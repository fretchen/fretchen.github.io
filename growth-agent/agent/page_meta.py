"""Fetch page metadata (title, description) from HTML meta tags."""

import re

import httpx

from agent.models import PageMeta

_DESCRIPTION_RE = re.compile(
    r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']',
    re.IGNORECASE,
)
_OG_DESCRIPTION_RE = re.compile(
    r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']*)["\']',
    re.IGNORECASE,
)
_TITLE_RE = re.compile(r"<title[^>]*>([^<]+)</title>", re.IGNORECASE)


def fetch_page_meta(url: str, client: httpx.Client | None = None) -> PageMeta | None:
    """Fetch a page and extract title + meta description from HTML.

    Args:
        url: Full URL to fetch.
        client: Optional reusable httpx.Client. A temporary one is created if not provided.

    Returns:
        PageMeta with title and description, or None on fetch error.
    """
    own_client = client is None
    if own_client:
        client = httpx.Client(timeout=15.0)

    try:
        resp = client.get(url, follow_redirects=True)
        resp.raise_for_status()
    except httpx.HTTPError:
        return None
    finally:
        if own_client:
            client.close()

    html = resp.text

    # Extract title
    title_match = _TITLE_RE.search(html)
    title = title_match.group(1).strip() if title_match else ""

    # Extract description: prefer name="description", fall back to og:description
    desc_match = _DESCRIPTION_RE.search(html)
    if not desc_match:
        desc_match = _OG_DESCRIPTION_RE.search(html)
    description = desc_match.group(1).strip() if desc_match else None

    return PageMeta(url=url, title=title, description=description)


def fetch_pages_meta(urls: list[str]) -> dict[str, PageMeta]:
    """Fetch metadata for multiple pages.

    Args:
        urls: List of full URLs to fetch.

    Returns:
        Dict mapping URL to PageMeta (only successful fetches included).
    """
    results = {}
    with httpx.Client(timeout=15.0) as client:
        for url in urls:
            meta = fetch_page_meta(url, client=client)
            if meta:
                results[url] = meta
    return results
