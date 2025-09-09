/**
 * Author: Subhranil Maity
 * FileName: mark.js
 * Description: API to mark attendance for a session.
 */
import {verifyToken} from "../../lib/auth.js";
import {connectDB} from "../../config/db.js";
import Session from "../../models/Session.js";
import Class from "../../models/Class.js";
import mongoose from "mongoose";



export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const decoded = verifyToken(req, res);
    if (!decoded) return; // verifyToken already responded

    const { sessionId, via } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: "sessionId and userId are required" });
    }

    try {
        await connectDB();
        // 1. Find session
        const session = await Session.findOne({ sessionId }).populate("classId");
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // 2. Ensure session is active
        if (!session.attendanceStart) {
            return res.status(400).json({ error: "Attendance not started for this session" });
        }

        // 3. Ensure student belongs to class
        const isMember = session.classId.students.some(
            (stu) => stu.toString() === decoded._id.toString()
        );
        if (!isMember) {
            return res.status(403).json({ error: "User not assigned to this class" });
        }

        // 4. Ensure not already marked
        const alreadyMarked = session.attendance.some(
            (a) => String(a.userId) === decoded._id.toString()
        );
        if (alreadyMarked) {
            return res.status(400).json({ error: "Attendance already marked" });
        }
        let userDbId = new mongoose.Types.ObjectId(decoded._id)
        let userId = decoded.userId
        // 5. Push attendance record
        session.attendance.push({
            userDbId,
            userId,
            time: new Date(),
            via: via || "Unknown",
        });

        await session.save();
        let dbId = userDbId.toString()
        return res.status(200).json({
            message: "✅ Attendance marked successfully",
            sessionId: session.sessionId,
            dbId,
        });
    } catch (err) {
        console.error("Error marking attendance:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
