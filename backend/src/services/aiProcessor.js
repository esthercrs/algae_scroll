function trimWords(text, wordCount = 70) {
  const words = (text || "").split(/\s+/).filter(Boolean);
  return words.slice(0, wordCount).join(" ");
}

function clampWords(text, maxWords = 220) {
  return trimWords(text, maxWords);
}

function splitSentences(text) {
  return (text || "")
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function stripDoiAndUrls(text) {
  return (text || "")
    .replace(/\bdoi\s*:\s*\S+/gi, "")
    .replace(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForFallback(text) {
  return String(text || "")
    .replace(/\bwe\b/gi, "les auteurs")
    .replace(/\bour study\b/gi, "cette etude")
    .replace(/\bthis study\b/gi, "cette etude")
    .replace(/\bresults?\b/gi, "resultats")
    .replace(/\bmodel\b/gi, "modele")
    .replace(/\bmodels\b/gi, "modeles")
    .replace(/\bdata\b/gi, "donnees")
    .replace(/\bforecast(?:ing)?\b/gi, "prevision")
    .replace(/\brisk\b/gi, "risque")
    .replace(/\bmonitoring\b/gi, "surveillance")
    .replace(/\bmethod\b/gi, "methode")
    .replace(/\bapproach\b/gi, "approche")
    .replace(/\s+/g, " ")
    .trim();
}

function extractiveSentences(text, maxCount = 5) {
  const sentences = splitSentences(text).map(normalizeForFallback);
  const filtered = sentences.filter((s) => s.split(/\s+/).length >= 8);
  return filtered.slice(0, maxCount);
}

function localFrenchFallback(abstractText) {
  const cleaned = stripDoiAndUrls(abstractText);
  const selected = extractiveSentences(cleaned, 5);
  const summary = selected.join(". ").replace(/\s+/g, " ").trim();

  return {
    simplifiedFrench: clampWords(summary || "Resume non disponible pour cet article.", 220),
    keyPoints: selected.slice(0, 6).map((sentence) => clampWords(sentence, 28))
  };
}

function buildPrompt(abstractText) {
  return (
    `Resume cet abstract en francais scientifique clair et fidele au texte.\n` +
    `Contraintes:\n` +
    `- 180 a 220 mots pour simplifiedFrench\n` +
    `- keyPoints: 4 a 6 puces courtes\n` +
    `- Le resume doit inclure des elements SPECIFIQUES du texte source (variables, methode, population, site, horizon temporel ou metriques quand presentes)\n` +
    `- Interdiction des formulations generiques du type "cette etude montre..." sans details concrets\n` +
    `- Ne commence jamais par "En bref"\n` +
    `- Ne jamais afficher de DOI, URL, ou reference brute\n` +
    `- N'ajoute aucune information non presente dans l'abstract\n` +
    `- Reponds uniquement en JSON valide avec les cles simplifiedFrench et keyPoints\n` +
    `Abstract:\n${abstractText}`
  );
}

function parseModelJson(text) {
  const raw = String(text || "").trim();
  const direct = raw.match(/\{[\s\S]*\}/);
  if (!direct) {
    throw new Error("Model output did not include JSON");
  }
  return JSON.parse(direct[0]);
}

function normalizeSummaryPayload(parsed) {
  const keyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 6) : [];
  if (!parsed.simplifiedFrench || keyPoints.length < 4) {
    throw new Error("Summary payload missing expected fields");
  }

  const normalizedPoints = keyPoints
    .map((point) =>
      stripDoiAndUrls(String(point))
        .replace(/^\s*[-*•]+\s*/g, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 6);

  if (normalizedPoints.length < 4) {
    throw new Error("Summary payload has insufficient clean key points");
  }

  const summary = clampWords(stripDoiAndUrls(parsed.simplifiedFrench).replace(/^en bref[:\s-]*/i, ""), 220);
  if (!isFrenchEnough(summary)) {
    throw new Error("Summary payload not French enough");
  }

  return {
    simplifiedFrench: summary,
    keyPoints: normalizedPoints
  };
}

function isFrenchEnough(text) {
  const content = String(text || "").toLowerCase();
  const frenchMarkers = [
    " les ",
    " des ",
    " une ",
    " dans ",
    " avec ",
    " pour ",
    " cette ",
    " donnees ",
    " resultats "
  ];
  const englishMarkers = [" the ", " and ", " with ", " data ", " results ", " study ", " model "];
  const frScore = frenchMarkers.reduce((acc, m) => (content.includes(m) ? acc + 1 : acc), 0);
  const enScore = englishMarkers.reduce((acc, m) => (content.includes(m) ? acc + 1 : acc), 0);
  return frScore >= 2 && frScore >= enScore;
}

async function summarizeWithOllama(abstractText) {
  const endpoint = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";
  const cleaned = stripDoiAndUrls(abstractText);
  const response = await fetch(`${endpoint}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      options: {
        temperature: 0.2
      },
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant scientifique francophone. Tu n'inventes aucun fait. Tu reponds uniquement en JSON."
        },
        {
          role: "user",
          content: buildPrompt(cleaned)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status})`);
  }

  const json = await response.json();
  const content = json?.message?.content;
  if (!content) {
    throw new Error("Ollama response did not include content");
  }

  return normalizeSummaryPayload(parseModelJson(content));
}

async function summarizeWithOpenAI(abstractText) {
  const cleaned = stripDoiAndUrls(abstractText);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant scientifique francophone. Reponds strictement en JSON avec les cles simplifiedFrench (string) et keyPoints (array de strings). Interdiction absolue d'inventer, d'extrapoler ou d'ajouter des faits absents du texte source."
        },
        {
          role: "user",
          content: buildPrompt(abstractText)
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status})`);
  }

  const json = await response.json();
  const payload = json?.choices?.[0]?.message?.content;
  if (!payload) {
    throw new Error("OpenAI response did not include content");
  }

  return normalizeSummaryPayload(JSON.parse(payload));
}

export async function summarizeAbstract(input) {
  const title = typeof input === "string" ? "" : stripDoiAndUrls(input?.title || "");
  const abstractText = typeof input === "string" ? input : input?.abstract || "";
  const cleaned = stripDoiAndUrls(abstractText);
  const combinedContext = stripDoiAndUrls([title, cleaned].filter(Boolean).join(". "));
  if (!combinedContext) {
    return {
      simplifiedFrench: "Resume non disponible pour cet article.",
      keyPoints: ["Aucun resume source fourni."]
    };
  }

  const provider = process.env.SUMMARY_PROVIDER || "ollama";

  if (provider === "none") {
    return localFrenchFallback(combinedContext);
  }

  try {
    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      return await summarizeWithOpenAI(combinedContext);
    }

    return await summarizeWithOllama(combinedContext);
  } catch (_error) {
    if (process.env.OPENAI_API_KEY) {
      try {
        return await summarizeWithOpenAI(combinedContext);
      } catch {
        return localFrenchFallback(combinedContext);
      }
    }

    return localFrenchFallback(combinedContext);
  }
}
