import type { IngestJob, JobStatus } from '../types/database.js';
import * as ingestJobRepository from '../repositories/ingestJobRepository.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function triggerIngestion(): Promise<{ jobId: string; status: JobStatus }> {
  // Check for active job
  const activeJob = await ingestJobRepository.getActiveIngestJob();
  if (activeJob) {
    return { jobId: activeJob.id, status: activeJob.status };
  }

  // Create new job
  const job = await ingestJobRepository.createIngestJob();
  
  // Trigger Python service asynchronously (fire and forget)
  triggerPythonIngestion(job.id).catch(err => {
    console.error('Failed to trigger Python ingestion:', err);
  });

  return { jobId: job.id, status: 'queued' };
}

async function triggerPythonIngestion(jobId: string): Promise<void> {
  try {
    await ingestJobRepository.updateIngestJobStatus(jobId, 'running', { started_at: new Date() });
    
    const response = await fetch(`${PYTHON_SERVICE_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });

    if (!response.ok) {
      throw new Error(`Python service returned ${response.status}`);
    }

    const result = await response.json();
    
    await ingestJobRepository.updateIngestJobStatus(jobId, 'completed', {
      completed_at: new Date(),
      articles_fetched: result.articles_fetched || 0,
      articles_inserted: result.articles_inserted || 0,
      articles_updated: result.articles_updated || 0,
      clusters_created: result.clusters_created || 0,
    });
  } catch (error) {
    await ingestJobRepository.updateIngestJobStatus(jobId, 'failed', {
      completed_at: new Date(),
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function getIngestionStatus(jobId: string): Promise<IngestJob | null> {
  return ingestJobRepository.getIngestJobById(jobId);
}