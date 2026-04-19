import asyncio
import json
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from models.schemas import PrepRequest, PrepResponse

app = FastAPI(title="AI Coffee Chat Prep Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# SSE helpers
# ---------------------------------------------------------------------------

def _sse(event: str, data: dict) -> str:
    """Format a single SSE frame."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _run_pipeline(req: PrepRequest) -> AsyncIterator[str]:
    """
    Drive the 6-agent pipeline and yield SSE frames as each stage completes.

    Stages
    ------
    1. Orchestrator plans the run
    2. Research + Resume parser  — parallel
    3. Skills match              — after resume parser (skipped if no JD)
    4. Synthesis
    5. Evaluation               — re-runs synthesis once if score < 0.7
    """
    # -- stage 1: orchestrator ------------------------------------------
    yield _sse("progress", {"stage": "orchestrator", "status": "running"})
    # from agents.orchestrator import run as orchestrator_run
    # plan = await orchestrator_run(req)
    yield _sse("progress", {"stage": "orchestrator", "status": "done"})

    # -- stage 2: research + resume parser (parallel) --------------------
    yield _sse("progress", {"stage": "research", "status": "running"})
    yield _sse("progress", {"stage": "resume_parser", "status": "running"})

    from agents.resume_parser import run as resume_parser_run
    # from agents.research import run as research_run

    # Research stub runs concurrently with resume parser once research agent exists.
    # For now only resume_parser is real; research is a placeholder coroutine.
    async def _research_stub():
        return None

    parsed_resume, _ = await asyncio.gather(
        resume_parser_run(req.resume_text, req.company),
        _research_stub(),
    )

    yield _sse("progress", {"stage": "research", "status": "done"})
    yield _sse("progress", {"stage": "resume_parser", "status": "done"})

    # -- stage 3: skills match (only if JD provided) ---------------------
    skills_match_brief = None
    if req.job_description:
        yield _sse("progress", {"stage": "skills_match", "status": "running"})
        # from agents.skills_match import run as skills_match_run
        # skills_match_brief = await skills_match_run(parsed_resume, req.job_description)
        yield _sse("progress", {"stage": "skills_match", "status": "done"})
    else:
        yield _sse("progress", {"stage": "skills_match", "status": "skipped"})

    # -- stage 4: synthesis ----------------------------------------------
    yield _sse("progress", {"stage": "synthesis", "status": "running"})
    # from agents.synthesis import run as synthesis_run
    # prep_response = await synthesis_run(research_brief, parsed_resume, skills_match_brief)
    yield _sse("progress", {"stage": "synthesis", "status": "done"})

    # -- stage 5: evaluation (one re-run allowed) ------------------------
    yield _sse("progress", {"stage": "evaluator", "status": "running"})
    # from agents.evaluator import run as evaluator_run
    # quality_score = await evaluator_run(prep_response)
    # if quality_score < 0.7:
    #     yield _sse("progress", {"stage": "synthesis", "status": "re-running"})
    #     prep_response = await synthesis_run(research_brief, parsed_resume, skills_match_brief)
    #     quality_score = await evaluator_run(prep_response)
    yield _sse("progress", {"stage": "evaluator", "status": "done"})

    # -- final result ----------------------------------------------------
    # Placeholder — replaced once synthesis + evaluator agents are wired in.
    # prep_response is a real PrepResponse object at that point.
    yield _sse("result", {"status": "pipeline_complete"})


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/prepare")
async def prepare(req: PrepRequest) -> StreamingResponse:
    """
    Main endpoint. Accepts a PrepRequest and streams SSE progress events
    followed by a final 'result' event containing a PrepResponse payload.
    """
    return StreamingResponse(
        _run_pipeline(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
