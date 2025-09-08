/**
 * Author: Subhranil Maity
 * FileName: testMain.js
 * Description: Main test script to test All 
 */

import { testLoginAndValidate } from "./testAuth.js";

const BASE_URL = "https://shi-qr-attendance-backend.vercel.app/";

// Test cases: username/password pairs
const testUsers = [
	{ username: "A25101300123", password: "admin123" },
	{ username: "F25101300124", password: "faculty123" },
	{ username: "25101300127", password: "student123" },
];

(async () => {
	for (let user of testUsers) {
		await testLoginAndValidate(BASE_URL, user.username, user.password);
	}
})();
