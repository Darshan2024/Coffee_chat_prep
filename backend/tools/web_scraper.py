"""
Web scraping utilities used by the Research agent.
All functions return plain text — no HTML leaks downstream.
"""

from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

# Shared headers that look like a real browser visit
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

_TIMEOUT = 10.0  # seconds


def _clean(soup: BeautifulSoup) -> str:
    """Strip scripts/styles and return normalized text."""
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return " ".join(soup.get_text(separator=" ").split())


# ---------------------------------------------------------------------------
# 1. LinkedIn profile scraper
# ---------------------------------------------------------------------------

async def scrape_linkedin(url: str) -> str:
    """
    Attempt to fetch a LinkedIn profile page and return cleaned text.
    LinkedIn aggressively blocks bots, so a graceful fallback is returned
    instead of raising — the research agent handles missing data fine.
    """
    if not url:
        return "[LinkedIn URL not provided]"

    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(url)

        if resp.status_code in (999, 403, 429, 401):
            return (
                f"[LinkedIn blocked the request (HTTP {resp.status_code}). "
                "Use manual profile summary or a LinkedIn API integration.]"
            )

        if resp.status_code != 200:
            return f"[LinkedIn fetch failed: HTTP {resp.status_code}]"

        soup = BeautifulSoup(resp.text, "html.parser")

        # LinkedIn's public profile renders key sections in these selectors
        sections = []
        for selector in [
            "h1",                          # name
            ".text-body-medium",           # headline
            ".core-section-container",     # about, experience, education
            ".pv-about-section",
            ".experience-section",
        ]:
            for el in soup.select(selector):
                text = el.get_text(separator=" ").strip()
                if text:
                    sections.append(text)

        result = " | ".join(sections) if sections else _clean(soup)
        return result[:4000]  # cap to avoid blowing token budget

    except httpx.RequestError as exc:
        return f"[LinkedIn scrape error: {exc}]"


# ---------------------------------------------------------------------------
# 2. Company about-page scraper
# ---------------------------------------------------------------------------

async def scrape_company(company_name: str) -> str:
    """
    Fetch {company}.com/about and return cleaned paragraph text.
    Falls back to homepage if /about returns non-200.
    """
    slug = company_name.lower().replace(" ", "")
    urls_to_try = [
        f"https://www.{slug}.com/about",
        f"https://www.{slug}.com/company/about",
        f"https://www.{slug}.com",
    ]

    async with httpx.AsyncClient(headers=_HEADERS, timeout=_TIMEOUT, follow_redirects=True) as client:
        for url in urls_to_try:
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    # Prefer paragraph text — most about pages are paragraph-heavy
                    paragraphs = [p.get_text(separator=" ").strip() for p in soup.find_all("p")]
                    paragraphs = [p for p in paragraphs if len(p) > 60]  # skip nav noise
                    if paragraphs:
                        return " ".join(paragraphs)[:4000]
                    return _clean(soup)[:4000]
            except httpx.RequestError:
                continue

    return f"[Could not scrape {company_name} website]"


# ---------------------------------------------------------------------------
# 3. Google News RSS scraper
# ---------------------------------------------------------------------------

async def scrape_news(person_name: str, company: str) -> list[str]:
    """
    Query Google News RSS for recent articles about person + company.
    Returns up to 5 headline + snippet strings.
    """
    query = quote_plus(f"{person_name} {company}")
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(rss_url)
        resp.raise_for_status()
    except httpx.RequestError as exc:
        return [f"[News fetch error: {exc}]"]

    import feedparser  # lazy import — only needed here
    feed = feedparser.parse(resp.text)

    results = []
    for entry in feed.entries[:5]:
        title = entry.get("title", "").strip()
        summary = BeautifulSoup(entry.get("summary", ""), "html.parser").get_text().strip()
        snippet = f"{title} — {summary}" if summary and summary != title else title
        if snippet:
            results.append(snippet[:300])

    return results if results else [f"[No recent news found for {person_name} at {company}]"]
