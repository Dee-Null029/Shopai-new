# ShopAI Presentation Facts

Use these facts as the primary source when building slides for this repository.

## One-Line Summary
ShopAI is an AI-powered multi-platform e-commerce aggregator that combines product search, sentiment analysis, smart ranking, virtual try-on, and a fashion chatbot in one system.

## Problem Statement
- Users compare products across multiple marketplaces manually.
- Raw ratings and prices are hard to interpret without sentiment and trust context.
- Fashion shopping has high uncertainty around fit and style.
- Existing experiences rarely combine comparison, ranking, try-on, and conversational assistance in one workflow.

## Core Value Proposition
- Aggregate products from Amazon, Flipkart, and Myntra in one place.
- Rank products using price, rating, sentiment, and reliability instead of simple sorting.
- Reduce uncertainty with review sentiment insights and a virtual try-on flow.
- Support discovery through conversational fashion assistance.

## Verified Capabilities
- Multi-platform scraping with product normalization and cross-platform deduplication.
- AI sentiment analysis with fallback behavior when reviews or API results are unavailable.
- Smart ranking engine with customizable weights.
- 3D try-on viewer with body measurement estimation support.
- Real-time chat backend with product search tool integration.
- Affiliate link generation and click tracking.
- JWT auth, rate limiting, Zod validation, and role-based access control.

## Technical Stack
- Frontend: React 18, Vite, TailwindCSS, Three.js, Framer Motion, Recharts.
- Backend: Node.js, Express, Socket.io, Zod, Winston.
- Data: MongoDB, Redis.
- Scraping: Puppeteer.
- AI: OpenAI GPT-4 family and vision-enabled model usage.
- DevOps: Docker, Docker Compose, Nginx, GitHub Actions CI.

## Architecture Talking Points
- Concurrent scraping across multiple marketplaces.
- Normalization and deduplication before ranking.
- Composite ranking score that blends price, rating, sentiment, and platform reliability.
- Sentiment fallback chain to preserve useful output when AI analysis is unavailable.
- Separate flows for search, chat, and try-on, while sharing auth and data infrastructure.

## Strong Demo Sequence
1. Search for a product across platforms.
2. Show ranked results and explain weighting.
3. Open a product and show sentiment insights.
4. Switch to try-on and demonstrate body parameter customization.
5. Show chat assistant recommending products.
6. Close with affiliate and analytics value.

## Security and Reliability Points
- JWT access and refresh token flow.
- Redis-backed rate limiting with fallback behavior.
- Input validation with Zod.
- Affiliate redirect whitelisting.
- Error boundaries and graceful shutdown.

## Honest Limitations / Roadmap
- Chat UI frontend is listed as a gap in the task board.
- Real garment `.glb` models are still missing for the try-on experience.
- Password reset and email verification are pending.
- Test suite and deeper admin dashboard work remain roadmap items.
- Performance metrics should be labeled as proposed unless measured.

## Recommended Slide Themes
- User pain point and market fragmentation.
- End-to-end architecture.
- Search and ranking pipeline.
- Sentiment analysis workflow.
- 3D try-on flow.
- Chat assistant workflow.
- Security, roadmap, and impact.

## Claims to Avoid Unless User Supplies Evidence
- Actual user adoption numbers.
- Real benchmark wins over competitors.
- Production-scale reliability percentages.
- Latency, accuracy, or revenue metrics not measured in the repo.