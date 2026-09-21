import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapClusterToApi, mapClusterDetailToApi, mapTimelineItemToApi, mapIngestJobToApi, mapSourceToApi, mapArticleToApi } from '../src/mappers/index.js';

describe('API Mappers', () => {
  describe('mapClusterToApi', () => {
    it('converts snake_case to camelCase', () => {
      const cluster = {
        id: 'test-id',
        label: 'Test Cluster',
        representative_article_id: 'rep-id',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        article_count: 5,
        start_time: new Date('2024-01-01T10:00:00Z'),
        end_time: new Date('2024-01-02T10:00:00Z'),
        sources: ['BBC', 'NPR'],
      };

      const result = mapClusterToApi(cluster);

      expect(result).toEqual({
        id: 'test-id',
        label: 'Test Cluster',
        articleCount: 5,
        startTime: '2024-01-01T10:00:00.000Z',
        endTime: '2024-01-02T10:00:00.000Z',
        sources: ['BBC', 'NPR'],
      });
    });

    it('handles null start_time and end_time', () => {
      const cluster = {
        id: 'test-id',
        label: 'Test Cluster',
        representative_article_id: 'rep-id',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        article_count: 5,
        start_time: null,
        end_time: null,
        sources: ['BBC'],
      };

      const result = mapClusterToApi(cluster);

      expect(result.startTime).toBeNull();
      expect(result.endTime).toBeNull();
    });
  });

  describe('mapTimelineItemToApi', () => {
    it('converts snake_case to camelCase', () => {
      const item = {
        cluster_id: 'cluster-1',
        label: 'Test Cluster',
        start_time: new Date('2024-01-01T10:00:00Z'),
        end_time: new Date('2024-01-02T10:00:00Z'),
        article_count: 3,
        intensity: 0.5,
        sources: ['BBC', 'NPR'],
      };

      const result = mapTimelineItemToApi(item);

      expect(result).toEqual({
        clusterId: 'cluster-1',
        label: 'Test Cluster',
        startTime: '2024-01-01T10:00:00.000Z',
        endTime: '2024-01-02T10:00:00.000Z',
        articleCount: 3,
        intensity: 0.5,
        sources: ['BBC', 'NPR'],
      });
    });
  });

  describe('mapIngestJobToApi', () => {
    it('converts snake_case to camelCase', () => {
      const job = {
        id: 'job-1',
        status: 'completed',
        started_at: new Date('2024-01-01T10:00:00Z'),
        completed_at: new Date('2024-01-01T10:05:00Z'),
        articles_fetched: 10,
        articles_inserted: 8,
        articles_updated: 2,
        clusters_created: 3,
        error_message: null,
        created_at: new Date('2024-01-01T09:55:00Z'),
      };

      const result = mapIngestJobToApi(job);

      expect(result).toEqual({
        id: 'job-1',
        status: 'completed',
        startedAt: '2024-01-01T10:00:00.000Z',
        completedAt: '2024-01-01T10:05:00.000Z',
        articlesFetched: 10,
        articlesInserted: 8,
        articlesUpdated: 2,
        clustersCreated: 3,
        errorMessage: null,
        createdAt: '2024-01-01T09:55:00.000Z',
      });
    });
  });

  describe('mapSourceToApi', () => {
    it('maps source correctly', () => {
      const source = { id: 'source-1', name: 'BBC' };
      const result = mapSourceToApi(source);
      expect(result).toEqual({ id: 'source-1', name: 'BBC' });
    });
  });
});