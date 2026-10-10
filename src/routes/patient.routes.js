import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { assignPatient, setPatientStatus } from "../controllers/patient.controller.js";

const router = Router();
router.use(authenticate, allowRoles("tablet","monitor" ));
router.post("/tablets/:tabletId/patient", assignPatient);
router.patch("/patients/:patientId/status", setPatientStatus);
export default router;
