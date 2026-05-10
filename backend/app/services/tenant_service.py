from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Municipality


def resolve_tenant(db: Session, x_mandant_id: str | None) -> Municipality:
    if x_mandant_id is None or not x_mandant_id.strip():
        raise HTTPException(status_code=400, detail="X-Mandant-ID header is required")

    tenant_code = x_mandant_id.strip().upper()
    municipality = db.scalar(select(Municipality).where(Municipality.code == tenant_code))
    if municipality is None:
        raise HTTPException(status_code=404, detail="Municipality tenant not found")

    return municipality
