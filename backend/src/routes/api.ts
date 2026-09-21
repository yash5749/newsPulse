import { Router } from 'express';
import type { Request, Response } from 'express';
import * as clusterRepository from '../repositories/clusterRepository.js';
import * as ingestionService from '../services/ingestionService.js';
import {
  mapClusterToApi,
  mapClusterDetailToApi,
  mapTimelineItemToApi,
  mapIngestJobToApi,
  mapSourceToApi,
} from '../mappers/index.js';
import { z } from 'zod';

const router = Router();

const sourceFilterSchema = z.array(z.string()).optional();

router.get('/clusters', async (req: Request, res: Response) => {
  try {
    const clusters = await clusterRepository.getAllClusters();
    res.json({ data: clusters.map(mapClusterToApi) });
  } catch (error) {
    console.error('Error fetching clusters:', error);
    res.status(500).json({ error: 'Failed to fetch clusters' });
  }
});

router.get('/clusters/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clusterId = Array.isArray(id) ? id[0] : id;
    const cluster = await clusterRepository.getClusterById(clusterId);
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }
    const articles = await clusterRepository.getClusterArticles(clusterId);
    res.json(mapClusterDetailToApi(cluster, articles));
  } catch (error) {
    console.error('Error fetching cluster:', error);
    res.status(500).json({ error: 'Failed to fetch cluster' });
  }
});

router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const sourcesParam = req.query.sources;
    const sources = sourceFilterSchema.parse(
      typeof sourcesParam === 'string' ? sourcesParam.split(',') : sourcesParam
    );
    const timeline = await clusterRepository.getTimelineItems(sources);
    res.json({ data: timeline.map(mapTimelineItemToApi) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid source filter' });
    }
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

router.post('/ingest/trigger', async (req: Request, res: Response) => {
  try {
    const result = await ingestionService.triggerIngestion();
    res.status(202).json(result);
  } catch (error) {
    if (error instanceof ingestionService.IngestionConflictError) {
      return res.status(409).json({
        error: 'Ingestion already in progress',
        jobId: error.jobId,
        status: error.status,
      });
    }
    console.error('Error triggering ingestion:', error);
    res.status(500).json({ error: 'Failed to trigger ingestion' });
  }
});

router.get('/ingest/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const jobIdStr = Array.isArray(jobId) ? jobId[0] : jobId;
    const job = await ingestionService.getIngestionStatus(jobIdStr);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(mapIngestJobToApi(job));
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

router.get('/sources', async (req: Request, res: Response) => {
  try {
    const sources = await clusterRepository.getAllSources();
    res.json({ data: sources.map(mapSourceToApi) });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

export default router;