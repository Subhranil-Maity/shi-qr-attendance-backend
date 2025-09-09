/**
 * Author: Subhranil Maity
 * FileName: overview.js
 * Description: Summary metrics for a class (Total Students, Avg Attendance Rate, At-Risk Students, Total Absences)
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
        if (!classId) return res.status(400).json({ error: "Missing classId query param" });

        const mode = req.query.mode || "days"; // default mode

        // fetch class
        const cls = await Class.findOne({ classId }).lean();
        if (!cls) return res.status(404).json({ error: "Class not found" });

        // permission: faculty must be assignedTo
        if (role === "faculty" && String(cls.assignedTo) !== requesterId) {
            return res.status(403).json({ error: "Forbidden" });
        }

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

        const sessionCount = sessions.length;

        if (sessionCount === 0) {
            return res.status(200).json({
                totalStudents: studentCount,
                avgAttendanceRate: 0,
                atRiskStudents: 0,
                totalAbsences: 0,
                sessionCount: 0,
            });
        }

        const sessionIds = sessions.map(s => s._id);

        // Aggregate total attendance per student
        const perStudentAgg = await Session.aggregate([
            { $match: { _id: { $in: sessionIds } } },
            { $unwind: { path: "$attendance", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$attendance.userDbId", presents: { $sum: 1 } } },
        ]);

        const presentsMap = {};
        perStudentAgg.forEach(r => { presentsMap[String(r._id)] = r.presents; });

        // Total attendance and absences
        let totalAttendance = 0;
        let atRiskCount = 0;
        for (const stuId of (cls.students || [])) {
            const p = presentsMap[String(stuId)] || 0;
            totalAttendance += p;
            const pct = Math.round((p / sessionCount) * 100);
            if (pct < 80) atRiskCount++;
        }

        const possibleAttendances = sessionCount * studentCount;
        const avgAttendanceRate = possibleAttendances === 0 ? 0 : Math.round((totalAttendance / possibleAttendances) * 100);
        const totalAbsences = Math.max(0, possibleAttendances - totalAttendance);

        return res.status(200).json({
            totalStudents: studentCount,
            avgAttendanceRate,
            atRiskStudents: atRiskCount,
            totalAbsences,
            sessionCount,
            mode,
            range: mode === "days"
                ? { from: sessions[sessions.length - 1]?.classStart?.toISOString() || null,
                    to: sessions[0]?.classStart?.toISOString() || null }
                : { lastNSessions: sessions.length }
        });
    } catch (err) {
        console.error("Error in overview:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
