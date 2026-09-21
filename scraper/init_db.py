#!/usr/bin/env python3
"""
Database initialization script for News Pulse scraper.
Creates tables and seeds initial RSS sources.
Safe to run multiple times (idempotent).
"""
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database.connection import init_connection_pool, close_connection_pool, get_cursor

SCHEMA_SQL = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sources table
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    rss_url TEXT NOT NULL UNIQUE,
    base_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    external_id VARCHAR(512),
    url TEXT NOT NULL,
    canonical_url TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    body TEXT,
    published_at TIMESTAMPTZ,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    extraction_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (extraction_status IN ('SUCCESS', 'FALLBACK', 'FAILED', 'PENDING')),
    content_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_source_external_id UNIQUE (source_id, external_id),
    CONSTRAINT unique_source_canonical_url UNIQUE (source_id, canonical_url)
);

-- Indexes for articles
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_fetched_at ON articles(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);

-- Clusters table
CREATE TABLE IF NOT EXISTS clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    representative_article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cluster Articles junction table
CREATE TABLE IF NOT EXISTS cluster_articles (
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    similarity_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    PRIMARY KEY (cluster_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_cluster_articles_article_id ON cluster_articles(article_id);

-- Ingest Jobs table
CREATE TABLE IF NOT EXISTS ingest_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    articles_fetched INTEGER NOT NULL DEFAULT 0,
    articles_inserted INTEGER NOT NULL DEFAULT 0,
    articles_updated INTEGER NOT NULL DEFAULT 0,
    clusters_created INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingest_jobs_status ON ingest_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingest_jobs_created_at ON ingest_jobs(created_at DESC);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clusters_updated_at ON clusters;
CREATE TRIGGER update_clusters_updated_at
    BEFORE UPDATE ON clusters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
"""

SEED_SQL = """
-- BBC News
INSERT INTO sources (name, rss_url, base_url)
VALUES ('BBC', 'https://feeds.bbci.co.uk/news/rss.xml', 'https://www.bbc.com')
ON CONFLICT (name) DO NOTHING;

-- NPR
INSERT INTO sources (name, rss_url, base_url)
VALUES ('NPR', 'https://feeds.npr.org/1001/rss.xml', 'https://www.npr.org')
ON CONFLICT (name) DO NOTHING;

-- The Guardian
INSERT INTO sources (name, rss_url, base_url)
VALUES ('The Guardian', 'https://www.theguardian.com/world/rss', 'https://www.theguardian.com')
ON CONFLICT (name) DO NOTHING;
"""

def run_sql(sql: str, description: str):
    """Execute SQL statements."""
    try:
        init_connection_pool()
        with get_cursor() as cur:
            cur.execute(sql)
        print(f"✓ {description}")
    except Exception as e:
        print(f"✗ {description}: {e}")
        raise
    finally:
        close_connection_pool()

def main():
    print("Initializing News Pulse database...")
    run_sql(SCHEMA_SQL, "Creating tables")
    run_sql(SEED_SQL, "Seeding RSS sources")
    print("Database initialization complete!")

if __name__ == "__main__":
    main()