import "dotenv/config";
import "./src/utils/dnsOverride.js";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import { cleanupExpiredDemos } from "./src/services/demo.service.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  setInterval(() => {
    cleanupExpiredDemos().catch((err) => console.error("Demo cleanup failed:", err.message));
  }, 15 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});