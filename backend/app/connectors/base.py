from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class ConnectorResult:
    source: str
    source_id: str
    url: str
    title: str
    text: str
    author: str = ""
    author_url: str = ""
    published_at: datetime | None = None
    engagement: dict = field(default_factory=dict)
    location: str = ""
    topics: list = field(default_factory=list)

class SourceConnector(ABC):
    name: str
    signal_type: str
    status: str = "UNAVAILABLE"

    @abstractmethod
    def search(self, query: str, depth: str = "standard") -> list[ConnectorResult]:
        ...

    def fetch(self, source_id: str) -> ConnectorResult | None:
        return None

    def normalize(self, item: ConnectorResult) -> ConnectorResult:
        return item

    def rate_limit(self):
        return None

    def health_check(self) -> str:
        return self.status

    def get_source_metadata(self) -> dict:
        return {
            "source": self.name,
            "signal_type": self.signal_type,
            "status": self.status,
        }
