# Algae Scroll (MVP)

Mobile app (Expo React Native) + backend API (Node.js/Express/PostgreSQL) for a scientific reels-style feed focused on algae research.

## Project structure

- `backend/`: Express API, ingestion pipeline (PubMed + arXiv), PostgreSQL persistence
- `mobile/`: Expo app with vertical full-screen feed, tabs, keyword filters

## MVP features implemented

- Infinite vertical feed with full-screen cards and snap behavior
- Tabs:
  - `Nouveautes`: unseen articles
  - `Archives`: viewed articles
- Keyword filtering (`algae`, `hab`, `genomics`, etc.)
- Read/unread tracking by `deviceId`
- Backend ingestion from:
  - PubMed API (`eutils`)
  - arXiv API
- AI summary service with OpenAI placeholder:
  - simplified French explanation
  - key bullet points
- Local mobile cache via AsyncStorage

## Backend setup

1. Start PostgreSQL (local or Docker) and create a database:
   - `algae_scroll`
2. Configure env:

   - Copy `backend/.env.example` to `backend/.env`
   - Update `DATABASE_URL`

3. Install and run:

```bash
cd backend
npm install
npm run db:init
npm run ingest
npm run dev
```

API base URL: `http://localhost:4000`

### Local open-source summarization (recommended, lowest cost)

The backend can use a local Ollama model for summaries/key points (no paid API).

1. Install Ollama (macOS):

```bash
brew install ollama
```

2. Start Ollama server:

```bash
ollama serve
```

3. Pull a model:

```bash
ollama pull qwen2.5:7b-instruct
```

4. In `backend/.env` set:

```env
SUMMARY_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b-instruct
```

Notes:
- `SUMMARY_PROVIDER=openai` uses OpenAI API key if preferred.
- `SUMMARY_PROVIDER=none` disables LLM and uses extractive fallback only.

Endpoints:
- `GET /articles?keywords=algae,hab&deviceId=my-device&page=1&limit=10`
- `GET /articles/new?keywords=algae&deviceId=my-device&page=1&limit=10`
- `POST /articles/mark-read` with JSON `{ "articleId": 123, "deviceId": "my-device" }`

## Mobile setup (Expo)

1. Configure API base URL:

```bash
export EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

2. Install and run:

```bash
cd mobile
npm install
npm run start
```

Then open iOS/Android simulator or Expo Go.

## Notes

- OpenAI integration is currently a placeholder fallback in `backend/src/services/aiProcessor.js`.
- Optional figures/graphs are supported in schema (`figure_url`) but not yet populated from sources in MVP.
