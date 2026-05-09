from fastapi import APIRouter, Depends, Header
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Dog
from app.schemas import DogOut, DogRegistrationRequest
from app.services.dog_registration_service import register_new_dog
from app.services.tenant_service import resolve_tenant


router = APIRouter()


@router.get("/hunde", response_model=list[DogOut])
def list_dogs(
    x_mandant_id: str | None = Header(default=None, alias="X-Mandant-ID"),
    db: Session = Depends(get_db),
):
    tenant = resolve_tenant(db, x_mandant_id)
    return db.scalars(
        select(Dog).where(Dog.municipality_id == tenant.id).order_by(Dog.id.asc())
    ).all()


@router.post("/dogs/register")
def register_dog(
    request: DogRegistrationRequest,
    db: Session = Depends(get_db),
):
    return register_new_dog(db, request)
