/**
 * Author: Subhranil Maity
 * FileName: atRisk.js
 * Description: Returns list of at-risk students (below threshold) with details.
 * Query params:
 *   classId (required)
 *   threshold (default 80)
 *   limit, skip
 *   mode: "days" | "sessions" (default "days")
 *   from, to (if mode=days)
 *   sessions (if mode=sessions, default 30)
 */

import { verifyToken } from "../../lib/auth.js";
import { connectDB } from "../../config/db.js";
import Session from "../../models/Session.js";
import Class from "../../models/Class.js";
import User from "../../models/User.js";
import mongoose from "mongoose";

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ error: "Use GET" });

    try {
        const payload = verifyToken(req, res);
        if (!payload) return;

        await connectDB();

        const { _id: requesterId, role } = payload;
        const classIdQ = req.query.classId;
        if (!classIdQ) return res.status(400).json({ error: "Missing classId" });
        console.log(classIdQ)
        let classId = await Class.findOne({ classId: classIdQ }).select("_id").lean();
        const threshold = parseInt(req.query.threshold, 10) || 80;
        const skip = parseInt(req.query.skip, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 50;
        const mode = req.query.mode || "days"; // default mode

        const cls = await Class.findOne({ _id: classId }).lean();
        if (!cls) return res.status(404).json({ error: "Class not found" });
        if (role === "faculty" && String(cls.assignedTo) !== requesterId)
            return res.status(403).json({ error: "Forbidden" });

        let sessions = [];
        let sessionCount = 0;
        let rangeInfo = {};

        if (mode === "sessions") {
            // Last N sessions mode
            const lastNSessions = parseInt(req.query.sessions, 10) || 30; // default 30 sessions
            sessions = await Session.find({ classId: cls._id })
                .sort({ classStart: -1 })
                .limit(lastNSessions)
                .lean();
            sessionCount = sessions.length;
            rangeInfo = { lastNSessions: lastNSessions };
        } else {
            // Days mode
            const to = req.query.to ? new Date(req.query.to) : new Date();
            const from = req.query.from
                ? new Date(req.query.from)
                : new Date(new Date().setDate(to.getDate() - 30)); // default last 30 days

            sessions = await Session.find({
                classId: cls._id,
                classStart: { $gte: from, $lte: to },
            }).lean();
            sessionCount = sessions.length;
            rangeInfo = { from: from.toISOString(), to: to.toISOString() };
        }

        if (sessionCount === 0) {
            return res.status(200).json({
                students: [],
                total: 0,
                threshold,
                mode,
                range: rangeInfo,
            });
        }

        const sessionIds = sessions.map(s => s._id);

        // Compute attendance per student
        const perStudent = await Session.aggregate([
            { $match: { _id: { $in: sessionIds } } },
            { $unwind: { path: "$attendance", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$attendance.userDbId", presents: { $sum: 1 } } },
            {
                $project: {
                    userId: "$_id",
                    presents: 1,
                    attendancePercent: {
                        $multiply: [{ $divide: ["$presents", sessionCount] }, 100],
                    },
                },
            },
            { $match: { attendancePercent: { $lt: threshold } } },
            { $sort: { attendancePercent: 1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        // Join with User to get display info
        const userIds = perStudent.map((p) => p.userId);
        const users = await User.find({ _id: { $in: userIds } })
            .select("name userId")
            .lean();
        const usersMap = {};
        users.forEach((u) => {
            usersMap[String(u._id)] = u;
        });

        // Last session for "lastClass" status
        const lastSession = sessions[0]; // already sorted descending
        const lastAttendanceSet = new Set();
        if (lastSession && Array.isArray(lastSession.attendance)) {
            lastSession.attendance.forEach((a) =>
                lastAttendanceSet.add(String(a.userDbId))
            );
        }

        const students = perStudent.map((p) => {
            const u = usersMap[String(p.userId)] || { name: null, userId: null };
            const pct = Math.round(p.attendancePercent);
            let riskLevel = "Low";
            if (pct < 60) riskLevel = "High";
            else if (pct < 80) riskLevel = "Medium";

            return {
                _id: p.userId,
                name: u.name || "Unknown",
                rollNo: u.userId || null,
                attendanceRate: pct,
                riskLevel,
                lastClass: lastSession
                    ? lastAttendanceSet.has(String(p.userId))
                        ? "Present"
                        : "Absent"
                    : "N/A",
            };
        });

        return res.status(200).json({
            students,
            total: students.length,
            threshold,
            mode,
            range: rangeInfo,
            limit,
            skip
        });
    } catch (err) {
        console.error("Error in atRisk:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
