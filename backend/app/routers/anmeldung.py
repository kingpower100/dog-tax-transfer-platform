from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AnmeldungRequest, AnmeldungResponse
from app.services.anmeldung_service import create_anmeldung
from app.services.tenant_service import resolve_tenant


router = APIRouter()


@router.post(
    "/anmeldung",
    response_model=AnmeldungResponse,
    status_code=status.HTTP_201_CREATED,
)
def anmeldung(
    request: AnmeldungRequest,
    x_mandant_id: str | None = Header(default=None, alias="X-Mandant-ID"),
    db: Session = Depends(get_db),
):
    tenant = resolve_tenant(db, x_mandant_id)
    return create_anmeldung(db, tenant, request)
