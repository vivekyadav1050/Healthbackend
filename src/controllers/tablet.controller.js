import Tablet from "../models/Tablet.js";
import Patient from "../models/Patient.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const registerTablet = asyncHandler(async (req, res) => {
  const deviceKey = String(req.body.deviceKey || "").trim();

  if (deviceKey.length < 16 || deviceKey.length > 200) {
    return res.status(400).json({ success: false, message: "deviceKey must be 16-200 characters" });
  }

  const existing = await Tablet.findOne({ user: req.user.id }).select("+deviceKey");
  if (existing) {
    if (existing.deviceKey !== deviceKey) {
      return res.status(409).json({ success: false, message: "This user is already registered to another device" });
    }
    if (!existing.isActive) return res.status(403).json({ success: false, message: "Tablet is deactivated" });
    existing.lastSeenAt = new Date();
    await existing.save();
    return res.json({ success: true, message: "Tablet already registered", tabletId: existing.tabletId });
  }

  if (await Tablet.exists({ deviceKey })) {
    return res.status(409).json({ success: false, message: "Device key is already registered" });
  }
  const tablet = await Tablet.create({ deviceKey, user: req.user.id, lastSeenAt: new Date() });
  res.status(201).json({ success: true, message: "Tablet registered", tabletId: tablet.tabletId });
});



export const getMyTablet = asyncHandler(async (req, res) => {
  const tablet = await Tablet.findOne({ user: req.user.id });
  if (!tablet) return res.status(404).json({ success: false, message: "Tablet is not registered" });
  const patient = await Patient.findOne({ tablet: tablet._id, isActive: true })
    .select("patientId patientName age sex date isActive createdAt");
  res.json({
    success: true,
    tablet: {
      tabletId: tablet.tabletId,
      isActive: tablet.isActive,
      lastSeenAt: tablet.lastSeenAt,
      patient
    }
  });
});
