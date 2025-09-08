/**
 * Author: Subhranil Maity
 * FileName: Attendance.js 
 * Description: Mongoose schema for Attendance records.
 */

import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    time: { type: Date, required: true },
    via: { type: String, enum: ["Web", "App", "Unknown"], default: "Unknown" },
  },
  { _id: false }
);

export { attendanceSchema };

