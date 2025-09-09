/**
 * Author: Subhranil Maity
 * FileName: testTrend.js
 * Description: Test function for attendance trend analytics.
 */

import axios from "axios";

/**
 * Fetch attendance trend for a class
 * @param {string} baseUrl - API base URL
 * @param {string} token - Faculty/Admin JWT token
 * @param {string} classId - Class ID (e.g., CSE101)
 * @returns {Promise<Object>} API response
 */
export async function getAttendanceTrend(baseUrl, token, classId) {
    try {
        const res = await axios.get(
            `${baseUrl}/api/analysis/trend?classId=${classId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (err) {
        console.error("❌ Error fetching attendance trend:", err.response?.data || err.message);
        throw err;
    }
}
