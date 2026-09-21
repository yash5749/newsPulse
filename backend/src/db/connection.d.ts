import pg from 'pg';
declare const pool: import("pg").Pool;
export declare function query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: any[]): Promise<pg.QueryResult<T>>;
export declare function getClient(): Promise<pg.PoolClient>;
export declare function closePool(): Promise<void>;
export default pool;
//# sourceMappingURL=connection.d.ts.map