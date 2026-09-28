def expand_query(base: str, business_type: str = "", target_customer: str = "") -> list[str]:
    parts = [base]
    suffixes = [
        "need",
        "looking for",
        "alternative to",
        "recommendation",
        "cost",
        "problem",
        "best",
        "review",
    ]
    for s in suffixes:
        parts.append(f"{s} {base}")
    if business_type:
        parts.append(f"{base} {business_type}")
    if target_customer:
        parts.append(f"{base} {target_customer}")
    return list(dict.fromkeys(parts))
