/**
 * Author: Subhranil Maity
 * FileName: auth.js
 * Description: Serverless-friendly JWT verification utility
 */

import jwt from "jsonwebtoken";

/**
 * Verifies JWT token from Authorization header in serverless functions.
 * Returns decoded payload if valid, otherwise sends response and returns null.
 *
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @returns {object|null} - decoded JWT payload or null if invalid
 */
export function verifyToken(req, res) {
    try {
        // 1. Check Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Missing or invalid Authorization header" });
            return null;
        }

        // 2. Extract and clean token
        const token = authHeader.split(" ")[1].trim();

        // 3. Ensure JWT_SECRET is available
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is not defined in environment variables!");
            res.status(500).json({ error: "Server misconfiguration" });
            return null;
        }

        // 4. Verify token
        const payload = jwt.verify(token, secret);

        // 5. Return decoded payload
        return payload;
    } catch (err) {
        console.error("JWT verification failed:", err.message);
        res.status(403).json({ error: "Invalid or expired token" });
        return null;
    }
}
