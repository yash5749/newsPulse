import { IngestJob, JobStatus } from '../types/database';
export declare function triggerIngestion(): Promise<{
    jobId: string;
    status: JobStatus;
}>;
export declare function getIngestionStatus(jobId: string): Promise<IngestJob | null>;
//# sourceMappingURL=ingestionService.d.ts.map