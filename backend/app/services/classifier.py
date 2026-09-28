BUYING = ["need", "looking for", "hire", "buy", "recommend", "alternative", "vendor"]
PROBLEM = ["problem", "issue", "broken", "can't", "cannot", "frustrated", "complaint"]

def classify(text: str):
    t = text.lower()
    buying_hits = sum(x in t for x in BUYING)
    problem_hits = sum(x in t for x in PROBLEM)

    if buying_hits:
        intent = "Buying Intent"
        score = min(100, 55 + buying_hits * 10)
    elif problem_hits:
        intent = "Problem/Pain"
        score = min(100, 45 + problem_hits * 8)
    else:
        intent = "Research Intent"
        score = 30

    return intent, score

def relevance(text: str, query: str) -> float:
    terms = {x.lower() for x in query.split() if len(x) > 2}
    if not terms:
        return 0
    words = set(text.lower().split())
    return round(min(100, len(terms & words) / len(terms) * 100), 2)
