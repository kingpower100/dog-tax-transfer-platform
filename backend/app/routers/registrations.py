from datetime import date, datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DogTaxRule, Owner, Registration, User
from app.schemas import DemoContext, RegistrationFinanceAction, RegistrationOut, TransferFormDataResponse
from app.services.dog_registration_service import (
    approve_new_dog_registration,
    reject_new_dog_registration,
    verify_new_dog_registration,
)
from app.services.tax_service import calculate_dog_tax
from app.services.transfer_service import get_transfer_form_data
from app.services.tenant_service import resolve_tenant


router = APIRouter()


def demo_context(
    current_role: str = Query(default="citizen"),
    current_municipality_id: int | None = Query(default=None),
    current_user_id: int | None = Query(default=None),
) -> DemoContext:
    return DemoContext(
        current_role=current_role,
        current_municipality_id=current_municipality_id,
        current_user_id=current_user_id,
    )


@router.get("/registrierungen", response_model=list[RegistrationOut])
def list_registrations(
    x_mandant_id: str | None = Header(default=None, alias="X-Mandant-ID"),
    db: Session = Depends(get_db),
):
    tenant = resolve_tenant(db, x_mandant_id)
    return db.scalars(
        select(Registration)
        .where(Registration.municipality_id == tenant.id)
        .order_by(Registration.id.asc())
    ).all()


def _require_citizen_context(context: DemoContext) -> None:
    if context.current_role != "citizen" or context.current_user_id is None:
        raise HTTPException(status_code=400, detail="Citizen context with current_user_id is required")
    if context.current_municipality_id is None:
        raise HTTPException(status_code=400, detail="current_municipality_id is required")


def _tax_rule_reference(rule: DogTaxRule | None) -> str:
    if rule is None:
        return "No tax rule assigned yet"
    position = f"position {rule.dog_position}" if rule.dog_position is not None else "all positions"
    return f"Rule #{rule.id} - {rule.rule_type}, {position}, valid from {rule.valid_from}"


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


def _current_citizen_active_registration_rows(db: Session, context: DemoContext) -> list[Registration]:
    user = db.get(User, context.current_user_id)
    if user is None or user.role != "citizen":
        raise HTTPException(status_code=404, detail="Citizen user not found")
    return db.scalars(
        select(Registration)
        .join(Owner, Registration.owner_id == Owner.id)
        .where(
            _owner_identity_filter(user),
            Registration.municipality_id == context.current_municipality_id,
            Registration.status == "active",
        )
        .order_by(Registration.municipality_id.asc(), Registration.dog_position.asc(), Registration.id.asc())
    ).all()


@router.get("/citizen/me/dogs")
def list_current_citizen_dogs(
    context: DemoContext = Depends(demo_context),
    db: Session = Depends(get_db),
):
    _require_citizen_context(context)
    rows = _current_citizen_active_registration_rows(db, context)
    return [
        {
            "registration_id": registration.id,
            "registration_status": registration.status,
            "owner_name": f"{registration.owner.first_name} {registration.owner.last_name}".strip(),
            "dog_name": registration.dog.name,
            "chip_number": registration.dog.chip_number,
            "insurance_number": registration.dog.insurance_number,
            "breed": registration.dog.breed,
            "dog_type": registration.dog.dog_type,
            "municipality": registration.municipality.name,
            "municipality_id": registration.municipality_id,
            "dog_position": registration.dog_position,
            "annual_tax_amount": registration.annual_tax_amount,
            "currency": registration.currency,
            "tax_rule_id": registration.tax_rule_id,
            "tax_rule_reference": _tax_rule_reference(registration.tax_rule),
        }
        for registration in rows
    ]


@router.get("/citizen/registered-dogs")
def list_citizen_registered_dogs(
    context: DemoContext = Depends(demo_context),
    db: Session = Depends(get_db),
):
    return list_current_citizen_dogs(context, db)


@router.post("/citizen/me/tax-receipt-preview")
def current_citizen_tax_receipt_preview(
    context: DemoContext,
    db: Session = Depends(get_db),
):
    _require_citizen_context(context)
    active_rows = _current_citizen_active_registration_rows(db, context)
    items = []
    total = 0
    for registration in active_rows:
        calculated = calculate_dog_tax(
            db,
            registration.municipality_id,
            max(registration.dog_position - 1, 0),
            registration.dog.dog_type,
            assistance_dog=bool(registration.assistance_dog),
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
    owner_name = ""
    if active_rows:
        owner = active_rows[0].owner
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


@router.post("/citizen/tax-receipt-preview")
def citizen_tax_receipt_preview(
    context: DemoContext,
    db: Session = Depends(get_db),
):
    return current_citizen_tax_receipt_preview(context, db)


@router.get("/registrations/{registration_id}/transfer-form-data", response_model=TransferFormDataResponse)
def transfer_form_data(
    registration_id: int,
    context: DemoContext = Depends(demo_context),
    db: Session = Depends(get_db),
):
    return get_transfer_form_data(db, registration_id, context)


@router.post("/registrations/{registration_id}/finance/verify")
def finance_verify_registration(
    registration_id: int,
    action: RegistrationFinanceAction,
    db: Session = Depends(get_db),
):
    return verify_new_dog_registration(db, registration_id, action)


@router.post("/registrations/{registration_id}/finance/approve")
def finance_approve_registration(
    registration_id: int,
    action: RegistrationFinanceAction,
    db: Session = Depends(get_db),
):
    return approve_new_dog_registration(db, registration_id, action)


@router.post("/registrations/{registration_id}/finance/reject")
def finance_reject_registration(
    registration_id: int,
    action: RegistrationFinanceAction,
    db: Session = Depends(get_db),
):
    return reject_new_dog_registration(db, registration_id, action)
