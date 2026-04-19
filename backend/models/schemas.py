from pydantic import BaseModel


class PrepRequest(BaseModel):
    person_name: str
    company: str
    linkedin_url: str | None = None
    resume_text: str
    job_description: str | None = None


class ParsedResume(BaseModel):
    skills: list[str]
    relevant_experiences: list[str]
    relevant_projects: list[str]


class SkillsMatchBrief(BaseModel):
    match_score: float  # 0-1
    matched_skills: list[str]
    gaps: list[str]


class ResearchBrief(BaseModel):
    person_summary: str
    company_summary: str
    recent_news: list[str]
    talking_angles: list[str]


class FITStage(BaseModel):
    stage: str           # e.g. "CATS-Global Intern"
    favorite: str        # favorite part of that role
    insight: str         # what you learned
    transition: str      # why you moved on / what drew you next


class FITIntro(BaseModel):
    stages: list[FITStage]
    why_this_company: str  # final transition into this company


class WhyThisCompany(BaseModel):
    reason: str      # why drawn to the company
    evidence: str    # from user's own experience
    connection: str  # how it connects to what company is building


class TIARAQuestions(BaseModel):
    trends: list[str]       # 1-2 questions
    insights: list[str]     # 1-2 questions
    advice: list[str]       # 1-2 questions
    resources: list[str]    # 1-2 questions
    assignments: list[str]  # 1-2 questions


class CallStructure(BaseModel):
    small_talk: list[str]           # opening questions, energy tips
    transition_phrase: str          # bridge from small talk to Q&A
    active_listening_cues: list[str]
    wrap_up: list[str]              # time check, gratitude, Ben Franklin ask


class FollowUpMessages(BaseModel):
    thank_you: str          # a few days later, references conversation
    application_nudge: str  # when ready to apply


class CompanyResearch(BaseModel):
    what_they_do: str
    current_momentum: str    # revenue, growth, recent news
    future_initiatives: str  # AI investments, product launches
    engineering_culture: str # tech stack, values, practices
    key_challenges: list[str]


class PersonResearch(BaseModel):
    current_role: str
    career_path: str
    interests_and_focus: str
    vibe: str                        # casual vs formal, chatty vs reserved
    connection_points: list[str]     # overlaps with user's background


class PrepResponse(BaseModel):
    # All nested sections are optional — Claude occasionally drops one.
    # The orchestrator validates completeness and retries if any are None.
    company_research: CompanyResearch | None = None
    person_research: PersonResearch | None = None
    fit_intro: FITIntro | None = None
    why_this_company: WhyThisCompany | None = None
    tiara_questions: TIARAQuestions | None = None
    call_structure: CallStructure | None = None
    followup_messages: FollowUpMessages | None = None
    skills_match_score: float | None = None
    quality_score: float = 0.0                         # evaluator fills this

    def missing_sections(self) -> list[str]:
        """Return names of any sections Claude failed to populate."""
        return [
            f for f in [
                "company_research", "person_research", "fit_intro",
                "why_this_company", "tiara_questions", "call_structure",
                "followup_messages",
            ]
            if getattr(self, f) is None
        ]


class SectionScore(BaseModel):
    score: float    # 0.0 to 1.0
    feedback: str   # specific reason for the score
    passed: bool    # score >= 0.7


class EvaluationResult(BaseModel):
    company_research_score: SectionScore
    person_research_score: SectionScore
    fit_intro_score: SectionScore
    tiara_score: SectionScore
    followup_score: SectionScore
    overall_score: float   # average of all section scores
    needs_rerun: bool      # True if overall_score < 0.7
    rerun_feedback: str    # actionable instructions for synthesis agent
