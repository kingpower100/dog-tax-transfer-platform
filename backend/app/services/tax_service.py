from datetime import date
from fastapi import HTTPException
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import Session

from app.models import DogTaxRule


def _find_tax_rule(
    db: Session,
    municipality_id: int,
    rule_type: str,
    dog_position: int | None,
    today: date,
) -> DogTaxRule | None:
    query = select(DogTaxRule).where(
        DogTaxRule.municipality_id == municipality_id,
        DogTaxRule.rule_type == rule_type,
        DogTaxRule.valid_from <= today,
    )

    query = query.filter(
        or_(
            DogTaxRule.valid_to == None,
            DogTaxRule.valid_to >= today
        )
    )

    if dog_position is None:
        query = query.filter(DogTaxRule.dog_position == None)
    else:
        query = query.filter(DogTaxRule.dog_position == dog_position)

    return db.scalar(query.order_by(DogTaxRule.valid_from.desc()))


def calculate_dog_tax(
    db: Session,
    municipality_id: int,
    dog_position: int,
    dog_type: str,
    assistance_dog: bool = False,
    today: date | None = None,
) -> dict:
    today = today or date.today()

    if dog_type not in ("NORMAL", "LISTENHUND"):
        raise HTTPException(
            status_code=400,
            detail="Invalid dog type. Expected NORMAL or LISTENHUND",
        )

    if dog_type == "LISTENHUND":
        rule = _find_tax_rule(
            db=db,
            municipality_id=municipality_id,
            rule_type="DANGEROUS",
            dog_position=None,
            today=today,
        )

        if rule is None:
            raise HTTPException(
                status_code=404,
                detail="No dangerous dog tax rule found for municipality",
            )

        return {
            "amount_eur": rule.amount_eur,
            "tax_rule_id": rule.id,
            "rule_type": rule.rule_type,
            "tax_reduced": False,
            "reduction_reason": None,
        }

    lookup_position = dog_position if dog_position <= 3 else 3

    rule = _find_tax_rule(
        db=db,
        municipality_id=municipality_id,
        rule_type="BASIC",
        dog_position=lookup_position,
        today=today,
    )

    if rule is None:
        rule = _find_tax_rule(
            db=db,
            municipality_id=municipality_id,
            rule_type="BASIC",
            dog_position=None,
            today=today,
        )

    if rule is None:
        raise HTTPException(
            status_code=404,
            detail="No basic dog tax rule found for municipality",
        )

    return {
        "amount_eur": rule.amount_eur,
        "tax_rule_id": rule.id,
        "rule_type": rule.rule_type,
        "tax_reduced": False,
        "reduction_reason": None,
    }


def calculate_next_dog_position(
    db: Session,
    municipality_id: int,
    owner_id: int,
) -> int:
    from app.models import Registration
    
    active_count = (
        db.query(Registration)
        .filter(
            Registration.municipality_id == municipality_id,
            Registration.owner_id == owner_id,
            Registration.status == "active",
        )
        .count()
    )

    return active_count + 1
