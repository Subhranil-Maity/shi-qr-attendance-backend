/**
 * Author: Subhranil Maity
 * FileName: restartAttendance.js
 * Description: API to restart attendance for a given session.
 */
import {verifyToken} from "../../lib/auth.js";
import Session from "../../models/Session.js";
import {connectDB} from "../../config/db.js";
import {cors} from "../../lib/cors.js";


export default async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // 1. Verify user token
    const decoded = verifyToken(req, res);
    if (!decoded) return; // response already sent by verifyToken
    await connectDB()
    const { sessionId, attendanceStart } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
    }

    try {
        // 2. Find the session
        const session = await Session.findOne({ sessionId }).populate("classId");
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        // 3. Permission check: only admin or assigned faculty
        const isAdmin = decoded.role === "admin";
        const isFaculty = decoded.role === "faculty" &&
            session.classId.assignedTo.toString() === decoded.userId;

        if (!isAdmin && !isFaculty) {
            return res.status(403).json({ error: "Forbidden: Not allowed to restart attendance" });
        }

        // 4. Restart logic → clear old QR + set new time window
        session.attendanceStart = new Date(); // restart from now
        session.qrPayload = `QR-${session.sessionId}-${Date.now()}`; // new QR value
        if (attendanceStart != null){
            session.attendanceStart = attendanceStart;
        }
        await session.save();

        return res.status(200).json({
            message: "✅ Attendance restarted successfully",
            sessionId: session.sessionId,
            classId: session.classId.classId,
            className: session.classId.name,
            newStartTime: session.attendanceStart,
            newQrPayload: session.qrPayload,
        });
    } catch (err) {
        console.error("Error restarting attendance:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}
