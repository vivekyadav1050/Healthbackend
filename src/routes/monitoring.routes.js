import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import {
  uploadReadings,
  latestReading,
  recentHistory,
  patientHistory,
  activePatients
} from "../controllers/monitoring.controller.js";

const router = Router();

// POST: Only tablet can upload readings
router.post(
  "/",
  authenticate,
  allowRoles("tablet"),
  uploadReadings
);

// GET: Both monitor and tablet can view monitoring data

router.get(
  "/active-patients",
  authenticate,
  allowRoles("monitor", "tablet"),
  activePatients
);

router.get(
  "/patients/:patientId/latest",
  authenticate,
  allowRoles("monitor", "tablet"),
  latestReading
);

router.get(
  "/patients/:patientId/history",
  authenticate,
  allowRoles("monitor", "tablet"),
  patientHistory
);

router.get(
  "/patients/:patientId",
  authenticate,
  allowRoles("monitor", "tablet"),
  recentHistory
);

export default router;
