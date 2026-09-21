import feedparser
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse
import logging
import time
from dateutil import parser as dateutil_parser

from app.database.models import NormalizedArticle, ExtractionStatus

logger = logging.getLogger(__name__)


def parse_date(date_str: Optional[str], parsed_struct: Optional[time.struct_time] = None, fallback: Optional[datetime] = None) -> Optional[datetime]:
    if parsed_struct:
        try:
            dt = datetime(*parsed_struct[:6], tzinfo=timezone.utc)
            return dt
        except Exception as e:
            logger.warning(f"Failed to convert parsed_struct to datetime: {e}")
    
    if not date_str:
        return fallback
    try:
        dt = dateutil_parser.parse(date_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt
    except Exception as e:
        logger.warning(f"Failed to parse date '{date_str}': {e}")
    return fallback


def extract_external_id(entry: feedparser.FeedParserDict) -> Optional[str]:
    for field in ('id', 'guid', 'link'):
        value = entry.get(field)
        if value:
            return str(value).strip()
    return None


def extract_title(entry: feedparser.FeedParserDict) -> str:
    title = entry.get('title', '').strip()
    if not title:
        title = entry.get('title_detail', {}).get('value', '').strip()
    return title or "(no title)"


def extract_summary(entry: feedparser.FeedParserDict) -> str:
    for field in ('summary', 'description', 'content', 'content:encoded'):
        value = entry.get(field)
        if value:
            if isinstance(value, list):
                value = value[0].get('value', '') if value else ''
            elif isinstance(value, dict):
                value = value.get('value', '')
            return str(value).strip()
    return ''


def extract_article_url(entry: feedparser.FeedParserDict) -> Optional[str]:
    if entry.get('link'):
        return entry['link'].strip()
    for link in entry.get('links', []):
        if link.get('rel') == 'alternate' or link.get('type', '').startswith('text/html'):
            return link.get('href', '').strip()
    return None


def normalize_feed_entry(source_name: str, source_rss_url: str, entry: feedparser.FeedParserDict) -> NormalizedArticle:
    external_id = extract_external_id(entry)
    title = extract_title(entry)
    summary = extract_summary(entry)
    article_url = extract_article_url(entry)
    fetch_time = datetime.now(timezone.utc)
    published_at = parse_date(
        entry.get('published') or entry.get('pubDate') or entry.get('updated'),
        entry.get('published_parsed') or entry.get('updated_parsed'),
        fetch_time
    )

    if not article_url:
        logger.warning(f"[{source_name}] Entry missing article URL, external_id={external_id}")

    return NormalizedArticle(
        source=source_name,
        external_id=external_id or article_url or '',
        title=title,
        summary=summary,
        article_url=article_url or '',
        published_at=published_at,
        body=None,
        extraction_status=ExtractionStatus.PENDING,
    )


def fetch_and_parse_feed(rss_url: str, source_name: str) -> list[NormalizedArticle]:
    logger.info(f"[{source_name}] Fetching feed: {rss_url}")
    parsed = feedparser.parse(rss_url)

    if parsed.bozo and parsed.bozo_exception:
        logger.warning(f"[{source_name}] Feed parsing warning: {parsed.bozo_exception}")

    entries = parsed.entries
    logger.info(f"[{source_name}] Found {len(entries)} entries")

    normalized = []
    for entry in entries:
        try:
            article = normalize_feed_entry(source_name, rss_url, entry)
            if article.article_url:
                normalized.append(article)
        except Exception as e:
            logger.error(f"[{source_name}] Failed to normalize entry: {e}")
            continue

    return normalized