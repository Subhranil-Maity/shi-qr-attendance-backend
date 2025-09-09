/**
 * Author: Subhranil Maity
 * FileName: trend.js
 * Description: Attendance trend by period (weekly or monthly). Query params: classId, period=weekly|monthly, lastN=6
 */

import { verifyToken } from "../../lib/auth.js";
import { connectDB } from "../../config/db.js";
import Session from "../../models/Session.js";
import Class from "../../models/Class.js";
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

        const period = (req.query.period || "monthly").toLowerCase(); // weekly or monthly
        const lastN = parseInt(req.query.lastN, 10) || 6;

        const cls = await Class.findOne({ classId }).lean();
        if (!cls) return res.status(404).json({ error: "Class not found" });
        if (role === "faculty" && String(cls.assignedTo) !== requesterId) return res.status(403).json({ error: "Forbidden" });

        // choose date format for grouping
        const dateFormat = period === "weekly" ? "%Y-%U" : "%Y-%m";

        // aggregate per period: number of sessions, total attendance count
        const pipeline = [
            { $match: { classId: cls._id } },
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
            { $sort: { _id: -1 } }, // newest first
            { $limit: lastN },
            { $sort: { _id: 1 } }, // return chronological
        ];

        const results = await Session.aggregate(pipeline);

        // compute attendance rate per period: attendance / (sessions * studentCount)
        const studentCount = (cls.students && cls.students.length) || 0;
        const formatted = results.map((r) => {
            const possible = r.sessions * studentCount || 1;
            return {
                period: r._id,
                sessions: r.sessions,
                attendanceCount: r.attendance,
                attendanceRate: studentCount === 0 ? 0 : Math.round((r.attendance / possible) * 100),
            };
        });

        return res.status(200).json({ trend: formatted });
    } catch (err) {
        console.error("Error in trend:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
