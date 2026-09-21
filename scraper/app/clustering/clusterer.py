import logging
import uuid
from dataclasses import dataclass, field
from typing import Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ArticleForClustering:
    id: str
    title: str
    summary: str
    source_id: str
    published_at: str


@dataclass
class ClusterArticle:
    article_id: str
    similarity_score: float


@dataclass
class ClusterResult:
    id: str
    label: str
    articles: list[ClusterArticle]
    representative_article_id: str

    @property
    def article_ids(self) -> list[str]:
        return [a.article_id for a in self.articles]


class TFIDFClusterer:
    def __init__(
        self,
        similarity_threshold: float = None,
        time_window_days: int = None,
    ):
        self.similarity_threshold = similarity_threshold or settings.cluster_similarity_threshold
        self.time_window_days = time_window_days or settings.cluster_time_window_days
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            max_df=0.95,
        )

    def _preprocess_text(self, text: str) -> str:
        if not text:
            return ""
        return " ".join(text.lower().split())

    def _build_corpus(self, articles: list[ArticleForClustering]) -> list[str]:
        corpus = []
        for article in articles:
            combined = f"{article.title} {article.summary}"
            corpus.append(self._preprocess_text(combined))
        return corpus

    def _compute_similarity_matrix(self, corpus: list[str]) -> np.ndarray:
        if len(corpus) < 2:
            return np.array([[1.0]])
        # Adjust max_df for small corpora to avoid pruning all terms
        max_df = 0.95 if len(corpus) > 2 else 1.0
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            max_df=max_df,
        )
        tfidf_matrix = vectorizer.fit_transform(corpus)
        return cosine_similarity(tfidf_matrix)

    def _build_adjacency(self, similarity_matrix: np.ndarray) -> dict[int, list[int]]:
        n = similarity_matrix.shape[0]
        adjacency = {i: [] for i in range(n)}
        for i in range(n):
            for j in range(i + 1, n):
                if similarity_matrix[i, j] >= self.similarity_threshold:
                    adjacency[i].append(j)
                    adjacency[j].append(i)
        return adjacency

    def _find_connected_components(self, adjacency: dict[int, list[int]]) -> list[list[int]]:
        n = len(adjacency)
        visited = [False] * n
        components = []

        def dfs(node: int, component: list[int]):
            visited[node] = True
            component.append(node)
            for neighbor in adjacency[node]:
                if not visited[neighbor]:
                    dfs(neighbor, component)

        for i in range(n):
            if not visited[i]:
                component = []
                dfs(i, component)
                components.append(component)

        return components

    def _generate_label(self, articles: list[ArticleForClustering], component: list[int]) -> str:
        representative_idx = component[0]
        return articles[representative_idx].title

    def _compute_cluster_similarity_scores(
        self,
        similarity_matrix: np.ndarray,
        component: list[int],
        representative_idx: int,
    ) -> list[ClusterArticle]:
        """Compute similarity scores for articles in a cluster relative to the representative."""
        articles = []
        for idx in component:
            if idx == representative_idx:
                score = 1.0
            else:
                score = float(similarity_matrix[representative_idx, idx])
            articles.append(ClusterArticle(
                article_id=articles[0].article_id if articles else "",  # Will be fixed below
                similarity_score=score,
            ))
        # Fix article_ids
        for i, idx in enumerate(component):
            articles[i].article_id = articles[0].article_id if articles else ""
        return articles

    def cluster(self, articles: list[ArticleForClustering]) -> list[ClusterResult]:
        if not articles:
            return []

        logger.info(f"Clustering {len(articles)} articles with threshold={self.similarity_threshold}")

        corpus = self._build_corpus(articles)
        similarity_matrix = self._compute_similarity_matrix(corpus)
        adjacency = self._build_adjacency(similarity_matrix)
        components = self._find_connected_components(adjacency)

        results = []
        for component in components:
            article_ids = [articles[idx].id for idx in component]
            representative_idx = component[0]
            representative_id = articles[representative_idx].id
            label = self._generate_label(articles, component)

            cluster_id = str(uuid.uuid4())

            # Compute similarity scores relative to representative
            cluster_articles = []
            for idx in component:
                if idx == representative_idx:
                    score = 1.0
                else:
                    score = float(similarity_matrix[representative_idx, idx])
                cluster_articles.append(ClusterArticle(
                    article_id=articles[idx].id,
                    similarity_score=score,
                ))

            results.append(ClusterResult(
                id=cluster_id,
                label=label,
                articles=cluster_articles,
                representative_article_id=representative_id,
            ))

        logger.info(f"Created {len(results)} clusters")
        return results