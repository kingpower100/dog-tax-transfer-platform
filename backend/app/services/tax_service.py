from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DogTaxRule


def _find_rule(
    db: Session,
    municipality_id: int,
    rule_type: str,
    dog_position: int | None,
) -> DogTaxRule | None:
    return db.scalar(
        select(DogTaxRule).where(
            DogTaxRule.municipality_id == municipality_id,
            DogTaxRule.rule_type == rule_type,
            DogTaxRule.dog_position.is_(None)
            if dog_position is None
            else DogTaxRule.dog_position == dog_position,
            DogTaxRule.valid_to.is_(None),
        )
    )


def calculate_dog_tax(
    db: Session,
    municipality_id: int,
    active_dogs_before: int,
    dog_type: str,
    assistance_dog: bool = False,
) -> dict[str, int | str | None]:
    dog_position = active_dogs_before + 1
    if assistance_dog:
        exemption_rule = _find_rule(db, municipality_id, "EXEMPTION", None)
        if exemption_rule is not None:
            return {
                "amount_eur": 0,
                "tax_rule_id": exemption_rule.id,
                "dog_position": dog_position,
                "tax_reduced": 1,
                "reduction_reason": "ASSISTANCE_DOG",
            }

    if dog_type == "LISTENHUND":
        dangerous_rule = _find_rule(db, municipality_id, "DANGEROUS", None)
        if dangerous_rule is None:
            raise HTTPException(status_code=404, detail="No dangerous-dog tax rule found for municipality")
        return {
            "amount_eur": dangerous_rule.amount_eur,
            "tax_rule_id": dangerous_rule.id,
            "dog_position": dog_position,
            "tax_reduced": 0,
            "reduction_reason": None,
        }

    lookup_position = dog_position if dog_position <= 3 else 3
    rule = _find_rule(db, municipality_id, "BASIC", lookup_position)
    if rule is None:
        rule = _find_rule(db, municipality_id, "BASIC", None)

    if rule is None:
        raise HTTPException(status_code=404, detail="No tax rule found for municipality")

    return {
        "amount_eur": rule.amount_eur,
        "tax_rule_id": rule.id,
        "dog_position": dog_position,
        "tax_reduced": 0,
        "reduction_reason": None,
    }
