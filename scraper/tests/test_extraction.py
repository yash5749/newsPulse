import pytest
from app.extraction.extractor import ArticleExtractor
from app.database.models import ExtractionStatus

def test_extract_with_trafilatura_success():
    extractor = ArticleExtractor(timeout=5)
    # Test with a simple HTML that trafilatura can extract
    html = '''
    <html>
    <body>
        <article>
            <h1>Test Article</h1>
            <p>This is a test article with enough content for extraction.</p>
            <p>It has multiple paragraphs to ensure it meets the minimum length requirement.</p>
        </article>
    </body>
    </html>
    '''
    # This tests the internal method directly
    body = extractor.extract_with_trafilatura(html, 'https://example.com')
    assert body is not None
    assert 'Test Article' in body

def test_extract_with_bs4_fallback():
    extractor = ArticleExtractor(timeout=5)
    html = '''
    <html>
    <body>
        <main>
            <h1>Test Article</h1>
            <p>This is a test article with enough content for extraction.</p>
            <p>It has multiple paragraphs to ensure it meets the minimum length requirement.</p>
        </main>
    </body>
    </html>
    '''
    # Trafilatura might fail on this, so BS4 should be tried
    body = extractor.extract_with_bs4(html, 'https://example.com')
    assert body is not None
    assert 'Test Article' in body

def test_extract_removes_scripts_and_styles():
    extractor = ArticleExtractor(timeout=5)
    html = '''
    <html>
    <head><script>alert('test')</script><style>body { color: red; }</style></head>
    <body>
        <article>
            <h1>Test Article</h1>
            <p>Content without scripts and styles. This is a longer paragraph to ensure the extraction meets the minimum length requirement for the extractor to return content.</p>
            <p>Another paragraph with more content to make sure we have enough text for the extractor.</p>
        </article>
    </body>
    </html>
    '''
    body = extractor.extract_with_bs4(html, 'https://example.com')
    assert body is not None
    assert 'alert' not in body
    assert 'color: red' not in body