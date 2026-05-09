from fastapi import APIRouter, Depends, Header
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DogTaxRule
from app.schemas import TaxRuleOut
from app.services.tenant_service import resolve_tenant


router = APIRouter()


@router.get("/steuerregeln", response_model=list[TaxRuleOut])
def list_tax_rules(
    x_mandant_id: str | None = Header(default=None, alias="X-Mandant-ID"),
    db: Session = Depends(get_db),
):
    tenant = resolve_tenant(db, x_mandant_id)
    return db.scalars(
        select(DogTaxRule)
        .where(DogTaxRule.municipality_id == tenant.id)
        .order_by(DogTaxRule.rule_type.asc(), DogTaxRule.dog_position.asc())
    ).all()
