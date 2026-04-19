import json

from config import deepseek_client, DEEPSEEK_MODEL
from models.schemas import ParsedResume, SkillsMatchBrief
from utils.cost_logger import log_cost

_SYSTEM_PROMPT = """\
You are a skills matching assistant. Compare a parsed resume against a job description.
Return ONLY valid JSON with exactly these keys:
{
  "match_score": 0.0,
  "matched_skills": [],
  "gaps": []
}

Rules:
- match_score: float 0.0-1.0 representing how well the resume matches the JD
- matched_skills: skills from the resume that directly match JD requirements
- gaps: skills the JD requires that are missing or weak in the resume
- Be precise — partial matches (e.g. "AWS Lambda" matching "AWS") count as matched
- Return only the JSON object, no markdown, no explanation
"""


async def run(parsed_resume: ParsedResume, job_description: str) -> SkillsMatchBrief:
    """
    Compare parsed resume skills/experience against a job description.
    Only called when a JD is provided.
    """
    user_prompt = (
        f"Job Description:\n{job_description}\n\n"
        f"Candidate Skills: {', '.join(parsed_resume.skills)}\n"
        f"Candidate Experience:\n"
        + "\n".join(f"- {e}" for e in parsed_resume.relevant_experiences)
        + "\n\nCandidate Projects:\n"
        + "\n".join(f"- {p}" for p in parsed_resume.relevant_projects)
    )

    response = await deepseek_client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
    )

    usage = response.usage
    log_cost(
        agent_name="skills_match",
        model=DEEPSEEK_MODEL,
        input_tokens=usage.prompt_tokens,
        output_tokens=usage.completion_tokens,
    )

    raw = json.loads(response.choices[0].message.content)
    # LLMs sometimes return score as 0-100 instead of 0-1 — normalize it
    if raw.get("match_score", 0) > 1.0:
        raw["match_score"] = raw["match_score"] / 100.0
    return SkillsMatchBrief(**raw)
