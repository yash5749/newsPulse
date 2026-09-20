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