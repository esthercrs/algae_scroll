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

## Installable builds (TestFlight + Android)

To use the app without your computer running Expo, build binaries with EAS.

### 1) Prepare mobile config

```bash
cd mobile
cp .env.example .env
```

Edit `.env` and set:
- `EXPO_PUBLIC_API_BASE_URL` to a hosted API URL (not localhost), for example `https://api.my-domain.com`
- Optional package IDs:
  - `EXPO_PUBLIC_IOS_BUNDLE_ID` (default: `com.escros.algaescroll`)
  - `EXPO_PUBLIC_ANDROID_PACKAGE` (default: `com.escros.algaescroll`)

### 2) Initialize EAS project

```bash
npx eas-cli login
npx eas-cli init
```

Then copy the generated project id into `mobile/.env`:
- `EXPO_PROJECT_ID=<value>`

### 3) Build production binaries

```bash
cd mobile
npm run build:ios
npm run build:android
```

### 4) Submit to stores

```bash
cd mobile
npm run submit:ios
npm run submit:android
```

Notes:
- iOS build appears in App Store Connect, then distribute via TestFlight.
- Android build can be uploaded to Google Play (Internal testing first).
- Once installed from TestFlight/Play, users no longer depend on your computer, but the backend must stay online.

## Notes

- OpenAI integration is currently a placeholder fallback in `backend/src/services/aiProcessor.js`.
- Optional figures/graphs are supported in schema (`figure_url`) but not yet populated from sources in MVP.
