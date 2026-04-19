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
    company_research: CompanyResearch
    person_research: PersonResearch
    fit_intro: FITIntro
    why_this_company: WhyThisCompany
    tiara_questions: TIARAQuestions
    call_structure: CallStructure
    followup_messages: FollowUpMessages
    skills_match_score: float | None
    quality_score: float             # filled by evaluator


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
