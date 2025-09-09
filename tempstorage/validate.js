/**
 * Author: Subhranil Maity
 * FileName: testAuth.js
 * Description: Utility API to test login token validation using verifyToken middleware.
 */
import {verifyToken} from "../lib/auth.js";


export default async function handler(req, res) {
	// Only GET requests allowed for validation
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed. Use GET." });
	}

	// Use verifyToken middleware
	const payload = verifyToken(req, res);

	// If verifyToken returned null, it already sent a response
	if (!payload) return;

	// If valid, return success info
	return res.status(200).json({
		message: "Token is valid",
		user: {
			userId: payload.userId,
			role: payload.role,
		},
		iat: payload.iat,
		exp: payload.exp,
	});
	// return res.status(200).json({ message: "Validation endpoint is up." });
}

