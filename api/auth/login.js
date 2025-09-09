/**
 * Author: Subhranil Maity
 * FileName: login.js
 * Description: API route for user login and JWT generation.
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "../../config/db.js";
import User from "../../models/User.js";
import {cors} from "../../lib/cors.js";

export default async function handler(req, res) {
    if (cors(req, res)) return;

    if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await connectDB();

  const { userId, password } = req.body;

  const user = await User.findOne({ userId });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  // generate JWT
  const token = jwt.sign(
    { userId: user.userId, role: user.role, _id: String(user._id) },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.status(200).json({ token, role: user.role });
}
