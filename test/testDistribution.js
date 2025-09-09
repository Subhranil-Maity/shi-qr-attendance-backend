/**
 * Author: Subhranil Maity
 * FileName: testDistribution.js
 * Description: Test function for attendance distribution analytics.
 */

import axios from "axios";

/**
 * Fetch attendance distribution for a class
 * @param {string} baseUrl - API base URL
 * @param {string} token - Faculty/Admin JWT token
 * @param {string} classId - Class ID (e.g., CSE101)
 * @returns {Promise<Object>} API response
 */
export async function getAttendanceDistribution(baseUrl, token, classId) {
    try {
        const res = await axios.get(
            `${baseUrl}/api/analysis/distribution?classId=${classId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (err) {
        console.error("❌ Error fetching attendance distribution:", err.response?.data || err.message);
        throw err;
    }
}
