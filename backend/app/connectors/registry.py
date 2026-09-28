from .mock import MockConnector
from .reddit import RedditConnector

CONNECTORS = {
    "mock": MockConnector(),
    "reddit": RedditConnector(),
}

def get_connectors(names: list[str] | None = None):
    if not names:
        return list(CONNECTORS.values())
    return [CONNECTORS[n] for n in names if n in CONNECTORS]
