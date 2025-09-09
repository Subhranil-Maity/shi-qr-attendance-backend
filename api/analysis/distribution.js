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
        // poor is implicit (< goodThreshold)

        const cls = await Class.findOne({ classId }).lean();
        if (!cls) return res.status(404).json({ error: "Class not found" });
        if (role === "faculty" && String(cls.assignedTo) !== requesterId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const studentCount = (cls.students && cls.students.length) || 0;

        // 1) count sessions
        const sessionCount = await Session.countDocuments({ classId: cls._id });
        if (sessionCount === 0) {
            return res.status(200).json({ excellent: 0, good: 0, poor: 0, total: studentCount });
        }

        // 2) compute attendance per student across sessions
        const perStudent = await Session.aggregate([
            { $match: { classId: cls._id } },
            { $unwind: { path: "$attendance", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$attendance.user", presents: { $sum: 1 } } },
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
            }
        });
    } catch (err) {
        console.error("Error in distribution:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
