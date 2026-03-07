# ShopAI — Team Task Board

> **Status**: Core backend & frontend done. Key gaps below.
> **Stack**: React 18 + Vite | Node.js + Express | MongoDB | Redis (optional) | Puppeteer | MediaPipe | Three.js
> **Requires**: `OPENAI_API_KEY` for sentiment, chatbot, body estimation features

---

## What's Already Working

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-platform search (Amazon, Flipkart, Myntra) | ✅ Done | Scrapes, normalizes, deduplicates, relevance-filters |
| Smart ranking engine | ✅ Done | Composite score: price + rating + sentiment + reliability |
| Sentiment analysis (backend) | ✅ Done | GPT-4o-mini, 24h cache, rating-based fallback |
| Auth (register/login/refresh) | ✅ Done | JWT access+refresh tokens, bcrypt, rate-limited |
| Affiliate link generation & tracking | ✅ Done | Click logging, admin analytics, domain whitelist |
| Try-on 3D mannequin viewer | ✅ Done | Parametric body, adjustable measurements, presets |
| Body scanner (MediaPipe camera) | ✅ Done | Client-side pose detection, no API key needed |
| Body estimator (server, image upload) | ✅ Done | GPT-4o vision, needs OPENAI_API_KEY |
| Chat backend (REST + WebSocket) | ✅ Done | Session management, tool calling, product search |
| Docker + Nginx + CI pipeline | ✅ Done | Health checks, resource limits, lint+build+audit |
| Production security hardening | ✅ Done | Rate limiting, Zod validation, CORS, helmet, error boundaries |

---

## Priority 1 — Fix Broken/Missing Features

### Task 1: Chat UI Frontend
**Assignee**: ___
**Files to create**: `client/src/components/Chat/ChatAssistant.jsx`, `client/src/pages/ChatPage.jsx`
**Context**: Backend is fully wired — REST at `POST /api/chat/:sessionId/message`, WebSocket on `socket.io` (`chat:message` / `chat:response` events). Sessions stored in MongoDB (`ChatSession` model). System prompt is a fashion assistant with `search_products` tool calling.
**What to build**:
- [ ] Chat UI component (message list, input, send button)
- [ ] WebSocket connection with auth token
- [ ] Session management (new/list/switch)
- [ ] Display product cards when bot returns search results
- [ ] Typing indicator during AI response
- [ ] Mobile-responsive layout
**Reference**: `server/src/routes/chat.js`, `server/src/services/chatService.js`, `server/src/app.js` (socket setup lines ~60-90)

---

### Task 2: 3D Garment Models
**Assignee**: ___
**Directory**: `client/public/models/`
**Context**: The try-on viewer (`TryOnViewer.jsx`) currently renders a parametric mannequin with colored cylinders. The server returns metadata for 6 garments (see `server/src/routes/tryon.js`) but the `.glb` model files don't exist.
**What to do**:
- [ ] Source or create 6 `.glb` garment models:
  - `tshirt-basic.glb`, `shirt-formal.glb`, `hoodie-basic.glb`
  - `jeans-slim.glb`
  - `dress-casual.glb`, `jacket-bomber.glb`
- [ ] Update `TryOnViewer.jsx` to load actual `.glb` models via `useGLTF` from `@react-three/drei`
- [ ] Apply garment color as material tint on the loaded model
- [ ] Adjust garment scale/position based on `bodyParams`
**Tip**: Free models from Sketchfab, ReadyPlayerMe, or generate with Meshy/Tripo AI. Must be rigged or at least positioned for a standing pose.

---

### Task 3: Password Reset & Email Verification
**Assignee**: ___
**Files to modify**: `server/src/routes/auth.js`, `server/src/models/User.js`
**Files to create**: `server/src/services/emailService.js`
**What to build**:
- [ ] `POST /api/auth/forgot-password` — generate reset token (crypto.randomBytes), store hashed in DB with expiry
- [ ] `POST /api/auth/reset-password` — validate token, update password
- [ ] Email service (Nodemailer with Gmail SMTP or SendGrid)
- [ ] Email verification on signup — send confirmation link, `GET /api/auth/verify/:token`
- [ ] Add `isEmailVerified`, `resetPasswordToken`, `resetPasswordExpires` fields to User model
- [ ] Frontend forms: Forgot Password page, Reset Password page
**Env vars to add**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`

---

## Priority 2 — Production Readiness

### Task 4: Test Suite
**Assignee**: ___
**What to build**:
- [ ] Set up Jest (server) + Vitest (client)
- [ ] Unit tests for: `productNormalizer.js`, `sentimentAnalyzer.js`, `ranking.js`
- [ ] Integration tests for: auth routes, search routes, product routes
- [ ] Mock Puppeteer scraping in tests
- [ ] Mock OpenAI calls in tests
- [ ] Add `npm test` scripts, target 70%+ coverage
- [ ] Add test step to `.github/workflows/ci.yml`

---

### Task 5: Admin Dashboard
**Assignee**: ___
**File**: `client/src/pages/AdminDashboard.jsx` (exists but minimal)
**What to build**:
- [ ] User count & recent signups
- [ ] Search analytics (popular queries, platform distribution)
- [ ] Affiliate click tracking with charts (Recharts already installed)
- [ ] System health: scraper success rates, API response times
- [ ] Role-based access: only `role: 'admin'` users (field exists in User model)
- [ ] Backend endpoints: `GET /api/admin/stats`, `GET /api/admin/users`

---

### Task 6: Advanced Search Filters
**Assignee**: ___
**Context**: Search currently supports `?q=`, `?platform=`, `?sort=`. Frontend has basic filter UI.
**What to add**:
- [ ] Price range filter (`?minPrice=&maxPrice=`) — backend + frontend slider
- [ ] Rating filter (`?minRating=4`) — backend + frontend stars
- [ ] Category/brand filter — extract from scraped data, show as facets
- [ ] Save filter preferences per user

---

## Priority 3 — Nice to Have

### Task 7: API Documentation
- [ ] Set up Swagger/OpenAPI with `swagger-jsdoc` + `swagger-ui-express`
- [ ] Document all endpoints with request/response schemas
- [ ] Serve at `/api/docs`

### Task 8: OAuth / Social Login
- [ ] Google OAuth 2.0 (`passport-google-oauth20`)
- [ ] Frontend Google sign-in button
- [ ] Link social account to existing user

### Task 9: Performance & Polish
- [ ] Code-split large chunks (Three.js, Recharts) with `React.lazy`
- [ ] Image lazy loading & compression
- [ ] Dark mode toggle (TailwindCSS `dark:` classes)
- [ ] PWA support (service worker, manifest)

### Task 10: E2E Tests
- [ ] Cypress or Playwright setup
- [ ] Test flows: search → product detail → try-on → chat

---

## Setup Instructions (for new team members)

```bash
# Clone
git clone <repo-url> && cd Shopai

# Server
cd server
cp .env.example .env          # Fill in OPENAI_API_KEY at minimum
npm install

# Client
cd ../client
npm install

# Requirements
# - Node.js 18+
# - MongoDB running on localhost:27017
# - Redis optional (auto-fallback to in-memory)
# - Chromium installed (Puppeteer needs it for scraping)

# Run
cd server && npm run dev      # Backend on :5000
cd client && npm run dev      # Frontend on :5173

# Docker (alternative)
docker-compose up --build
```

## Key Architecture Notes

- **Scrapers** use Puppeteer with real browser — some sites block headless; may need proxy rotation for production scale
- **Rate limiting** uses Redis if available, falls back to in-memory (fine for single instance)
- **OpenAI calls** are used for: sentiment analysis, chatbot, body estimation from photo. All have graceful fallbacks when API key is missing
- **Body scanner** (MediaPipe) runs 100% client-side — no server calls needed
- **Socket.io** is set up on the same Express server for real-time chat
