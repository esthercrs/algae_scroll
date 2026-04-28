import dotenv from "dotenv";
import { query, pool } from "../db.js";

dotenv.config();

const statements = [
  `
  CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    source_id TEXT NOT NULL UNIQUE,
    source_name TEXT NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT,
    doi_url TEXT NOT NULL,
    publication_date TIMESTAMP,
    keywords TEXT[] DEFAULT '{}',
    simplified_french TEXT,
    key_points TEXT[] DEFAULT '{}',
    image_urls TEXT[] DEFAULT '{}',
    image_captions TEXT[] DEFAULT '{}',
    figure_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  `,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';`,
  `ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_captions TEXT[] DEFAULT '{}';`,
  `
  CREATE TABLE IF NOT EXISTS article_views (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (device_id, article_id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS article_likes (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    liked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (device_id, article_id)
  );
  `,
  `CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(publication_date DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_articles_keywords ON articles USING GIN(keywords);`,
  `CREATE INDEX IF NOT EXISTS idx_article_likes_device ON article_likes(device_id);`
];

async function initDb() {
  for (const statement of statements) {
    await query(statement);
  }
  console.log("Database initialized.");
  await pool.end();
}

initDb().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
