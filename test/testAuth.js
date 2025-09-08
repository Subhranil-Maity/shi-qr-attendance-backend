/**
 * Author: Subhranil Maity
 * FileName: testAuth.js
 * Description: Utility to test login and validate endpoints.
 */

import axios from "axios";

/**
 * Test login and JWT validation
 * @param {string} baseUrl - Base URL of the API
 * @param {string} username - Username to login
 * @param {string} password - Password for login
 * @returns {Promise<void>}
 */
export async function testLoginAndValidate(baseUrl, username, password) {
  try {
    console.log(`\n🔹 Testing login for user: ${username}`);

    // 1. Login
    const loginRes = await axios.post(`${baseUrl}/api/auth/login`, {
      username,
      password,
    });

    if (!loginRes.data.token) {
      console.error("❌ Login failed: No token returned");
      return;
    }

    const { token, role } = loginRes.data;
    console.log(`✅ Login successful. Role: ${role}`);
    console.log(`Token: ${token}`);

    // 2. Validate JWT
    console.log(`\n🔹 Validating token...`);
    const validateRes = await axios.get(`${baseUrl}/api/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (validateRes.status === 200) {
      console.log("✅ JWT validation successful. Status 200 OK");
    } else {
      console.error(`❌ JWT validation failed. Status: ${validateRes.status}`);
    }
  } catch (err) {
    console.error("❌ Error during test:", err.response?.data || err.message);
  }
}
