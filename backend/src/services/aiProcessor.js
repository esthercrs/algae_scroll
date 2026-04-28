function trimWords(text, wordCount = 70) {
  const words = (text || "").split(/\s+/).filter(Boolean);
  return words.slice(0, wordCount).join(" ");
}

function splitSentences(text) {
  return (text || "")
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function summarizeAbstract(abstractText) {
  if (!abstractText) {
    return {
      simplifiedFrench: "Resume non disponible pour cet article.",
      keyPoints: ["Aucun resume source fourni."]
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    const topSentences = splitSentences(abstractText).slice(0, 3);
    return {
      simplifiedFrench:
        "En bref: " +
        trimWords(abstractText, 45) +
        ". Cette etude explore des mecanismes biologiques avec un impact potentiel sur la surveillance environnementale.",
      keyPoints:
        topSentences.length > 0
          ? topSentences.map((s) => trimWords(s, 16))
          : [trimWords(abstractText, 16)]
    };
  }

  // Placeholder for real OpenAI integration:
  // - send abstract to model
  // - request simplified French summary + bullet points
  // For MVP we keep deterministic fallback behavior.
  const topSentences = splitSentences(abstractText).slice(0, 3);
  return {
    simplifiedFrench:
      "Explication simplifiee (placeholder OpenAI): " + trimWords(abstractText, 45),
    keyPoints: topSentences.map((s) => trimWords(s, 16))
  };
}
