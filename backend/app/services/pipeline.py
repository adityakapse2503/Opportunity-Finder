import hashlib
from sqlalchemy import select
from ..models import NormalizedDocument, Evidence, Lead
from .classifier import classify, relevance
from ..connectors.registry import get_connectors

def run_pipeline(db, project, query, depth="standard", connector_names=None):
    docs_created = []
    for connector in get_connectors(connector_names):
        for item in connector.search(query, depth):
            content_hash = hashlib.sha256(
                (item.url + "\n" + item.title + "\n" + item.text).encode()
            ).hexdigest()

            existing = db.scalar(
                select(NormalizedDocument).where(
                    (NormalizedDocument.content_hash == content_hash) |
                    ((NormalizedDocument.source == item.source) &
                     (NormalizedDocument.source_id == item.source_id))
                )
            )
            if existing:
                continue

            intent, intent_score = classify(item.title + " " + item.text)
            rel = relevance(item.title + " " + item.text, query)

            doc = NormalizedDocument(
                source=item.source,
                source_id=item.source_id,
                source_url=item.url,
                title=item.title,
                text=item.text,
                author=item.author,
                author_url=item.author_url,
                published_at=item.published_at,
                engagement=item.engagement,
                location=item.location,
                topics=item.topics,
                keywords=query.split(),
                intent_type=intent,
                intent_score=intent_score,
                relevance_score=rel,
                business_type=project.business_type,
                source_type=connector.signal_type,
                content_hash=content_hash,
            )
            db.add(doc)
            db.flush()

            db.add(Evidence(
                document_id=doc.id,
                reason=f"{connector.name} produced evidence matching the query.",
                excerpt=item.text[:500],
            ))

            if intent_score >= 65 and rel >= 20:
                db.add(Lead(
                    document_id=doc.id,
                    label="High-Intent Signal",
                    score=round((intent_score * 0.6) + (rel * 0.4), 2),
                    reason=f"{intent} with relevance {rel:.0f}/100.",
                ))

            docs_created.append(doc)

    db.commit()
    return docs_created
