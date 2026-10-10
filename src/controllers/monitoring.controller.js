import mongoose from "mongoose";
import Tablet from "../models/Tablet.js";
import Patient from "../models/Patient.js";
import MonitoringReading from "../models/MonitoringReading.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const readingFields = ["recordId", "timestamp", "spo2", "pulseRate", "perfusionIndex", "batteryLevel", "probeStatus"];

const numericRules = {
  spo2: [0, 100], pulseRate: [0, 300], perfusionIndex: [0, 100], batteryLevel: [0, 100]
};

function validateReading(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return "Each reading must be an object";
  for (const key of readingFields) {
    if (!(key in item)) return `Missing reading field: ${key}`;
  }
  if (typeof item.recordId !== "string" || !item.recordId.trim() || item.recordId.length > 200) return "recordId must be a non-empty string up to 200 characters";
  if (Number.isNaN(Date.parse(item.timestamp))) return "timestamp must be a valid date";
  for (const [key, [min, max]] of Object.entries(numericRules)) {
    if (item[key] !== null && (typeof item[key] !== "number" || !Number.isFinite(item[key]) || item[key] < min || item[key] > max)) {
      return `${key} must be null or a number from ${min} to ${max}`;
    }
  }
  if (!["connected", "disconnected", "searching", "unknown"].includes(item.probeStatus)) return "probeStatus is invalid";
  return null;
}

async function authorizePatientRead(req, patientId) {
  const patient = await Patient.findOne({ patientId });
  if (!patient) return { error: { status: 404, message: "Patient not found" } };
  if (req.user.role === "tablet") {
    const tablet = await Tablet.findOne({ _id: patient.tablet, user: req.user.id });
    if (!tablet) return { error: { status: 403, message: "You do not own this patient" } };
  }
  return { patient };
}

export const uploadReadings = asyncHandler(async (req, res) => {
  const { tabletId, readings } = req.body;
  if (typeof tabletId !== "string" || !Array.isArray(readings) || readings.length < 1 || readings.length > 500) {
    return res.status(400).json({ success: false, message: "tabletId and a readings array (1-500 items) are required" });
  }
  for (const item of readings) {
    const error = validateReading(item);
    if (error) return res.status(400).json({ success: false, message: error });
  }

  const tablet = await Tablet.findOne({ tabletId, user: req.user.id });
  if (!tablet) return res.status(403).json({ success: false, message: "You do not own this tablet" });
  if (!tablet.isActive) return res.status(403).json({ success: false, message: "Tablet is deactivated" });
  const patient = await Patient.findOne({ tablet: tablet._id, isActive: true });
  if (!patient) return res.status(409).json({ success: false, message: "No active patient is assigned to this tablet" });

  const docs = readings.map(r => ({
    tabletId, patientId: patient.patientId, patient: patient._id,
    recordId: r.recordId, timestamp: new Date(r.timestamp),
    spo2: r.spo2, pulseRate: r.pulseRate, perfusionIndex: r.perfusionIndex,
    batteryLevel: r.batteryLevel, probeStatus: r.probeStatus
  }));

  let inserted = 0;
  let duplicates = 0;
  for (const doc of docs) {
    try {
      const result = await MonitoringReading.updateOne(
        { tabletId: doc.tabletId, recordId: doc.recordId },
        { $setOnInsert: doc },
        { upsert: true, runValidators: true }
      );
      if (result.upsertedCount === 1) inserted += 1;
      else duplicates += 1;
    } catch (err) {
      if (err.code === 11000) duplicates += 1;
      else throw err;
    }
  }
  tablet.lastSeenAt = new Date();
  await tablet.save();
  res.json({ success: true, message: "Monitoring upload processed", inserted, duplicates });
});

export const latestReading = asyncHandler(async (req, res) => {
  const access = await authorizePatientRead(req, req.params.patientId);
  if (access.error) return res.status(access.error.status).json({ success: false, message: access.error.message });
  const reading = await MonitoringReading.findOne({ patientId: req.params.patientId }).sort({ timestamp: -1 });
  res.json({ success: true, patientId: req.params.patientId, latestReading: reading || null });
});



export const recentHistory = asyncHandler(async (req, res) => {
  if (req.query.range !== "1h") return res.status(400).json({ success: false, message: "Only range=1h is supported" });
  const access = await authorizePatientRead(req, req.params.patientId);
  if (access.error) return res.status(access.error.status).json({ success: false, message: access.error.message });
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const readings = await MonitoringReading.find({ patientId: req.params.patientId, timestamp: { $gte: since } }).sort({ timestamp: -1 }).limit(5000);
  res.json({ success: true, patientId: req.params.patientId, range: "1h", count: readings.length, readings });
});

export const patientHistory = asyncHandler(async (req, res) => {
  const access = await authorizePatientRead(req, req.params.patientId);
  if (access.error) return res.status(access.error.status).json({ success: false, message: access.error.message });
  const page = Number.parseInt(req.query.page ?? "1", 10);
  const limit = Number.parseInt(req.query.limit ?? "100", 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 500) {
    return res.status(400).json({ success: false, message: "page must be >= 1 and limit must be 1-500" });
  }
  const filter = { patientId: req.params.patientId };
  const [totalRecords, readings] = await Promise.all([
    MonitoringReading.countDocuments(filter),
    MonitoringReading.find(filter).sort({ timestamp: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)
  ]);
  res.json({
    success: true, patientId: req.params.patientId, page, limit, totalRecords,
    totalPages: Math.ceil(totalRecords / limit), readings
  });
});

export const activePatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find({ isActive: true })
    .populate({ path: "tablet", match: { isActive: true }, select: "tabletId user lastSeenAt isActive" })
    .sort({ createdAt: -1 });

  const visible = patients.filter(p => p.tablet);
  const tabletUserIds = [...new Set(visible.map(p => String(p.tablet.user)))];
  const users = await User.find({ _id: { $in: tabletUserIds } }).select("username");
  const usernames = new Map(users.map(u => [String(u._id), u.username]));
  const patientIds = visible.map(p => p.patientId);
  
const latestRows = await MonitoringReading.aggregate([
  {
    $match: {
      patientId: { $in: patientIds }
    }
  },
  {
    $sort: {
      timestamp: -1,
      _id: -1
    }
  },
  {
    $group: {
      _id: "$patientId",
      reading: { $first: "$$ROOT" }
    }
  }
]);

const latestMap = new Map(
  latestRows.map(row => [String(row._id), row.reading])
);

const timeout = Number(process.env.DEVICE_ONLINE_TIMEOUT_SECONDS || 120);
  const now = Date.now();

  const result = visible.map(p => {
    const lastSeen = p.tablet.lastSeenAt;
    const online = lastSeen && (now - new Date(lastSeen).getTime()) <= timeout * 1000;
    return {
      patientId: p.patientId, patientName: p.patientName, age: p.age, sex: p.sex, date: p.date,
      tabletId: p.tablet.tabletId, username: usernames.get(String(p.tablet.user)) || null,
      isActive: p.isActive, deviceStatus: online ? "online" : "offline", lastSeenAt: lastSeen || null,
      latestReading: latestMap.has(p.patientId) ? latestMap.get(p.patientId) : null
    };
  });
  res.json({ success: true, count: result.length, patients: result });
});
