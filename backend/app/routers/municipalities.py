from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Municipality
from app.schemas import MunicipalityOut


router = APIRouter()


@router.get("/mandanten", response_model=list[MunicipalityOut])
def list_municipalities(db: Session = Depends(get_db)):
    return db.scalars(select(Municipality).order_by(Municipality.name.asc())).all()
