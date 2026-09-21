import { IngestJob, JobStatus } from '../types/database';
export declare function createIngestJob(): Promise<IngestJob>;
export declare function getIngestJobById(jobId: string): Promise<IngestJob | null>;
export declare function updateIngestJobStatus(jobId: string, status: JobStatus, updates?: Partial<Pick<IngestJob, 'started_at' | 'completed_at' | 'articles_fetched' | 'articles_inserted' | 'articles_updated' | 'clusters_created' | 'error_message'>>): Promise<IngestJob | null>;
export declare function getActiveIngestJob(): Promise<IngestJob | null>;
export declare function getRecentIngestJobs(limit?: number): Promise<IngestJob[]>;
//# sourceMappingURL=ingestJobRepository.d.ts.map