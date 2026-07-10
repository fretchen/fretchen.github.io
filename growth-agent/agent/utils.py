"""Shared utilities for the growth agent."""

from urllib.parse import urlsplit, urlunsplit


def normalize_url(url: str) -> str:
    """Canonicalize a URL: lowercase scheme/host, ensure trailing slash on non-root paths.

    Also strips query/fragment.
    """
    parts = urlsplit(url.strip())
    path = parts.path or "/"
    if path != "/" and not path.endswith("/"):
        path = path + "/"
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, "", ""))
