import { fetchArxivArticles, fetchPubMedArticles } from "../services/articleSources.js";
import { summarizeAbstract } from "../services/aiProcessor.js";
import { upsertArticle } from "../repositories/articlesRepo.js";

export async function ingestArticles() {
  const [pubmed, arxiv] = await Promise.all([
    fetchPubMedArticles(10),
    fetchArxivArticles(10)
  ]);
  const combined = [...pubmed, ...arxiv];

  let saved = 0;
  for (const article of combined) {
    const { simplifiedFrench, keyPoints } = await summarizeAbstract({
      title: article.title,
      abstract: article.abstract
    });
    await upsertArticle({
      ...article,
      simplifiedFrench,
      keyPoints,
      imageUrls: article.imageUrls ?? [],
      imageCaptions: article.imageCaptions ?? []
    });
    saved += 1;
  }

  return {
    fetched: combined.length,
    saved
  };
}
