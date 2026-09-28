from datetime import datetime
from pydantic import BaseModel, Field

class ProjectCreate(BaseModel):
    name: str
    business_type: str
    target_customer: str
    location: str = ""

class ProjectOut(ProjectCreate):
    id: str
    created_at: datetime
    model_config = {"from_attributes": True}

class SearchCreate(BaseModel):
    query: str
    depth: str = Field(default="standard", pattern="^(quick|standard|deep)$")

class SearchOut(BaseModel):
    id: str
    status: str
    query: str
    model_config = {"from_attributes": True}

class ResultOut(BaseModel):
    id: str
    source: str
    title: str
    excerpt: str
    source_url: str
    published_at: datetime | None
    author: str
    intent_type: str
    intent_score: float
    relevance_score: float
    engagement: dict
