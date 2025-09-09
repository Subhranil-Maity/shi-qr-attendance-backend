/**
 * Author: Subhranil Maity
 * FileName: Attendance.js
 * Description: Mongoose schema for Attendance records.
 */

import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        userDbId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        userId: {type: String, required: true},
        time: {type: Date, required: true},
        via: {type: String, enum: ["Web", "App", "Unknown"], default: "Unknown"},
    },
    {_id: false}
);

export {attendanceSchema};

