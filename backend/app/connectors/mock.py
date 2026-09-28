from datetime import datetime, timedelta
from .base import SourceConnector, ConnectorResult

class MockConnector(SourceConnector):
    name = "Mock Research"
    signal_type = "Consumer discussion"
    status = "MOCK"

    def search(self, query: str, depth: str = "standard"):
        return [
            ConnectorResult(
                source=self.name,
                source_id=f"mock-{i}",
                url="https://example.com/evidence",
                title=f"Public discussion about {query}",
                text=f"Example research evidence related to {query}. "
                     "This is MOCK data and must not be interpreted as real market evidence.",
                author="mock-user",
                published_at=datetime.utcnow() - timedelta(days=i),
                engagement={"comments": 12 + i, "score": 42 + i},
                topics=[query],
            )
            for i in range(1, 4)
        ]
