import express from "express";
import { getArticles, markAsRead, setLike } from "../repositories/articlesRepo.js";

export const articlesRouter = express.Router();

function toPublicArticle(row) {
  const imageUrls = Array.isArray(row.image_urls) ? row.image_urls : [];
  const imageCaptions = Array.isArray(row.image_captions) ? row.image_captions : [];
  const images = imageUrls
    .map((url, index) => ({
      url,
      caption: imageCaptions[index] || "Figure de l'article"
    }))
    .filter((img) => !!img.url);

  return {
    id: row.id,
    source_id: row.source_id,
    source_name: row.source_name,
    title: row.title,
    article_url: row.doi_url,
    publication_date: row.publication_date,
    keywords: row.keywords || [],
    simplified_french: row.simplified_french || "",
    key_points: row.key_points || [],
    images,
    is_read: !!row.is_read,
    is_liked: !!row.is_liked
  };
}

function parseKeywords(rawKeywords) {
  if (!rawKeywords) return [];
  return rawKeywords
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

articlesRouter.get("/", async (req, res, next) => {
  try {
    const deviceId = req.query.deviceId || "anonymous-device";
    const keywords = parseKeywords(req.query.keywords);
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const seen = req.query.seen;

    const articles = await getArticles({
      deviceId,
      keywords,
      seen,
      page,
      limit
    });

    res.json({ data: articles.map(toPublicArticle), page, limit });
  } catch (error) {
    next(error);
  }
});

articlesRouter.get("/new", async (req, res, next) => {
  try {
    const deviceId = req.query.deviceId || "anonymous-device";
    const keywords = parseKeywords(req.query.keywords);
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const articles = await getArticles({
      deviceId,
      keywords,
      seen: "new",
      page,
      limit
    });
    res.json({ data: articles.map(toPublicArticle), page, limit });
  } catch (error) {
    next(error);
  }
});

articlesRouter.post("/mark-read", async (req, res, next) => {
  try {
    const { articleId, deviceId = "anonymous-device" } = req.body;
    if (!articleId) {
      return res.status(400).json({ error: "articleId is required" });
    }

    const mark = await markAsRead({ articleId, deviceId });
    return res.status(201).json({ data: mark });
  } catch (error) {
    next(error);
  }
});

articlesRouter.get("/liked", async (req, res, next) => {
  try {
    const deviceId = req.query.deviceId || "anonymous-device";
    const keywords = parseKeywords(req.query.keywords);
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const articles = await getArticles({
      deviceId,
      keywords,
      seen: "liked",
      page,
      limit
    });
    res.json({ data: articles.map(toPublicArticle), page, limit });
  } catch (error) {
    next(error);
  }
});

articlesRouter.post("/mark-liked", async (req, res, next) => {
  try {
    const { articleId, deviceId = "anonymous-device", liked } = req.body;
    if (!articleId || typeof liked !== "boolean") {
      return res.status(400).json({ error: "articleId and liked(boolean) are required" });
    }

    const result = await setLike({ articleId, deviceId, liked });
    return res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
});
