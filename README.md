# ShopAI — AI-Powered Multi-Platform E-Commerce Aggregator

ShopAI is a full-stack web application that aggregates products from **Amazon**, **Flipkart**, and **Myntra**, then applies AI-driven **sentiment analysis**, **smart ranking**, and a **3D virtual try-on** experience to help users make better purchase decisions.

Built with **React + Node.js + MongoDB**, powered by **OpenAI GPT-4** and **Puppeteer** web scraping.

---

## Features

### 1. Multi-Platform Product Search

- Real-time scraping of Amazon.in, Flipkart, and Myntra
- Relevance-scored filtering with word-boundary matching
- Cross-platform deduplication (Jaccard similarity)
- Platform-specific price, rating, and review extraction

### 2. AI Sentiment Analysis

- GPT-4 powered review analysis
- Sentiment scoring (0–100) with positive/negative/neutral classification
- Key theme extraction from reviews
- Rating-based fallback when reviews are unavailable

### 3. Smart Ranking Engine

- Composite score: `Price + Rating + Sentiment + Reliability`
- Customizable weights via UI sliders
- Bayesian average for ratings, normalized inverse pricing
- Platform trust scores (Amazon 85, Flipkart 80, Myntra 78)

### 4. 3D Virtual Try-On

- Three.js-based 3D body model viewer
- AI body measurement estimation from uploaded photos (GPT-4 Vision)
- Customizable body parameters (height, chest, waist, hip)
- Virtual garment fitting with color selection

### 5. AI Fashion Chatbot

- Real-time WebSocket chat with GPT-4
- Product search tool integration (searches while chatting)
- Style recommendations and fashion advice
- Persistent chat sessions per user

### 6. Affiliate Monetization

- Auto-generated affiliate links for Amazon, Flipkart, Myntra
- Click tracking with analytics dashboard
- Domain-whitelisted redirects (prevents open redirect attacks)
- Admin-only analytics with role-based access control

---

## Tech Stack

| Layer        | Technology                                                                          |
| ------------ | ----------------------------------------------------------------------------------- |
| **Frontend** | React 18, Vite, TailwindCSS, Three.js (@react-three/fiber), Framer Motion, Recharts |
| **Backend**  | Node.js, Express, Socket.io, Zod validation, Winston logging                        |
| **Database** | MongoDB (Mongoose), Redis (caching + rate limiting)                                 |
| **Scraping** | Puppeteer (headless Chromium)                                                       |
| **AI**       | OpenAI GPT-4 / GPT-4 Vision                                                         |
| **Auth**     | JWT (access + refresh tokens), bcrypt                                               |
| **DevOps**   | Docker, Docker Compose, Nginx, GitHub Actions CI                                    |

---

## Project Structure

```
Shopai/
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/              # ChatAssistant, ChatMessage
│   │   │   ├── TryOn/             # TryOnViewer, BodyConfigurator
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductList.jsx
│   │   │   ├── RankingControls.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── SentimentPanel.jsx
│   │   ├── context/               # AuthContext
│   │   ├── pages/                 # Home, SearchResults, ProductDetail,
│   │   │                          # TryOnPage, AdminDashboard, Login, Register
│   │   ├── services/api.js        # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── nginx/nginx.conf
│   ├── Dockerfile
│   └── package.json
│
├── server/                        # Node.js backend
│   ├── src/
│   │   ├── config/                # env.js, db.js, redis.js
│   │   ├── middleware/            # auth, errorHandler, logger,
│   │   │                          # rateLimiter (Redis-backed), validate
│   │   ├── models/                # User, ChatSession, Product, AffiliateClick
│   │   ├── routes/                # auth, search, product, sentiment,
│   │   │                          # ranking, tryon, chat, affiliate
│   │   └── services/
│   │       ├── scrapers/          # baseScraper, amazonScraper,
│   │       │                      # flipkartScraper, myntraScraper
│   │       ├── rankingEngine.js
│   │       ├── sentimentAnalyzer.js
│   │       ├── chatService.js
│   │       ├── bodyEstimator.js
│   │       ├── productNormalizer.js
│   │       ├── affiliateService.js
│   │       └── openaiService.js
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml
├── .github/workflows/ci.yml
└── .gitignore
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **MongoDB** (running locally or via Docker)
- **Redis** (optional — app works without it, just no caching/shared rate limits)
- **Chrome/Chromium** (Puppeteer auto-downloads it locally)

### Local Development

```bash
# 1. Clone and install
cd Shopai
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env — set your OPENAI_API_KEY, JWT secrets, etc.

# 3. Start MongoDB (if not running)
mongod --dbpath /path/to/data

# 4. Start backend (port 5000)
cd server && npm run dev

# 5. Start frontend (port 5173)
cd client && npm run dev
```

Open **http://localhost:5173** in your browser.

### Docker Deployment

```bash
# 1. Configure environment
cp server/.env.example server/.env
# Edit server/.env with production values

# 2. Build and start all services
docker compose up -d --build

# Services:
# - Frontend:  http://localhost:80 (Nginx)
# - Backend:   http://localhost:5000
# - MongoDB:   localhost:27017 (internal only)
# - Redis:     localhost:6379 (internal only)
```

---

## Environment Variables

| Variable                | Required       | Description                                                 |
| ----------------------- | -------------- | ----------------------------------------------------------- |
| `NODE_ENV`              | No             | `development` or `production` (default: development)        |
| `PORT`                  | No             | Server port (default: 5000)                                 |
| `MONGODB_URI`           | No             | MongoDB connection string (default: localhost:27017/shopai) |
| `REDIS_HOST`            | No             | Redis host (default: localhost)                             |
| `REDIS_PORT`            | No             | Redis port (default: 6379)                                  |
| `REDIS_PASSWORD`        | No             | Redis password (required if Redis has auth)                 |
| `JWT_SECRET`            | **Yes (prod)** | JWT signing secret — **required in production**             |
| `JWT_REFRESH_SECRET`    | **Yes (prod)** | Refresh token secret — **required in production**           |
| `OPENAI_API_KEY`        | **Yes**        | OpenAI API key for chat, sentiment, body estimation         |
| `AMAZON_AFFILIATE_TAG`  | No             | Amazon affiliate tag for monetization                       |
| `FLIPKART_AFFILIATE_ID` | No             | Flipkart affiliate ID                                       |
| `MYNTRA_AFFILIATE_ID`   | No             | Myntra affiliate ID                                         |

---

## API Endpoints

| Method | Endpoint                      | Description                           |
| ------ | ----------------------------- | ------------------------------------- |
| `GET`  | `/api/health`                 | Health check                          |
| `GET`  | `/api/search?q=...`           | Multi-platform product search         |
| `GET`  | `/api/product/:platform/:id`  | Product detail with reviews           |
| `GET`  | `/api/ranking?q=...`          | AI-ranked products with scores        |
| `POST` | `/api/sentiment`              | Analyze sentiment of reviews          |
| `POST` | `/api/tryon/estimate-body`    | Estimate body measurements from photo |
| `GET`  | `/api/tryon/garments`         | List available 3D garment models      |
| `POST` | `/api/auth/register`          | Create account                        |
| `POST` | `/api/auth/login`             | Login                                 |
| `POST` | `/api/auth/refresh`           | Refresh access token                  |
| `POST` | `/api/affiliate/generate`     | Generate affiliate link               |
| `GET`  | `/api/affiliate/redirect/:id` | Tracked redirect to affiliate URL     |
| `GET`  | `/api/affiliate/analytics`    | Admin analytics dashboard data        |
| `WS`   | `/socket.io/`                 | WebSocket chat (requires auth token)  |

---

## Security Features

- **JWT authentication** with access + refresh token rotation
- **Production secret enforcement** — server refuses to start without `JWT_SECRET` in production
- **Open redirect prevention** — affiliate redirects whitelisted to Amazon/Flipkart/Myntra domains only
- **Role-based access control** — admin-only analytics endpoint
- **Rate limiting** — Redis-backed distributed rate limits (API: 100/15min, Auth: 20/15min, Search: 10/min)
- **Input validation** — Zod schemas on all API endpoints
- **Helmet** security headers + Nginx `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`
- **Graceful shutdown** — proper cleanup of HTTP server, WebSocket, Puppeteer browser, and DB connections
- **Error boundary** — React ErrorBoundary prevents white-screen crashes
- **Docker hardening** — MongoDB/Redis not exposed to host, authenticated, resource-limited

---

## Architecture Highlights

- **Scraper resilience**: Text-node extraction for Flipkart (immune to CSS class randomization), ASIN-based URLs for Amazon, retry logic with configurable timeouts
- **Relevance filtering**: Word-boundary regex matching prevents false positives (e.g., "ROG" doesn't match "WROGN")
- **Cross-platform dedup**: Jaccard similarity (>0.6) + price proximity (<30%) merges duplicate products across platforms
- **Sentiment fallback chain**: GPT-4 analysis → rating-based estimation → neutral default (50)
- **Concurrency control**: OpenAI calls batched in groups of 5 to prevent rate limit exhaustion
- **Cache layer**: Redis caching with 15-minute TTL on search and ranking results

---

## License

This project was built as part of an academic research initiative (IEEE paper). All rights reserved.
