import { query, getClient } from '../db/connection.js';
import type { IngestJob, JobStatus } from '../types/database.js';

export async function createIngestJob(): Promise<IngestJob> {
  const result = await query<IngestJob>(`
    INSERT INTO ingest_jobs (status) VALUES ('queued') RETURNING *
  `);
  return result.rows[0];
}

export async function getIngestJobById(jobId: string): Promise<IngestJob | null> {
  const result = await query<IngestJob>(`
    SELECT * FROM ingest_jobs WHERE id = $1
  `, [jobId]);
  return result.rows[0] || null;
}

export async function updateIngestJobStatus(
  jobId: string,
  status: JobStatus,
  updates: Partial<Pick<IngestJob, 'started_at' | 'completed_at' | 'articles_fetched' | 'articles_inserted' | 'articles_updated' | 'clusters_created' | 'error_message'>> = {}
): Promise<IngestJob | null> {
  const setClauses: string[] = ['status = $2'];
  const params: any[] = [jobId, status];
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

  const result = await query<IngestJob>(`
    UPDATE ingest_jobs SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *
  `, params);
  return result.rows[0] || null;
}

export async function getActiveIngestJob(): Promise<IngestJob | null> {
  const result = await query<IngestJob>(`
    SELECT * FROM ingest_jobs 
    WHERE status IN ('queued', 'running') 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  return result.rows[0] || null;
}

export async function getRecentIngestJobs(limit = 10): Promise<IngestJob[]> {
  const result = await query<IngestJob>(`
    SELECT * FROM ingest_jobs 
    ORDER BY created_at DESC 
    LIMIT $1
  `, [limit]);
  return result.rows;
}