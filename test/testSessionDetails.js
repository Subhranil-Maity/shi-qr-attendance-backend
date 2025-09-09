/**
 * Author: Subhranil Maity
 * FileName: testSessionDetails.js
 * Description: Test function for session-specific attendance details API
 */

import axios from "axios";

/**
 * Fetch session-specific attendance details
 * @param {string} baseUrl - API base URL
 * @param {string} token - Faculty/Admin JWT token
 * @param {string} sessionId - Session ID (e.g., S-CSE101-1757398229730)
 * @returns {Promise<Object>} API response
 */
export async function getSessionDetails(baseUrl, token, sessionId) {
    try {
        const res = await axios.get(
            `${baseUrl}/api/session/sessionDetails`,
            {
                headers: { Authorization: `Bearer ${token}` },
                params: { sessionId }
            }
        );
        return res.data;
    } catch (err) {
        console.error("❌ Error fetching session details:", err.response?.data || err.message);
        throw err;
    }
}

// Example usage
/*
(async () => {
    const BASE_URL = "http://localhost:3000";
    const token = "<JWT_TOKEN>";
    const sessionId = "S-CSE101-1757398229730";

    const sessionData = await getSessionDetails(BASE_URL, token, sessionId);
    console.log(JSON.stringify(sessionData, null, 2));
})();
*/
