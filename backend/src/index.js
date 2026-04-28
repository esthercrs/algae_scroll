import dotenv from "dotenv";
import { app } from "./app.js";
import { query } from "./db.js";
import { ingestArticles } from "./jobs/ingest.js";

dotenv.config();

const port = Number(process.env.PORT || 4000);

async function bootstrap() {
  await query("SELECT 1");
  app.listen(port, async () => {
    console.log(`API running on http://localhost:${port}`);
    if (process.env.INGEST_ON_START === "true") {
      try {
        const result = await ingestArticles();
        console.log("Ingest complete:", result);
      } catch (error) {
        console.error("Ingest failed:", error.message);
      }
    }
  });
}

bootstrap().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});
