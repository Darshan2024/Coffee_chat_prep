import json

from config import deepseek_client, DEEPSEEK_MODEL
from models.schemas import ParsedResume
from utils.cost_logger import log_cost

_SYSTEM_PROMPT = """\
You are a resume parser. Extract structured information from the resume text provided.
Return ONLY valid JSON with exactly these keys:
{
  "skills": [...],
  "relevant_experiences": [...],
  "relevant_projects": [...]
}

Rules:
- skills: technical and soft skills as short strings (e.g. "Python", "System Design")
- relevant_experiences: 2-4 sentence descriptions of past roles most relevant to the target company
- relevant_projects: 2-4 sentence descriptions of projects most relevant to the target company
- Prioritize relevance to the target company over recency
- Return only the JSON object, no markdown, no explanation
"""


async def run(resume_text: str, company: str) -> ParsedResume:
    """
    Parse a raw resume string into structured fields filtered for relevance
    to the target company.
    """
    user_prompt = (
        f"Target company: {company}\n\n"
        f"Resume:\n{resume_text}"
    )

    response = await deepseek_client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,  # low temp — we want consistent extraction, not creativity
    )

    usage = response.usage
    log_cost(
        agent_name="resume_parser",
        model=DEEPSEEK_MODEL,
        input_tokens=usage.prompt_tokens,
        output_tokens=usage.completion_tokens,
    )

    raw = json.loads(response.choices[0].message.content)
    return ParsedResume(**raw)
