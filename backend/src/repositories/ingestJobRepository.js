import { query, getClient } from '../db/connection';
import { IngestJob, JobStatus } from '../types/database';
export async function createIngestJob() {
    const result = await query(`
    INSERT INTO ingest_jobs (status) VALUES ('queued') RETURNING *
  `);
    return result.rows[0];
}
export async function getIngestJobById(jobId) {
    const result = await query(`
    SELECT * FROM ingest_jobs WHERE id = $1
  `, [jobId]);
    return result.rows[0] || null;
}
export async function updateIngestJobStatus(jobId, status, updates = {}) {
    const setClauses = ['status = $2'];
    const params = [jobId, status];
    let paramIndex = 3;
    if (updates.started_at !== undefined) {
        setClauses.push(`started_at = $${paramIndex++}`);
        params.push(updates.started_at);
    }
    if (updates.completed_at !== undefined) {
        setClauses.push(`completed_at = $${paramIndex++}`);
        params.push(updates.completed_at);
    }
    if (updates.articles_fetched !== undefined) {
        setClauses.push(`articles_fetched = $${paramIndex++}`);
        params.push(updates.articles_fetched);
    }
    if (updates.articles_inserted !== undefined) {
        setClauses.push(`articles_inserted = $${paramIndex++}`);
        params.push(updates.articles_inserted);
    }
    if (updates.articles_updated !== undefined) {
        setClauses.push(`articles_updated = $${paramIndex++}`);
        params.push(updates.articles_updated);
    }
    if (updates.clusters_created !== undefined) {
        setClauses.push(`clusters_created = $${paramIndex++}`);
        params.push(updates.clusters_created);
    }
    if (updates.error_message !== undefined) {
        setClauses.push(`error_message = $${paramIndex++}`);
        params.push(updates.error_message);
    }
    const result = await query(`
    UPDATE ingest_jobs SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *
  `, params);
    return result.rows[0] || null;
}
export async function getActiveIngestJob() {
    const result = await query(`
    SELECT * FROM ingest_jobs 
    WHERE status IN ('queued', 'running') 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
    return result.rows[0] || null;
}
export async function getRecentIngestJobs(limit = 10) {
    const result = await query(`
    SELECT * FROM ingest_jobs 
    ORDER BY created_at DESC 
    LIMIT $1
  `, [limit]);
    return result.rows;
}
//# sourceMappingURL=ingestJobRepository.js.map