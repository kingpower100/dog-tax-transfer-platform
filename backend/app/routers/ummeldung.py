from fastapi import APIRouter, Depends, Header
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import UmmeldungRequest, UmmeldungResponse


router = APIRouter()


@router.post("/ummeldung", response_model=UmmeldungResponse)
def ummeldung(
    request: UmmeldungRequest,
    x_mandant_id: str | None = Header(default=None, alias="X-Mandant-ID"),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=410, detail="Legacy direct transfer endpoint is disabled. Use /transfer-requests workflow.")
