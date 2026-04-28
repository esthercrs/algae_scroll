import express from "express";
import { getArticles, markAsRead } from "../repositories/articlesRepo.js";

export const articlesRouter = express.Router();

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

    res.json({ data: articles, page, limit });
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
    res.json({ data: articles, page, limit });
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
