-- News Pulse Seed Data
-- Run this after schema.sql to populate initial RSS sources
-- Safe to run multiple times (idempotent)

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