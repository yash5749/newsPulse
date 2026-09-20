from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID


class ExtractionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FALLBACK = "FALLBACK"
    FAILED = "FAILED"
    PENDING = "PENDING"


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Source:
    id: UUID
    name: str
    rss_url: str
    base_url: Optional[str]
    created_at: datetime


@dataclass
class Article:
    id: UUID
    source_id: UUID
    external_id: Optional[str]
    url: str
    canonical_url: Optional[str]
    title: str
    summary: Optional[str]
    body: Optional[str]
    published_at: Optional[datetime]
    fetched_at: datetime
    extraction_status: ExtractionStatus
    content_hash: Optional[str]
    created_at: datetime
    updated_at: datetime


@dataclass
class Cluster:
    id: UUID
    label: str
    representative_article_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime


@dataclass
class ClusterArticle:
    cluster_id: UUID
    article_id: UUID
    similarity_score: float


@dataclass
class IngestJob:
    id: UUID
    status: JobStatus
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    articles_fetched: int
    articles_inserted: int
    articles_updated: int
    clusters_created: int
    error_message: Optional[str]
    created_at: datetime


@dataclass
class NormalizedArticle:
    source: str
    external_id: str
    title: str
    summary: str
    article_url: str
    published_at: Optional[datetime]
    body: Optional[str] = None
    extraction_status: ExtractionStatus = ExtractionStatus.PENDING