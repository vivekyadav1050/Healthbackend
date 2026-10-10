import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { registerTablet, getMyTablet } from "../controllers/tablet.controller.js";

const router = Router();
router.use(authenticate, allowRoles("tablet"));
router.post("/register", registerTablet);
router.get("/me", getMyTablet);
export default router;
