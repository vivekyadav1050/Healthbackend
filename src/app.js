import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import tabletRoutes from "./routes/tablet.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import monitoringRoutes from "./routes/monitoring.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => res.json({ success: true, message: "AP-20 backend is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tablets", tabletRoutes);
app.use("/api", patientRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
