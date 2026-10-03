import "dotenv/config";
import "./src/utils/dnsOverride.js";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});