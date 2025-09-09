/**
 * Author: Subhranil Maity
 * FileName: testTrendDynamic.js
 * Description: Test function for dynamic attendance trend analytics.
 */

import axios from "axios";

/**
 * Fetch dynamic attendance trend for a class
 * @param {string} baseUrl - API base URL
 * @param {string} token - Faculty/Admin JWT token
 * @param {string} classId - Class ID (e.g., CSE101)
 * @param {Object} options - Optional query params
 * @param {"days"|"sessions"} options.mode - Mode: days or sessions (default: days)
 * @param {"weekly"|"monthly"} options.period - Trend period (default: monthly)
 * @param {string} options.from - Start date (ISO string, for mode=days)
 * @param {string} options.to - End date (ISO string, for mode=days)
 * @param {number} options.sessions - Number of sessions (for mode=sessions)
 * @returns {Promise<Object>} API response
 */
export async function getDynamicAttendanceTrend(baseUrl, token, classId, options = {}) {
    try {
        const params = new URLSearchParams({ classId });

        if (options.mode) params.append("mode", options.mode);
        if (options.period) params.append("period", options.period);
        if (options.from) params.append("from", options.from);
        if (options.to) params.append("to", options.to);
        if (options.sessions) params.append("sessions", options.sessions);

        const res = await axios.get(
            `${baseUrl}/api/analysis/trendDynamic?${params.toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        return res.data;
    } catch (err) {
        console.error("❌ Error fetching dynamic attendance trend:", err.response?.data || err.message);
        throw err;
    }
}

// Example usage
/*
(async () => {
    const baseUrl = "http://localhost:3000";
    const token = "<JWT_TOKEN>";
    const classId = "CSE101";

    const trend = await getDynamicAttendanceTrend(baseUrl, token, classId, {
        mode: "days",
        period: "weekly",
        from: "2025-08-01T00:00:00Z",
        to: "2025-09-01T00:00:00Z"
    });

    console.log(JSON.stringify(trend, null, 2));
})();
*/
