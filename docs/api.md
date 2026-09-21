# News Pulse — API Documentation

Base URL: `http://localhost:3001` (local) / `https://<your-api>.onrender.com` (prod)

---

## GET /clusters

List all clusters with summary metadata.

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `sources` | string | No | Comma-separated source names to filter (e.g., `BBC,NPR`) |

### Response 200

```json
{
  "data": [
    {
      "id": "uuid",
      "label": "Technology Regulation Bill Advances",
      "articleCount": 5,
      "startTime": "2026-09-18T10:00:00Z",
      "endTime": "2026-09-20T14:30:00Z",
      "sources": ["BBC", "NPR", "Guardian"]
    }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Cluster identifier |
| `label` | string | Human-readable cluster label |
| `articleCount` | integer | Number of articles in cluster (after source filter) |
| `startTime` | ISO 8601 | Earliest article published_at |
| `endTime` | ISO 8601 | Latest article published_at |
| `sources` | string[] | Unique source names in cluster |

---

## GET /clusters/:id

Get a single cluster with all its articles.

### Path Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Cluster ID |

### Response 200

```json
{
  "id": "uuid",
  "label": "Technology Regulation Bill Advances",
  "articleCount": 5,
  "startTime": "2026-09-18T10:00:00Z",
  "endTime": "2026-09-20T14:30:00Z",
  "sources": ["BBC", "NPR", "Guardian"],
  "representativeArticleId": "uuid",
  "createdAt": "2026-09-18T10:00:00Z",
  "updatedAt": "2026-09-20T14:30:00Z",
  "articles": [
    {
      "id": "uuid",
      "sourceId": "uuid",
      "sourceName": "BBC",
      "externalId": "bbc-12345",
      "url": "https://bbc.com/news/tech-12345",
      "canonicalUrl": "https://bbc.com/news/tech-12345",
      "title": "Tech Regulation Bill Passes First Reading",
      "summary": "Parliament debates new technology oversight...",
      "body": "Full article text...",
      "publishedAt": "2026-09-18T10:00:00Z",
      "fetchedAt": "2026-09-18T10:05:00Z",
      "extractionStatus": "SUCCESS",
      "contentHash": "sha256...",
      "createdAt": "2026-09-18T10:05:00Z",
      "updatedAt": "2026-09-18T10:05:00Z"
    }
  ]
}
```

### Response 404

```json
{ "error": "Cluster not found" }
```

---

## GET /timeline

Get timeline-ready data for visualization.

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `sources` | string | No | Comma-separated source names to filter (e.g., `BBC,NPR`) |

### Response 200

```json
{
  "data": [
    {
      "clusterId": "uuid",
      "label": "Technology Regulation Bill Advances",
      "startTime": "2026-09-18T10:00:00Z",
      "endTime": "2026-09-20T14:30:00Z",
      "articleCount": 5,
      "intensity": 0.83,
      "sources": ["BBC", "NPR", "Guardian"]
    }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `clusterId` | string (UUID) | Cluster identifier |
| `label` | string | Cluster label |
| `startTime` | ISO 8601 | Earliest article in cluster |
| `endTime` | ISO 8601 | Latest article in cluster |
| `articleCount` | integer | Articles in cluster (filtered) |
| `intensity` | float | `articleCount / daysSpan` — visual weight |
| `sources` | string[] | Source names in cluster |

### Source Filter Behavior

When `sources` parameter provided:
- Clusters with **zero** matching-source articles are excluded
- `articleCount` = count of matching-source articles only
- `startTime`/`endTime` = range of matching-source articles only
- `intensity` = recomputed from filtered count + filtered time range
- `sources` = only matching sources

---

## POST /ingest/trigger

Trigger an asynchronous ingestion job.

### Response 202 (Accepted)

```json
{
  "jobId": "uuid",
  "status": "queued"
}
```

### Response 409 (Conflict)

```json
{
  "error": "Ingestion already in progress",
  "jobId": "uuid",
  "status": "running"
}
```
Returned when an active job exists. Client should poll the existing job.

### Response 503

```json
{ "error": "Ingestion service unavailable" }
```

---

## GET /ingest/status/:jobId

Get ingestion job status and progress.

### Path Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `jobId` | string (UUID) | Yes | Job ID from POST /ingest/trigger |

### Response 200

```json
{
  "id": "uuid",
  "status": "running",
  "startedAt": "2026-09-20T15:00:00Z",
  "completedAt": null,
  "articlesFetched": 42,
  "articlesInserted": 38,
  "articlesUpdated": 4,
  "clustersCreated": 7,
  "errorMessage": null,
  "createdAt": "2026-09-20T15:00:00Z"
}
```

### Status Values

| Status | Description |
|--------|-------------|
| `queued` | Job created, not yet started |
| `running` | Ingestion in progress |
| `completed` | Finished successfully |
| `failed` | Error occurred |

### Response 404

```json
{ "error": "Job not found" }
```

---

## GET /sources

List all configured RSS sources.

### Response 200

```json
{
  "data": [
    { "id": "uuid", "name": "BBC" },
    { "id": "uuid", "name": "NPR" },
    { "id": "uuid", "name": "The Guardian" }
  ]
}
```

---

## Error Responses

All endpoints may return:

### 400 Bad Request

```json
{ "error": "Invalid query parameter: sources" }
```

### 500 Internal Server Error

```json
{ "error": "Internal server error" }
```
No stack traces exposed.

---

## Frontend Usage Patterns

### Initial Load

```js
// Load timeline
const timeline = await fetch('/api/timeline').then(r => r.json())

// User clicks cluster
const cluster = await fetch(`/api/clusters/${clusterId}`).then(r => r.json())
```

### Source Filter

```js
// User toggles sources
const filtered = await fetch(`/api/timeline?sources=${selected.join(',')}`).then(r => r.json())
```

### Refresh Flow

```js
// 1. Trigger ingestion
const { jobId } = await fetch('/api/ingest/trigger', { method: 'POST' }).then(r => r.json())

// 2. Poll status
async function poll() {
  const { status, ...job } = await fetch(`/api/ingest/status/${jobId}`).then(r => r.json())
  if (status === 'running') { setTimeout(poll, 2000); return }
  if (status === 'completed') { refreshTimeline(); return }
  if (status === 'failed') { showError(job.errorMessage); return }
}
poll()

// 3. On complete, reload timeline
async function refreshTimeline() {
  const timeline = await fetch('/api/timeline').then(r => r.json())
  setTimeline(timeline.data)
}
```