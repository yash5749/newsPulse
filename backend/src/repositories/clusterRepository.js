import { query } from '../db/connection';
import { ClusterWithDetails, ClusterDetail, ArticleWithSource, TimelineItem } from '../types/database';
export async function getAllClusters() {
    const result = await query(`
    SELECT 
      c.id,
      c.label,
      c.representative_article_id,
      c.created_at,
      c.updated_at,
      COUNT(ca.article_id) as article_count,
      MIN(a.published_at) as start_time,
      MAX(a.published_at) as end_time,
      ARRAY_AGG(DISTINCT s.name) as sources
    FROM clusters c
    LEFT JOIN cluster_articles ca ON c.id = ca.cluster_id
    LEFT JOIN articles a ON ca.article_id = a.id
    LEFT JOIN sources s ON a.source_id = s.id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `);
    return result.rows;
}
export async function getClusterById(clusterId) {
    const result = await query(`
    SELECT 
      c.id,
      c.label,
      c.representative_article_id,
      c.created_at,
      c.updated_at,
      COUNT(ca.article_id) as article_count,
      MIN(a.published_at) as start_time,
      MAX(a.published_at) as end_time,
      ARRAY_AGG(DISTINCT s.name) as sources
    FROM clusters c
    LEFT JOIN cluster_articles ca ON c.id = ca.cluster_id
    LEFT JOIN articles a ON ca.article_id = a.id
    LEFT JOIN sources s ON a.source_id = s.id
    WHERE c.id = $1
    GROUP BY c.id
  `, [clusterId]);
    return result.rows[0] || null;
}
export async function getClusterArticles(clusterId) {
    const result = await query(`
    SELECT 
      a.id,
      a.source_id,
      a.external_id,
      a.url,
      a.canonical_url,
      a.title,
      a.summary,
      a.body,
      a.published_at,
      a.fetched_at,
      a.extraction_status,
      a.content_hash,
      a.created_at,
      a.updated_at,
      s.name as source_name
    FROM articles a
    JOIN cluster_articles ca ON a.id = ca.article_id
    JOIN sources s ON a.source_id = s.id
    WHERE ca.cluster_id = $1
    ORDER BY a.published_at ASC
  `, [clusterId]);
    return result.rows;
}
export async function getTimelineItems(sourceFilter) {
    let whereClause = '';
    let params = [];
    if (sourceFilter && sourceFilter.length > 0) {
        whereClause = `WHERE s.name = ANY($1)`;
        params.push(sourceFilter);
    }
    const result = await query(`
    SELECT 
      c.id as cluster_id,
      c.label,
      MIN(a.published_at) as start_time,
      MAX(a.published_at) as end_time,
      COUNT(ca.article_id) as article_count,
      COUNT(ca.article_id)::float / GREATEST(EXTRACT(EPOCH FROM (MAX(a.published_at) - MIN(a.published_at))) / 3600, 1) as intensity,
      ARRAY_AGG(DISTINCT s.name) as sources
    FROM clusters c
    JOIN cluster_articles ca ON c.id = ca.cluster_id
    JOIN articles a ON ca.article_id = a.id
    JOIN sources s ON a.source_id = s.id
    ${whereClause}
    GROUP BY c.id
    HAVING COUNT(ca.article_id) > 0
    ORDER BY start_time DESC
  `, params);
    return result.rows;
}
export async function getAllSources() {
    const result = await query(`
    SELECT id, name FROM sources ORDER BY name
  `);
    return result.rows;
}
//# sourceMappingURL=clusterRepository.js.map