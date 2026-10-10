import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createUser = asyncHandler(async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = req.body.role;

  if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
    return res.status(400).json({ success: false, message: "Username must be 3-40 characters (letters, numbers, dot, underscore, hyphen)" });
  }
  if (password.length < 12) {
    return res.status(400).json({ success: false, message: "Password must be at least 12 characters" });
  }
  if (!["tablet", "monitor"].includes(role)) {
    return res.status(400).json({ success: false, message: "Role must be tablet or monitor" });
  }
  if (await User.exists({ username })) {
    return res.status(409).json({ success: false, message: "Username already exists" });
  }

  const user = await User.create({
    username,
    passwordHash: await bcrypt.hash(password, 12),
    role
  });
  res.status(201).json({
    success: true,
    user: { id: user.id, username: user.username, role: user.role, isActive: user.isActive, createdAt: user.createdAt }
  });
});


export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("username role isActive createdAt updatedAt").sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }
  if (typeof req.body.isActive !== "boolean") {
    return res.status(400).json({ success: false, message: "isActive must be true or false" });
  }
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { isActive: req.body.isActive },
    { new: true, runValidators: true }
  ).select("username role isActive createdAt updatedAt");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, user });
});
