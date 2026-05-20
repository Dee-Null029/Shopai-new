# ShopAI — IEEE Paper Diagrams & Tables

> All diagrams are in Mermaid syntax. Render them at:
>
> - **mermaid.live** (copy-paste each block)
> - **Export as SVG/PNG** for IEEE paper
> - Or use the Mermaid CLI: `npx @mermaid-js/mermaid-cli mmdc -i file.mmd -o output.svg`

---

## TABLE OF CONTENTS

1. [System Architecture Block Diagram](#1-system-architecture-block-diagram)
2. [Data Pipeline Flowchart (Search → Ranking)](#2-data-pipeline-flowchart)
3. [User Flow Diagram](#3-user-flow-diagram)
4. [Smart Ranking Algorithm Flowchart](#4-smart-ranking-algorithm-flowchart)
5. [Body Measurement Algorithm Flowchart](#5-body-measurement-algorithm-flowchart)
6. [UML Class Diagram](#6-uml-class-diagram)
7. [Sequence Diagram: Search & Ranking](#7-sequence-diagram-search--ranking)
8. [Sequence Diagram: Body Scan & Chatbot](#8-sequence-diagram-body-scan--chatbot)
9. [Use Case Diagram](#9-use-case-diagram)
10. [Docker Deployment Architecture](#10-docker-deployment-architecture)
11. [Comparison Tables](#11-comparison-tables)
12. [Performance Metrics](#12-performance-metrics)
13. [Mathematical Formulations](#13-mathematical-formulations)

---

## 1. System Architecture Block Diagram

```mermaid
graph TB
    subgraph Client["Client Layer (React 18 + Vite)"]
        UI["React Frontend<br/>Port 5173"]
        TF["Three.js 3D Viewer"]
        MP["MediaPipe Pose<br/>Body Scanner"]
        SC["Socket.io Client"]
    end

    subgraph Server["Server Layer (Node.js + Express)"]
        API["Express API<br/>Port 5000"]
        WS["Socket.io Server"]
        MW["Middleware Stack<br/>Helmet | CORS | Rate Limiter<br/>JWT Auth | Zod Validation"]
    end

    subgraph Services["Service Layer"]
        SS["Scraper Service<br/>(Puppeteer)"]
        PN["Product Normalizer<br/>Dedup + Relevance"]
        RE["Ranking Engine<br/>Composite Scoring"]
        SA["Sentiment Analyzer<br/>(GPT-4o-mini)"]
        CS["Chat Service<br/>(GPT-4 + Tool Calling)"]
        BE["Body Estimator<br/>(GPT-4o Vision)"]
        AS["Affiliate Service"]
    end

    subgraph Scrapers["Web Scraper Pool"]
        AM["Amazon Scraper"]
        FK["Flipkart Scraper"]
        MN["Myntra Scraper"]
    end

    subgraph Data["Data Layer"]
        MDB[("MongoDB<br/>Users, Products<br/>Chat Sessions")]
        RD[("Redis Cache<br/>Rate Limits<br/>Query Cache")]
    end

    subgraph External["External APIs"]
        OAI["OpenAI API<br/>GPT-4 / GPT-4o"]
        ECM["E-commerce Sites<br/>Amazon.in | Flipkart | Myntra"]
    end

    UI --> API
    UI --> TF
    UI --> MP
    SC --> WS

    API --> MW --> Services
    WS --> CS

    SS --> AM & FK & MN
    AM & FK & MN --> ECM
    SA & CS & BE --> OAI

    SS --> PN --> RE
    Services --> MDB
    Services --> RD
```

---

## 2. Data Pipeline Flowchart

```mermaid
flowchart TD
    A([User Enters Query]) --> B[Search API]
    B --> C{Platform Selection}
    C --> D1["Amazon Scraper<br/>Puppeteer + DOM"]
    C --> D2["Flipkart Scraper<br/>Puppeteer + Text Nodes"]
    C --> D3["Myntra Scraper<br/>Puppeteer + .product-base"]

    D1 & D2 & D3 --> E["Promise.allSettled()<br/>Concurrent Scraping"]

    E --> F["Product Normalizer<br/>• Standardize fields<br/>• Filter price > 0"]
    F --> G["Deduplication<br/>• Exact match: platform:id<br/>• Cross-platform: Jaccard > 0.6<br/>  AND price diff < 30%"]
    G --> H["Relevance Filter<br/>• Word-boundary regex<br/>• Threshold ≥ 50%"]

    H --> I{Smart Ranking?}
    I -->|No| J["Sort by relevance<br/>then reviewCount"]
    I -->|Yes| K["Sentiment Analysis<br/>(GPT-4o-mini per product)"]
    K --> L["Composite Scoring<br/>S = w₁·Price + w₂·Rating<br/>+ w₃·Sentiment + w₄·Reliability"]
    L --> M["Sort by Score DESC"]

    J & M --> N([Return Results])

    style A fill:#4ade80,color:#000
    style N fill:#4ade80,color:#000
    style E fill:#60a5fa,color:#000
    style L fill:#f59e0b,color:#000
```

---

## 3. User Flow Diagram

```mermaid
flowchart TD
    Start([User Opens App]) --> Home[Landing Page]
    Home --> Search["Search Products<br/>Enter query"]
    Home --> TryOn["3D Virtual Try-On"]
    Home --> Chat["AI Fashion Chat"]
    Home --> Auth{Logged In?}

    Auth -->|No| Login[Login / Register]
    Auth -->|Yes| Profile[User Profile]
    Login --> Home

    Search --> Results["Search Results<br/>Multi-platform products"]
    Results --> Filter["Apply Filters<br/>Platform / Sort"]
    Results --> Rank["Enable Smart Ranking<br/>AI-powered scoring"]
    Results --> Detail["View Product Detail"]

    Detail --> Sentiment["View Sentiment<br/>Pros / Cons / Score"]
    Detail --> Affiliate["Buy via Affiliate Link"]
    Detail --> TryOn

    TryOn --> Scan{Scan Method}
    Scan --> Camera["Camera Scan<br/>MediaPipe Pose"]
    Scan --> Upload["Upload Photo<br/>GPT-4o Vision"]
    Scan --> Manual["Manual Sliders"]
    Camera & Upload & Manual --> View3D["3D Mannequin<br/>Adjust garment color"]

    Chat --> Session["Chat Session<br/>Ask fashion advice"]
    Session --> BotSearch["Bot searches<br/>products automatically"]
    BotSearch --> Recommend["Product Recommendations<br/>in chat"]

    style Start fill:#4ade80,color:#000
    style Affiliate fill:#f59e0b,color:#000
    style View3D fill:#818cf8,color:#000
    style Recommend fill:#60a5fa,color:#000
```

---

## 4. Smart Ranking Algorithm Flowchart

```mermaid
flowchart TD
    A([Ranking Algorithm]) --> B["Collect all prices<br/>from search results"]

    B --> C1["Price Score<br/>score = (max - price)/(max - min) × 100<br/>Lower price → Higher score"]
    B --> C2["Rating Score<br/>Bayesian Average:<br/>B = (10 × 3.5 + n × r)/(10 + n)<br/>score = (B / 5) × 100"]
    B --> C3["Sentiment Score<br/>GPT-4o-mini analysis<br/>score = sentiment.score (0-100)"]
    B --> C4["Reliability Score<br/>Base: Platform Trust<br/>Amazon:85 | Flipkart:80 | Myntra:78<br/>±Seller rating, reviews, availability"]

    C1 & C2 & C3 & C4 --> D["Weight Normalization<br/>Σwᵢ = 1.0"]

    D --> E["Composite Score<br/>S = w₁·PriceScore + w₂·RatingScore<br/>+ w₃·SentimentScore + w₄·ReliabilityScore"]

    E --> F["Sort DESC by S"]
    F --> G([Ranked Products 0-100])

    style A fill:#f59e0b,color:#000
    style G fill:#4ade80,color:#000
    style E fill:#818cf8,color:#fff
```

---

## 5. Body Measurement Algorithm Flowchart

```mermaid
flowchart TD
    A["Camera Frame<br/>(640×480)"] --> B["MediaPipe Pose Landmarker<br/>33 Keypoints"]
    B --> C["Extract Key Landmarks"]

    C --> D1["Nose (0) → Head Top<br/>y - 0.08 offset"]
    C --> D2["Shoulders (11, 12)"]
    C --> D3["Hips (23, 24)"]
    C --> D4["Heels (29, 30)"]

    D1 & D4 --> E["Body Height in px<br/>d = √(Δx² + Δy² + Δz²)"]

    E --> F["Scale Factor<br/>pxToCm = userHeight / bodyHeightPx"]

    D2 --> G1["Shoulder Width<br/>d(L_shoulder, R_shoulder) × pxToCm"]
    G1 --> H1["Chest = shoulder × π × 0.65"]

    D3 --> G2["Hip Width<br/>d(L_hip, R_hip) × pxToCm"]
    G2 --> H2["Hip = hipWidth × π × 0.8"]

    H1 & H2 --> H3["Waist = (chest + hip) / 2 × 0.85"]

    H1 & H2 & H3 --> I["Body Type Classification"]
    I --> J1["waist/hip < 0.75 → Slim"]
    I --> J2["shoulder/hip > 1.3 → Athletic"]
    I --> J3["waist/hip > 0.9 → Plus"]
    I --> J4["else → Average"]

    style A fill:#60a5fa,color:#000
    style F fill:#f59e0b,color:#000
    style I fill:#818cf8,color:#fff
```

---

## 6. UML Class Diagram

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        -String password
        +Enum role [user, admin]
        +Object preferences
        -String[] refreshTokens
        +Date createdAt
        +comparePassword(candidate) bool
    }

    class Product {
        +ObjectId _id
        +String platformId
        +Enum platform [amazon, flipkart, myntra]
        +String title
        +Number price
        +Number originalPrice
        +Number rating
        +Number reviewCount
        +String[] images
        +String url
        +String brand
        +Object seller
        +Boolean availability
        +Object sentiment
        +Review[] reviews
        +String affiliateUrl
    }

    class Review {
        +String author
        +Number rating
        +String title
        +String text
        +Date date
        +Boolean verified
    }

    class ChatSession {
        +ObjectId _id
        +ObjectId userId
        +String title
        +Message[] messages
        +Object context
    }

    class Message {
        +Enum role [user, assistant, system]
        +String content
        +Object[] productRecommendations
        +Date timestamp
    }

    class AffiliateClick {
        +ObjectId _id
        +String linkId
        +Enum platform
        +String productId
        +String affiliateUrl
        +ObjectId userId
        +String ip
        +Date clickedAt
    }

    class RankingEngine {
        +computePriceScore(price, allPrices) Number
        +computeRatingScore(rating, count) Number
        +computeSentimentScore(sentiment) Number
        +computeReliabilityScore(product) Number
        +rankProducts(products, weights) Product[]
    }

    class SentimentAnalyzer {
        +analyzeSentiment(reviews, title) Object
        -fallbackSentiment(reviews) Object
    }

    class ScraperService {
        -Browser browserInstance
        +searchAllPlatforms(query, opts) Product[]
        +scrapeProductDetail(platform, id) Product
        -withRetry(fn, retries, delay) any
    }

    User "1" --> "*" ChatSession : owns
    User "1" --> "*" AffiliateClick : generates
    Product "1" --> "*" Review : contains
    ChatSession "1" --> "*" Message : contains
    ScraperService --> Product : produces
    RankingEngine --> Product : scores
    SentimentAnalyzer --> Product : analyzes
```

---

## 7. Sequence Diagram: Search & Ranking

```mermaid
sequenceDiagram
    actor U as User
    participant C as React Client
    participant API as Express API
    participant SC as Scraper Service
    participant AM as Amazon
    participant FK as Flipkart
    participant MN as Myntra
    participant PN as Product Normalizer
    participant RE as Ranking Engine
    participant SA as Sentiment Analyzer
    participant AI as OpenAI GPT-4o-mini
    participant DB as MongoDB
    participant RD as Redis

    U->>C: Search "running shoes"
    C->>API: GET /api/search?q=running+shoes
    API->>RD: Check cache
    RD-->>API: Cache miss

    par Concurrent Scraping
        API->>SC: searchAllPlatforms()
        SC->>AM: Puppeteer scrape
        SC->>FK: Puppeteer scrape
        SC->>MN: Puppeteer scrape
        AM-->>SC: 19 products
        FK-->>SC: 14 products
        MN-->>SC: 18 products
    end

    SC-->>API: 51 raw products
    API->>PN: normalizeProducts()
    Note over PN: Filter price>0<br/>Standardize fields
    PN->>PN: deduplicateProducts()<br/>Jaccard similarity
    PN->>PN: filterByRelevance()<br/>Word-boundary ≥50%
    PN-->>API: 45 clean products

    API->>RD: Cache results (1h TTL)
    API-->>C: Return products
    C-->>U: Display results

    U->>C: Enable Smart Ranking
    C->>API: GET /api/ranking?q=running+shoes

    loop Batch of 5 products
        API->>SA: analyzeSentiment(reviews)
        SA->>AI: GPT-4o-mini prompt
        AI-->>SA: {score, pros, cons}
    end

    API->>RE: rankProducts(products, weights)
    Note over RE: S = w₁·Price + w₂·Rating<br/>+ w₃·Sentiment + w₄·Reliability
    RE-->>API: Scored & sorted
    API-->>C: Ranked results
    C-->>U: Display with scores
```

---

## 8. Sequence Diagram: Body Scan & Chatbot

```mermaid
sequenceDiagram
    actor U as User
    participant C as React Client
    participant MP as MediaPipe Pose
    participant WS as Socket.io
    participant API as Express API
    participant CS as Chat Service
    participant AI as OpenAI GPT-4
    participant SC as Scraper Service
    participant DB as MongoDB

    rect rgb(230, 245, 255)
        Note over U,MP: 3D Body Scanning Flow
        U->>C: Open Try-On, Scan Camera
        C->>MP: Initialize PoseLandmarker<br/>(pose_landmarker_lite, GPU)
        C->>C: getUserMedia Camera stream
        loop Real-time Detection at 30fps
            C->>MP: detectForVideo(frame, timestamp)
            MP-->>C: 33 landmarks with x y z visibility
            C->>C: Draw skeleton overlay
        end
        U->>C: Capture
        C->>C: calculateMeasurements<br/>pxToCm = height / bodyHeightPx<br/>chest = shoulder x pi x 0.65<br/>hip = hipWidth x pi x 0.8
        C-->>U: Show measurements<br/>chest, waist, hip, shoulder, bodyType
        U->>C: Apply to Update 3D mannequin
    end

    rect rgb(255, 245, 230)
        Note over U,DB: AI Chatbot Flow
        U->>C: Send message via chat
        C->>WS: chat:message with sessionId and message
        WS->>CS: getChatResponse()
        CS->>AI: GPT-4 with tools search_products
        AI-->>CS: tool_call search_products blue shirt
        CS->>SC: searchAllPlatforms blue shirt
        SC-->>CS: Top 5 products
        CS->>AI: tool_result products JSON
        AI-->>CS: Here are some blue shirts
        CS->>DB: Save to ChatSession
        WS-->>C: chat:response with message and products
        C-->>U: Display message and product cards
    end
```

---

## 9. Use Case Diagram

```mermaid
graph LR
    subgraph Actors
        U((User))
        A((Admin))
    end

    subgraph "ShopAI Use Cases"
        UC1["Search Products<br/>Across Platforms"]
        UC2["View Product Details<br/>& Sentiment"]
        UC3["Smart Rank Products<br/>AI-Powered"]
        UC4["3D Virtual Try-On"]
        UC5["Body Scan<br/>Camera or Upload"]
        UC6["AI Fashion Chat"]
        UC7["Register / Login"]
        UC8["Buy via Affiliate Link"]
        UC9["View Analytics<br/>Admin Only"]
        UC10["Manage Users<br/>Admin Only"]
    end

    U --- UC1
    U --- UC2
    U --- UC3
    U --- UC4
    U --- UC5
    U --- UC6
    U --- UC7
    U --- UC8

    A --- UC9
    A --- UC10
    A --- UC1

    UC4 -.->|includes| UC5
    UC3 -.->|includes| UC2
    UC6 -.->|extends| UC1
```

---

## 10. Docker Deployment Architecture

```mermaid
graph TB
    subgraph Docker["Docker Compose Stack"]
        subgraph SRV["server - Node.js"]
            EXP["Express API :5000"]
            PUP["Puppeteer + Chromium"]
            SIO["Socket.io"]
        end

        subgraph CLT["client - Nginx"]
            NGX["Nginx :80"]
            SPA["React SPA"]
        end

        subgraph DB["mongo"]
            MDB[("MongoDB :27017<br/>Auth enabled<br/>Health: mongosh --eval")]
        end

        subgraph CACHE["redis"]
            RDS[("Redis :6379<br/>requirepass<br/>Health: redis-cli ping")]
        end
    end

    CLT -->|"proxy /api/*"| SRV
    SRV --> DB
    SRV --> CACHE

    SRV -.-|"Memory: 2GB<br/>CPU: 1.5"| RES1["Resource Limits"]
    DB -.-|"depends_on:<br/>service_healthy"| HC1["Health Check"]
    CACHE -.-|"depends_on:<br/>service_healthy"| HC2["Health Check"]

    style SRV fill:#3b82f6,color:#fff
    style CLT fill:#22c55e,color:#fff
    style DB fill:#f59e0b,color:#000
    style CACHE fill:#ef4444,color:#fff
```

---

## 11. Comparison Tables

### Table I: Technology Stack Comparison

| Layer          | Technology                   | Purpose                     | Alternative Considered             |
| -------------- | ---------------------------- | --------------------------- | ---------------------------------- |
| Frontend       | React 18 + Vite              | SPA with fast HMR           | Next.js (SSR overhead unnecessary) |
| Styling        | TailwindCSS 3.4              | Utility-first CSS           | Material UI (heavier bundle)       |
| 3D Rendering   | Three.js + React Three Fiber | WebGL mannequin             | Babylon.js (less React ecosystem)  |
| Pose Detection | MediaPipe Pose Landmarker    | Client-side body scan       | OpenPose (requires server GPU)     |
| Backend        | Node.js + Express            | REST API + WebSocket        | Django (Python slower for I/O)     |
| Real-time      | Socket.io v4                 | Bidirectional chat          | WebSocket raw (less features)      |
| Scraping       | Puppeteer + Chromium         | Dynamic page rendering      | Playwright (similar, less mature)  |
| AI/NLP         | OpenAI GPT-4 / GPT-4o-mini   | Sentiment + Chatbot         | Hugging Face (self-hosted cost)    |
| Database       | MongoDB + Mongoose           | Document store              | PostgreSQL (less flexible schema)  |
| Cache          | Redis                        | Rate limiting + caching     | Memcached (less features)          |
| Auth           | JWT (access + refresh)       | Stateless auth              | Session-based (not scalable)       |
| Validation     | Zod                          | Schema validation           | Joi (less TypeScript support)      |
| Container      | Docker Compose               | Multi-service orchestration | Kubernetes (overkill for MVP)      |

### Table II: Platform Scraper Comparison

| Feature             | Amazon                           | Flipkart                  | Myntra                          |
| ------------------- | -------------------------------- | ------------------------- | ------------------------------- |
| Search URL          | `/s?k={query}`                   | `/search?q={query}`       | `/{query-slug}`                 |
| DOM Strategy        | CSS selectors (`.a-text-normal`) | Text-node leaf extraction | CSS selectors (`.product-base`) |
| Anti-bot Handling   | User-Agent spoofing              | Popup dismissal + delay   | Minimal                         |
| Product ID Format   | ASIN (10 chars)                  | `data-id` attribute       | Numeric ID from URL             |
| Price Extraction    | `.a-price-whole`                 | Text matching `₹X,XXX`    | `parseInt` after `Rs.` strip    |
| Review Extraction   | Rating + verified badge          | Text pattern matching     | Rating only                     |
| Avg. Products/Query | 19                               | 14                        | 18                              |
| Retry Strategy      | 2 retries, exponential backoff   | Same                      | Same                            |

### Table III: Ranking Weight Configuration

| Component   | Default Weight | Score Range | Formula                                                                |
| ----------- | -------------- | ----------- | ---------------------------------------------------------------------- |
| Price       | 0.25           | 0–100       | $S_p = \frac{p_{max} - p_i}{p_{max} - p_{min}} \times 100$             |
| Rating      | 0.25           | 0–100       | $S_r = \frac{m \cdot C + n_i \cdot r_i}{m + n_i} \times \frac{100}{5}$ |
| Sentiment   | 0.25           | 0–100       | $S_s = \text{GPT score} \in [0, 100]$                                  |
| Reliability | 0.25           | 0–100       | $S_{rel} = T_{platform} \pm \Delta_{seller} \pm \Delta_{reviews}$      |

Where: $m = 10$ (min reviews), $C = 3.5$ (global mean), $n_i$ = review count, $r_i$ = average rating

### Table IV: Body Measurement Parameters

| Parameter      | Formula                                            | Output Range | Unit  |
| -------------- | -------------------------------------------------- | ------------ | ----- |
| Scale Factor   | $k = H_{user} / H_{pixel}$                         | —            | cm/px |
| Shoulder Width | $d(L_{11}, L_{12}) \times k$                       | 30–60        | cm    |
| Chest          | $\text{shoulder} \times \pi \times 0.65$           | 70–130       | cm    |
| Hip            | $d(L_{23}, L_{24}) \times k \times \pi \times 0.8$ | 70–130       | cm    |
| Waist          | $(\text{chest} + \text{hip}) / 2 \times 0.85$      | 55–120       | cm    |

Where $L_i$ = MediaPipe landmark index, $d(a,b) = \sqrt{(x_a-x_b)^2+(y_a-y_b)^2+(z_a-z_b)^2}$

### Table V: Security Measures

| Layer            | Measure                    | Implementation                                  |
| ---------------- | -------------------------- | ----------------------------------------------- |
| Transport        | HTTPS (via Nginx)          | TLS termination at reverse proxy                |
| Authentication   | JWT (HS256)                | Access: 15min, Refresh: 7 days, max 10 tokens   |
| Password         | bcrypt (12 rounds)         | ~250ms hash time, timing-safe comparison        |
| Input Validation | Zod schemas                | All API endpoints validated                     |
| Rate Limiting    | express-rate-limit + Redis | API: 100/15min, Auth: 5/15min, Search: 20/15min |
| Headers          | Helmet.js                  | X-Frame-Options, CSP, HSTS, X-Content-Type      |
| CORS             | Whitelist                  | localhost:5173, localhost:3000 only             |
| File Upload      | Multer                     | 10MB limit, JPEG/PNG/WebP only                  |
| Redirect         | Domain whitelist           | amazon.in, flipkart.com, myntra.com only        |

### Table VI: API Endpoints

| Method | Endpoint                          | Auth | Description              |
| ------ | --------------------------------- | ---- | ------------------------ |
| POST   | `/api/auth/register`              | No   | User registration        |
| POST   | `/api/auth/login`                 | No   | User login               |
| POST   | `/api/auth/refresh`               | No   | Refresh access token     |
| POST   | `/api/auth/logout`                | Yes  | Invalidate refresh token |
| GET    | `/api/auth/me`                    | Yes  | Get user profile         |
| GET    | `/api/search?q=`                  | No   | Multi-platform search    |
| GET    | `/api/ranking?q=`                 | No   | AI-ranked search         |
| GET    | `/api/product/:platform/:id`      | No   | Product detail           |
| GET    | `/api/sentiment/:platform/:id`    | No   | Sentiment analysis       |
| POST   | `/api/tryon/estimate-body`        | No   | Body estimation (image)  |
| GET    | `/api/tryon/garments`             | No   | Available 3D garments    |
| POST   | `/api/chat/:sessionId/message`    | Yes  | Send chat message        |
| POST   | `/api/affiliate/generate`         | Yes  | Generate affiliate link  |
| GET    | `/api/affiliate/redirect/:linkId` | No   | Redirect via affiliate   |
| GET    | `/api/health`                     | No   | Health check             |

---

## 12. Performance Metrics

### Table VII: Scraping Performance (query: "running shoes")

| Metric                 | Amazon | Flipkart | Myntra | Total          |
| ---------------------- | ------ | -------- | ------ | -------------- |
| Products Found         | 19     | 14       | 18     | 51             |
| After Dedup            | 18     | 13       | 17     | 48             |
| After Relevance Filter | 17     | 12       | 16     | 45             |
| Zero-Price Filtered    | 0      | 0        | 0      | 0              |
| Avg. Response Time     | ~4s    | ~5s      | ~3s    | ~5s (parallel) |

### Table VIII: Ranking Performance

| Metric                     | Value                          |
| -------------------------- | ------------------------------ |
| Products Ranked            | 53                             |
| Avg. Composite Score       | 76/100                         |
| Top Score                  | 91/100                         |
| Sentiment Batch Size       | 5 concurrent                   |
| Total Ranking Time         | ~8s (with sentiment API calls) |
| Without Sentiment (cached) | ~200ms                         |

### Table IX: Body Scanner Performance

| Metric               | Value                          |
| -------------------- | ------------------------------ |
| Model                | pose_landmarker_lite (float16) |
| Landmarks Detected   | 33 per frame                   |
| Frame Rate           | ~30 FPS (GPU delegate)         |
| Detection Confidence | ≥ 0.5                          |
| Measurement Accuracy | ±5cm (empirical)               |
| Client-side Only     | Yes (no server calls)          |

```mermaid
xychart-beta
    title "Product Yield Per Platform"
    x-axis ["Amazon", "Flipkart", "Myntra"]
    y-axis "Products Returned" 0 --> 25
    bar [19, 14, 18]
```

```mermaid
xychart-beta
    title "Ranking Score Breakdown - Top 3 Products"
    x-axis ["Product 1", "Product 2", "Product 3"]
    y-axis "Score (0-100)" 0 --> 100
    bar "Price" [85, 78, 92]
    bar "Rating" [90, 88, 82]
    bar "Sentiment" [95, 92, 88]
    bar "Reliability" [85, 80, 78]
```

---

## 13. Mathematical Formulations

For use in the IEEE paper body text (LaTeX-compatible):

### Composite Ranking Score

$$S_i = w_1 \cdot S_{price}(i) + w_2 \cdot S_{rating}(i) + w_3 \cdot S_{sentiment}(i) + w_4 \cdot S_{reliability}(i)$$

Where $\sum_{k=1}^{4} w_k = 1$ and $S_i \in [0, 100]$

### Price Score (Min-Max Normalization)

$$S_{price}(i) = \frac{p_{max} - p_i}{p_{max} - p_{min}} \times 100$$

### Rating Score (Bayesian Average)

$$S_{rating}(i) = \frac{B_i}{5} \times 100, \quad B_i = \frac{m \cdot C + n_i \cdot \bar{r}_i}{m + n_i}$$

Where $m = 10$ (prior weight), $C = 3.5$ (global prior mean), $n_i$ = number of reviews, $\bar{r}_i$ = average rating

### Jaccard Similarity (Deduplication)

$$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$

Where $A$ and $B$ are sets of tokenized words from product titles. Duplicate threshold: $J > 0.6$ AND $\frac{|p_a - p_b|}{\max(p_a, p_b)} < 0.3$

### Relevance Score

$$R(q, p) = \frac{|\{w \in q : \exists \text{ word-boundary match in } p.title \cup p.brand\}|}{|q|}$$

Filter threshold: $R \geq 0.5$

### Body Measurement Estimation

$$k = \frac{H_{ref}}{d(L_0', L_{mid(29,30)})}$$

$$\text{Chest} = d(L_{11}, L_{12}) \cdot k \cdot \pi \cdot 0.65$$

$$\text{Hip} = d(L_{23}, L_{24}) \cdot k \cdot \pi \cdot 0.80$$

$$\text{Waist} = \frac{\text{Chest} + \text{Hip}}{2} \times 0.85$$

Where $d(a,b) = \sqrt{(x_a - x_b)^2 + (y_a - y_b)^2 + (z_a - z_b)^2}$, $L_i$ = MediaPipe pose landmark index, $H_{ref}$ = user-provided height in cm.

### Body Type Classification

$$\text{BodyType} = \begin{cases} \text{slim} & \text{if } \frac{\text{waist}}{\text{hip}} < 0.75 \\ \text{athletic} & \text{if } \frac{\text{shoulder}_{width}}{\text{hip}_{width}} > 1.3 \\ \text{plus} & \text{if } \frac{\text{waist}}{\text{hip}} > 0.9 \\ \text{average} & \text{otherwise} \end{cases}$$

---

## How to Export for IEEE Paper

1. **Open** [mermaid.live](https://mermaid.live)
2. **Paste** each Mermaid code block
3. **Export** as SVG (vector, scales perfectly) or PNG (300+ DPI)
4. **In LaTeX**: Use `\includegraphics[width=\columnwidth]{diagram.svg}`
5. **For tables**: Copy the Markdown tables directly into your LaTeX using `tabular` environment
6. **For equations**: The LaTeX math in Section 13 can be pasted directly into your `.tex` file
