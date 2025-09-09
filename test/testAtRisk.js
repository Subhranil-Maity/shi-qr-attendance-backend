/**
 * Author: Subhranil Maity
 * FileName: testAtRisk.js
 * Description: Test function for at-risk students analytics.
 */

import axios from "axios";

/**
 * Fetch at-risk students for a given class
 * @param {string} baseUrl - API base URL
 * @param {string} token - Faculty/Admin JWT token
 * @param {string} classId - Class ID (e.g., CSE101)
 * @returns {Promise<Object>} API response
 */
export async function getAtRiskStudents(baseUrl, token, classId) {
    try {
        const res = await axios.get(
            `${baseUrl}/api/analysis/atRisk?classId=${classId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    } catch (err) {
        console.error("❌ Error fetching at-risk students:", err.response?.data || err.message);
        throw err;
    }
}
