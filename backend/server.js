import "dotenv/config";          // must be first so env vars exist before other files use them
import app from "./src/app.js";
import connectDB from "./src/db/db.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});