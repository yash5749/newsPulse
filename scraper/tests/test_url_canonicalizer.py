import pytest
from app.normalization.url_canonicalizer import canonicalize_url

def test_canonicalize_url_removes_tracking_params():
    url = 'https://example.com/article?utm_source=twitter&utm_medium=social&id=123'
    result = canonicalize_url(url)
    assert 'utm_source' not in result
    assert 'utm_medium' not in result
    assert 'id=123' in result

def test_canonicalize_url_removes_fbclid():
    url = 'https://example.com/article?fbclid=12345'
    result = canonicalize_url(url)
    assert 'fbclid' not in result

def test_canonicalize_url_removes_fragment():
    url = 'https://example.com/article#section1'
    result = canonicalize_url(url)
    assert '#' not in result

def test_canonicalize_url_lowercases_domain():
    url = 'https://EXAMPLE.COM/article'
    result = canonicalize_url(url)
    assert result == 'https://example.com/article'

def test_canonicalize_url_removes_www():
    url = 'https://www.example.com/article'
    result = canonicalize_url(url)
    assert result == 'https://example.com/article'

def test_canonicalize_url_keeps_meaningful_params():
    url = 'https://example.com/article?article_id=123&page=2'
    result = canonicalize_url(url)
    assert 'article_id=123' in result
    assert 'page=2' in result

def test_canonicalize_url_handles_invalid_url():
    url = 'not a valid url'
    result = canonicalize_url(url)
    assert result == url  # Returns original on error