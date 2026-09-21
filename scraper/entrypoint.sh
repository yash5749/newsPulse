#!/bin/bash
# Entrypoint script that waits for DATABASE_URL to be available

set -e

# Wait for DATABASE_URL to be set (Render injects it via fromDatabase)
# Sometimes there's a timing issue where the service starts before the env var is injected
for i in {1..30}; do
    if [ -n "$DATABASE_URL" ]; then
        echo "DATABASE_URL is set, starting server..."
        break
    fi
    echo "Waiting for DATABASE_URL... (attempt $i/30)"
    sleep 2
done

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL not set after 60 seconds"
    echo "Available env vars:"
    env | grep -E '(DATABASE|POSTGRES|DB_)' || echo "No database-related vars found"
    exit 1
fi

# Run the Python HTTP server
exec python http_server.py