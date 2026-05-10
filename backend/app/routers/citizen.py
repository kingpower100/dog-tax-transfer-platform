from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DogTaxRule, Owner, Registration, TaxAssessment, TransferRequest, User
from app.schemas import CitizenMeResponse, DemoContext
from app.services.tax_service import calculate_dog_tax


router = APIRouter()

ACTIVE_TRANSFER_STATUSES = {
    "draft",
    "form_prefilled",
    "citizen_submitted",
    "consent_given",
    "abmeldung_generated",
    "source_finance_verified",
    "source_finance_approved",
    "target_finance_verified",
    "target_finance_approved",
    "pending_source_approval",
    "released_by_source",
}


def demo_context(
    current_role: str = Query(default="citizen"),
    current_municipality_id: int | None = Query(default=None),
    current_user_id: int | None = Query(default=1001),
) -> DemoContext:
    return DemoContext(
        current_role=current_role,
        current_municipality_id=current_municipality_id,
        current_user_id=current_user_id,
    )


def _require_current_citizen(db: Session, context: DemoContext) -> User:
    if context.current_role != "citizen" or context.current_user_id is None:
        raise HTTPException(status_code=403, detail="Citizen context is required")
    user = db.get(User, context.current_user_id)
    if user is None or user.role != "citizen":
        raise HTTPException(status_code=404, detail="Citizen user not found")
    return user


def _owner_identity_filter(user: User):
    name_parts = (user.name or "").split()
    filters = []
    if len(name_parts) >= 2:
        filters.append(
            (Owner.user_id == user.id)
            & (Owner.first_name == name_parts[0])
            & (Owner.last_name == " ".join(name_parts[1:]))
        )
    if user.email:
        filters.append(Owner.email == user.email)
    if not filters:
        filters.append(Owner.user_id == user.id)
    return or_(*filters)


def _tax_rule_reference(rule: DogTaxRule | None) -> str | None:
    if rule is None:
        return None
    position = f"position {rule.dog_position}" if rule.dog_position is not None else "all positions"
    return f"Rule #{rule.id} - {rule.rule_type}, {position}, valid from {rule.valid_from}"


def _active_transfer(db: Session, registration: Registration) -> TransferRequest | None:
    return db.scalar(
        select(TransferRequest)
        .where(
            TransferRequest.source_registration_id == registration.id,
            TransferRequest.status.in_(ACTIVE_TRANSFER_STATUSES),
        )
        .order_by(TransferRequest.created_at.desc(), TransferRequest.id.desc())
    )


def _latest_tax_assessment(db: Session, registration: Registration) -> TaxAssessment | None:
    return db.scalar(
        select(TaxAssessment)
        .where(TaxAssessment.dog_registration_id == registration.id)
        .order_by(TaxAssessment.calculated_at.desc(), TaxAssessment.id.desc())
    )


@router.get("/citizen/me", response_model=CitizenMeResponse)
def get_current_citizen_dashboard(
    context: DemoContext = Depends(demo_context),
    db: Session = Depends(get_db),
):
    user = _require_current_citizen(db, context)
    query = (
        select(Registration)
        .join(Owner, Registration.owner_id == Owner.id)
        .where(
            _owner_identity_filter(user),
            Registration.status == "active",
        )
        .order_by(Registration.registered_at.desc(), Registration.id.desc())
    )
    registrations = db.scalars(query).all()

    primary_owner = registrations[0].owner if registrations else db.scalar(
        select(Owner)
        .where(_owner_identity_filter(user))
        .order_by(Owner.updated_at.desc(), Owner.id.desc())
    )

    dogs = []
    for registration in registrations:
        assessment = _latest_tax_assessment(db, registration)
        tax_rule = assessment.tax_rule if assessment else registration.tax_rule
        transfer = _active_transfer(db, registration)
        dogs.append(
            {
                "dog_id": registration.dog.id,
                "registration_id": registration.id,
                "dog_name": registration.dog.name,
                "chip_number": registration.dog.chip_number,
                "insurance_number": registration.dog.insurance_number,
                "breed": registration.dog.breed,
                "dog_type": registration.dog.dog_type,
                "municipality_id": registration.municipality_id,
                "municipality_name": registration.municipality.name,
                "registration_status": registration.status,
                "registration_start_date": registration.registered_at,
                "registration_end_date": registration.end_date,
                "annual_tax_eur": assessment.amount_eur if assessment else registration.annual_tax_amount,
                "tax_rule_id": tax_rule.id if tax_rule else registration.tax_rule_id,
                "tax_rule_reference": _tax_rule_reference(tax_rule),
                "tax_assessment_id": assessment.id if assessment else None,
                "active_transfer_id": transfer.id if transfer else None,
                "active_transfer_status": transfer.status if transfer else None,
            }
        )

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.upper(),
        },
        "owner": {
            "id": primary_owner.id,
            "first_name": primary_owner.first_name,
            "last_name": primary_owner.last_name,
            "date_of_birth": primary_owner.date_of_birth,
            "street": primary_owner.street,
            "house_number": primary_owner.house_number,
            "postal_code": primary_owner.postal_code,
            "city": primary_owner.city,
            "municipality_id": primary_owner.municipality_id,
            "municipality_name": primary_owner.municipality.name,
        }
        if primary_owner
        else None,
        "dogs": dogs,
    }


@router.post("/citizen/me/tax-receipt-preview")
def current_citizen_tax_receipt_preview(
    context: DemoContext,
    db: Session = Depends(get_db),
):
    user = _require_current_citizen(db, context)
    query = (
        select(Registration)
        .join(Owner, Registration.owner_id == Owner.id)
        .where(
            _owner_identity_filter(user),
            Registration.status == "active",
        )
        .order_by(Registration.municipality_id.asc(), Registration.dog_position.asc(), Registration.id.asc())
    )
    registrations = db.scalars(query).all()

    items = []
    total = 0
    for registration in registrations:
        calculated = calculate_dog_tax(
            db,
            registration.municipality_id,
            registration.dog_position,
            registration.dog.dog_type,
            assistance_dog=bool(getattr(registration, "assistance_dog", False)),
        )
        rule = db.get(DogTaxRule, calculated["tax_rule_id"])
        total += calculated["amount_eur"]
        items.append(
            {
                "dog_name": registration.dog.name,
                "chip_number": registration.dog.chip_number,
                "insurance_number": registration.dog.insurance_number,
                "municipality": registration.municipality.name,
                "dog_type": registration.dog.dog_type,
                "registration_id": registration.id,
                "calculated_amount_eur": calculated["amount_eur"],
                "dog_position": registration.dog_position,
                "tax_rule_id": calculated["tax_rule_id"],
                "tax_rule_reference": _tax_rule_reference(rule),
            }
        )

    owner_name = user.name
    if registrations:
        owner = registrations[0].owner
        owner_name = f"{owner.first_name} {owner.last_name}".strip()
    return {
        "owner_name": owner_name,
        "tax_period": date.today().year,
        "generated_date": datetime.utcnow(),
        "status": "Preview / Not official until approved",
        "dogs": items,
        "total_amount_eur": total,
        "dog_count": len(items),
    }
