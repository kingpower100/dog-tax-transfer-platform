from datetime import date, datetime
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Dog, Owner, Registration, Municipality
from app.schemas import UmmeldungRequest, UmmeldungResponse
from app.services.tax_service import calculate_dog_tax, calculate_next_dog_position
from app.services.audit_service import create_audit_log


def create_ummeldung(db: Session, target_municipality, request: UmmeldungRequest) -> UmmeldungResponse:
    """
    Create a dog transfer (ummeldung) to target municipality.
    
    Args:
        db: Database session
        target_municipality: Target municipality resolved from X-Mandant-ID header
        request: UmmeldungRequest with von_mandant, chipnummer, neue_adresse
    
    Returns:
        UmmeldungResponse with uebernommen_von, personId, hundId, neuer_steuerbetrag, waehrung, veranlagungsjahr, protokoll_id
    """
    # Resolve source municipality from von_mandant
    source_municipality = db.scalar(
        select(Municipality).where(Municipality.code == request.von_mandant.upper())
    )
    if source_municipality is None:
        raise HTTPException(status_code=404, detail="Unknown source tenant")
    
    # Validate source and target are different
    if source_municipality.id == target_municipality.id:
        raise HTTPException(status_code=400, detail="Source and target municipalities must be different")
    
    # Find active source registration by source municipality, chipnummer, status = active
    source_registration = db.scalar(
        select(Registration).join(Dog).join(Owner).where(
            Registration.municipality_id == source_municipality.id,
            Dog.chip_number == request.chipnummer,
            Registration.status == "active",
        )
    )
    
    if source_registration is None:
        raise HTTPException(status_code=404, detail="No active source registration found")
    
    source_dog = db.get(Dog, source_registration.dog_id)
    source_owner = db.get(Owner, source_registration.owner_id)
    
    # Close source registration
    now = datetime.utcnow()
    source_registration.status = "transferred"
    source_registration.deregistered_at = now
    source_registration.end_date = date.today().isoformat()
    source_registration.deregistration_reason = f"TRANSFER_TO_{target_municipality.code}"
    
    # Create or reuse target owner in target municipality
    target_owner = db.scalar(
        select(Owner).where(
            Owner.municipality_id == target_municipality.id,
            Owner.first_name == source_owner.first_name,
            Owner.last_name == source_owner.last_name,
            Owner.date_of_birth == source_owner.date_of_birth,
        )
    )
    
    if target_owner is None:
        target_owner = Owner(
            municipality_id=target_municipality.id,
            user_id=None,
            first_name=source_owner.first_name,
            last_name=source_owner.last_name,
            date_of_birth=source_owner.date_of_birth,
            street=request.neue_adresse.strasse,
            house_number=str(request.neue_adresse.hausnummer),
            postal_code=request.neue_adresse.plz,
            city=request.neue_adresse.ort,
            email=source_owner.email,
            phone=source_owner.phone,
        )
        db.add(target_owner)
        db.flush()
    else:
        # Update address for existing target owner
        target_owner.street = request.neue_adresse.strasse
        target_owner.house_number = str(request.neue_adresse.hausnummer)
        target_owner.postal_code = request.neue_adresse.plz
        target_owner.city = request.neue_adresse.ort
    
    # Reuse dog identity by chipnummer
    target_dog = db.scalar(
        select(Dog).where(
            Dog.municipality_id == target_municipality.id,
            Dog.chip_number == request.chipnummer,
        )
    )
    
    if target_dog is None:
        target_dog = Dog(
            municipality_id=target_municipality.id,
            owner_id=target_owner.id,
            name=source_dog.name,
            breed=source_dog.breed,
            chip_number=source_dog.chip_number,
            birth_date=source_dog.birth_date,
            gender=source_dog.gender,
            dog_type=source_dog.dog_type,
            is_dangerous=source_dog.is_dangerous,
            status="active",
        )
        db.add(target_dog)
        db.flush()
    
    # Calculate new dog_position in target municipality only
    dog_position = calculate_next_dog_position(db, target_municipality.id, target_owner.id)
    
    # Calculate new tax using target municipality dog_tax_rules only
    tax = calculate_dog_tax(db, target_municipality.id, dog_position, source_dog.dog_type)
    
    # Create new active target registration
    target_registration = Registration(
        municipality_id=target_municipality.id,
        owner_id=target_owner.id,
        dog_id=target_dog.id,
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
        registered_at=now,
    )
    db.add(target_registration)
    db.flush()
    
    # Create transfer/audit protocol entry
    audit_log = create_audit_log(
        db,
        action="UMMELDUNG_TRANSFER",
        details_dict={
            "source_municipality_code": source_municipality.code,
            "target_municipality_code": target_municipality.code,
            "chip_number": request.chipnummer,
            "source_registration_id": source_registration.id,
            "target_registration_id": target_registration.id,
            "dog_position": dog_position,
            "tax_amount": tax["amount_eur"],
        },
        actor_role="system",
        actor_municipality_id=target_municipality.id,
    )
    
    db.commit()

    return UmmeldungResponse(
        status=200,
        uebernommen_von=request.von_mandant,
        personId=target_owner.id,
        hundId=target_dog.id,
        neuer_steuerbetrag=tax["amount_eur"],
        waehrung="EUR",
        veranlagungsjahr=target_registration.assessment_year,
        protokoll_id=audit_log.id,
    )
