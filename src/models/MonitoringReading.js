import mongoose from "mongoose";

const readingSchema = new mongoose.Schema({
  tabletId: { type: String, required: true },
  patientId: { type: String, required: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  recordId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  spo2: { type: Number, min: 0, max: 100, default: null },
  pulseRate: { type: Number, min: 0, max: 300, default: null },
  perfusionIndex: { type: Number, min: 0, max: 100, default: null },
  batteryLevel: { type: Number, min: 0, max: 100, default: null },
  probeStatus: { type: String, enum: ["connected", "disconnected", "searching", "unknown"], required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

readingSchema.index({ tabletId: 1, recordId: 1 }, { unique: true });
readingSchema.index({ patientId: 1, timestamp: -1 });
readingSchema.index({ patient: 1, timestamp: -1 });

export default mongoose.model("MonitoringReading", readingSchema);
