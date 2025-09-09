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

// const BASE_URL = "https://shi-qr-attendance-backend.vercel.app/";
const BASE_URL = "http://localhost:3000";

// Test cases: userId/password pairs
const testUsers = [
	{ userId: "A25101300123", password: "admin123" },
	{ userId: "F25101300124", password: "faculty123" },
	{ userId: "25101300127", password: "student123" },
];

async function runAnalyticsTests() {
    const BASE_URL = "http://localhost:3000";
    const CLASS_ID = "CSE101";

    const token = await loginFaculty(BASE_URL);

    const atRisk = await getAtRiskStudents(BASE_URL, token, CLASS_ID);
    console.log("📊 At-Risk Students:", atRisk);

    const distribution = await getAttendanceDistribution(BASE_URL, token, CLASS_ID);
    console.log("📊 Attendance Distribution:", distribution);

    const trend = await getAttendanceTrend(BASE_URL, token, CLASS_ID);
    console.log("📊 Attendance Trend:", trend);
}
(async () => {
	// for (let user of testUsers) {
	// 	await testLoginAndValidate(BASE_URL, user.userId, user.password);
	// }
    //     await testSessionFlow(BASE_URL);
    // await testOverview(BASE_URL)
    await   runAnalyticsTests()
})()

