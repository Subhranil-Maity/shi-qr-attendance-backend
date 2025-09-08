/**
 * Author: Subhranil Maity
 * FileName: Class.js
 * Description: Mongoose schema and model for Class.
 */
import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    classId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.models.Class || mongoose.model("Class", classSchema);
