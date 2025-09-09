/**
 * Author: Subhranil Maity
 * FileName: testSession.js
 * Description: Test script to login as faculty, start a session, and mark attendance for students.
 */

import axios from "axios";

// Example users
const faculty = { userId: "F25101300124", password: "faculty123" };
const students = [
    { userId: "25101300127", password: "student123" },
    { userId: "25101300128", password: "student123" },
    { userId: "25101300129", password: "student123" },
];

const CLASS_ID = "CSE101"; // class must exist in DB

async function login(baseUrl, user) {
    const res = await axios.post(`${baseUrl}/api/auth/login`, {
        userId: user.userId,
        password: user.password,
    });
    return res.data.token;
}

async function startSession(baseUrl, token) {
    const now = new Date();
    const classStart = now.toISOString();
    const classEnd = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // +1 hour
    const attendanceTime = 15 * 60 * 1000; // 15 minutes in ms

    const res = await axios.post(
        `${baseUrl}/api/session/startSession`,
        {
            classId: CLASS_ID,
            classStart,
            classEnd,
            attendanceTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return res.data;
}

async function markAttendance(baseUrl, token, sessionId, student) {
    try {
        const res = await axios.post(
            `${baseUrl}/api/session/mark`,
            { sessionId, via: "App" }, // userId taken from JWT
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✅ Attendance marked for ${student.userId}`);
        return res.data;
    } catch (err) {
        console.error(
            `⚠️ Failed for ${student.userId}:`,
            err.response?.data || err.message
        );
        return null;
    }
}

/**
 * Full flow: login faculty -> start session -> mark attendance for students
 * @param {string} baseUrl - Base API URL
 */
export async function testSessionFlow(baseUrl) {
    try {
        // 1. Faculty login
        const facultyToken = await login(baseUrl, faculty);
        console.log(`✅ Faculty logged in: ${faculty.userId}`);

        // 2. Start session
        const session = await startSession(baseUrl, facultyToken);
        console.log(`✅ Session started: ${session.sessionId}`);

        // 3. Student logins & mark attendance
        for (const s of students) {
            const studentToken = await login(baseUrl, s);
            console.log(`✅ Student logged in: ${s.userId}`);
            await markAttendance(baseUrl, studentToken, session.sessionId, s);
        }

        console.log("✅ Test session flow complete!");
        return session;
    } catch (err) {
        console.error("❌ Error in test session flow:", err.message);
        return null;
    }
}
