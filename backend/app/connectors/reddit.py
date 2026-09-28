import httpx
from datetime import datetime, timezone
from .base import SourceConnector, ConnectorResult
from ..core.config import settings

class RedditConnector(SourceConnector):
    name = "Reddit"
    signal_type = "Conversation / Consumer intent"

    def __init__(self):
        self.status = "CONNECTED" if settings.reddit_client_id and settings.reddit_client_secret else "UNAVAILABLE"

    def search(self, query: str, depth: str = "standard"):
        if self.status != "CONNECTED":
            return []
        # Production implementation should use Reddit's approved API/OAuth access.
        # Do not scrape around authentication or rate limits.
        token_url = "https://www.reddit.com/api/v1/access_token"
        auth = (settings.reddit_client_id, settings.reddit_client_secret)
        data = {"grant_type": "client_credentials"}
        headers = {"User-Agent": settings.reddit_user_agent}
        with httpx.Client(timeout=20) as client:
            token_response = client.post(token_url, auth=auth, data=data, headers=headers)
            token_response.raise_for_status()
            token = token_response.json()["access_token"]
            r = client.get(
                "https://oauth.reddit.com/search",
                params={"q": query, "sort": "new", "limit": 25, "type": "link"},
                headers={**headers, "Authorization": f"bearer {token}"},
            )
            r.raise_for_status()
            children = r.json()["data"]["children"]

        return [
            ConnectorResult(
                source=self.name,
                source_id=x["data"]["name"],
                url="https://www.reddit.com" + x["data"]["permalink"],
                title=x["data"].get("title", ""),
                text=x["data"].get("selftext", ""),
                author=x["data"].get("author") or "",
                published_at=datetime.fromtimestamp(x["data"]["created_utc"], tz=timezone.utc).replace(tzinfo=None),
                engagement={"score": x["data"].get("score", 0), "comments": x["data"].get("num_comments", 0)},
                topics=[query],
            )
            for x in children
        ]
