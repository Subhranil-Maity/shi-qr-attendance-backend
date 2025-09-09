/**
 * Author: Subhranil Maity
 * FileName: overview.js
 * Description: Summary metrics for a class (Total Students, Avg Attendance Rate, At-Risk Students, Total Absences)
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
        if (!classId) return res.status(400).json({ error: "Missing classId query param" });

        // fetch class
        const cls = await Class.findOne({ classId }).lean();
        if (!cls) return res.status(404).json({ error: "Class not found" });

        // permission: faculty must be assignedTo
        if (role === "faculty" && String(cls.assignedTo) !== requesterId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const studentCount = (cls.students && cls.students.length) || 0;

        // Sessions for this class
        const sessions = await Session.find({ classId: cls._id }).select("_id").lean();
        const sessionCount = sessions.length;

        if (sessionCount === 0) {
            return res.status(200).json({
                totalStudents: studentCount,
                avgAttendanceRate: 0,
                atRiskStudents: 0,
                totalAbsences: 0,
            });
        }

        // total attendance records for this class across sessions
        const attendanceAgg = await Session.aggregate([
            { $match: { classId: cls._id } },
            { $project: { attendanceCount: { $size: { $ifNull: ["$attendance", []] } } } },
            { $group: { _id: null, totalAttendance: { $sum: "$attendanceCount" } } },
        ]);

        const totalAttendance = (attendanceAgg[0] && attendanceAgg[0].totalAttendance) || 0;
        const possibleAttendances = sessionCount * studentCount;
        const avgAttendanceRate = possibleAttendances === 0 ? 0 : Math.round((totalAttendance / possibleAttendances) * 100);

        // total absences
        const totalAbsences = Math.max(0, possibleAttendances - totalAttendance);

        // compute at-risk students count (attendance % < 80)
        // pipeline: for each session, unwind attendance and count per user, then compute %
        const perStudentAgg = await Session.aggregate([
            { $match: { classId: cls._id } },
            { $unwind: { path: "$attendance", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$attendance.user", presents: { $sum: 1 } } },
            { $project: { _id: 1, presents: 1 } },
        ]);

        // map userId -> presents
        const presentsMap = {};
        perStudentAgg.forEach((r) => {
            presentsMap[String(r._id)] = r.presents;
        });

        // student list: count those with attendance% < 80
        const threshold = 80;
        let atRiskCount = 0;
        for (const stuId of (cls.students || [])) {
            const p = presentsMap[String(stuId)] || 0;
            const pct = Math.round((sessionCount === 0 ? 0 : (p / sessionCount) * 100));
            if (pct < threshold) atRiskCount++;
        }

        return res.status(200).json({
            totalStudents: studentCount,
            avgAttendanceRate,
            atRiskStudents: atRiskCount,
            totalAbsences,
            sessionCount,
        });
    } catch (err) {
        console.error("Error in overview:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
