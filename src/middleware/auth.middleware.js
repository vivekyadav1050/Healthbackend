import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Bearer token required" });
  }

  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }

  if (payload.role === "admin") {
    if (payload.username !== process.env.ADMIN_USERNAME.toLowerCase()) {
      return res.status(401).json({ success: false, message: "Invalid admin token" });
    }
    req.user = { id: "env-admin", username: payload.username, role: "admin" };
    return next();
  }

  const user = await User.findById(payload.sub).select("username role isActive");
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: "Account is unavailable" });
  }
  req.user = { id: user.id, username: user.username, role: user.role };
  next();
});
