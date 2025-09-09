/**
 * Author: Subhranil Maity
 * FileName: testOverview.js
 * Description: Test script for faculty overview analytics.
 */

import axios from "axios";


async function testOverview(baseUrl) {
    try {
        // 1. Login as faculty
        const loginRes = await axios.post(`${baseUrl}/api/auth/login`, {
            userId: "F25101300124", // faculty id
            password: "faculty123",
        });

        const { token } = loginRes.data;
        console.log("✅ Logged in, got token");

        // 2. Query overview for class CSE101
        const overviewRes = await axios.get(
            `${baseUrl}/api/analysis/overview?classId=CSE101`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        console.log("📊 Overview response:");
        console.dir(overviewRes.data, { depth: null });
    } catch (err) {
        console.error("❌ Error in testOverview:", err.response?.data || err.message);
    }
}

export default testOverview;
