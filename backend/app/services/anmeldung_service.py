from datetime import date, datetime
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Dog, Owner, Registration
from app.schemas import AnmeldungRequest, AnmeldungResponse
from app.services.tax_service import calculate_dog_tax, calculate_next_dog_position


def create_anmeldung(db: Session, municipality, request: AnmeldungRequest) -> AnmeldungResponse:
    """
    Create a new dog registration (anmeldung) for the specified municipality.
    
    Args:
        db: Database session
        municipality: Municipality resolved from X-Mandant-ID header
        request: AnmeldungRequest with halter and hund data
    
    Returns:
        AnmeldungResponse with personId, hundId, steuerbetrag, waehrung, veranlagungsjahr
    """
    # Create or reuse owner inside this municipality only
    owner = db.scalar(
        select(Owner).where(
            Owner.municipality_id == municipality.id,
            Owner.first_name == request.halter.vorname,
            Owner.last_name == request.halter.nachname,
            Owner.street == request.halter.strasse,
            Owner.house_number == str(request.halter.hausnummer),
            Owner.postal_code == request.halter.plz,
            Owner.city == request.halter.ort,
        )
    )
    
    if owner is None:
        owner = Owner(
            municipality_id=municipality.id,
            user_id=None,
            first_name=request.halter.vorname,
            last_name=request.halter.nachname,
            date_of_birth=request.halter.geburtsdatum,
            street=request.halter.strasse,
            house_number=str(request.halter.hausnummer),
            postal_code=request.halter.plz,
            city=request.halter.ort,
            email=request.halter.email,
            phone=request.halter.telefon,
        )
        db.add(owner)
        db.flush()

    # Create or reuse dog by chipnummer
    dog = db.scalar(
        select(Dog).where(
            Dog.municipality_id == municipality.id,
            Dog.chip_number == request.hund.chipnummer,
        )
    )
    
    if dog is None:
        dog = Dog(
            municipality_id=municipality.id,
            owner_id=owner.id,
            name=request.hund.name,
            breed=request.hund.rasse,
            chip_number=request.hund.chipnummer,
            birth_date=request.hund.geburtsdatum,
            gender=request.hund.geschlecht,
            dog_type=request.hund.typ,
            is_dangerous=1 if request.hund.typ == "LISTENHUND" else 0,
            status="active",
        )
        db.add(dog)
        db.flush()
    
    # Calculate dog position for this owner in this municipality
    dog_position = calculate_next_dog_position(db, municipality.id, owner.id)
    
    # Calculate tax using this municipality's dog_tax_rules table
    tax = calculate_dog_tax(db, municipality.id, dog_position, request.hund.typ)
    
    # Create active registration
    registration = Registration(
        municipality_id=municipality.id,
        owner_id=owner.id,
        dog_id=dog.id,
        tax_rule_id=tax["tax_rule_id"],
        assessment_year=date.today().year,
        dog_position=dog_position,
        annual_tax_amount=tax["amount_eur"],
        assistance_dog=1 if request.assistance_dog else 0,
        tax_reduced=1 if request.tax_reduced else 0,
        reduction_reason=request.reduction_reason,
        liability_insurance_available=1 if request.liability_insurance_available else 0,
        insurance_policy_number=request.insurance_policy_number,
        currency="EUR",
        status="active",
        registered_at=datetime.utcnow(),
    )
    db.add(registration)
    db.flush()
    db.commit()

    return AnmeldungResponse(
        status=201,
        personId=owner.id,
        hundId=dog.id,
        steuerbetrag=tax["amount_eur"],
        waehrung="EUR",
        veranlagungsjahr=registration.assessment_year,
    )
