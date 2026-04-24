import json
import os
from pathlib import Path

# Resolve absolute path to careers.json (works reliably on Windows)
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # goes up: services -> backend -> AI Mentor
DATA_PATH = BASE_DIR / "src" / "data" / "careers.json"

def load_careers():
    """Load career data from the JSON file."""
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────────────────────
# Keyword Mapping — Maps student interests/goals to career categories & titles
# ─────────────────────────────────────────────────────────────────────────────

INTEREST_KEYWORDS = {
    "IT": [
        "coding", "programming", "computers", "software", "apps", "websites",
        "technology", "tech", "internet", "gaming", "ai", "machine learning",
        "data", "cybersecurity", "hacking", "cloud", "mobile", "android", "ios",
        "digital", "robotics", "automation", "development", "devops"
    ],
    "Core": [
        "engineering", "machines", "construction", "buildings", "electricity",
        "mechanical", "civil", "chemical", "electronics", "hardware", "physics",
        "manufacturing", "design", "automobile", "cars", "bridges", "circuits",
        "power", "energy", "materials", "physics"
    ],
    "Govt": [
        "government", "stability", "security", "ias", "upsc", "banking", "bank",
        "ssc", "railway", "defence", "army", "navy", "airforce", "police",
        "teaching", "teacher", "school", "public service", "nda", "cds",
        "isro", "drdo", "research", "civil services"
    ],
    "Startup": [
        "startup", "entrepreneur", "founder", "build my own", "product",
        "ux", "ui", "design", "devops", "growth", "scale", "venture",
        "innovation", "pitch", "funding", "mvp", "agile", "freelance",
        "full stack", "fullstack", "product manager", "digital marketing"
    ],
    "Business": [
        "business", "finance", "accounting", "management", "marketing",
        "hr", "human resources", "supply chain", "mba", "commerce", "bcom",
        "ca", "chartered", "analyst", "bba", "economics", "corporate",
        "sales", "operations", "logistics", "financial"
    ]
}

GOAL_KEYWORDS = {
    "high_salary": [
        "high salary", "earn more", "rich", "money", "income", "package",
        "lpa", "crore", "financial freedom", "wealth", "well paid"
    ],
    "job_security": [
        "job security", "stable job", "permanent", "secure", "safety",
        "pension", "no layoff", "reliable", "safe career"
    ],
    "social_impact": [
        "help people", "society", "impact", "change the world", "service",
        "public service", "nation", "teaching", "welfare", "social"
    ],
    "innovation": [
        "innovate", "create", "invent", "startup", "entrepreneur", "new ideas",
        "research", "cutting edge", "future", "technology", "ai", "build"
    ],
    "prestige": [
        "respect", "prestige", "status", "officer", "ias", "power",
        "famous", "reputed", "recognition", "authority", "leadership"
    ],
    "entrepreneurship": [
        "own business", "start a company", "be my own boss", "entrepreneur",
        "startup", "build a product", "launch", "freelance", "independent",
        "self employed", "venture", "founder"
    ],
    "creative": [
        "creative", "design", "art", "ux", "ui", "visual", "aesthetic",
        "branding", "marketing", "content", "media", "storytelling"
    ]
}

# Careers that align with specific goals
GOAL_CAREER_BOOST = {
    "high_salary": ["Software Engineer", "AI/ML Engineer", "Cloud Engineer", "Cybersecurity Analyst",
                    "Data Analyst", "Chartered Accountant (CA)", "Financial Analyst", "Product Manager"],
    "job_security": ["IAS Officer (Civil Services)", "Bank PO (Probationary Officer)",
                     "SSC CGL (Staff Selection Combined Graduate Level)", "Railway Engineer (RRB JE/SSE)",
                     "Teacher (Government School – TGT/PGT)"],
    "social_impact": ["IAS Officer (Civil Services)", "Teacher (Government School – TGT/PGT)",
                      "ISRO/DRDO Scientist", "Civil Engineer", "Human Resources (HR) Manager"],
    "innovation": ["AI/ML Engineer", "Cloud Engineer", "Software Engineer", "ISRO/DRDO Scientist",
                   "Electronics & Communication Engineer", "Startup Founder / Entrepreneur",
                   "Full-Stack Developer (Startup)", "Product Manager", "UI/UX Designer"],
    "prestige": ["IAS Officer (Civil Services)", "Defence Officer (NDA/CDS)", "ISRO/DRDO Scientist",
                 "Software Engineer", "Chartered Accountant (CA)", "Startup Founder / Entrepreneur"],
    "entrepreneurship": ["Startup Founder / Entrepreneur", "Product Manager", "Growth Hacker / Digital Marketer",
                         "Full-Stack Developer (Startup)", "UI/UX Designer", "Business Analyst"],
    "creative": ["UI/UX Designer", "Growth Hacker / Digital Marketer", "Marketing Manager",
                 "Product Manager", "Web Developer", "Mobile App Developer"]
}


def detect_categories(interest: str) -> list:
    """Return matching career categories based on student interest keywords."""
    interest = interest.lower()
    matched = []

    for category, keywords in INTEREST_KEYWORDS.items():
        if any(kw in interest for kw in keywords):
            matched.append(category)

    # Default: return all if nothing matched
    return matched if matched else list(INTEREST_KEYWORDS.keys())


def detect_goal_type(goal: str) -> str | None:
    """Identify the goal type from the student's goal text."""
    goal = goal.lower()

    for goal_type, keywords in GOAL_KEYWORDS.items():
        if any(kw in goal for kw in keywords):
            return goal_type

    return None


def score_career(career: dict, goal_careers: list) -> int:
    """Assign a relevance score to a career based on goal alignment."""
    score = 0

    if career["title"] in goal_careers:
        score += 10  # Directly goal-aligned

    if career["demand"] == "High":
        score += 3
    elif career["demand"] == "Medium":
        score += 1

    return score


def suggest_careers(interest: str, goal: str) -> dict:
    """
    Core logic: Filter and rank career suggestions based on interest and goal.

    Args:
        interest (str): Student's area of interest
        goal    (str): Student's career goal

    Returns:
        dict: Ranked career suggestions with metadata
    """
    careers_data = load_careers()

    # Step 1: Detect relevant categories from interest
    matched_categories = detect_categories(interest)

    # Step 2: Gather careers from matched categories
    candidate_careers = []
    for category in matched_categories:
        for career in careers_data.get(category, []):
            career["_category"] = category  # Tag each career with its category
            candidate_careers.append(career)

    # Step 3: Detect goal type and get goal-aligned career titles
    goal_type = detect_goal_type(goal)
    goal_careers = GOAL_CAREER_BOOST.get(goal_type, []) if goal_type else []

    # Step 4: Score and sort
    scored = sorted(
        candidate_careers,
        key=lambda c: score_career(c, goal_careers),
        reverse=True
    )

    # Step 5: Remove internal tag before returning
    for c in scored:
        c.pop("_category", None)

    return {
        "interest_detected": interest,
        "goal_detected": goal,
        "goal_type": goal_type or "general",
        "matched_categories": matched_categories,
        "total_suggestions": len(scored),
        "suggestions": scored
    }
