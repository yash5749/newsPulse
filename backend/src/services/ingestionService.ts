import type { IngestJob, JobStatus } from '../types/database.js';
import * as ingestJobRepository from '../repositories/ingestJobRepository.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export class IngestionConflictError extends Error {
  constructor(public readonly jobId: string, public readonly status: JobStatus) {
    super('Ingestion already in progress');
    this.name = 'IngestionConflictError';
  }
}

export async function triggerIngestion(): Promise<{ jobId: string; status: JobStatus }> {
  // Check for active job
  const activeJob = await ingestJobRepository.getActiveIngestJob();
  if (activeJob) {
    throw new IngestionConflictError(activeJob.id, activeJob.status);
  }

  // Create new job
  const job = await ingestJobRepository.createIngestJob();
  
  // Trigger Python service asynchronously (fire and forget)
  // Python service will update job status to running/completed/failed
  triggerPythonIngestion(job.id).catch(err => {
    console.error('Failed to trigger Python ingestion:', err);
  });

  return { jobId: job.id, status: 'queued' };
}

async function triggerPythonIngestion(jobId: string): Promise<void> {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });

    if (!response.ok) {
      throw new Error(`Python service returned ${response.status}`);
    }

    // Python service returns 202 Accepted - job is queued for processing
    // Python service will update job status to running/completed/failed
    // Do NOT mark job as completed here - that's the Python service's responsibility
    const result = await response.json();
    console.log('Python ingestion triggered:', result);
  } catch (error) {
    // If we can't even trigger the Python service, mark as failed
    await ingestJobRepository.updateIngestJobStatus(jobId, 'failed', {
      completed_at: new Date(),
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function getIngestionStatus(jobId: string): Promise<IngestJob | null> {
  return ingestJobRepository.getIngestJobById(jobId);
}