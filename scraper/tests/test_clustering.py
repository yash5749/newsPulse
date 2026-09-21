import pytest
from app.clustering.clusterer import TFIDFClusterer, ArticleForClustering

def test_empty_clustering():
    clusterer = TFIDFClusterer(similarity_threshold=0.3)
    result = clusterer.cluster([])
    assert result == []

def test_single_article_creates_one_cluster():
    clusterer = TFIDFClusterer(similarity_threshold=0.3)
    articles = [
        ArticleForClustering(
            id='1',
            title='Test Article',
            summary='Test summary',
            source_id='BBC',
            published_at='2024-01-01T10:00:00Z',
        )
    ]
    result = clusterer.cluster(articles)
    assert len(result) == 1
    assert result[0].label == 'Test Article'
    assert result[0].article_ids == ['1']
    assert result[0].representative_article_id == '1'

def test_identical_summaries_clustered_together():
    clusterer = TFIDFClusterer(similarity_threshold=0.0)
    articles = [
        ArticleForClustering(
            id='1',
            title='Article One',
            summary='Identical summary text for testing clustering',
            source_id='BBC',
            published_at='2024-01-01T10:00:00Z',
        ),
        ArticleForClustering(
            id='2',
            title='Article Two',
            summary='Identical summary text for testing clustering',
            source_id='NPR',
            published_at='2024-01-01T11:00:00Z',
        ),
    ]
    result = clusterer.cluster(articles)
    # With threshold 0.0 and identical summaries, should create 1 cluster
    assert len(result) == 1
    assert len(result[0].article_ids) == 2

def test_dissimilar_articles_separate_clusters():
    clusterer = TFIDFClusterer(similarity_threshold=0.5)
    articles = [
        ArticleForClustering(
            id='1',
            title='Technology Regulation Bill Passes',
            summary='Parliament passes new tech regulation',
            source_id='BBC',
            published_at='2024-01-01T10:00:00Z',
        ),
        ArticleForClustering(
            id='2',
            title='Stock Market Rises on Economic News',
            summary='Markets surge on positive economic data',
            source_id='NPR',
            published_at='2024-01-01T11:00:00Z',
        ),
    ]
    result = clusterer.cluster(articles)
    # Should create 2 clusters since articles are dissimilar
    assert len(result) == 2

def test_similarity_scores_in_results():
    clusterer = TFIDFClusterer(similarity_threshold=0.1)
    articles = [
        ArticleForClustering(
            id='1',
            title='Test Article About Technology',
            summary='This is a test summary about technology and innovation',
            source_id='BBC',
            published_at='2024-01-01T10:00:00Z',
        ),
        ArticleForClustering(
            id='2',
            title='Another Test Article About Tech',
            summary='Another test summary about technology and innovation',
            source_id='NPR',
            published_at='2024-01-01T11:00:00Z',
        ),
    ]
    result = clusterer.cluster(articles)
    # Check that similarity scores are present
    for cluster in result:
        for article in cluster.articles:
            assert 'similarity_score' in article.__dict__
            assert 0 <= article.similarity_score <= 1.0