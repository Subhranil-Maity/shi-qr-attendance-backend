/**
 * Author: Subhranil Maity
 * FileName: sessionDetails.js
 * Description: Returns detailed attendance info for a single session with proper student info.
 * Query params: sessionId
 */

import { verifyToken } from "../../lib/auth.js";
import { connectDB } from "../../config/db.js";
import Session from "../../models/Session.js";
import Class from "../../models/Class.js";
import User from "../../models/User.js";
import {cors} from "../../lib/cors.js";

export default async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== "GET") return res.status(405).json({ error: "Use GET" });

    try {
        const payload = verifyToken(req, res);
        if (!payload) return;

        await connectDB();

        const { _id: requesterId, role } = payload;
        const sessionId = req.query.sessionId;
        if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

        // Fetch session by sessionId string and populate class
        const session = await Session.findOne({ sessionId })
            .populate("classId", "classId name assignedTo students")
            .lean();

        if (!session) return res.status(404).json({ error: "Session not found" });

        const cls = session.classId;
        if (role === "faculty" && String(cls.assignedTo) !== requesterId)
            return res.status(403).json({ error: "Forbidden" });

        const studentCount = (cls.students && cls.students.length) || 0;

        // Fetch all students of the class with name and userId
        const allStudents = await User.find({ _id: { $in: cls.students } })
            .select("name userId")
            .lean();

        // Map present students
        const attendanceList = session.attendance.map(a => {
            const u = allStudents.find(u => String(u._id) === String(a.userDbId));
            return {
                studentId: u?.userId || a.userId,
                name: u?.name || "Unknown",
                status: "Present",
                timestamp: a.time,
                mode: a.via
            };
        });

        // Map absent students
        const absentStudents = allStudents
            .filter(u => !attendanceList.some(a => a.studentId === u.userId))
            .map(u => ({
                studentId: u.userId,
                name: u.name,
                status: "Absent",
                timestamp: null,
                mode: null
            }));

        const allAttendance = [...attendanceList, ...absentStudents];

        const presentCount = attendanceList.length;
        const absentCount = absentStudents.length;
        const faculty = await User.findById(cls.assignedTo)
            .select("name userId")
            .lean();
        return res.status(200).json({
            sessionId: session.sessionId,
            classId: cls.classId,
            className: cls.name,
            faculty: {
                userId: faculty?.userId || null,
                name: faculty?.name || "Unknown"
            },
            sessionStart: session.classStart,
            sessionEnd: session.classEnd,
            totalStudents: studentCount,
            present: presentCount,
            absent: absentCount,
            attendance: allAttendance
        });

    } catch (err) {
        console.error("Error in sessionDetails:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
