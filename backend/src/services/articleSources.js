import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false
});

function normalizeKeywords(text) {
  const content = (text || "").toLowerCase();
  const candidates = ["algae", "hab", "genomics", "phytoplankton", "toxin", "bloom"];
  return candidates.filter((kw) => content.includes(kw));
}

export async function fetchPubMedArticles(limit = 10) {
  const query = encodeURIComponent(
    process.env.PUBMED_QUERY || "algae harmful algal bloom genomics"
  );

  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}&sort=pub+date&term=${query}`;
  const searchRes = await fetch(searchUrl);
  const searchJson = await searchRes.json();
  const ids = searchJson?.esearchresult?.idlist || [];

  if (!ids.length) {
    return [];
  }

  const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsJson = await detailsRes.json();

  return ids
    .map((id) => detailsJson?.result?.[id])
    .filter(Boolean)
    .map((item) => {
      const title = item.title || "Untitled PubMed article";
      const summaryText = `${title} ${(item?.sortfirstauthor || "").trim()}`;
      const doi = item?.articleids?.find((v) => v.idtype === "doi")?.value;
      return {
        sourceId: `pubmed:${item.uid}`,
        sourceName: "pubmed",
        title,
        abstract: item?.elocationid || summaryText,
        doiUrl: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
        publicationDate: item?.pubdate ? new Date(item.pubdate) : null,
        keywords: normalizeKeywords(summaryText)
      };
    });
}

export async function fetchArxivArticles(limit = 10) {
  const query = encodeURIComponent(process.env.ARXIV_QUERY || `all:algae+OR+all:"harmful algal bloom"`);
  const arxivUrl = `https://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=${limit}&sortBy=submittedDate&sortOrder=descending`;
  const response = await fetch(arxivUrl);
  const xml = await response.text();
  const parsed = parser.parse(xml);
  const entries = parsed?.feed?.entry || [];
  const list = Array.isArray(entries) ? entries : [entries];

  return list
    .filter(Boolean)
    .map((entry) => {
      const summary = (entry.summary || "").replace(/\s+/g, " ").trim();
      const title = (entry.title || "").replace(/\s+/g, " ").trim();
      const id = entry.id || "";
      const textBlob = `${title} ${summary}`;
      return {
        sourceId: `arxiv:${id.split("/").pop()}`,
        sourceName: "arxiv",
        title,
        abstract: summary,
        doiUrl: id,
        publicationDate: entry.published ? new Date(entry.published) : null,
        keywords: normalizeKeywords(textBlob)
      };
    });
}
