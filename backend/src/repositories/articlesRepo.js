import { query } from "../db.js";

export async function upsertArticle(article) {
  const sql = `
    INSERT INTO articles (
      source_id,
      source_name,
      title,
      abstract,
      doi_url,
      publication_date,
      keywords,
      simplified_french,
      key_points,
      figure_url
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (source_id) DO UPDATE SET
      title = EXCLUDED.title,
      abstract = EXCLUDED.abstract,
      doi_url = EXCLUDED.doi_url,
      publication_date = EXCLUDED.publication_date,
      keywords = EXCLUDED.keywords,
      simplified_french = COALESCE(EXCLUDED.simplified_french, articles.simplified_french),
      key_points = COALESCE(EXCLUDED.key_points, articles.key_points),
      figure_url = COALESCE(EXCLUDED.figure_url, articles.figure_url),
      updated_at = NOW()
    RETURNING *;
  `;

  const params = [
    article.sourceId,
    article.sourceName,
    article.title,
    article.abstract,
    article.doiUrl,
    article.publicationDate,
    article.keywords,
    article.simplifiedFrench ?? null,
    article.keyPoints ?? [],
    article.figureUrl ?? null
  ];

  const result = await query(sql, params);
  return result.rows[0];
}

export async function getArticles({
  deviceId,
  keywords,
  seen,
  page = 1,
  limit = 10
}) {
  const offset = (page - 1) * limit;
  const params = [deviceId, limit, offset];
  const where = [];

  if (seen === "new") {
    where.push("v.article_id IS NULL");
  } else if (seen === "archives") {
    where.push("v.article_id IS NOT NULL");
  }

  if (keywords?.length) {
    params.push(keywords);
    where.push("a.keywords && $" + params.length + "::text[]");
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT
      a.*,
      (v.article_id IS NOT NULL) AS is_read
    FROM articles a
    LEFT JOIN article_views v
      ON v.article_id = a.id
      AND v.device_id = $1
    ${whereClause}
    ORDER BY a.publication_date DESC NULLS LAST, a.created_at DESC
    LIMIT $2 OFFSET $3;
  `;

  const result = await query(sql, params);
  return result.rows;
}

export async function markAsRead({ deviceId, articleId }) {
  const sql = `
    INSERT INTO article_views (device_id, article_id, viewed_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (device_id, article_id)
    DO UPDATE SET viewed_at = NOW()
    RETURNING *;
  `;
  const result = await query(sql, [deviceId, articleId]);
  return result.rows[0];
}
