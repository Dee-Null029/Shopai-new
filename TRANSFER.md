# ShopAI Transfer Guide

This document is a compact handoff for the ShopAI project.

## Project Summary

ShopAI is a full-stack shopping assistant built with:

- Frontend: React 18, Vite, Tailwind CSS, Three.js, React Three Fiber
- Backend: Node.js, Express, MongoDB, Redis, Socket.io
- AI: OpenAI API for sentiment analysis and chat assistance
- Scraping: Puppeteer-based scrapers for Amazon, Flipkart, and Myntra
- Try-on: MediaPipe-based body scanning and a 3D try-on viewer
- Deployment: Docker Compose for server, client, MongoDB, and Redis

Core behavior includes multi-platform product search, product normalization, deduplication, ranking, optional AI sentiment scoring, affiliate links, authenticated chat, and a client-side virtual try-on flow.

## Key Paths

- `server/` - Express backend
- `server/src/app.js` - backend entry point, routes, Socket.io setup
- `server/src/config/` - environment, database, and Redis config
- `server/src/routes/` - API route modules
- `server/src/models/` - MongoDB models
- `server/src/services/scrapers/` - Amazon, Flipkart, Myntra, and base scraper logic
- `server/src/services/rankingEngine.js` - smart ranking engine
- `server/src/services/openaiService.js` - OpenAI integration
- `server/src/services/sentimentAnalyzer.js` - sentiment scoring
- `server/src/services/chatService.js` - chat assistant logic
- `client/` - React frontend
- `client/src/App.jsx` - frontend app routing
- `client/src/pages/` - main app pages
- `client/src/components/` - reusable UI components
- `client/src/components/TryOn/` - body scanner and 3D try-on components
- `client/src/hooks/useBodyScanner.js` - MediaPipe body scanner hook
- `client/src/services/api.js` - API client
- `docker-compose.yml` - full-stack local deployment
- `README.md` - primary project documentation
- `TASKS.md` - project task notes
- `IEEE_DIAGRAMS.md` - architecture and diagram notes
- `HACKATHON_PPT.md` - presentation source notes

## Private Environment Setup

The private environment file should be created at:

```bash
server/.env
```

Use this tracked template:

```bash
server/.env.example
```

Required values:

```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shopai
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=replace-with-strong-secret
JWT_REFRESH_SECRET=replace-with-strong-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
OPENAI_API_KEY=replace-with-private-key
AMAZON_AFFILIATE_TAG=replace-if-used
FLIPKART_AFFILIATE_ID=replace-if-used
FLIPKART_AFFILIATE_TOKEN=replace-if-used
MYNTRA_AFFILIATE_ID=replace-if-used
PROXY_LIST=
MAX_CONCURRENT_SCRAPES=3
SCRAPE_TIMEOUT=30000
```

Do not share real secrets in public chat, email, screenshots, or source control. Use a password manager, encrypted file, or another private channel.

## Local Setup

Prerequisites:

- Node.js 18 or newer
- MongoDB
- Redis
- Docker and Docker Compose, optional but recommended

Backend:

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Frontend:

```bash
cd client
npm install
npm run dev
```

Production frontend build:

```bash
cd client
npm run build
```

Full stack with Docker:

```bash
docker-compose up --build
```

Docker ports:

- Client: `http://localhost`
- Server: `http://localhost:5000`

## Useful Checks

Backend syntax check:

```bash
cd server
npm run lint
```

Frontend build:

```bash
cd client
npm run build
```

Dependency audit:

```bash
cd server
npm audit --audit-level=moderate

cd ../client
npm audit --audit-level=moderate
```

Git status, including ignored files:

```bash
git status --short --ignored
```

## Smoke Test Flow

1. Start MongoDB and Redis, or run the full stack with Docker.
2. Start the backend with `npm run dev` from `server/`.
3. Start the frontend with `npm run dev` from `client/`.
4. Register or log in through the UI.
5. Run a product search, for example shoes or headphones.
6. Confirm results load from available scrapers.
7. Open a product detail page.
8. Try chat assistant behavior.
9. Open the try-on page and confirm camera permission and 3D viewer behavior.

API smoke endpoint to try once the server is running:

```bash
curl "http://localhost:5000/api/search?q=shoes"
```

## Known Risks And Follow-Ups

- Puppeteer and scraper dependencies may trigger audit warnings. Review `npm audit` output before production use.
- Scraping can break when source sites change markup or block automated traffic.
- Large frontend bundles are likely because Three.js, MediaPipe, and chat UI are loaded by the app. Consider route-level code splitting for try-on and chat.
- Client auth currently depends on browser-side token storage. For production, consider `httpOnly` secure cookies.
- If moving to cookie auth, add explicit CSRF protection.
- The current checkout does not include a CI workflow file, although the project summary mentions CI. Add `.github/workflows/ci.yml` if automated checks are required.

## Transfer Checklist

- [ ] Share `server/.env` securely with real private values.
- [ ] Run `npm install` in `server/`.
- [ ] Run `npm install` in `client/`.
- [ ] Start MongoDB and Redis locally, or use Docker Compose.
- [ ] Start backend with `npm run dev`.
- [ ] Start frontend with `npm run dev`.
- [ ] Build frontend with `npm run build`.
- [ ] Run backend syntax check with `npm run lint`.
- [ ] Smoke test `/api/search?q=shoes`.
- [ ] Review dependency audit output.
