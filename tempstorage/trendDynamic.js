/**
 * Author: Subhranil Maity
 * FileName: trendDynamic.js
 * Description: Attendance trend by period with hybrid mode (days or sessions).
 * Query params: classId, period=weekly|monthly, mode=days|sessions, from, to, sessions
 */

import { verifyToken } from "../lib/auth.js";
import { connectDB } from "../config/db.js";
import Session from "../models/Session.js";
import Class from "../models/Class.js";

// export default async function handler(req, res) {
async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ error: "Use GET" });

    try {
        const payload = verifyToken(req, res);
        if (!payload) return;

        await connectDB();

        const { _id: requesterId, role } = payload;
        const classId = req.query.classId;
        if (!classId) return res.status(400).json({ error: "Missing classId" });

        const period = (req.query.period || "monthly").toLowerCase(); // weekly or monthly
        const mode = req.query.mode || "days"; // default mode

        const cls = await Class.findOne({ classId }).lean();
        if (!cls) return res.status(404).json({ error: "Class not found" });
        if (role === "faculty" && String(cls.assignedTo) !== requesterId)
            return res.status(403).json({ error: "Forbidden" });

        const studentCount = (cls.students && cls.students.length) || 0;

        // fetch sessions based on mode
        let sessions = [];
        if (mode === "sessions") {
            const lastNSessions = parseInt(req.query.sessions, 10) || 30;
            sessions = await Session.find({ classId: cls._id })
                .sort({ classStart: -1 })
                .limit(lastNSessions)
                .lean();
        } else {
            // days mode
            const to = req.query.to ? new Date(req.query.to) : new Date();
            const from = req.query.from
                ? new Date(req.query.from)
                : new Date(new Date().setDate(to.getDate() - 30)); // default last 30 days

            sessions = await Session.find({
                classId: cls._id,
                classStart: { $gte: from, $lte: to },
            }).lean();
        }

        if (sessions.length === 0) {
            return res.status(200).json({
                classId: cls.classId,
                period,
                trend: [],
                mode,
                range: mode === "days"
                    ? { from: req.query.from || null, to: req.query.to || null }
                    : { lastNSessions: req.query.sessions || 30 }
            });
        }

        const sessionIds = sessions.map(s => s._id);

        // determine grouping format
        const dateFormat = period === "weekly" ? "%Y-%U" : "%Y-%m";

        // aggregate per period
        const pipeline = [
            { $match: { _id: { $in: sessionIds } } },
            {
                $project: {
                    period: { $dateToString: { format: dateFormat, date: "$classStart" } },
                    attendanceCount: { $size: { $ifNull: ["$attendance", []] } },
                },
            },
            {
                $group: {
                    _id: "$period",
                    sessions: { $sum: 1 },
                    attendance: { $sum: "$attendanceCount" },
                },
            },
            { $sort: { _id: 1 } }, // chronological
        ];

        const results = await Session.aggregate(pipeline);

        // compute attendance rate per period
        const formatted = results.map((r) => {
            const possible = r.sessions * studentCount || 1;
            return {
                period: r._id,
                sessions: r.sessions,
                attendanceCount: r.attendance,
                attendanceRate: studentCount === 0 ? 0 : Math.round((r.attendance / possible) * 100),
            };
        });

        return res.status(200).json({
            classId: cls.classId,
            period,
            trend: formatted,
            mode,
            range: mode === "days"
                ? { from: req.query.from || null, to: req.query.to || null }
                : { lastNSessions: req.query.sessions || 30 }
        });

    } catch (err) {
        console.error("Error in trendDynamic:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
