import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false
});

const KEYWORD_RULES = [
  { tag: "algae", patterns: ["algae", "algal", "microalga", "seaweed"] },
  { tag: "hab", patterns: ["harmful algal bloom", "harmful bloom", "hab"] },
  { tag: "genomics", patterns: ["genomic", "genomics", "transcriptom", "metagenom", "dna", "rna"] },
  { tag: "phytoplankton", patterns: ["phytoplankton", "diatom", "dinoflagellate", "cyanobacter"] },
  { tag: "toxin", patterns: ["toxin", "toxicity", "cyanotoxin", "domoic acid", "saxitoxin"] },
  { tag: "bloom", patterns: ["bloom", "eutrophication"] },
  { tag: "monitoring", patterns: ["monitoring", "detection", "forecast", "remote sensing"] },
  { tag: "climate", patterns: ["climate", "warming", "temperature", "heatwave"] }
];

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function extractKeywords(text) {
  const content = (text || "").toLowerCase();
  return KEYWORD_RULES.filter((rule) => rule.patterns.some((pattern) => content.includes(pattern))).map(
    (rule) => rule.tag
  );
}

function extractAbstractText(pubmedArticle) {
  const abstractNode = pubmedArticle?.MedlineCitation?.Article?.Abstract?.AbstractText;
  const chunks = asArray(abstractNode).map((part) => {
    if (typeof part === "string") return part;
    if (part?.["#text"]) return part["#text"];
    return "";
  });
  return cleanText(chunks.join(" "));
}

function buildPubMedAbstractMap(parsedXml) {
  const articles = asArray(parsedXml?.PubmedArticleSet?.PubmedArticle);
  const map = new Map();

  for (const article of articles) {
    const pmid = cleanText(article?.MedlineCitation?.PMID?.["#text"] || article?.MedlineCitation?.PMID);
    if (!pmid) continue;
    map.set(pmid, extractAbstractText(article));
  }

  return map;
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
  const abstractUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}`;
  const abstractRes = await fetch(abstractUrl);
  const abstractXml = await abstractRes.text();
  const abstractMap = buildPubMedAbstractMap(parser.parse(abstractXml));

  return ids
    .map((id) => detailsJson?.result?.[id])
    .filter(Boolean)
    .map((item) => {
      const title = item.title || "Untitled PubMed article";
      const abstract = abstractMap.get(item.uid) || "";
      const textBlob = `${title} ${abstract}`;
      const doi = item?.articleids?.find((v) => v.idtype === "doi")?.value;
      return {
        sourceId: `pubmed:${item.uid}`,
        sourceName: "pubmed",
        title,
        abstract: abstract || item?.elocationid || title,
        doiUrl: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
        publicationDate: item?.pubdate ? new Date(item.pubdate) : null,
        keywords: extractKeywords(textBlob),
        imageUrls: [],
        imageCaptions: []
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
        keywords: extractKeywords(textBlob),
        imageUrls: [],
        imageCaptions: []
      };
    });
}
