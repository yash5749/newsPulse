import { ClusterWithDetails, ArticleWithSource, TimelineItem } from '../types/database';
export declare function getAllClusters(): Promise<ClusterWithDetails[]>;
export declare function getClusterById(clusterId: string): Promise<ClusterWithDetails | null>;
export declare function getClusterArticles(clusterId: string): Promise<ArticleWithSource[]>;
export declare function getTimelineItems(sourceFilter?: string[]): Promise<TimelineItem[]>;
export declare function getAllSources(): Promise<{
    id: string;
    name: string;
}[]>;
//# sourceMappingURL=clusterRepository.d.ts.map