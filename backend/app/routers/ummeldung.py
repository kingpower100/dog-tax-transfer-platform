from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import UmmeldungRequest, UmmeldungResponse
from app.services.ummeldung_service import create_ummeldung
from app.services.tenant_service import resolve_tenant


router = APIRouter()


@router.post("/ummeldung", response_model=UmmeldungResponse)
def ummeldung(
    request: UmmeldungRequest,
    x_mandant_id: str | None = Header(default=None, alias="X-Mandant-ID"),
    db: Session = Depends(get_db),
):
    target_municipality = resolve_tenant(db, x_mandant_id)
    return create_ummeldung(db, target_municipality, request)
