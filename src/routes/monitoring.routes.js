import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { uploadReadings, latestReading, recentHistory, patientHistory, activePatients } from "../controllers/monitoring.controller.js";

const router = Router();
router.post("/", authenticate, allowRoles("tablet"), uploadReadings);
router.get("/active-patients", authenticate, allowRoles("monitor"), activePatients);
router.get("/patients/:patientId/latest", authenticate, allowRoles("tablet", "monitor"), latestReading);
router.get("/patients/:patientId/history", authenticate, allowRoles("tablet", "monitor"), patientHistory);
router.get("/patients/:patientId", authenticate, allowRoles("tablet", "monitor"), recentHistory);
export default router;
