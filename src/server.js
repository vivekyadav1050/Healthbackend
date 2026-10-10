import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const required = ["MONGODB_URI", "JWT_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters");
  process.exit(1);
}
if (process.env.ADMIN_PASSWORD.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters");
  process.exit(1);
}

const PORT = Number(process.env.PORT || 5000);
try {
  await connectDB();
  app.listen(PORT, () => console.log(`AP-20 backend listening on http://localhost:${PORT}`));
} catch (error) {
  console.error("Could not start backend:", error.message);
  process.exit(1);
}
