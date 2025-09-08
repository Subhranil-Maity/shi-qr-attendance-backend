import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

async function seedUsers() {
  await connectDB();

  const users = [
    { name: "Admin User", username: "A25101300123", password: "admin123", role: "admin" },
    { name: "Dr. Sharma", username: "F25101300124", password: "faculty123", role: "faculty" },
    { name: "Aman Singh", username: "25101300125", password: "student123", role: "student" },
    { name: "Riya Verma", username: "25101300126", password: "student123", role: "student" },
    { name: "Karan Patel", username: "25101300124", password: "student123", role: "student" }
  ];

  for (let u of users) {
    const existing = await User.findOne({ username: u.username });
    if (existing) {
      console.log(`⚠️ User already exists: ${u.username}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(u.password, 10);
    const newUser = new User({ ...u, passwordHash });
    delete newUser.password; // don’t save plain password
    await newUser.save();
    console.log(`✅ Created user: ${u.username} (${u.role})`);
  }

  process.exit();
}

seedUsers();

