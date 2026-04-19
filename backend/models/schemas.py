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


class PrepResponse(BaseModel):
    talking_points: list[str]
    questions_to_ask: list[str]
    followup_draft: str
    skills_match_score: float | None
    quality_score: float
