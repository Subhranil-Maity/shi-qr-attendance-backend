/**
 * Author: Subhranil Maity
 * FileName: startSession.js
 * Description: Serverless function to start a session (faculty/admin only)
 */

import { verifyToken } from "../../lib/auth.js";
import Class from "../../models/Class.js";
import Session from "../../models/Session.js";
import { connectDB } from "../../config/db.js";
import { Types } from "mongoose";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    try {
        // 1. Verify JWT
        const payload = verifyToken(req, res);
        if (!payload) return;

        await connectDB();

        const { role, _id } = payload;
        const { classId, classStart, classEnd, attendanceTime } = req.body;

        // 2. Validate request body
        if (!classId || !classStart || !classEnd) {
            return res
                .status(400)
                .json({ error: "Missing required fields: classId, classStart, classEnd" });
        }

        // 3. Fetch class
        const cls = await Class.findOne({ classId });
        if (!cls) {
            return res.status(404).json({ error: "Class not found" });
        }

        // 4. Permission check
        if (role === "faculty" && String(cls.assignedTo) !== _id) {
            return res
                .status(403)
                .json({ error: "You are not assigned to this class" });
        }

        // 5. Generate sessionId and QR payload
        const sessionId = `S-${classId}-${Date.now()}`;
        const qrPayload = `${sessionId}-${classId}-${Date.now()}`;

        // 6. Create session
        const session = new Session({
            sessionId,
            createdById: new Types.ObjectId(_id), // ✅ use Types.ObjectId
            classId: cls._id,
            year: new Date().getFullYear(),
            classStart: new Date(classStart),
            classEnd: new Date(classEnd),
            attendanceStart: new Date(classStart),
            attendanceTime: attendanceTime || 15,
            qrPayload,
            attendance: [],
        });

        await session.save();

        return res.status(201).json({
            message: "✅ Session started successfully",
            sessionId: session.sessionId,
            qrPayload: session.qrPayload,
            classId: cls.classId,
        });
    } catch (err) {
        console.error("Error starting session:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
