import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
<<<<<<< HEAD
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

=======
import { uploadReadings, latestReading, recentHistory, patientHistory, activePatients } from "../controllers/monitoring.controller.js";

const router = Router();
router.post("/", authenticate, allowRoles("tablet"), uploadReadings);
router.get("/active-patients", authenticate, allowRoles("monitor"), activePatients);
router.get("/patients/:patientId/latest", authenticate, allowRoles("tablet", "monitor"), latestReading);
router.get("/patients/:patientId/history", authenticate, allowRoles("tablet", "monitor"), patientHistory);
router.get("/patients/:patientId", authenticate, allowRoles("tablet", "monitor"), recentHistory);
>>>>>>> 80cdcdfd3adbb9c6e5688f005fb7fe2f989f77ba
export default router;
