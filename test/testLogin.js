/**
 * Author: Subhranil Maity
 * FileName: testLogin.js
 * Description: Reusable login functions for faculty and students.
 */

import axios from "axios";

/**
 * Generic login
 * @param {string} baseUrl - API base URL
 * @param {string} userId - User ID (e.g., F25101300124 or 25101300127)
 * @param {string} password - User password
 * @returns {Promise<string>} JWT token
 */
export async function login(baseUrl, userId, password) {
    const res = await axios.post(`${baseUrl}/api/auth/login`, {
        userId,
        password,
    });
    return res.data.token;
}

/**
 * Faculty login shortcut
 * @param {string} baseUrl - API base URL
 * @returns {Promise<string>} JWT token
 */
export async function loginFaculty(baseUrl) {
    return login(baseUrl, "F25101300124", "faculty123");
}

/**
 * Example: Student login shortcut
 * @param {string} baseUrl - API base URL
 * @param {string} userId - Student userId
 * @returns {Promise<string>} JWT token
 */
export async function loginStudent(baseUrl, userId) {
    return login(baseUrl, userId, "student123");
}
