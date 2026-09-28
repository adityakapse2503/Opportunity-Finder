import enum
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Float, Integer, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from .db import Base

class ConnectorStatus(str, enum.Enum):
    CONNECTED = "CONNECTED"
    LIMITED = "LIMITED"
    UNAVAILABLE = "UNAVAILABLE"
    MOCK = "MOCK"
    ERROR = "ERROR"

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200))
    business_type: Mapped[str] = mapped_column(String(200))
    target_customer: Mapped[str] = mapped_column(String(500))
    location: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Source(Base):
    __tablename__ = "sources"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), unique=True)
    signal_type: Mapped[str] = mapped_column(String(100))
    status: Mapped[ConnectorStatus] = mapped_column(Enum(ConnectorStatus), default=ConnectorStatus.MOCK)
    reliability: Mapped[float] = mapped_column(Float, default=0.5)
    freshness: Mapped[str] = mapped_column(String(50), default="unknown")

class SearchRun(Base):
    __tablename__ = "search_runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    query: Mapped[str] = mapped_column(String(500))
    depth: Mapped[str] = mapped_column(String(30), default="standard")
    status: Mapped[str] = mapped_column(String(30), default="queued")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class NormalizedDocument(Base):
    __tablename__ = "normalized_documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source: Mapped[str] = mapped_column(String(100))
    source_id: Mapped[str] = mapped_column(String(500), index=True)
    source_url: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text)
    text: Mapped[str] = mapped_column(Text)
    author: Mapped[str] = mapped_column(String(300), default="")
    author_url: Mapped[str] = mapped_column(Text, default="")
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    engagement: Mapped[dict] = mapped_column(JSON, default=dict)
    location: Mapped[str] = mapped_column(String(200), default="")
    language: Mapped[str] = mapped_column(String(20), default="en")
    topics: Mapped[list] = mapped_column(JSON, default=list)
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    intent_type: Mapped[str] = mapped_column(String(100), default="Unknown")
    intent_score: Mapped[float] = mapped_column(Float, default=0)
    relevance_score: Mapped[float] = mapped_column(Float, default=0)
    business_type: Mapped[str] = mapped_column(String(200), default="")
    source_type: Mapped[str] = mapped_column(String(100), default="")
    content_hash: Mapped[str] = mapped_column(String(64), index=True)
    embedding: Mapped[list | None] = mapped_column(Vector(384), nullable=True)

class Evidence(Base):
    __tablename__ = "evidence"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(ForeignKey("normalized_documents.id"))
    reason: Mapped[str] = mapped_column(Text)
    excerpt: Mapped[str] = mapped_column(Text)

class Lead(Base):
    __tablename__ = "leads"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(ForeignKey("normalized_documents.id"))
    label: Mapped[str] = mapped_column(String(100), default="Potential Lead")
    score: Mapped[float] = mapped_column(Float, default=0)
    reason: Mapped[str] = mapped_column(Text, default="")
