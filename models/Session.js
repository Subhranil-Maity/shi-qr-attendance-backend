/**
 * Author: Subhranil Maity
 * FileName: Session.js 
 * Description: Mongoose schema and model for Session.
**/

import mongoose from "mongoose";
import { attendanceSchema } from "./Attendance.js";

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    year: { type: Number, required: true },
    classStart: { type: Date, required: true },
    classEnd: { type: Date, required: true },
    attendanceStart: { type: Date, required: true },
    attendanceTime: { type: Number, required: true }, // duration in minutes
    qrPayload: { type: String, required: true },
    attendance: [attendanceSchema],
  },
  { timestamps: true }
);

// Indexes for fast analytics queries
sessionSchema.index({ year: 1, classId: 1 });
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ "attendance.userId": 1, "attendance.time": 1 });

export default mongoose.models.Session || mongoose.model("Session", sessionSchema);

