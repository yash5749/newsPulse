# News Pulse — Architecture Documentation

## System Overview

News Pulse is a three-service architecture:

1. **Next.js Frontend** — Interactive timeline UI
2. **Node.js Backend API** — REST endpoints for clusters, timeline, ingestion
3. **Python Ingestion Service** — RSS fetching, article extraction, clustering

All services share a **PostgreSQL** database.

---

## Component Responsibilities

### Frontend (`/frontend`)
- Renders timeline visualization
- Cluster detail view (side panel/modal)
- Source filter toggles
- Refresh workflow: POST /ingest/trigger → poll /ingest/status → GET /timeline
- Responsive layout (desktop + mobile)

### Backend API (`/backend`)
- **GET /clusters** — Cluster list with metadata
- **GET /clusters/:id** — Single cluster with all articles
- **GET /timeline** — Chart-ready timeline data (supports `?sources=` filter)
- **POST /ingest/trigger** — Create job, trigger Python service, return jobId
- **GET /ingest/status/:jobId** — Job progress/status
- Validates requests, handles errors, enforces concurrent ingestion guard

### Python Ingestion (`/scraper/app/`)
- **Feeds** — Fetch and parse RSS (feedparser)
- **Normalization** — Unify inconsistent RSS fields (pubDate/published/updated, description/content/summary)
- **Extraction** — Full article body via trafilatura → BeautifulSoup fallback
- **Deduplication** — Source+external_id, source+canonical_url, normalized title+time
- **Clustering** — TF-IDF (unigram+bigram) + cosine similarity + connected components
- **Persistence** — Upsert articles, recompute clusters, record job status

### Database (PostgreSQL)
Tables: `sources`, `articles`, `clusters`, `cluster_articles`, `ingest_jobs`

---

## Request Flow

### Timeline Load
```
User opens frontend
       │
       ▼
GET /timeline?sources=BBC,NPR
       │
       ▼
Backend queries clusters + articles
       │
       ▼
Returns timeline items (clusterId, label, startTime, endTime, articleCount, intensity, sources)
       │
       ▼
Frontend renders timeline bars
```

### Cluster Detail
```
User clicks cluster
       │
       ▼
GET /clusters/:id
       │
       ▼
Backend returns cluster + articles (chronological)
       │
       ▼
Frontend opens detail panel
```

### Refresh / Ingestion
```
User clicks "Refresh Data"
       │
       ▼
POST /ingest/trigger
       │
       ▼
Backend: INSERT ingest_jobs (status=queued) → return jobId
       │
       ▼
Backend: HTTP POST to Python service /ingest
       │
       ▼
Python: UPDATE job status=running
       │
       ▼
Python: For each source:
        fetch RSS → normalize → extract → deduplicate/upsert
       │
       ▼
Python: Load recent articles → recompute clusters → persist
       │
       ▼
Python: UPDATE job status=completed (with counts)
       │
       ▼
Frontend polls GET /ingest/status/:jobId
       │
       ▼
On completed: GET /timeline → update UI
```

---

## Ingestion Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│                    INGESTION PIPELINE                           │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │  sources table  │
                          │ (configured RSS)│
                          └────────┬────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌─────────┐   ┌─────────┐   ┌─────────┐
              │ Feed A  │   │ Feed B  │   │ Feed C  │
              │ (BBC)   │   │ (NPR)   │   │ (Guard.)│
              └────┬────┘   └────┬────┘   └────┬────┘
                   │             │             │
                   ▼             ▼             ▼
         ┌──────────────────────────────────────────┐
         │         NORMALIZATION                    │
         │  • date → UTC timestamp                  │
         │  • field mapping (pubDate/published/etc) │
         │  • URL canonicalization                  │
         └──────────────────┬───────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────────┐
         │         ARTICLE EXTRACTION               │
         │  1. trafilatura.extract(url)             │
         │  2. fallback: BeautifulSoup              │
         │  3. fallback: RSS summary                │
         │  Status: SUCCESS / FALLBACK / FAILED     │
         └──────────────────┬───────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────────┐
         │         DEDUPLICATION                    │
         │  1. source + external_id (primary)       │
         │  2. source + canonical_url               │
         │  3. normalized title + published_at      │
         └──────────────────┬───────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────────┐
         │         PERSIST ARTICLES                 │
         │  UPSERT into articles table              │
         │  Track inserted/updated counts           │
         └──────────────────┬───────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────────┐
         │         CLUSTERING                       │
         │  • Load articles within time window      │
         │  • TF-IDF vectorize (headline+summary)   │
         │  • Cosine similarity matrix              │
         │  • Threshold → graph edges               │
         │  • Connected components = clusters       │
         │  • Label from representative article     │
         └──────────────────┬───────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────────┐
         │         PERSIST CLUSTERS                 │
         │  INSERT clusters + cluster_articles      │
         │  UPDATE job: clusters_created            │
         └──────────────────────────────────────────┘
```

---

## Database Relationships

```
sources (1) ───< (N) articles
articles (1) ───< (N) cluster_articles >─── (1) clusters
clusters (1) ───< (N) cluster_articles
ingest_jobs (standalone, tracks each run)
```

---

## Deployment Topology

### Local Development
```
localhost:3000  →  Next.js (frontend)
localhost:3001  →  Node API (backend)
localhost:5432  →  PostgreSQL
localhost:8000  →  Python service (optional, can run as script)
```

### Production (Render + Vercel)
```
Vercel (Next.js)
       │ HTTPS
       ▼
Render (Node API)
       │ Internal
       ▼
Render (PostgreSQL)
       │ Internal
       ▼
Render (Python Web Service)  ← HTTP trigger from Node API
```

---

## Data Flow Summary

| Operation | Initiator | Services Involved |
|-----------|-----------|-------------------|
| View timeline | User → Frontend | Frontend → Backend → DB |
| View cluster | User → Frontend | Frontend → Backend → DB |
| Trigger ingest | User → Frontend | Frontend → Backend → Python → DB |
| Poll ingest status | Frontend | Frontend → Backend → DB |