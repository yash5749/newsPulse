import trafilatura
from bs4 import BeautifulSoup
import httpx
import logging
from typing import Optional
from app.database.models import ExtractionStatus

logger = logging.getLogger(__name__)


class ArticleExtractor:
    def __init__(self, timeout: int = 30, user_agent: str = "NewsPulse/1.0"):
        self.timeout = timeout
        self.user_agent = user_agent
        self.client = httpx.Client(
            timeout=timeout,
            headers={"User-Agent": user_agent},
            follow_redirects=True,
        )

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()

    def fetch_html(self, url: str) -> Optional[str]:
        try:
            response = self.client.get(url)
            response.raise_for_status()
            content_type = response.headers.get('content-type', '').lower()
            if 'text/html' not in content_type and 'application/xhtml' not in content_type:
                logger.warning(f"Non-HTML content type for {url}: {content_type}")
                return None
            return response.text
        except httpx.TimeoutException:
            logger.warning(f"Timeout fetching {url}")
        except httpx.HTTPStatusError as e:
            logger.warning(f"HTTP error {e.response.status_code} for {url}")
        except httpx.RequestError as e:
            logger.warning(f"Request error for {url}: {e}")
        except Exception as e:
            logger.warning(f"Unexpected error fetching {url}: {e}")
        return None

    def extract_with_trafilatura(self, html: str, url: str) -> Optional[str]:
        try:
            extracted = trafilatura.extract(
                html,
                url=url,
                include_comments=False,
                include_tables=False,
                include_formatting=False,
                deduplicate=True,
                target_language='en',
            )
            if extracted and len(extracted.strip()) > 100:
                return extracted.strip()
        except Exception as e:
            logger.debug(f"Trafilatura extraction failed for {url}: {e}")
        return None

    def extract_with_bs4(self, html: str, url: str) -> Optional[str]:
        try:
            soup = BeautifulSoup(html, 'html.parser')

            for tag in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript', 'svg']):
                tag.decompose()

            article = soup.find('article')
            if article:
                text = article.get_text(separator='\n', strip=True)
                if len(text) > 100:
                    return text

            main = soup.find('main')
            if main:
                text = main.get_text(separator='\n', strip=True)
                if len(text) > 100:
                    return text

            candidates = soup.find_all(['div', 'section'], class_=re.compile(r'(content|article|post|body|entry)', re.I))
            for candidate in candidates:
                text = candidate.get_text(separator='\n', strip=True)
                if len(text) > 200:
                    return text

            body = soup.find('body')
            if body:
                text = body.get_text(separator='\n', strip=True)
                if len(text) > 300:
                    return text

        except Exception as e:
            logger.debug(f"BeautifulSoup extraction failed for {url}: {e}")
        return None

    def extract(self, url: str) -> tuple[Optional[str], ExtractionStatus]:
        html = self.fetch_html(url)
        if not html:
            return None, ExtractionStatus.FAILED

        body = self.extract_with_trafilatura(html, url)
        if body:
            return body, ExtractionStatus.SUCCESS

        body = self.extract_with_bs4(html, url)
        if body:
            return body, ExtractionStatus.FALLBACK

        return None, ExtractionStatus.FAILED


import re