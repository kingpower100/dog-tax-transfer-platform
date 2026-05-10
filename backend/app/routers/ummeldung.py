from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import UmmeldungRequest, UmmeldungResponse
from app.services.tenant_service import resolve_tenant
from app.services.transfer_service import create_ummeldung


router = APIRouter()


@router.post("/ummeldung", response_model=UmmeldungResponse, status_code=status.HTTP_200_OK)
def ummeldung(
    request: UmmeldungRequest,
    x_mandant_id: str | None = Header(default=None, alias="X-Mandant-ID"),
    db: Session = Depends(get_db),
):
    target = resolve_tenant(db, x_mandant_id)
    source = resolve_tenant(db, request.von_mandant)
    return create_ummeldung(db, source, target, request)
