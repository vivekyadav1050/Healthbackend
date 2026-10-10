import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true, index: true },
  patientName: { type: String, required: true, trim: true, maxlength: 120 },
  age: { type: Number, required: true, min: 0, max: 130 },
  sex: { type: String, enum: ["male", "female", "other"], required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  tablet: { type: mongoose.Schema.Types.ObjectId, ref: "Tablet", required: true, index: true },
  tabletId: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

patientSchema.pre("validate", function () {
  if (!this.patientId) this.patientId = `PAT-${randomUUID()}`;
});

patientSchema.index({ tablet: 1, isActive: 1 });

export default mongoose.model("Patient", patientSchema);
