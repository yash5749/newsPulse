import pytest
from app.feeds.adapter import parse_date, extract_external_id, extract_title, extract_summary, extract_article_url
from datetime import datetime, timezone

def test_parse_date_with_parsed_struct():
    import time
    struct = time.struct_time((2024, 1, 15, 10, 30, 0, 0, 15, 0))
    result = parse_date(None, struct)
    assert result == datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)

def test_parse_date_with_date_string():
    result = parse_date('Mon, 15 Jan 2024 10:30:00 GMT')
    assert result == datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)

def test_parse_date_with_iso_string():
    result = parse_date('2024-01-15T10:30:00Z')
    assert result == datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)

def test_parse_date_with_none_returns_fallback():
    fallback = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
    result = parse_date(None, None, fallback)
    assert result == fallback

def test_parse_date_with_empty_string_returns_fallback():
    fallback = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
    result = parse_date('', None, fallback)
    assert result == fallback

def test_parse_date_with_invalid_string_returns_fallback():
    fallback = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
    result = parse_date('not a date', None, fallback)
    assert result == fallback

def test_extract_external_id_with_id():
    entry = {'id': 'test-id-123'}
    result = extract_external_id(entry)
    assert result == 'test-id-123'

def test_extract_external_id_with_guid():
    entry = {'guid': 'guid-123'}
    result = extract_external_id(entry)
    assert result == 'guid-123'

def test_extract_external_id_with_link():
    entry = {'link': 'https://example.com/article'}
    result = extract_external_id(entry)
    assert result == 'https://example.com/article'

def test_extract_external_id_prefers_id_over_guid():
    entry = {'id': 'id-123', 'guid': 'guid-123'}
    result = extract_external_id(entry)
    assert result == 'id-123'

def test_extract_title():
    entry = {'title': 'Test Title'}
    result = extract_title(entry)
    assert result == 'Test Title'

def test_extract_title_with_title_detail():
    entry = {'title_detail': {'value': 'Detail Title'}}
    result = extract_title(entry)
    assert result == 'Detail Title'

def test_extract_summary_with_summary():
    entry = {'summary': 'Test summary'}
    result = extract_summary(entry)
    assert result == 'Test summary'

def test_extract_summary_with_description():
    entry = {'description': 'Test description'}
    result = extract_summary(entry)
    assert result == 'Test description'

def test_extract_summary_with_content():
    entry = {'content': [{'value': 'Test content'}]}
    result = extract_summary(entry)
    assert result == 'Test content'

def test_extract_article_url_with_link():
    entry = {'link': 'https://example.com/article'}
    result = extract_article_url(entry)
    assert result == 'https://example.com/article'

def test_extract_article_url_with_links():
    entry = {'links': [{'rel': 'alternate', 'href': 'https://example.com/article'}]}
    result = extract_article_url(entry)
    assert result == 'https://example.com/article'