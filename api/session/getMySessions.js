/**
 * Author: Subhranil Maity
 * FileName: getMySessions.js
 * Description: Get sessions for faculty (only their assigned classes) or admin (all),
 *              with pagination and lightweight response.
 */

import { verifyToken } from "../../lib/auth.js";
import Class from "../../models/Class.js";
import Session from "../../models/Session.js";
import {connectDB} from "../../config/db.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed. Use GET." });
    }

    try {
        // 1. Verify JWT
        const payload = verifyToken(req, res);
        if (!payload) return; // handled inside verifyToken

        const { role, userId } = payload;

        if (role === "student") {
            return res.status(403).json({ error: "Students cannot view sessions" });
        }

        // 2. Parse pagination query params
        const skip = parseInt(req.query.skip) || 0;
        const limit = parseInt(req.query.limit) || 20;
        await connectDB()
        let sessionsQuery;

        // 3. Admin → all sessions
        if (role === "admin") {
            sessionsQuery = Session.find({});
        }

        // 4. Faculty → only sessions of assigned classes
        else if (role === "faculty") {
            const classes = await Class.find({ assignedTo: userId }, "_id");
            const classIds = classes.map((c) => c._id);

            sessionsQuery = Session.find({ classId: { $in: classIds } });
        }
        else{
            return res.status(400).json({ error: "Not Allowed" })
        }

        // 5. Apply pagination & lightweight projection
        const sessions = await sessionsQuery
            .select("sessionId classId classStart classEnd attendance") // include only needed fields
            .sort({ classStart: -1 })
            .skip(skip)
            .limit(limit)
            .populate("classId", "classId name students assignedTo")
            .lean();


        // 6. Format response
        const formatted = sessions.map((s) => ({
            sessionId: s.sessionId,
            classId: s.classId.classId,
            className: s.classId.name,
            classStart: s.classStart,
            classEnd: s.classEnd,
            facultyId: s.classId.assignedTo,
            attendanceCount: s.attendance?.length || 0,   // computed on read
            studentCount: s.classId.students?.length || 0 // from populated class
        }));

        return res.status(200).json({
            count: formatted.length,
            skip,
            limit,
            sessions: formatted,
        });
    } catch (err) {
        console.error("Error fetching sessions:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
