/**
 * Author: Subhranil Maity
 * FileName: seedUsersAndClasses.js
 * Description: Script to seed initial users (faculty + students) and classes into the database.
 */

import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Class from "../models/Class.js";

async function seedData() {
  await connectDB();

  // ----- 1. Seed Users -----
  const users = [
    // Admin
    { name: "Admin User", userId: "A25101300123", password: "admin123", role: "admin" },

    // Faculty
    { name: "Dr. Sharma", userId: "F25101300124", password: "faculty123", role: "faculty" },
    { name: "Dr. Kapoor", userId: "F25101300125", password: "faculty123", role: "faculty" },
    { name: "Dr. Mehta", userId: "F25101300126", password: "faculty123", role: "faculty" },

    // Students
    { name: "Aman Singh", userId: "25101300127", password: "student123", role: "student" },
    { name: "Riya Verma", userId: "25101300128", password: "student123", role: "student" },
    { name: "Karan Patel", userId: "25101300129", password: "student123", role: "student" },
    { name: "Sanya Gupta", userId: "25101300130", password: "student123", role: "student" },
    { name: "Rahul Joshi", userId: "25101300131", password: "student123", role: "student" },
    { name: "Neha Sharma", userId: "25101300132", password: "student123", role: "student" }
  ];

  const savedUsers = {};
  for (let u of users) {
    let existing = await User.findOne({ userId: u.userId });
    if (existing) {
      console.log(`⚠️ User already exists: ${u.userId}`);
      savedUsers[u.userId] = existing;
      continue;
    }

    const passwordHash = await bcrypt.hash(u.password, 10);
    const newUser = new User({ ...u, passwordHash });
    delete newUser.password;
    const saved = await newUser.save();
    savedUsers[u.userId] = saved;
    console.log(`✅ Created user: ${u.userId} (${u.role})`);
  }

  // ----- 2. Seed Classes -----
  const classes = [
    {
      classId: "CSE101",
      name: "Discrete Mathematics",
      assignedTo: savedUsers["F25101300124"]._id,
      students: [
        savedUsers["25101300127"]._id,
        savedUsers["25101300128"]._id,
        savedUsers["25101300129"]._id
      ]
    },
    {
      classId: "CSE102",
      name: "Computer Basics",
      assignedTo: savedUsers["F25101300125"]._id,
      students: [
        savedUsers["25101300128"]._id,
        savedUsers["25101300130"]._id,
        savedUsers["25101300131"]._id
      ]
    },
    {
      classId: "CSE103",
      name: "Data Structures",
      assignedTo: savedUsers["F25101300126"]._id,
      students: [
        savedUsers["25101300127"]._id,
        savedUsers["25101300129"]._id,
        savedUsers["25101300132"]._id
      ]
    }
  ];

  const savedClasses = {};
  for (let c of classes) {
    let existing = await Class.findOne({ classId: c.classId });
    if (existing) {
      console.log(`⚠️ Class already exists: ${c.classId}`);
      savedClasses[c.classId] = existing;
      continue;
    }

    const saved = await new Class(c).save();
    savedClasses[c.classId] = saved;
    console.log(`✅ Created class: ${c.classId} (${c.name})`);
  }

  console.log("🎉 Seeding completed!");
  process.exit();
}

seedData();

