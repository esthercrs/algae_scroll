const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function fetchArticles({ tab, keywords, page, deviceId }) {
  const query = new URLSearchParams();
  query.set("deviceId", deviceId);
  query.set("page", String(page));
  query.set("limit", "10");
  if (keywords.length) {
    query.set("keywords", keywords.join(","));
  }

  const endpoint = tab === "new" ? "/articles/new" : "/articles";
  if (tab === "archives") {
    query.set("seen", "archives");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}?${query.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch articles");
  }
  const json = await response.json();
  return json.data || [];
}

export async function markArticleRead(articleId, deviceId) {
  const response = await fetch(`${API_BASE_URL}/articles/mark-read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ articleId, deviceId })
  });
  if (!response.ok) {
    throw new Error("Failed to mark article as read");
  }
}
