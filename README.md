# News Pulse — Topic-Clustered News Timeline

A news aggregation system that ingests RSS feeds, extracts full articles, clusters them by topic using TF-IDF similarity, and presents them in an interactive timeline.

## Architecture

```
┌─────────────┐     HTTPS REST      ┌─────────────┐
│   Next.js   │ ◄──────────────────► │  Node.js    │
│  Frontend   │                     │   API       │
└─────────────┘                     └──────┬──────┘
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │ PostgreSQL  │
                                     └──────┬──────┘
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │   Python    │
                                     │  Ingestion  │
                                     │   Service   │
                                     └─────────────┘
```

### Components

- **Frontend** (`/frontend`): Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Backend** (`/backend`): Node.js + Express + TypeScript + PostgreSQL (pg)
- **Scraper** (`/scraper`): Python 3.12+ + feedparser + trafilatura + scikit-learn

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL 16+

### Database Setup

```bash
createdb newspulse
psql -d newspulse -f backend/src/db/schema.sql
psql -d newspulse -f backend/src/db/seed.sql
```

Or use the init script (idempotent, safe to run multiple times):

```bash
cd backend
npm run db:init
```

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL
npm install
npm run dev
```

### Scraper

```bash
cd scraper
cp .env.example .env
# Edit .env with your DATABASE_URL
.venv/bin/pip install -r requirements.txt
# Run ingestion manually:
.venv/bin/python -m app.main
# Or initialize database:
.venv/bin/python init_db.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PYTHON_SERVICE_URL` | Python ingestion service URL | `http://localhost:8000` |
| `CLUSTER_SIMILARITY_THRESHOLD` | Cosine similarity threshold | `0.30` |
| `CLUSTER_TIME_WINDOW_DAYS` | Days to look back for clustering | `7` |
| `PORT` | API server port | `3001` |
| `CORS_ORIGIN` | Frontend origin for CORS | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |

### Scraper (`scraper/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `CLUSTER_SIMILARITY_THRESHOLD` | Cosine similarity threshold | `0.30` |
| `CLUSTER_TIME_WINDOW_DAYS` | Days to look back for clustering | `7` |
| `REQUEST_TIMEOUT` | HTTP request timeout (seconds) | `30` |
| `USER_AGENT` | HTTP User-Agent header | `NewsPulse/1.0` |
| `LOG_LEVEL` | Logging level | `INFO` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (with /api) | Uses Next.js rewrites in dev |

## Clustering Approach

- **Algorithm**: TF-IDF + Cosine Similarity + Connected Components
- **Input**: Article headline + summary (not full body)
- **Preprocessing**: Lowercase, punctuation/URL removal, English stopwords, unigrams + bigrams
- **Threshold**: Configurable (default 0.30)
- **Time Window**: Only compare articles within N days (default 7)
- **Limitation**: Lexical similarity ≠ semantic understanding. Same event with different vocabulary may not cluster; generic overlapping language may incorrectly cluster.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/clusters` | List all clusters with metadata |
| GET | `/clusters/:id` | Get cluster with all articles |
| GET | `/timeline` | Get timeline-ready cluster data |
| POST | `/ingest/trigger` | Start async ingestion job |
| GET | `/ingest/status/:jobId` | Get ingestion job status |
| GET | `/sources` | List all RSS sources |

## Deployment

### Local Development

```bash
# Terminal 1: Start PostgreSQL
# Terminal 2: Initialize database
cd backend && npm run db:init

# Terminal 3: Start Python ingestion service
cd scraper && .venv/bin/python http_server.py

# Terminal 4: Start Node.js backend
cd backend && npm run dev

# Terminal 5: Start Next.js frontend
cd frontend && npm run dev
```

### Production (Render + Vercel)

1. **PostgreSQL**: Create Render Free PostgreSQL database
2. **Python Service**: Deploy as Render Web Service (Docker)
   - Uses `scraper/Dockerfile`
   - Health check: `/health`
   - Binds to `0.0.0.0:$PORT`
3. **Node.js API**: Deploy as Render Web Service
   - Build: `cd backend && npm ci && npm run build`
   - Start: `cd backend && npm run start`
   - Health check: `/health`
4. **Frontend**: Deploy to Vercel
   - Set `NEXT_PUBLIC_API_URL` to production API URL
   - No rewrites needed in production

### Database Initialization on Render

After creating the PostgreSQL database on Render:

```bash
# Using backend init script
cd backend
DATABASE_URL=<render-connection-string> npm run db:init:tsx

# Or using psql
psql <render-connection-string> -f backend/src/db/schema.sql
psql <render-connection-string> -f backend/src/db/seed.sql
```

## Testing

```bash
# Backend tests
cd backend && npx vitest run

# Scraper tests
cd scraper && .venv/bin/python -m pytest tests/ -v
```

## Project Structure

```
news-pulse/
├── backend/
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── repositories/ # Database queries
│   │   ├── services/     # Business logic
│   │   ├── mappers/      # API response mappers
│   │   ├── db/           # Database schema & init
│   │   ├── types/        # TypeScript types
│   │   ├── app.ts        # Express app
│   │   └── server.ts     # Server entry
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities (API client)
│   │   └── types/        # TypeScript types
│   ├── public/
│   ├── package.json
│   └── next.config.ts
├── scraper/
│   ├── app/
│   │   ├── feeds/        # RSS feed parsing
│   │   ├── extraction/   # Article extraction
│   │   ├── normalization/ # URL canonicalization
│   │   ├── clustering/   # TF-IDF clustering
│   │   ├── database/     # Database operations
│   │   ├── jobs/         # Ingestion pipeline
│   │   └── config.py     # Settings
│   ├── tests/
│   ├── http_server.py    # HTTP server for production
│   ├── init_db.py        # Database initialization
│   ├── Dockerfile
│   └── requirements.txt
├── docs/
│   ├── architecture.md
│   ├── decisions.md
│   └── api.md
├── render.yaml           # Render Blueprint
└── README.md
```

## License

MIT