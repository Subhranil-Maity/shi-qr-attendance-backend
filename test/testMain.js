/**
 * Author: Subhranil Maity
 * FileName: testMain.js
 * Description: Main test script to test All 
 */

import { testLoginAndValidate } from "./testAuth.js";
import {testSessionFlow} from "./testSession.js";
import testOverview from "./testOverview.js";
import {getAtRiskStudents} from "./testAtRisk.js";
import {getAttendanceDistribution} from "./testDistribution.js";
import {getAttendanceTrend} from "./testTrend.js";
import {loginFaculty} from "./testLogin.js";
import {getDynamicAttendanceTrend} from "./testTrendDynamic.js";
import {getSessionDetails} from "./testSessionDetails.js";

const BASE_URL = "https://shi-qr-attendance-backend.vercel.app/";
// const BASE_URL = "http://localhost:3000";

// Test cases: userId/password pairs
const testUsers = [
	{ userId: "A25101300123", password: "admin123" },
	{ userId: "F25101300124", password: "faculty123" },
	{ userId: "25101300127", password: "student123" },
];

async function runAnalyticsTests(token) {
    const CLASS_ID = "CSE101";

    // Get JWT token for faculty


    // 1️⃣ At-Risk Students
    const atRisk = await getAtRiskStudents(BASE_URL, token, CLASS_ID);
    console.log("📊 At-Risk Students:", atRisk);

    // 2️⃣ Attendance Distribution
    const distribution = await getAttendanceDistribution(BASE_URL, token, CLASS_ID);
    console.log("📊 Attendance Distribution:", distribution);

    // 3️⃣ Attendance Trend (original trend.js)
    const trend = await getAttendanceTrend(BASE_URL, token, CLASS_ID);
    console.log("📊 Attendance Trend:", trend);

    // // 4️⃣ Dynamic Trend - mode=days (last 30 days)
    // const toDate = new Date();
    // const fromDate = new Date();
    // fromDate.setDate(toDate.getDate() - 30); // last 30 days
    //
    // const trendDynamicDays = await getDynamicAttendanceTrend(BASE_URL, token, CLASS_ID, {
    //     mode: "days",
    //     period: "weekly",
    //     from: fromDate.toISOString(),
    //     to: toDate.toISOString()
    // });
    // console.log("📊 Dynamic Trend (last 30 days):", trendDynamicDays);
    //
    // // 5️⃣ Dynamic Trend - mode=sessions (last 30 sessions)
    // const trendDynamicSessions = await getDynamicAttendanceTrend(BASE_URL, token, CLASS_ID, {
    //     mode: "sessions",
    //     period: "weekly",
    //     sessions: 30
    // });
    // console.log("📊 Dynamic Trend (last 30 sessions):", trendDynamicSessions);
    //

}
(async () => {
	// for (let user of testUsers) {
	// 	await testLoginAndValidate(BASE_URL, user.userId, user.password);
	// }
        await testSessionFlow(BASE_URL);
    await testOverview(BASE_URL)
    const token = await loginFaculty(BASE_URL);
    await   runAnalyticsTests(token)

    const sessionData = await getSessionDetails(BASE_URL, token, "S-CSE101-1757408473944");
    console.log("Session Data:", sessionData);
})()

