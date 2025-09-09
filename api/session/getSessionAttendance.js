/**
 * Author: Subhranil Maity
 * FileName: getSessionAttendance.js
 * Description: Get attendance for a session (faculty/admin only)
 */

import { verifyToken } from "../../lib/auth.js";
import Session from "../../models/Session.js";
import {connectDB} from "../../config/db.js";
import Class from "../../models/Class.js"

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed. Use GET." });
    }

    try {
        // 1. Verify JWT
        const payload = verifyToken(req, res);
        if (!payload) return; // already handled in verifyToken
        await connectDB()
        const { role, userId } = payload;
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ error: "Missing sessionId in query" });
        }

        // 2. Find session
        const session = await Session.findOne({ sessionId }).populate("classId");
        if (!session) return res.status(404).json({ error: "Session not found" });

        // 3. Permission check
        const cls = session.classId; // populated class document
        if (role === "faculty" && (String(cls.assignedTo) !== payload._id)) {
            return res.status(403).json({ error: "You are not assigned to this class" });
        }
        // Admin can view any session

        // 4. Return attendance
        return res.status(200).json({
            sessionId: session.sessionId,
            classId: cls.classId,
            attendance: session.attendance,
        });
    } catch (err) {
        console.error("Error fetching session attendance:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
