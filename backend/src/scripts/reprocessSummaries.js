import dotenv from "dotenv";
import { pool, query } from "../db.js";
import { summarizeAbstract } from "../services/aiProcessor.js";

dotenv.config();

async function reprocessAllSummaries() {
  const result = await query(
    `
    SELECT id, title, abstract
    FROM articles
    ORDER BY publication_date DESC NULLS LAST, created_at DESC
    `
  );

  const rows = result.rows || [];
  let updated = 0;

  for (const row of rows) {
    const { simplifiedFrench, keyPoints } = await summarizeAbstract({
      title: row.title || "",
      abstract: row.abstract || ""
    });

    await query(
      `
      UPDATE articles
      SET simplified_french = $1,
          key_points = $2,
          updated_at = NOW()
      WHERE id = $3
      `,
      [simplifiedFrench, keyPoints, row.id]
    );
    updated += 1;
  }

  console.log(`Summaries reprocessed: ${updated}/${rows.length}`);
}

reprocessAllSummaries()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
