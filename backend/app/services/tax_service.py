from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DogTaxRule


def calculate_dog_tax(
    db: Session,
    municipality_id: int,
    active_dogs_before: int,
    dog_type: str,
    assistance_dog: bool = False,
    shelter_adoption: bool = False,
    social_benefit: bool = False,
) -> dict[str, int | str | None]:
    """
    Calculate dog tax using a data-driven rule evaluator.

    Rules are matched by condition (ASSISTANCE_DOG, LISTENHUND, SHELTER_ADOPTION, etc.)
    with priority determining evaluation order. Within each condition, dog_position
    provides tiering (1st dog vs 2nd+ dog). Flat rates use dog_position=NULL.

    For 4+ dogs: evaluator uses the highest-numbered dog_position <= actual_position,
    so position 3 acts as "3rd and above" catch-all.
    """
    actual_position = active_dogs_before + 1

    # Build fact map: what conditions apply to this registration?
    facts = {
        "LISTENHUND": dog_type == "LISTENHUND",
        "ASSISTANCE_DOG": assistance_dog,
        "SHELTER_ADOPTION": shelter_adoption,
        "SOCIAL_BENEFIT": social_benefit,
        "DEFAULT": True,
    }

    # Fetch all rules for this municipality (valid today), ordered by priority DESC then position DESC
    # This ensures highest-priority rules are checked first, and within a priority,
    # higher positions are checked first (best positional match wins).
    rules = db.scalars(
        select(DogTaxRule)
        .where(
            DogTaxRule.municipality_id == municipality_id,
            DogTaxRule.valid_to.is_(None),
        )
        .order_by(DogTaxRule.priority.desc(), DogTaxRule.dog_position.desc())
    ).all()

    for rule in rules:
        # Check if this rule's condition applies
        if not facts.get(rule.condition, False):
            continue

        # Check if position matches
        if rule.dog_position is not None and rule.dog_position > actual_position:
            # Rule is for a higher position (e.g., position 4 rule but we're at position 2), skip
            continue

        # Match found! Return the tax outcome
        return {
            "amount_eur": rule.amount_eur,
            "tax_rule_id": rule.id,
            "dog_position": actual_position,
            "tax_reduced": 1 if rule.priority > 0 else 0,
            "reduction_reason": rule.condition if rule.priority > 0 else None,
        }

    # No rule matched
    raise HTTPException(
        status_code=404,
        detail=f"No tax rule found for municipality {municipality_id} matching dog type {dog_type} at position {actual_position}",
    )
