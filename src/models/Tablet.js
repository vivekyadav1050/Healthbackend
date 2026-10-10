import mongoose from "mongoose";
import { randomBytes } from "node:crypto";

const tabletSchema = new mongoose.Schema({
  tabletId: { type: String, unique: true, index: true },
  deviceKey: { type: String, required: true, unique: true, select: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  isActive: { type: Boolean, default: true },
  lastSeenAt: { type: Date, default: null }
}, { timestamps: true });

tabletSchema.pre("validate", function () {
  if (!this.tabletId) this.tabletId = `TAB-${randomBytes(4).toString("hex").toUpperCase()}`;
});

export default mongoose.model("Tablet", tabletSchema);
