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

### Scraper (`scraper/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `CLUSTER_SIMILARITY_THRESHOLD` | Cosine similarity threshold | `0.30` |
| `CLUSTER_TIME_WINDOW_DAYS` | Days to look back for clustering | `7` |
| `REQUEST_TIMEOUT` | HTTP request timeout (seconds) | `30` |
| `USER_AGENT` | HTTP User-Agent header | `NewsPulse/1.0` |

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

## License

MIT