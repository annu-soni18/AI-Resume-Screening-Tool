from groq import Groq
import json
import re
from app.core.config import get_settings

settings = get_settings()

SCREENING_PROMPT = """You are an expert HR recruiter and technical hiring specialist. Analyze the resume against the job description and return a JSON object.

JOB DESCRIPTION:
{job_description}

RESUME TEXT:
{resume_text}

Return ONLY a valid JSON object with exactly these fields (no markdown, no explanation):
{{
  "match_score": <integer 0-100>,
  "candidate_name": "<full name from resume>",
  "candidate_email": "<email from resume or empty string>",
  "candidate_phone": "<phone from resume or empty string>",
  "years_experience": <float, total years of relevant experience>,
  "ai_summary": "<2-3 sentence summary of the candidate fit for this role>",
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "green_flags": ["positive signal 1", "positive signal 2"],
  "red_flags": ["concern 1", "concern 2"]
}}

Scoring guide:
- 85-100: Exceptional fit, meets all requirements
- 70-84: Strong fit, meets most requirements
- 55-69: Moderate fit, meets core requirements
- 40-54: Partial fit, significant gaps
- 0-39: Poor fit, major mismatches"""


async def screen_resume(job_description: str, resume_text: str) -> dict:
    client = Groq(api_key=settings.groq_api_key)

    prompt = SCREENING_PROMPT.format(
        job_description=job_description,
        resume_text=resume_text[:6000],
    )

    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=1000,
    )

    raw_text = response.choices[0].message.content
    return parse_llm_response(raw_text)


def parse_llm_response(raw: str) -> dict:
    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
    if json_match:
        try:
            result = json.loads(json_match.group())
            return sanitize_result(result)
        except json.JSONDecodeError:
            pass

    return {
        "match_score": 0,
        "candidate_name": "Unknown",
        "candidate_email": "",
        "candidate_phone": "",
        "years_experience": 0.0,
        "ai_summary": "Could not parse AI response. Please re-screen this candidate.",
        "matching_skills": [],
        "missing_skills": [],
        "green_flags": [],
        "red_flags": ["Screening failed — AI response could not be parsed"],
    }


def sanitize_result(data: dict) -> dict:
    def ensure_list(val):
        if isinstance(val, list):
            return [str(x) for x in val]
        if isinstance(val, str):
            return [x.strip() for x in val.split(",") if x.strip()]
        return []

    return {
        "match_score": max(0, min(100, float(data.get("match_score", 0)))),
        "candidate_name": str(data.get("candidate_name", "Unknown"))[:255],
        "candidate_email": str(data.get("candidate_email", ""))[:255],
        "candidate_phone": str(data.get("candidate_phone", ""))[:50],
        "years_experience": max(0.0, float(data.get("years_experience", 0))),
        "ai_summary": str(data.get("ai_summary", ""))[:2000],
        "matching_skills": ensure_list(data.get("matching_skills", [])),
        "missing_skills": ensure_list(data.get("missing_skills", [])),
        "green_flags": ensure_list(data.get("green_flags", [])),
        "red_flags": ensure_list(data.get("red_flags", [])),
    }


async def check_ollama_health() -> bool:
    # Groq — just verify API key is set
    return bool(settings.groq_api_key)