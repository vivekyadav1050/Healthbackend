import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { createUser, listUsers, setUserStatus } from "../controllers/admin.controller.js";

const router = Router();
router.use(authenticate, allowRoles("admin"));
router.post("/users", createUser);
router.get("/users", listUsers);
router.patch("/users/:userId/status", setUserStatus);
export default router;
