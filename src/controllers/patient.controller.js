import mongoose from "mongoose";
import Tablet from "../models/Tablet.js";
import Patient from "../models/Patient.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const assignPatient = asyncHandler(async (req, res) => {
  const { tabletId } = req.params;
  const { patientName, age, sex, date } = req.body;

  // 1. Validate patient details
  if (
    !patientName ||
    typeof patientName !== "string" ||
    !patientName.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "patientName is required",
    });
  }

  if (!Number.isInteger(age) || age < 0 || age > 130) {
    return res.status(400).json({
      success: false,
      message: "age must be an integer from 0 to 130",
    });
  }

  if (!["male", "female", "other"].includes(sex)) {
    return res.status(400).json({
      success: false,
      message: "sex must be male, female, or other",
    });
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  ) {
    return res.status(400).json({
      success: false,
      message: "date must be a valid YYYY-MM-DD date",
    });
  }

  // 2. Find the latest registered tablet belonging to this user
  const tablet = await Tablet.findOne({
    user: req.user.id,
    isActive: true,
  }).sort({ updatedAt: -1, createdAt: -1 });

  if (!tablet) {
    return res.status(404).json({
      success: false,
      message: "No active tablet registered for this user",
    });
  }

  // 3. Ensure the requested tabletId matches the latest registration
  if (tablet.tabletId !== tabletId) {
    return res.status(409).json({
      success: false,
      message: "Tablet ID is outdated. Refresh tablet details and try again.",
      latestTabletId: tablet.tabletId,
    });
  }

  // 4. Prevent assigning a second active patient to the same tablet
  const existingPatient = await Patient.findOne({
    tablet: tablet._id,
    isActive: true,
  });

  if (existingPatient) {
    return res.status(409).json({
      success: false,
      message: "Deactivate the current patient before assigning another",
      currentPatient: {
        patientId: existingPatient.patientId,
        patientName: existingPatient.patientName,
      },
    });
  }

  // 5. Create patient using the latest tablet record
  const patient = await Patient.create({
    patientName: patientName.trim(),
    age,
    sex,
    date,
    tablet: tablet._id,
    tabletId: tablet.tabletId,
    isActive: true,
  });

  return res.status(201).json({
    success: true,
    message: "Patient assigned successfully",
    patient,
  });
});


export const setPatientStatus = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  if (typeof req.body.isActive !== "boolean") {
    return res.status(400).json({ success: false, message: "isActive must be true or false" });
  }
  const patient = await Patient.findOne({ patientId });
  if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });
  const tablet = await Tablet.findOne({ _id: patient.tablet, user: req.user.id });
  if (!tablet) return res.status(403).json({ success: false, message: "You do not own this patient" });
  patient.isActive = req.body.isActive;
  await patient.save();
  res.json({ success: true, message: "Patient status updated", patient });
});
