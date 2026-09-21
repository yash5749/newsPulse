# News Pulse — Architecture Decisions

| Decision | Choice | Reason | Alternatives Considered |
|----------|--------|--------|------------------------|
| Database | PostgreSQL | Relational, mature, JSON support, free hosting on Render | SQLite (no concurrent writes), MongoDB (no strict schema), MySQL |
| Backend Framework | Express + TypeScript | Minimal, familiar, good TS support | Fastify, Hono, NestJS (overkill) |
| Frontend Framework | Next.js 16 (App Router) | React Server Components, SSR, Vercel deployment | Vite + React (no SSR), Remix |
| Python HTTP | httpx | Async, modern, good timeout/retry support | requests (sync), aiohttp (more complex) |
| RSS Parsing | feedparser | Handles malformed feeds, standard library | xml.etree (manual), custom parser |
| Article Extraction | trafilatura → BeautifulSoup fallback | Best-in-class extraction, handles paywalls | readability-lxml, newspaper3k (unmaintained) |
| Clustering Algorithm | TF-IDF + Cosine + Connected Components | No training needed, explainable, works on small data | KMeans (need k), DBSCAN (density issues), LLM embeddings (cost/complexity) |
| Clustering Input | Headline + Summary only | Body extraction can fail; headline+summary always available | Full body, title only, title+body |
| Similarity Threshold | 0.30 (configurable) | Empirical balance between over/under clustering | 0.25 (too aggressive), 0.4 (too strict) |
| Time Window | 7 days (configurable) | News cycles ~week; prevents old generic vocab clustering | 3 days (misses slow stories), 14 days (noise) |
| Cluster Recomputation | Full recompute on each ingest | Dataset small (<1000 articles); simpler, correct | Incremental (complex, edge cases) |
| Cluster Label | Representative article headline | Human-readable, no extra processing | TF-IDF top terms (ugly), centroid vector (unreadable) |
| Python Service Interface | Separate HTTP service (prod) / Script (dev) | Decouples long-running ingestion from API | Node spawns Python (fragile), Celery + Redis (overkill) |
| Concurrent Ingestion Guard | Single active job, reuse if exists | Prevents DB contention, duplicate work | Queue (needs Redis), reject new (poor UX) |
| Source Filter Semantics | Recompute metrics (count, time range, intensity) | Filter must change data, not just hide | Hide only (cosmetic, misleading) |
| Refresh UX | Async trigger + polling | Ingestion takes 30-120s; blocking UX unacceptable | WebSockets (complex), long-poll (same), sync (bad UX) |
| URL Canonicalization | Strip tracking params (utm_*, fbclid, etc.) | Deduplication needs stable identity | Keep all params (fragile dedup), strip all query (breaks some URLs) |
| Date Normalization | UTC timestamps, fallback to fetch time | Consistent ordering, handles missing pubDate | Keep original tz (messy), drop articles (data loss) |
| Extraction Status | SUCCESS / FALLBACK / FAILED | Visibility into pipeline health | Boolean success (loses info), exceptions (crashes) |
| API Response Format | CamelCase with "data" envelope | Frontend expects camelCase; consistent envelope | Snake_case (mismatch), no envelope (inconsistent) |
| Frontend API Strategy | NEXT_PUBLIC_API_URL (direct) | Simple, works for dev and prod | Next.js rewrites (dev only), proxy (complex) |
| CORS Config | Single CORS_ORIGIN env var | Consistency across dev/prod | Multiple env vars (FRONTEND_URL, CORS_ORIGIN, etc.) |
| Database Init | Idempotent schema + seed scripts | Works on fresh DB, safe to re-run | Migration tools (overkill), manual (error-prone) |
| Python Deployment | Docker on Render | Consistent env, easy PORT binding | Raw Python (no isolation), serverless (cold starts) |
| Free Tier Compatibility | All services on Render Free | Assessment requirement | Paid plans (not allowed), Neon/Supabase (different) |

## Key Implementation Decisions

### 1. TF-IDF Vectorizer Configuration
- `stop_words="english"` - Built-in English stopwords (no NLTK needed)
- `ngram_range=(1, 2)` - Unigrams + bigrams for better phrase matching
- `sublinear_tf=True` - Log scaling for term frequency
- `min_df=1, max_df=0.95` (adjusted to 1.0 for ≤2 docs) - Filters rare/ubiquitous terms

### 2. Connected Components Clustering
- Build similarity graph: articles = nodes, similarity ≥ threshold = edges
- Connected components = clusters
- Singleton articles = valid clusters (no minimum cluster size)

### 3. Ingestion Job Lifecycle
- Node creates job (queued) → returns jobId immediately (202)
- Python service receives jobId → marks running → processes → marks completed/failed
- Node NEVER marks completed based on Python 202 response
- Frontend polls status until completed/failed

### 4. Source Filter Behavior
When `sources` parameter provided:
- Clusters with zero matching-source articles excluded
- Article count = count of matching-source articles only
- Start/end time = range of matching-source articles only
- Intensity = recomputed from filtered count + filtered time range
- Sources array = only matching sources

### 5. Deduplication Priority
1. Source + external_id (primary)
2. Source + canonical_url
3. Normalized title + publication time (±24h window)

### 6. Transaction Safety for Clustering
- Single transaction: DELETE cluster_articles, DELETE clusters, INSERT new
- If clustering fails: ROLLBACK, original clusters preserved
- No partial state visible to API

## Known Limitations

1. **Lexical similarity only**: TF-IDF cannot detect semantic similarity (e.g., "car" vs "automobile")
2. **No cross-source story merging**: Same event from different sources may not cluster if vocabulary differs
3. **Fixed time window**: Old articles never re-clustered with new ones
4. **No incremental clustering**: Full recomputation on each ingest
5. **Free tier limitations**: Render Free PostgreSQL expires after 30 days; Python/Node services spin down after 15 min inactivity
6. **No authentication**: Public API, no user management
7. **No real-time updates**: Polling-based refresh only