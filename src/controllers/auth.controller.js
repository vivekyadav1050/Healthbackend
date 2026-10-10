import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "username and password are required" });
  }

  let user;
  if (
    username === process.env.ADMIN_USERNAME.toLowerCase() &&
    password === process.env.ADMIN_PASSWORD
  ) {
    user = { id: "env-admin", username, role: "admin" };
  } else {
    const found = await User.findOne({ username }).select("+passwordHash");
    if (!found || !found.isActive || !(await bcrypt.compare(password, found.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }
    user = { id: found.id, username: found.username, role: found.role };
  }

  const token = jwt.sign(
    { role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
  res.json({ success: true, message: "Login successful", token, tokenType: "Bearer", user });
});
