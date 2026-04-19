import json

from config import anthropic_client, CLAUDE_MODEL
from models.schemas import (
    PrepRequest,
    ResearchBrief,
    ParsedResume,
    SkillsMatchBrief,
    PrepResponse,
)
from utils.cost_logger import log_cost

_SYSTEM_PROMPT = """\
You are an expert networking coach trained in Steve Dalton's \
"The Two Hour Job Search" methodology. You generate \
hyper-personalized coffee chat prep using two frameworks:

FIT METHOD (Favorite → Insight → Transition):
- For each career stage in the user's resume, identify their \
favorite part, a genuine insight they gained, and what \
drove their transition to the next stage
- The final transition must connect naturally to \
"why this company"
- Output as bullet points, NOT a script

TIARA FRAMEWORK (Trends, Insights, Advice, Resources, Assignments):
- Generate 1-2 questions per category
- Every question must reference something SPECIFIC from \
company or person research
- Questions should feel genuinely curious, not like proof of stalking

STRICT RULES:
1. Company research must include real momentum signals — \
revenue, growth, recent product launches, AI investments
2. Person vibe assessment must be based on actual LinkedIn \
activity patterns, not assumptions
3. Connection points must reference SPECIFIC overlaps between \
the user's background and the person's career
4. Why This Company must follow Reason → Evidence → Connection
5. Call structure must include the Ben Franklin effect in \
wrap-up (ask permission to follow up, not ask for referral)
6. Follow-up messages must reference something SPECIFIC — \
never generic "great talking to you"
7. If skills match is provided, weave matched skills \
naturally into FIT stages and Why This Company\
"""

# ---------------------------------------------------------------------------
# Tool schema — Claude fills this in, we parse it as PrepResponse
# ---------------------------------------------------------------------------

_TOOL = {
    "name": "generate_prep",
    "description": (
        "Generate the full coffee chat prep guide following the FIT method "
        "and TIARA framework. Call this tool with the complete structured output."
    ),
    "input_schema": {
        "type": "object",
        "required": [
            "company_research",
            "person_research",
            "fit_intro",
            "why_this_company",
            "tiara_questions",
            "call_structure",
            "followup_messages",
            "skills_match_score",
            "quality_score",
        ],
        "properties": {
            "company_research": {
                "type": "object",
                "required": ["what_they_do", "current_momentum", "future_initiatives", "engineering_culture", "key_challenges"],
                "properties": {
                    "what_they_do":          {"type": "string"},
                    "current_momentum":      {"type": "string"},
                    "future_initiatives":    {"type": "string"},
                    "engineering_culture":   {"type": "string"},
                    "key_challenges":        {"type": "array", "items": {"type": "string"}},
                },
            },
            "person_research": {
                "type": "object",
                "required": ["current_role", "career_path", "interests_and_focus", "vibe", "connection_points"],
                "properties": {
                    "current_role":         {"type": "string"},
                    "career_path":          {"type": "string"},
                    "interests_and_focus":  {"type": "string"},
                    "vibe":                 {"type": "string"},
                    "connection_points":    {"type": "array", "items": {"type": "string"}},
                },
            },
            "fit_intro": {
                "type": "object",
                "required": ["stages", "why_this_company"],
                "properties": {
                    "stages": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["stage", "favorite", "insight", "transition"],
                            "properties": {
                                "stage":      {"type": "string"},
                                "favorite":   {"type": "string"},
                                "insight":    {"type": "string"},
                                "transition": {"type": "string"},
                            },
                        },
                    },
                    "why_this_company": {"type": "string"},
                },
            },
            "why_this_company": {
                "type": "object",
                "required": ["reason", "evidence", "connection"],
                "properties": {
                    "reason":     {"type": "string"},
                    "evidence":   {"type": "string"},
                    "connection": {"type": "string"},
                },
            },
            "tiara_questions": {
                "type": "object",
                "required": ["trends", "insights", "advice", "resources", "assignments"],
                "properties": {
                    "trends":      {"type": "array", "items": {"type": "string"}},
                    "insights":    {"type": "array", "items": {"type": "string"}},
                    "advice":      {"type": "array", "items": {"type": "string"}},
                    "resources":   {"type": "array", "items": {"type": "string"}},
                    "assignments": {"type": "array", "items": {"type": "string"}},
                },
            },
            "call_structure": {
                "type": "object",
                "required": ["small_talk", "transition_phrase", "active_listening_cues", "wrap_up"],
                "properties": {
                    "small_talk":              {"type": "array", "items": {"type": "string"}},
                    "transition_phrase":       {"type": "string"},
                    "active_listening_cues":   {"type": "array", "items": {"type": "string"}},
                    "wrap_up":                 {"type": "array", "items": {"type": "string"}},
                },
            },
            "followup_messages": {
                "type": "object",
                "required": ["thank_you", "application_nudge"],
                "properties": {
                    "thank_you":         {"type": "string"},
                    "application_nudge": {"type": "string"},
                },
            },
            "skills_match_score": {"type": ["number", "null"]},
            "quality_score":      {"type": "number"},
        },
    },
}


# ---------------------------------------------------------------------------
# Agent entry point
# ---------------------------------------------------------------------------

async def run(
    request: PrepRequest,
    research_brief: ResearchBrief,
    parsed_resume: ParsedResume,
    skills_match: SkillsMatchBrief | None,
) -> PrepResponse:
    """
    Synthesize all research and resume data into a full PrepResponse
    using the FIT method and TIARA framework via Claude tool-calling.
    """
    # Build skills section only when JD was provided
    if skills_match:
        skills_section = (
            f"SKILLS MATCH (score: {skills_match.match_score:.0%}):\n"
            f"Matched skills: {', '.join(skills_match.matched_skills)}\n"
            f"Gaps to be aware of: {', '.join(skills_match.gaps)}"
        )
    else:
        skills_section = "(No job description provided — skip skills match references)"

    user_message = f"""\
MEETING INFO:
Person: {request.person_name}
Company: {request.company}

RESEARCH DATA:
Person summary: {research_brief.person_summary}
Company summary: {research_brief.company_summary}
Recent news: {chr(10).join(f'- {n}' for n in research_brief.recent_news)}
Talking angles: {chr(10).join(f'- {a}' for a in research_brief.talking_angles)}

MY RESUME:
Skills: {', '.join(parsed_resume.skills)}
Experience:
{chr(10).join(f'- {e}' for e in parsed_resume.relevant_experiences)}
Projects:
{chr(10).join(f'- {p}' for p in parsed_resume.relevant_projects)}

{skills_section}

Generate the full coffee chat prep guide following the FIT method and TIARA \
framework exactly as specified. Write in first person as if I am going into \
this meeting.\
"""

    response = await anthropic_client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        system=_SYSTEM_PROMPT,
        tools=[_TOOL],
        tool_choice={"type": "tool", "name": "generate_prep"},
        messages=[{"role": "user", "content": user_message}],
    )

    log_cost(
        agent_name="synthesis",
        model=CLAUDE_MODEL,
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens,
    )

    # Extract the tool call arguments — tool_choice forces exactly one call
    tool_block = next(b for b in response.content if b.type == "tool_use")
    return PrepResponse(**tool_block.input)
