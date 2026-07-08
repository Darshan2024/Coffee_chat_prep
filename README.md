# Coffee Chat Prep — AI-Powered Networking Assistant

An agentic pipeline that turns a name, company, and resume into a fully personalized coffee chat prep guide in ~2 minutes. Built on the FIT method and TIARA framework from Steve Dalton's *The Two Hour Job Search*.

## What it generates

- **Company research** — what they do, current momentum, future initiatives, engineering culture, key challenges
- **Person research** — career path, interests, communication vibe, connection points to your background
- **FIT intro** — your career story stage by stage (Favorite → Insight → Transition), ending in a natural "why this company" bridge
- **Why This Company** — Reason → Evidence → Connection, grounded in your actual experience
- **10 TIARA questions** — 2 per category (Trends, Insights, Advice, Resources, Assignments), each tied to specific company or person details
- **Call structure** — small talk openers, transition phrase, active listening cues, wrap-up with Ben Franklin ask
- **Follow-up messages** — thank-you note and application nudge, both specific to the conversation context

## Architecture

```
frontend/          React + Vite + Tailwind CSS
backend/
  main.py          FastAPI — multipart form, SSE streaming, /generate-facts endpoint
  agents/
    orchestrator   Drives the full 6-agent pipeline
    research       Scrapes LinkedIn, company site, Google News in parallel
    resume_parser  Extracts skills + experience from PDF or pasted text
    skills_match   Scores resume against job description (optional)
    synthesis      Generates full prep guide via Claude tool-calling
    evaluator      Scores output for specificity, triggers rerun if too generic
  tools/
    web_scraper    httpx scrapers with graceful fallbacks for LinkedIn blocks
  models/
    schemas.py     Pydantic v2 schemas for all agent I/O
  utils/
    cost_logger    Tracks token usage and USD cost per agent per run
```

**Models used:**
- Claude Sonnet — synthesis and evaluation (tool-calling for structured output)
- Claude Haiku — loading screen facts generation (fast, ~$0.001/call)
- DeepSeek — research summarization and resume parsing (cost-efficient)

**Key patterns:**
- `tool_choice: {"type": "tool"}` forces structured JSON output from every Claude call
- SSE streaming shows live pipeline progress in the frontend
- Evaluator scores each section 0–1 for specificity; auto-reruns synthesis with targeted feedback if any section is too generic
- All `PrepResponse` sections are `Optional` with `missing_sections()` detection and automatic retry

## Running locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- API keys: `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
echo "DEEPSEEK_API_KEY=sk-..." >> .env

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

## Usage

1. Enter the person's name and company
2. Optionally paste their LinkedIn URL
3. Upload your resume PDF (or paste text)
4. Optionally paste the job description for skills match scoring
5. Hit **Generate my prep guide** — the pipeline takes ~2 minutes
6. Browse your personalized results, copy any section with one click

## Screenshots

**1. Fill in who you're meeting**

![Input form](screenshots/01-input-form.png)

**2. Watch the pipeline run live** — SSE progress updates as each agent finishes, with rotating facts and framework insights while you wait

| Researching | Parsing + facts | Synthesizing + insights |
|---|---|---|
| ![Progress: researching](screenshots/02-progress-researching.png) | ![Progress: facts card](screenshots/03-progress-facts.png) | ![Progress: framework insight](screenshots/04-progress-insight.png) |

**3. Get your personalized guide** — company + person research, FIT intro, Why This Company, TIARA questions, call structure, and follow-up messages, each with a copy button, plus quality/skills-match scores at the bottom

![Results dashboard](screenshots/05-results-dashboard.png)

## Pipeline flow

```
form submit
    │
    ├─ research agent ──────────┐  (parallel)
    └─ resume parser ───────────┤
                                ▼
                       skills match (if JD provided)
                                │
                                ▼
                          synthesis agent
                         (FIT + TIARA output)
                                │
                                ▼
                         evaluator agent
                       (specificity scoring)
                                │
                    ┌───────────┴───────────┐
                  pass                  rerun once
                    │                       │
                    └───────────┬───────────┘
                                ▼
                         final results
```

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Inter font |
| Backend | FastAPI, Python 3.11, asyncio |
| AI — synthesis/eval | Claude Sonnet (Anthropic SDK) |
| AI — facts | Claude Haiku |
| AI — research/parsing | DeepSeek (OpenAI-compatible SDK) |
| PDF extraction | pdfplumber |
| Web scraping | httpx, feedparser |
| Streaming | Server-Sent Events (SSE) |

## Cost per run

| Agent | Model | Approx. cost |
|---|---|---|
| Research | DeepSeek | ~$0.002 |
| Resume parser | DeepSeek | ~$0.001 |
| Skills match | DeepSeek | ~$0.001 |
| Synthesis | Claude Sonnet | ~$0.015 |
| Evaluator | Claude Sonnet | ~$0.008 |
| Loading facts | Claude Haiku | ~$0.001 |
| **Total** | | **~$0.03/run** |

## Known limitations

- LinkedIn blocks automated scraping (HTTP 999) — person research falls back to company site + news data when this happens
- Prep guide quality is directly tied to how much public information exists about the person and company

---

Based on *The Two Hour Job Search* by Steve Dalton · Built with Claude + DeepSeek
