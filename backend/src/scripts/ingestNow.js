import dotenv from "dotenv";
import { ingestArticles } from "../jobs/ingest.js";
import { pool } from "../db.js";

dotenv.config();

async function run() {
  const result = await ingestArticles();
  console.log("Manual ingest complete:", result);
  await pool.end();
}

run().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
