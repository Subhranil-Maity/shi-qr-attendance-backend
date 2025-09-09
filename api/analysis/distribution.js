/**
 * Author: Subhranil Maity
 * FileName: distribution.js
 * Description: Attendance distribution for a class into buckets (configurable thresholds via query params)
 */

import { verifyToken } from "../../lib/auth.js";
import { connectDB } from "../../config/db.js";
import Session from "../../models/Session.js";
import Class from "../../models/Class.js";

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ error: "Use GET" });

    try {
        const payload = verifyToken(req, res);
        if (!payload) return;

        await connectDB();

        const { _id: requesterId, role } = payload;
        const classId = req.query.classId;
        if (!classId) return res.status(400).json({ error: "Missing classId" });

        // thresholds via query params (defaults)
        const excellentThreshold = parseInt(req.query.excellent ?? 90, 10);
        const goodThreshold = parseInt(req.query.good ?? 80, 10);

        const mode = req.query.mode || "days"; // default mode

        const cls = await Class.findOne({ classId }).lean();
        if (!cls) return res.status(404).json({ error: "Class not found" });
        if (role === "faculty" && String(cls.assignedTo) !== requesterId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const studentCount = (cls.students && cls.students.length) || 0;

        // 1) fetch sessions based on mode
        let sessions = [];
        let sessionCount = 0;

        if (mode === "sessions") {
            const lastNSessions = parseInt(req.query.sessions, 10) || 30;
            sessions = await Session.find({ classId: cls._id })
                .sort({ classStart: -1 })
                .limit(lastNSessions)
                .lean();
            sessionCount = sessions.length;
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
            sessionCount = sessions.length;
        }

        if (sessionCount === 0) {
            return res.status(200).json({ excellent: 0, good: 0, poor: 0, total: studentCount });
        }

        const sessionIds = sessions.map(s => s._id);

        // 2) compute attendance per student
        const perStudent = await Session.aggregate([
            { $match: { _id: { $in: sessionIds } } },
            { $unwind: { path: "$attendance", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$attendance.userDbId", presents: { $sum: 1 } } },
        ]);

        const mapPresents = {};
        perStudent.forEach((r) => { mapPresents[String(r._id)] = r.presents; });

        // 3) categorize students
        let excellent = 0, good = 0, poor = 0;
        for (const stu of (cls.students || [])) {
            const p = mapPresents[String(stu)] || 0;
            const pct = Math.round((p / sessionCount) * 100);

            if (pct > excellentThreshold) excellent++;
            else if (pct >= goodThreshold) good++;
            else poor++;
        }

        return res.status(200).json({
            excellent,
            good,
            poor,
            total: studentCount,
            thresholds: {
                excellent: `>${excellentThreshold}%`,
                good: `${goodThreshold}–${excellentThreshold}%`,
                poor: `<${goodThreshold}%`
            },
            mode,
            range: mode === "days"
                ? { from: sessions[0]?.classStart ? sessions[sessions.length -1].classStart.toISOString() : null,
                    to: sessions[0]?.classStart ? sessions[0].classStart.toISOString() : null }
                : { lastNSessions: sessions.length }
        });
    } catch (err) {
        console.error("Error in distribution:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
