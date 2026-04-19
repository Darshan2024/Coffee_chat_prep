import asyncio
import json

from config import deepseek_client, DEEPSEEK_MODEL
from models.schemas import ResearchBrief
from tools.web_scraper import scrape_linkedin, scrape_company, scrape_news
from utils.cost_logger import log_cost

_SYSTEM_PROMPT = """\
You are a research assistant preparing someone for a coffee chat.
Return ONLY valid JSON with exactly these keys:
{
  "person_summary": "...",
  "company_summary": "...",
  "recent_news": ["...", "..."],
  "talking_angles": ["...", "...", "..."]
}

Rules:
- person_summary: 3-4 sentences on the person's background, role, and known interests
- company_summary: 2-3 sentences on what the company does and its current focus areas
- recent_news: up to 5 recent headlines or developments (strings), empty list if none
- talking_angles: 3-5 SPECIFIC, non-generic conversation angles — reference actual projects,
  initiatives, published writing, or public statements. Avoid generic angles like
  "ask about their career journey". Each angle should be a full sentence.
- Return only the JSON object, no markdown, no explanation
"""


async def run(
    person_name: str,
    company: str,
    linkedin_url: str | None = None,
) -> ResearchBrief:
    """
    Scrape LinkedIn, company site, and news in parallel, then synthesize
    into a ResearchBrief via DeepSeek.
    """
    # -- parallel scraping --------------------------------------------------
    linkedin_text, company_text, news_items = await asyncio.gather(
        scrape_linkedin(linkedin_url or ""),
        scrape_company(company),
        scrape_news(person_name, company),
    )

    scraped_data = (
        f"=== LinkedIn Profile ===\n{linkedin_text}\n\n"
        f"=== Company Website ===\n{company_text}\n\n"
        f"=== Recent News ===\n" + "\n".join(f"- {n}" for n in news_items)
    )

    user_prompt = (
        f"You are a research assistant preparing someone for a coffee chat. "
        f"Given the following raw data about {person_name} at {company}, "
        f"synthesize a concise research brief. Focus on finding genuine talking angles "
        f"— specific projects, initiatives, or interests that would make for a "
        f"non-generic conversation.\n\nRaw data:\n{scraped_data}"
    )

    # -- DeepSeek synthesis -------------------------------------------------
    response = await deepseek_client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )

    usage = response.usage
    log_cost(
        agent_name="research",
        model=DEEPSEEK_MODEL,
        input_tokens=usage.prompt_tokens,
        output_tokens=usage.completion_tokens,
    )

    raw = json.loads(response.choices[0].message.content)
    return ResearchBrief(**raw)
