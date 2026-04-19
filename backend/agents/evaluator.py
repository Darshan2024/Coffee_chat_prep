from config import anthropic_client, CLAUDE_MODEL
from models.schemas import (
    PrepRequest,
    PrepResponse,
    ResearchBrief,
    EvaluationResult,
    SectionScore,
)
from utils.cost_logger import log_cost

_SYSTEM_PROMPT = """\
You are a strict quality evaluator for coffee chat prep material. You evaluate \
output generated using the FIT method and TIARA framework from \
"The Two Hour Job Search".

You are checking for ONE thing above all else: SPECIFICITY.
Generic output that could apply to any company or person is a failure. \
Specific output grounded in real research is a pass.

Evaluation criteria per section:

COMPANY RESEARCH (score 0-1):
- 1.0: Includes specific revenue/growth signals, named product launches, \
real AI initiatives, concrete engineering challenges
- 0.7: Mostly specific with minor generic statements
- 0.5: Mix of specific and generic
- 0.0: Could describe any tech company

PERSON RESEARCH (score 0-1):
- 1.0: Vibe is based on actual evidence (post frequency, writing style, topics), \
connection points are specific overlaps not surface-level
- 0.7: Mostly evidence-based with some assumptions
- 0.5: Vibe is assumed, connection points are generic
- 0.0: Could describe any engineer at any company

FIT INTRO (score 0-1):
- 1.0: Each stage has a genuine specific favorite, real insight, and logical \
transition. Final transition naturally leads to this company specifically
- 0.7: Most stages strong, one or two weak transitions
- 0.5: Stages feel scripted or generic
- 0.0: Could be any person's intro

TIARA QUESTIONS (score 0-1):
- 1.0: Every question references specific company initiative or person background. \
Feels genuinely curious
- 0.7: Most questions specific, 1-2 slightly generic
- 0.5: Questions could be asked to anyone at this company
- 0.0: Generic questions that require no research

FOLLOW-UP MESSAGES (score 0-1):
- 1.0: References something specific from the conversation context, \
application nudge is natural not pushy
- 0.7: Mostly specific with minor generic phrases
- 0.5: Generic pleasantries with one specific touch
- 0.0: Pure template, could be sent to anyone

If needs_rerun is True, rerun_feedback must be:
- Specific about WHICH sections failed
- Clear about WHAT was generic and WHY
- Actionable instructions for the synthesis agent to fix it\
"""

_TOOL = {
    "name": "submit_evaluation",
    "description": "Submit the structured quality evaluation of the coffee chat prep output.",
    "input_schema": {
        "type": "object",
        "required": [
            "company_research_score",
            "person_research_score",
            "fit_intro_score",
            "tiara_score",
            "followup_score",
            "overall_score",
            "needs_rerun",
            "rerun_feedback",
        ],
        "properties": {
            "company_research_score": {
                "type": "object",
                "required": ["score", "feedback", "passed"],
                "properties": {
                    "score":    {"type": "number"},
                    "feedback": {"type": "string"},
                    "passed":   {"type": "boolean"},
                },
            },
            "person_research_score": {
                "type": "object",
                "required": ["score", "feedback", "passed"],
                "properties": {
                    "score":    {"type": "number"},
                    "feedback": {"type": "string"},
                    "passed":   {"type": "boolean"},
                },
            },
            "fit_intro_score": {
                "type": "object",
                "required": ["score", "feedback", "passed"],
                "properties": {
                    "score":    {"type": "number"},
                    "feedback": {"type": "string"},
                    "passed":   {"type": "boolean"},
                },
            },
            "tiara_score": {
                "type": "object",
                "required": ["score", "feedback", "passed"],
                "properties": {
                    "score":    {"type": "number"},
                    "feedback": {"type": "string"},
                    "passed":   {"type": "boolean"},
                },
            },
            "followup_score": {
                "type": "object",
                "required": ["score", "feedback", "passed"],
                "properties": {
                    "score":    {"type": "number"},
                    "feedback": {"type": "string"},
                    "passed":   {"type": "boolean"},
                },
            },
            "overall_score":   {"type": "number"},
            "needs_rerun":     {"type": "boolean"},
            "rerun_feedback":  {"type": "string", "description": "Required when needs_rerun is true — specific actionable instructions for the synthesis agent."},
        },
    },
}


async def run(
    prep_response: PrepResponse,
    request: PrepRequest,
    research_brief: ResearchBrief,
    rerun_count: int = 0,
) -> tuple[EvaluationResult, PrepResponse]:
    """
    Evaluate a PrepResponse for specificity and quality.

    Returns (EvaluationResult, PrepResponse) where PrepResponse has
    quality_score updated. If needs_rerun is True AND rerun_count < 1,
    the caller should re-run synthesis with rerun_feedback injected.
    If rerun_count >= 1, returns as-is regardless of score (max one rerun).
    """
    user_message = f"""\
ORIGINAL REQUEST:
Person: {request.person_name} at {request.company}

RESEARCH DATA AVAILABLE:
Person summary: {research_brief.person_summary}
Company summary: {research_brief.company_summary}
Recent news: {chr(10).join(f'- {n}' for n in research_brief.recent_news)}
Talking angles: {chr(10).join(f'- {a}' for a in research_brief.talking_angles)}

PREP RESPONSE TO EVALUATE:
Company Research: {prep_response.company_research.model_dump_json(indent=2)}
Person Research: {prep_response.person_research.model_dump_json(indent=2)}
FIT Intro: {prep_response.fit_intro.model_dump_json(indent=2)}
TIARA Questions: {prep_response.tiara_questions.model_dump_json(indent=2)}
Follow-up Messages: {prep_response.followup_messages.model_dump_json(indent=2) if prep_response.followup_messages else "(missing)"}

Evaluate each section strictly. Flag any statement that could apply to a \
company or person other than {request.person_name} at {request.company}.\
"""

    response = await anthropic_client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        system=_SYSTEM_PROMPT,
        tools=[_TOOL],
        tool_choice={"type": "tool", "name": "submit_evaluation"},
        messages=[{"role": "user", "content": user_message}],
    )

    log_cost(
        agent_name="evaluator",
        model=CLAUDE_MODEL,
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens,
    )

    tool_block = next(b for b in response.content if b.type == "tool_use")
    evaluation = EvaluationResult(**tool_block.input)

    # If Claude said needs_rerun but forgot rerun_feedback, supply a generic instruction
    if evaluation.needs_rerun and not evaluation.rerun_feedback.strip():
        evaluation = evaluation.model_copy(update={
            "rerun_feedback": "Output was too generic. Add more specific details referencing actual company initiatives, person background, and candidate's real experience."
        })

    # Force needs_rerun=False if we've already rerun once (max one rerun)
    if rerun_count >= 1 and evaluation.needs_rerun:
        evaluation = evaluation.model_copy(update={
            "needs_rerun": False,
            "rerun_feedback": evaluation.rerun_feedback + " [Rerun limit reached — returning as-is]",
        })

    # Write quality score back into the PrepResponse
    prep_response = PrepResponse(
        **{**prep_response.model_dump(), "quality_score": evaluation.overall_score}
    )

    return evaluation, prep_response
