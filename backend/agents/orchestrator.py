import asyncio
from typing import Callable, Awaitable

from models.schemas import PrepRequest, PrepResponse
from utils.cost_logger import reset_session_cost

import agents.research as research_agent
import agents.resume_parser as resume_parser_agent
import agents.skills_match as skills_match_agent
import agents.synthesis as synthesis_agent
import agents.evaluator as evaluator_agent

# Type alias for the SSE progress callback
ProgressCallback = Callable[[str], Awaitable[None]]


async def run(request: PrepRequest, progress_callback: ProgressCallback) -> PrepResponse:
    """
    Top-level orchestrator. Drives the full 6-agent pipeline in the
    correct order, calls progress_callback after each stage for SSE streaming.
    """
    reset_session_cost()

    # ------------------------------------------------------------------
    # STEP 1 — Research + Resume parser in parallel
    # ------------------------------------------------------------------
    research_brief, parsed_resume = await asyncio.gather(
        research_agent.run(request.person_name, request.company, request.linkedin_url),
        resume_parser_agent.run(request.resume_text, request.company),
    )

    await progress_callback(f"Researched {request.person_name} and {request.company}...")
    await progress_callback("Parsed your resume and extracted relevant experience...")

    # ------------------------------------------------------------------
    # STEP 2 — Skills match (only if JD provided)
    # ------------------------------------------------------------------
    skills_match = None
    if request.job_description:
        skills_match = await skills_match_agent.run(parsed_resume, request.job_description)
        await progress_callback("Matched your skills against the job description...")

    # ------------------------------------------------------------------
    # STEP 3 — Synthesis
    # ------------------------------------------------------------------
    prep_response = await synthesis_agent.run(
        request, research_brief, parsed_resume, skills_match
    )
    await progress_callback("Generated your personalized prep guide...")

    # ------------------------------------------------------------------
    # STEP 4 — Evaluation + optional single rerun
    # ------------------------------------------------------------------
    evaluation, prep_response = await evaluator_agent.run(
        prep_response, request, research_brief, rerun_count=0
    )

    if evaluation.needs_rerun:
        await progress_callback(
            "Quality check failed — regenerating for more specificity..."
        )
        prep_response = await synthesis_agent.run(
            request,
            research_brief,
            parsed_resume,
            skills_match,
            rerun_feedback=evaluation.rerun_feedback,
        )
        evaluation, prep_response = await evaluator_agent.run(
            prep_response, request, research_brief, rerun_count=1
        )
        await progress_callback(
            f"Final quality check passed (score: {evaluation.overall_score:.0%})..."
        )
    else:
        await progress_callback(
            f"Quality check passed (score: {evaluation.overall_score:.0%})..."
        )

    # ------------------------------------------------------------------
    # STEP 5 — Return final response with quality score written in
    # ------------------------------------------------------------------
    return prep_response
