import { Router, Request, Response } from 'express';
import * as clusterRepository from '../repositories/clusterRepository';
import * as ingestionService from '../services/ingestionService';
import { z } from 'zod';
const router = Router();
const sourceFilterSchema = z.array(z.string()).optional();
router.get('/clusters', async (req, res) => {
    try {
        const clusters = await clusterRepository.getAllClusters();
        res.json({ data: clusters });
    }
    catch (error) {
        console.error('Error fetching clusters:', error);
        res.status(500).json({ error: 'Failed to fetch clusters' });
    }
});
router.get('/clusters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cluster = await clusterRepository.getClusterById(id);
        if (!cluster) {
            return res.status(404).json({ error: 'Cluster not found' });
        }
        const articles = await clusterRepository.getClusterArticles(id);
        res.json({ ...cluster, articles });
    }
    catch (error) {
        console.error('Error fetching cluster:', error);
        res.status(500).json({ error: 'Failed to fetch cluster' });
    }
});
router.get('/timeline', async (req, res) => {
    try {
        const sources = sourceFilterSchema.parse(req.query.sources ? req.query.sources.split(',') : undefined);
        const timeline = await clusterRepository.getTimelineItems(sources);
        res.json({ data: timeline });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid source filter' });
        }
        console.error('Error fetching timeline:', error);
        res.status(500).json({ error: 'Failed to fetch timeline' });
    }
});
router.post('/ingest/trigger', async (req, res) => {
    try {
        const result = await ingestionService.triggerIngestion();
        res.status(202).json(result);
    }
    catch (error) {
        console.error('Error triggering ingestion:', error);
        res.status(500).json({ error: 'Failed to trigger ingestion' });
    }
});
router.get('/ingest/status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await ingestionService.getIngestionStatus(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(job);
    }
    catch (error) {
        console.error('Error fetching job status:', error);
        res.status(500).json({ error: 'Failed to fetch job status' });
    }
});
router.get('/sources', async (req, res) => {
    try {
        const sources = await clusterRepository.getAllSources();
        res.json({ data: sources });
    }
    catch (error) {
        console.error('Error fetching sources:', error);
        res.status(500).json({ error: 'Failed to fetch sources' });
    }
});
export default router;
//# sourceMappingURL=api.js.map