
# QR Attendance API Documentation

This document provides a detailed description of the QR Attendance API endpoints.

## Authentication

### `POST /api/auth/login`

Authenticates a user and returns a JWT token.

**Request Body:**

```json
{
  "userId": "user_id",
  "password": "password"
}
```

**Response:**

```json
{
  "token": "jwt_token",
  "role": "user_role"
}
```

---

## Analysis

### `GET /api/analysis/atRisk`

Returns a list of at-risk students (attendance below a certain threshold).

**Query Parameters:**

*   `classId` (required): The ID of the class.
*   `threshold` (optional, default: 80): The attendance percentage threshold below which students are considered at-risk.
*   `limit` (optional, default: 50): The maximum number of students to return.
*   `skip` (optional, default: 0): The number of students to skip.
*   `mode` (optional, default: "days"): The mode to calculate attendance. Can be "days" or "sessions".
*   `from` (optional, default: 30 days ago): The start date for attendance calculation (if mode is "days").
*   `to` (optional, default: today): The end date for attendance calculation (if mode is "days").
*   `sessions` (optional, default: 30): The number of last sessions to consider (if mode is "sessions").

**Response:**

```json
{
  "students": [
    {
      "_id": "student_id",
      "name": "Student Name",
      "rollNo": "student_roll_no",
      "attendanceRate": 75,
      "riskLevel": "Medium",
      "lastClass": "Present"
    }
  ],
  "total": 1,
  "threshold": 80,
  "mode": "days",
  "range": {
    "from": "2025-08-10T00:00:00.000Z",
    "to": "2025-09-09T00:00:00.000Z"
  },
  "limit": 50,
  "skip": 0
}
```

### `GET /api/analysis/distribution`

Provides an attendance distribution for a class, categorized into "excellent", "good", and "poor" based on thresholds.

**Query Parameters:**

*   `classId` (required): The ID of the class.
*   `excellentThreshold` (optional, default: 90): The percentage threshold for "excellent" attendance.
*   `goodThreshold` (optional, default: 80): The percentage threshold for "good" attendance.
*   `mode` (optional, default: "days"): The mode to calculate attendance. Can be "days" or "sessions".
*   `from` (optional, default: 30 days ago): The start date for attendance calculation (if mode is "days").
*   `to` (optional, default: today): The end date for attendance calculation (if mode is "days").
*   `sessions` (optional, default: 30): The number of last sessions to consider (if mode is "sessions").

**Response:**

```json
{
  "excellent": 10,
  "good": 15,
  "poor": 5,
  "total": 30,
  "thresholds": {
    "excellent": ">90%",
    "good": "80–90%",
    "poor": "<80%"
  },
  "mode": "days",
  "range": {
    "from": "2025-08-10T00:00:00.000Z",
    "to": "2025-09-09T00:00:00.000Z"
  }
}
```

### `GET /api/analysis/overview`

Returns summary metrics for a class, including total students, average attendance rate, at-risk students, and total absences.

**Query Parameters:**

*   `classId` (required): The ID of the class.
*   `mode` (optional, default: "days"): The mode to calculate attendance. Can be "days" or "sessions".
*   `from` (optional, default: 30 days ago): The start date for attendance calculation (if mode is "days").
*   `to` (optional, default: today): The end date for attendance calculation (if mode is "days").
*   `sessions` (optional, default: 30): The number of last sessions to consider (if mode is "sessions").

**Response:**

```json
{
  "totalStudents": 30,
  "avgAttendanceRate": 85,
  "atRiskStudents": 5,
  "totalAbsences": 150,
  "sessionCount": 50,
  "mode": "days",
  "range": {
    "from": "2025-08-10T00:00:00.000Z",
    "to": "2025-09-09T00:00:00.000Z"
  }
}
```

### `GET /api/analysis/trend`

Provides attendance trend data for a class over a specified period (weekly or monthly).

**Query Parameters:**

*   `classId` (required): The ID of the class.
*   `period` (optional, default: "monthly"): The time period for the trend analysis. Can be "weekly" or "monthly".
*   `lastN` (optional, default: 6): The number of periods to include in the trend.

**Response:**

```json
{
  "classId": "class_id",
  "period": "monthly",
  "trend": [
    {
      "period": "2025-08",
      "sessions": 20,
      "attendanceCount": 500,
      "attendanceRate": 83
    },
    {
      "period": "2025-09",
      "sessions": 22,
      "attendanceCount": 550,
      "attendanceRate": 83
    }
  ]
}
```

---

## Session

### `GET /api/session/getMySessions`

Retrieves a list of sessions for the authenticated faculty or admin.

**Query Parameters:**

*   `skip` (optional, default: 0): The number of sessions to skip for pagination.
*   `limit` (optional, default: 20): The maximum number of sessions to return.

**Response:**

```json
{
  "count": 1,
  "skip": 0,
  "limit": 20,
  "sessions": [
    {
      "sessionId": "S-CS101-1662726600000",
      "classId": "CS101",
      "className": "Introduction to Computer Science",
      "classStart": "2025-09-09T10:00:00.000Z",
      "classEnd": "2025-09-09T11:00:00.000Z",
      "facultyId": "faculty_id",
      "attendanceCount": 25,
      "studentCount": 30
    }
  ]
}
```

### `GET /api/session/getSessionAttendance`

Fetches the attendance records for a specific session.

**Query Parameters:**

*   `sessionId` (required): The ID of the session.

**Response:**

```json
{
  "sessionId": "S-CS101-1662726600000",
  "classId": "CS101",
  "attendance": [
    {
      "userDbId": "user_db_id",
      "userId": "student_id",
      "time": "2025-09-09T10:05:00.000Z",
      "via": "QR"
    }
  ]
}
```

### `POST /api/session/mark`

Marks attendance for a student in a session.

**Request Body:**

```json
{
  "sessionId": "S-CS101-1662726600000",
  "via": "QR"
}
```

**Response:**

```json
{
  "message": "✅ Attendance marked successfully",
  "sessionId": "S-CS101-1662726600000",
  "dbId": "user_db_id"
}
```

### `POST /api/session/restartAttendance`

Restarts the attendance-taking process for a session, generating a new QR code.

**Request Body:**

```json
{
  "sessionId": "S-CS101-1662726600000",
  "attendanceStart": "2025-09-09T10:15:00.000Z"
}
```

**Response:**

```json
{
  "message": "✅ Attendance restarted successfully",
  "sessionId": "S-CS101-1662726600000",
  "classId": "CS101",
  "className": "Introduction to Computer Science",
  "newStartTime": "2025-09-09T10:15:00.000Z",
  "newQrPayload": "QR-S-CS101-1662726600000-1662727500000"
}
```

### `GET /api/session/sessionDetails`

Retrieves detailed attendance information for a single session, including a list of all students and their attendance status.

**Query Parameters:**

*   `sessionId` (required): The ID of the session.

**Response:**

```json
{
  "sessionId": "S-CS101-1662726600000",
  "classId": "CS101",
  "className": "Introduction to Computer Science",
  "faculty": {
    "userId": "faculty_id",
    "name": "Faculty Name"
  },
  "sessionStart": "2025-09-09T10:00:00.000Z",
  "sessionEnd": "2025-09-09T11:00:00.000Z",
  "totalStudents": 30,
  "present": 25,
  "absent": 5,
  "attendance": [
    {
      "studentId": "student_id_1",
      "name": "Student Name 1",
      "status": "Present",
      "timestamp": "2025-09-09T10:05:00.000Z",
      "mode": "QR"
    },
    {
      "studentId": "student_id_2",
      "name": "Student Name 2",
      "status": "Absent",
      "timestamp": null,
      "mode": null
    }
  ]
}
```

### `POST /api/session/startSession`

Starts a new attendance session for a class.

**Request Body:**

```json
{
  "classId": "CS101",
  "classStart": "2025-09-09T10:00:00.000Z",
  "classEnd": "2025-09-09T11:00:00.000Z",
  "attendanceTime": 15
}
```

**Response:**

```json
{
  "message": "✅ Session started successfully",
  "sessionId": "S-CS101-1662726600000",
  "qrPayload": "S-CS101-1662726600000-CS101-1662726600000",
  "classId": "CS101"
}
```
