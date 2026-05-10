from datetime import date

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Dog, Municipality, Owner, Registration, TaxAssessment
from app.schemas import DemoContext, DogRegistrationRequest, RegistrationFinanceAction
from app.services.audit_service import write_audit_log
from app.services.tax_service import calculate_dog_tax
from app.services.transfer_service import _require_municipality_admin


def _audit(
    db: Session,
    action: str,
    registration: Registration,
    context: DemoContext,
    details: dict | None = None,
) -> None:
    write_audit_log(
        db,
        context.current_user_id,
        context.current_role,
        context.current_municipality_id,
        action,
        "dog_registration",
        registration.id,
        details or {},
    )


def register_new_dog(db: Session, payload: DogRegistrationRequest, current_user: DemoContext | None = None) -> dict:
    context = current_user or payload
    if context.current_role != "citizen" or context.current_user_id is None:
        raise HTTPException(status_code=403, detail="Citizen role is required")

    municipality = db.get(Municipality, payload.municipality_id)
    if municipality is None:
        raise HTTPException(status_code=404, detail="Municipality not found")

    owner_data = payload.owner
    dog_data = payload.dog
    chip_number = str(dog_data.get("chip_number") or dog_data.get("chipnummer") or "").strip()
    if not chip_number:
        raise HTTPException(status_code=400, detail="Dog chip number is required")
    insurance_number = str(dog_data.get("insurance_number") or "").strip()
    if not insurance_number:
        raise HTTPException(status_code=400, detail="Insurance number is required.")
    assistance_dog = bool(getattr(payload, "assistance_dog", False))
    tax_reduced = bool(getattr(payload, "tax_reduced", False))
    reduction_reason = getattr(payload, "reduction_reason", None)
    liability_insurance_available = bool(getattr(payload, "liability_insurance_available", False))
    insurance_policy_number = getattr(payload, "insurance_policy_number", None)

    duplicate = db.scalar(
        select(Dog).where(
            Dog.municipality_id == municipality.id,
            Dog.chip_number == chip_number,
            Dog.status == "active",
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="A dog with this chip number is already active in this municipality")

    owner = db.scalar(
        select(Owner).where(
            Owner.municipality_id == municipality.id,
            Owner.user_id == context.current_user_id,
            Owner.first_name == owner_data.get("first_name"),
            Owner.last_name == owner_data.get("last_name"),
            Owner.date_of_birth == owner_data.get("date_of_birth"),
        )
    )
    if owner is None:
        owner = Owner(
            municipality_id=municipality.id,
            user_id=context.current_user_id,
            first_name=owner_data.get("first_name") or "",
            last_name=owner_data.get("last_name") or "",
            date_of_birth=owner_data.get("date_of_birth"),
            street=owner_data.get("street") or "",
            house_number=owner_data.get("house_number") or "",
            postal_code=owner_data.get("postal_code") or "",
            city=owner_data.get("city") or municipality.name,
            email=owner_data.get("email"),
            phone=owner_data.get("phone"),
        )
        db.add(owner)
        db.flush()

    dog_type = dog_data.get("dog_type") or dog_data.get("typ") or "NORMAL"
    dog = Dog(
        municipality_id=municipality.id,
        owner_id=owner.id,
        name=dog_data.get("name") or "",
        breed=dog_data.get("breed") or dog_data.get("rasse") or "",
        chip_number=chip_number,
        insurance_number=insurance_number,
        birth_date=dog_data.get("birth_date") or dog_data.get("geburtsdatum"),
        gender=dog_data.get("gender") or dog_data.get("geschlecht"),
        dog_type=dog_type,
        is_dangerous=1 if dog_type == "LISTENHUND" else 0,
        status="active",
    )
    db.add(dog)
    db.flush()

    registration = Registration(
        municipality_id=municipality.id,
        owner_id=owner.id,
        dog_id=dog.id,
        tax_rule_id=None,
        assessment_year=date.today().year,
        dog_position=1,
        annual_tax_amount=0,
        assistance_dog=1 if assistance_dog else 0,
        tax_reduced=1 if tax_reduced else 0,
        reduction_reason=reduction_reason,
        liability_insurance_available=1 if liability_insurance_available else 0,
        insurance_policy_number=insurance_policy_number,
        currency="EUR",
        status="pending_finance_verification",
    )
    db.add(registration)
    db.flush()
    _audit(db, "ANMELDUNG_CREATED", registration, context, {"chip_number": chip_number})
    db.commit()
    db.refresh(registration)
    return _registration_result(registration)


def _registration_result(registration: Registration) -> dict:
    return {
        "id": registration.id,
        "municipality_id": registration.municipality_id,
        "owner_id": registration.owner_id,
        "dog_id": registration.dog_id,
        "tax_rule_id": registration.tax_rule_id,
        "assessment_year": registration.assessment_year,
        "dog_position": registration.dog_position,
        "annual_tax_amount": registration.annual_tax_amount,
        "assistance_dog": registration.assistance_dog,
        "tax_reduced": registration.tax_reduced,
        "reduction_reason": registration.reduction_reason,
        "liability_insurance_available": registration.liability_insurance_available,
        "insurance_policy_number": registration.insurance_policy_number,
        "currency": registration.currency,
        "status": registration.status,
        "registered_at": registration.registered_at,
        "deregistered_at": registration.deregistered_at,
        "end_date": registration.end_date,
        "deregistration_reason": registration.deregistration_reason,
        "created_at": registration.created_at,
        "updated_at": registration.updated_at,
    }


def verify_new_dog_registration(db: Session, registration_id: int, action: RegistrationFinanceAction) -> dict:
    registration = _get_pending_registration(db, registration_id)
    _require_municipality_admin(action, registration.municipality_id)
    _audit(db, "DOG_REGISTRATION_VERIFIED", registration, action, {"notes": action.notes})
    db.commit()
    db.refresh(registration)
    return _registration_result(registration)


def approve_new_dog_registration(db: Session, registration_id: int, action: RegistrationFinanceAction) -> dict:
    registration = _get_pending_registration(db, registration_id)
    _require_municipality_admin(action, registration.municipality_id)
    dog = db.get(Dog, registration.dog_id)
    if dog is None:
        raise HTTPException(status_code=409, detail="Dog record is missing")
    active_before = db.scalar(
        select(func.count())
        .select_from(Registration)
        .where(
            Registration.municipality_id == registration.municipality_id,
            Registration.owner_id == registration.owner_id,
            Registration.status == "active",
            Registration.id != registration.id,
        )
    ) or 0
    tax = calculate_dog_tax(
        db,
        registration.municipality_id,
        active_before,
        dog.dog_type,
        assistance_dog=bool(registration.assistance_dog),
    )
    registration.status = "active"
    registration.tax_rule_id = tax["tax_rule_id"]
    registration.dog_position = tax["dog_position"]
    registration.annual_tax_amount = tax["amount_eur"]
    registration.tax_reduced = 1 if tax.get("tax_reduced") else registration.tax_reduced
    registration.reduction_reason = tax.get("reduction_reason") or registration.reduction_reason
    assessment = TaxAssessment(
        dog_registration_id=registration.id,
        transfer_request_id=None,
        municipality_id=registration.municipality_id,
        tax_rule_id=tax["tax_rule_id"],
        active_dogs_before=active_before,
        dog_position=tax["dog_position"],
        amount_eur=tax["amount_eur"],
    )
    db.add(assessment)
    _audit(db, "DOG_REGISTRATION_APPROVED", registration, action, {"notes": action.notes})
    _audit(db, "DOG_REGISTRATION_ACTIVATED", registration, action)
    _audit(db, "TAX_ASSESSED", registration, action, {"amount_eur": tax["amount_eur"], "tax_rule_id": tax["tax_rule_id"]})
    db.commit()
    db.refresh(registration)
    return _registration_result(registration)


def reject_new_dog_registration(db: Session, registration_id: int, action: RegistrationFinanceAction) -> dict:
    registration = _get_pending_registration(db, registration_id)
    _require_municipality_admin(action, registration.municipality_id)
    registration.status = "rejected"
    _audit(db, "DOG_REGISTRATION_REJECTED", registration, action, {"reason": action.reason, "notes": action.notes})
    db.commit()
    db.refresh(registration)
    return _registration_result(registration)


def _get_pending_registration(db: Session, registration_id: int) -> Registration:
    registration = db.get(Registration, registration_id)
    if registration is None:
        raise HTTPException(status_code=404, detail="Registration not found")
    if registration.status != "pending_finance_verification":
        raise HTTPException(status_code=409, detail=f"Registration is not pending finance verification: {registration.status}")
    return registration
