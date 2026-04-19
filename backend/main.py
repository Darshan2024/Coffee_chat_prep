import asyncio
import io
import json
import time
import uuid
from asyncio import Queue

import pdfplumber
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from models.schemas import PrepRequest, PrepResponse
from utils.cost_logger import get_session_cost

app = FastAPI(title="AI Coffee Chat Prep Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store
_jobs: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def _pdf_to_text(upload: UploadFile) -> str:
    pdf_bytes = await upload.read()
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)


def _start_job(request: PrepRequest) -> tuple[str, Queue]:
    job_id = str(uuid.uuid4())
    queue: Queue = Queue()
    _jobs[job_id] = {"status": "processing", "messages": queue, "result": None, "error": None}

    async def _run():
        from agents.orchestrator import run as orchestrator_run

        async def _progress(message: str) -> None:
            await queue.put({"status": "progress", "message": message})

        try:
            result = await orchestrator_run(request, _progress)
            _jobs[job_id]["result"] = result
            _jobs[job_id]["status"] = "complete"
            await queue.put({"status": "complete", "result": result.model_dump()})
        except Exception as exc:
            _jobs[job_id]["status"] = "error"
            _jobs[job_id]["error"] = str(exc)
            await queue.put({"status": "error", "message": str(exc)})
        finally:
            await queue.put(None)  # sentinel

    asyncio.create_task(_run())
    return job_id, queue


# ---------------------------------------------------------------------------
# POST /prep  — multipart form (PDF upload path)
# ---------------------------------------------------------------------------

@app.post("/prep")
async def prep_async(
    person_name: str = Form(...),
    company: str = Form(...),
    linkedin_url: str = Form(None),
    resume_file: UploadFile = File(None),
    resume_text: str = Form(None),
    job_description: str = Form(None),
) -> dict:
    """
    Kick off the full pipeline in the background.
    Accepts multipart form (PDF) or plain form (text fallback).
    Returns { job_id } immediately.
    """
    if resume_file:
        text = await _pdf_to_text(resume_file)
    elif resume_text:
        text = resume_text
    else:
        raise HTTPException(status_code=422, detail="resume_file or resume_text is required")

    request = PrepRequest(
        person_name=person_name,
        company=company,
        linkedin_url=linkedin_url or None,
        resume_text=text,
        job_description=job_description or None,
    )
    job_id, _ = _start_job(request)
    return {"job_id": job_id}


# ---------------------------------------------------------------------------
# POST /prep/json  — JSON body (kept for test scripts / curl)
# ---------------------------------------------------------------------------

@app.post("/prep/json")
async def prep_async_json(request: PrepRequest) -> dict:
    job_id, _ = _start_job(request)
    return {"job_id": job_id}


# ---------------------------------------------------------------------------
# GET /prep/stream/{job_id}  — SSE stream
# ---------------------------------------------------------------------------

@app.get("/prep/stream/{job_id}")
async def prep_stream(job_id: str) -> StreamingResponse:
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    async def _event_stream():
        queue: Queue = _jobs[job_id]["messages"]
        while True:
            msg = await queue.get()
            if msg is None:
                break
            yield _sse(msg)

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# POST /prep/sync  — blocking (test endpoint, JSON body)
# ---------------------------------------------------------------------------

@app.post("/prep/sync")
async def prep_sync(request: PrepRequest) -> dict:
    from agents.orchestrator import run as orchestrator_run

    messages: list[str] = []
    start = time.perf_counter()

    async def _progress(message: str) -> None:
        messages.append(message)
        print(f"  [progress] {message}")

    result = await orchestrator_run(request, _progress)
    elapsed = time.perf_counter() - start
    total_cost = get_session_cost()

    return {
        "result": result.model_dump(),
        "meta": {
            "total_cost_usd": round(total_cost, 6),
            "elapsed_seconds": round(elapsed, 2),
            "quality_score": result.quality_score,
            "skills_match_score": result.skills_match_score,
            "progress_log": messages,
        },
    }


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# print_summary helper — used by test scripts
# ---------------------------------------------------------------------------

def print_summary(result: PrepResponse, meta: dict) -> None:
    def _head(text: str, n: int = 120) -> str:
        return (text[:n] + "...") if len(text) > n else text

    divider = "=" * 60

    print(f"\n{divider}")
    print("COFFEE CHAT PREP SUMMARY")
    print(divider)

    print(f"\n[Company Research]")
    print(f"  What they do:     {_head(result.company_research.what_they_do)}")
    print(f"  Momentum:         {_head(result.company_research.current_momentum)}")
    print(f"  Future:           {_head(result.company_research.future_initiatives)}")
    print(f"  Engineering:      {_head(result.company_research.engineering_culture)}")

    print(f"\n[Person Research]")
    print(f"  Current role:     {_head(result.person_research.current_role)}")
    print(f"  Vibe:             {_head(result.person_research.vibe)}")
    print(f"  Connection pts:   {_head(str(result.person_research.connection_points))}")

    print(f"\n[FIT Intro - {len(result.fit_intro.stages)} stages]")
    for s in result.fit_intro.stages:
        print(f"  Stage: {s.stage}")
        print(f"    Favorite:   {_head(s.favorite, 80)}")
        print(f"    Transition: {_head(s.transition, 80)}")

    print(f"\n[Why This Company]")
    print(f"  Reason:     {_head(result.why_this_company.reason)}")
    print(f"  Evidence:   {_head(result.why_this_company.evidence)}")
    print(f"  Connection: {_head(result.why_this_company.connection)}")

    print(f"\n[TIARA - sample]")
    for category, questions in [
        ("Trends",   result.tiara_questions.trends),
        ("Insights", result.tiara_questions.insights),
        ("Advice",   result.tiara_questions.advice),
    ]:
        for q in questions[:1]:
            print(f"  [{category}] {_head(q)}")

    print(f"\n[Follow-up Messages]")
    print(f"  Thank you:  {_head(result.followup_messages.thank_you)}")
    print(f"  App nudge:  {_head(result.followup_messages.application_nudge)}")

    print(f"\n{divider}")
    print("PIPELINE METADATA")
    print(divider)
    print(f"  Quality score:      {meta['quality_score']:.2f}")
    print(f"  Skills match score: {meta['skills_match_score']}")
    print(f"  Total cost (USD):   ${meta['total_cost_usd']:.6f}")
    print(f"  Total time:         {meta['elapsed_seconds']}s")
    print(f"\n  Progress log:")
    for msg in meta["progress_log"]:
        print(f"    - {msg}")
    print()
