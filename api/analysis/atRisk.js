/**
 * Author: Subhranil Maity
 * FileName: atRisk.js
 * Description: Returns list of at-risk students (below threshold) with details.
 * Query params: classId, threshold (default 80), limit, skip
 */

import { verifyToken } from "../../lib/auth.js";
import { connectDB } from "../../config/db.js";
import Session from "../../models/Session.js";
import Class from "../../models/Class.js";
import User from "../../models/User.js";
import { Types } from "mongoose";

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ error: "Use GET" });

    try {
        const payload = verifyToken(req, res);
        if (!payload) return;

        await connectDB();

        const { _id: requesterId, role } = payload;
        const classId = req.query.classId;
        if (!classId) return res.status(400).json({ error: "Missing classId" });

        const threshold = parseInt(req.query.threshold, 10) || 80;
        const skip = parseInt(req.query.skip, 10) || 0;
        const limit = parseInt(req.query.limit, 10) || 50;

        const cls = await Class.findOne({ classId }).lean();
        if (!cls) return res.status(404).json({ error: "Class not found" });
        if (role === "faculty" && String(cls.assignedTo) !== requesterId) return res.status(403).json({ error: "Forbidden" });

        // number of sessions for this class
        const sessionCount = await Session.countDocuments({ classId: cls._id });
        if (sessionCount === 0) {
            return res.status(200).json({ students: [], total: 0 });
        }

        // compute attendance presents per student
        const perStudent = await Session.aggregate([
            { $match: { classId: cls._id } },
            { $unwind: { path: "$attendance", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$attendance.user", presents: { $sum: 1 } } },
            {
                $project: {
                    userId: "$_id",
                    presents: 1,
                    attendancePercent: { $multiply: [{ $divide: ["$presents", sessionCount] }, 100] },
                },
            },
            { $match: { attendancePercent: { $lt: threshold } } },
            { $sort: { attendancePercent: 1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        // join with User to get display info & last class presence
        const userIds = perStudent.map((p) => p.userId);
        const users = await User.find({ _id: { $in: userIds } }).select("name userId").lean();
        const usersMap = {};
        users.forEach((u) => { usersMap[String(u._id)] = u; });

        // compute last class status for each user (present/absent) by finding latest session and checking attendance
        // get last session
        const lastSession = await Session.findOne({ classId: cls._id }).sort({ classStart: -1 }).select("sessionId attendance classStart").lean();

        const lastAttendanceSet = new Set();
        if (lastSession && Array.isArray(lastSession.attendance)) {
            lastSession.attendance.forEach((a) => lastAttendanceSet.add(String(a.user)));
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
                lastClass: lastSession ? (lastAttendanceSet.has(String(p.userId)) ? "Present" : "Absent") : "N/A",
            };
        });

        return res.status(200).json({ students, total: students.length });
    } catch (err) {
        console.error("Error in atRisk:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
