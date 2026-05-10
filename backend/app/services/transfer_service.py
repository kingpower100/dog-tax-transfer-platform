import json
from datetime import date, datetime

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Dog,
    Municipality,
    Owner,
    Registration,
    TaxAssessment,
    TransferApproval,
    TransferDocument,
    TransferPayload,
    TransferRequest,
    User,
)
from app.schemas import (
    AnmeldungRequest,
    DemoContext,
    FinanceApproveRequest,
    FinanceRejectRequest,
    FinanceVerifyRequest,
    TransferAction,
    TransferConsentRequest,
    TransferCreateRequest,
    TransferRequestCreate,
    UmmeldungRequest,
)
from app.services.audit_service import create_audit_log, write_audit_log
from app.services.tax_service import calculate_dog_tax


def _require_platform_or_involved(transfer: TransferRequest, context: DemoContext) -> None:
    if context.current_role == "platform_admin":
        return
    if context.current_municipality_id in {
        transfer.from_municipality_id,
        transfer.to_municipality_id,
    }:
        return
    raise HTTPException(status_code=403, detail="Transfer is not visible to this demo actor")


def _require_municipality_admin(context: DemoContext, municipality_id: int) -> None:
    if context.current_role not in {
        "municipality_admin",
        "municipality_finance",
        "source_municipality_finance",
        "target_municipality_finance",
    }:
        raise HTTPException(status_code=403, detail="Municipality finance role is required")
    if context.current_municipality_id != municipality_id:
        raise HTTPException(status_code=403, detail="Wrong municipality for this action")


def _ensure_demo_user(db: Session, user_id: int | None, role: str, municipality_id: int | None = None) -> None:
    if user_id is None:
        return
    normalized_role = "municipality_admin" if role in {
        "municipality_finance",
        "source_municipality_finance",
        "target_municipality_finance",
    } else role

    existing = db.get(User, user_id)
    if existing is not None:
        if existing.role != normalized_role:
            raise HTTPException(status_code=403, detail="Demo role does not match the submitted user")
        if normalized_role == "municipality_admin" and existing.municipality_id != municipality_id:
            raise HTTPException(status_code=403, detail="Demo municipality does not match the submitted user")
        if normalized_role == "platform_admin" and existing.municipality_id is not None:
            raise HTTPException(status_code=403, detail="Platform admin demo users must not be tenant-bound")
        return

    db.add(
        User(
            id=user_id,
            name=f"User {user_id}",
            email=f"user.{user_id}@example.local",
            password_hash="local",
            role=normalized_role,
            municipality_id=municipality_id if normalized_role == "municipality_admin" else None,
        )
    )
    db.flush()


def _source_owner_query(db: Session, transfer: TransferRequest) -> Owner:
    owner = db.get(Owner, transfer.source_owner_id)
    if owner is None or owner.municipality_id != transfer.from_municipality_id:
        raise HTTPException(status_code=409, detail="Transfer source owner integrity check failed")
    return owner


def _source_dog_query(db: Session, transfer: TransferRequest) -> Dog:
    dog = db.get(Dog, transfer.source_dog_id)
    if dog is None or dog.municipality_id != transfer.from_municipality_id:
        raise HTTPException(status_code=409, detail="Transfer source dog integrity check failed")
    return dog


def _active_source_registration(db: Session, transfer: TransferRequest) -> Registration | None:
    if transfer.source_registration_id is None:
        return None
    registration = db.get(Registration, transfer.source_registration_id)
    if (
        registration is None
        or registration.municipality_id != transfer.from_municipality_id
        or registration.owner_id != transfer.source_owner_id
        or registration.dog_id != transfer.source_dog_id
    ):
        raise HTTPException(status_code=409, detail="Transfer source registration integrity check failed")
    return registration


def _require_citizen_owner(db: Session, transfer: TransferRequest, context: DemoContext) -> Owner:
    if context.current_role != "citizen" or context.current_user_id is None:
        raise HTTPException(status_code=403, detail="Citizen demo user is required")
    owner = _source_owner_query(db, transfer)
    if owner.user_id != context.current_user_id:
        raise HTTPException(status_code=403, detail="Citizen does not own this transfer")
    return owner


def _minimal_payload(source: Municipality, target: Municipality, owner: Owner, dog: Dog, deregistration_date: datetime) -> dict:
    return {
        "owner_full_name": f"{owner.first_name} {owner.last_name}".strip(),
        "owner_name": f"{owner.first_name} {owner.last_name}".strip(),
        "owner_date_of_birth": owner.date_of_birth,
        "dog_name": dog.name,
        "breed": dog.breed,
        "birth_date": dog.birth_date,
        "chip_number": dog.chip_number,
        "insurance_number": dog.insurance_number,
        "dog_type": dog.dog_type,
        "dangerous_dog": bool(dog.is_dangerous),
        "source_municipality_name": source.name,
        "target_municipality_name": target.name,
        "deregistration_date": deregistration_date.isoformat(),
        "move_date": deregistration_date.isoformat(),
    }


def _registration_case_fields(
    *,
    assistance_dog: bool = False,
    tax_reduced: bool = False,
    reduction_reason: str | None = None,
    liability_insurance_available: bool = False,
    insurance_policy_number: str | None = None,
) -> dict:
    return {
        "assistance_dog": 1 if assistance_dog else 0,
        "tax_reduced": 1 if tax_reduced else 0,
        "reduction_reason": reduction_reason,
        "liability_insurance_available": 1 if liability_insurance_available else 0,
        "insurance_policy_number": insurance_policy_number,
    }


def _latest_payload(db: Session, transfer_id: int) -> TransferPayload | None:
    return db.scalar(
        select(TransferPayload)
        .where(TransferPayload.transfer_request_id == transfer_id)
        .order_by(TransferPayload.id.desc())
        .limit(1)
    )


def serialize_transfer(transfer: TransferRequest, include_payload: bool = False, db: Session | None = None) -> dict:
    payload = None
    if include_payload and db is not None:
        transfer_payload = _latest_payload(db, transfer.id)
        payload = json.loads(transfer_payload.payload_json) if transfer_payload else None

    source_dog = db.get(Dog, transfer.source_dog_id) if db is not None and transfer.source_dog_id is not None else None
    target_registration = transfer.target_registration if transfer.target_registration_id else None
    tax_assessment = transfer.tax_assessment
    tax_preview = None
    if (
        db is not None
        and target_registration is None
        and transfer.status in {"target_finance_verified", "target_finance_approved"}
    ):
        try:
            source_dog = _source_dog_query(db, transfer)
            tax_preview = calculate_dog_tax(db, transfer.to_municipality_id, 0, source_dog.dog_type)
        except HTTPException:
            tax_preview = None
    return {
        "id": transfer.id,
        "citizen_user_id": transfer.citizen_user_id,
        "dog_id": transfer.dog_id or transfer.source_dog_id,
        "owner_id": transfer.owner_id or transfer.source_owner_id,
        "source_registration_id": transfer.source_registration_id,
        "source_municipality_id": transfer.source_municipality_id or transfer.from_municipality_id,
        "target_municipality_id": transfer.target_municipality_id or transfer.to_municipality_id,
        "target_owner_id": transfer.target_owner_id,
        "target_dog_id": transfer.target_dog_id,
        "target_registration_id": transfer.target_registration_id,
        "from_municipality": transfer.from_municipality.name,
        "to_municipality": transfer.to_municipality.name,
        "dog_name": source_dog.name if source_dog is not None else (payload or {}).get("dog_name"),
        "chip_number": transfer.chip_number,
        "insurance_number": transfer.insurance_number,
        "status": transfer.status,
        "target_street": transfer.target_street,
        "target_house_number": transfer.target_house_number,
        "target_postal_code": transfer.target_postal_code,
        "target_city": transfer.target_city,
        "move_date": transfer.move_date,
        "deregistration_date": transfer.deregistration_date,
        "deregistration_reason": transfer.deregistration_reason,
        "consent_given": transfer.consent_given,
        "consent_given_at": transfer.consent_given_at,
        "consent_actor_user_id": transfer.consent_actor_user_id,
        "abmeldung_generated_at": transfer.abmeldung_generated_at,
        "source_verified_at": transfer.source_verified_at,
        "source_approved": transfer.source_approved,
        "source_approved_at": transfer.source_approved_at,
        "target_verified_at": transfer.target_verified_at,
        "target_accepted": transfer.target_accepted,
        "target_accepted_at": transfer.target_accepted_at,
        "target_approved_at": transfer.target_approved_at,
        "created_at": transfer.created_at,
        "updated_at": transfer.updated_at,
        "completed_at": transfer.completed_at,
        "rejected_at": transfer.rejected_at,
        "rejection_reason": transfer.rejection_reason,
        "annual_tax_amount": target_registration.annual_tax_amount if target_registration else None,
        "dog_position": target_registration.dog_position if target_registration else None,
        "transfer_payload": payload,
        "tax_assessment": {
            "id": tax_assessment.id,
            "transfer_request_id": tax_assessment.transfer_request_id,
            "municipality_id": tax_assessment.municipality_id,
            "tax_rule_id": tax_assessment.tax_rule_id,
            "active_dogs_before": tax_assessment.active_dogs_before,
            "dog_position": tax_assessment.dog_position,
            "amount_eur": tax_assessment.amount_eur,
            "created_at": tax_assessment.created_at,
        }
        if tax_assessment is not None
        else None,
        "tax_preview": tax_preview,
    }


def create_legacy_transfer_request(db: Session, request: TransferRequestCreate) -> dict:
    if request.current_role != "citizen" or request.current_user_id is None:
        raise HTTPException(status_code=403, detail="Citizen demo context is required")
    if request.from_municipality_id == request.to_municipality_id:
        raise HTTPException(status_code=400, detail="Source and target municipalities must be different")
    if request.current_municipality_id != request.from_municipality_id:
        raise HTTPException(status_code=403, detail="Citizen demo municipality must match the source municipality")

    source = db.get(Municipality, request.from_municipality_id)
    target = db.get(Municipality, request.to_municipality_id)
    if source is None or target is None:
        raise HTTPException(status_code=404, detail="Unknown source or target municipality")
    _ensure_demo_user(db, request.current_user_id, "citizen")

    chip_number = request.chip_number.strip()
    source_dog = db.scalar(
        select(Dog).where(
            Dog.municipality_id == source.id,
            Dog.chip_number == chip_number,
            Dog.status == "active",
        )
    )
    if source_dog is None:
        raise HTTPException(status_code=404, detail="No active source dog found")
    source_owner = db.get(Owner, source_dog.owner_id)
    if source_owner is None or source_owner.municipality_id != source.id:
        raise HTTPException(status_code=409, detail="Source owner integrity check failed")
    if source_owner.user_id is None:
        source_owner.user_id = request.current_user_id
    elif source_owner.user_id != request.current_user_id:
        raise HTTPException(status_code=403, detail="Citizen does not own this source dog")

    existing_open = db.scalar(
        select(TransferRequest).where(
            TransferRequest.source_dog_id == source_dog.id,
            TransferRequest.status.in_(["draft", "pending_source_approval", "released_by_source"]),
        )
    )
    if existing_open is not None:
        raise HTTPException(status_code=409, detail="An open transfer already exists for this dog")

    source_registration = db.scalar(
        select(Registration).where(
            Registration.municipality_id == source.id,
            Registration.owner_id == source_owner.id,
            Registration.dog_id == source_dog.id,
            Registration.status == "active",
        )
    )

    transfer = TransferRequest(
        citizen_user_id=request.current_user_id,
        dog_id=source_dog.id,
        owner_id=source_owner.id,
        source_municipality_id=source.id,
        target_municipality_id=target.id,
        from_municipality_id=source.id,
        to_municipality_id=target.id,
        source_owner_id=source_owner.id,
        source_dog_id=source_dog.id,
        source_registration_id=source_registration.id if source_registration else None,
        chip_number=chip_number,
        status="draft",
        consent_given=0,
        source_approved=0,
        target_accepted=0,
    )
    db.add(transfer)
    db.flush()
    create_audit_log(
        db,
        "TRANSFER_REQUEST_CREATED",
        {"transfer_request_id": transfer.id, "chip_number": chip_number},
        actor_role="citizen",
        actor_user_id=request.current_user_id,
        actor_municipality_id=source.id,
        transfer_request_id=transfer.id,
    )
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer)


def _assert_transfer_status(transfer: TransferRequest, allowed: set[str], action: str) -> None:
    if transfer.status not in allowed:
        raise HTTPException(status_code=409, detail=f"{action} is not allowed from status {transfer.status}")


def give_transfer_consent(db: Session, transfer_id: int, action: TransferAction) -> dict:
    if hasattr(action, "consent_accepted"):
        return give_workflow_transfer_consent(db, transfer_id, action)
    transfer = db.get(TransferRequest, transfer_id)
    if transfer is None:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    _require_citizen_owner(db, transfer, action)
    _ensure_demo_user(db, action.current_user_id, "citizen")
    if action.current_municipality_id != transfer.from_municipality_id:
        raise HTTPException(status_code=403, detail="Citizen demo municipality must match the source municipality")
    _assert_transfer_status(transfer, {"draft"}, "Consent")
    if transfer.consent_given:
        raise HTTPException(status_code=409, detail="Consent has already been recorded")

    now = datetime.utcnow()
    transfer.status = "pending_source_approval"
    transfer.consent_given = 1
    transfer.consent_given_at = now
    transfer.consent_actor_user_id = action.current_user_id
    create_audit_log(
        db,
        "CONSENT_GIVEN",
        {"transfer_request_id": transfer.id},
        actor_role="citizen",
        actor_user_id=action.current_user_id,
        actor_municipality_id=transfer.from_municipality_id,
        transfer_request_id=transfer.id,
    )
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer)


def approve_source_release(db: Session, transfer_id: int, action: TransferAction) -> dict:
    transfer = db.get(TransferRequest, transfer_id)
    if transfer is None:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    _require_municipality_admin(action, transfer.from_municipality_id)
    _ensure_demo_user(db, action.current_user_id, "municipality_admin", transfer.from_municipality_id)
    _assert_transfer_status(transfer, {"pending_source_approval"}, "Source approval")
    if not transfer.consent_given or transfer.consent_given_at is None:
        raise HTTPException(status_code=409, detail="Source approval requires citizen consent")

    source = transfer.from_municipality
    target = transfer.to_municipality
    source_owner = _source_owner_query(db, transfer)
    source_dog = _source_dog_query(db, transfer)
    source_registration = _active_source_registration(db, transfer)
    now = datetime.utcnow()

    payload = _minimal_payload(source, target, source_owner, source_dog, now)
    db.add(
        TransferPayload(
            transfer_request_id=transfer.id,
            payload_json=json.dumps(payload, sort_keys=True, ensure_ascii=False),
        )
    )
    source_dog.status = "transferred"
    if source_registration is not None:
        source_registration.status = "deregistered"
        source_registration.deregistered_at = now
    transfer.status = "released_by_source"
    transfer.source_approved = 1
    transfer.source_approved_at = now
    create_audit_log(
        db,
        "SOURCE_APPROVED_RELEASE",
        {"transfer_request_id": transfer.id, "minimal_payload_fields": sorted(payload.keys())},
        actor_role="municipality_admin",
        actor_user_id=action.current_user_id,
        actor_municipality_id=transfer.from_municipality_id,
        transfer_request_id=transfer.id,
    )
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def _name_parts(full_name: str) -> tuple[str, str]:
    parts = full_name.strip().split()
    if not parts:
        return "Unknown", "Owner"
    if len(parts) == 1:
        return parts[0], "Owner"
    return parts[0], " ".join(parts[1:])


def accept_target_transfer(db: Session, transfer_id: int, action: TransferAction) -> dict:
    transfer = db.get(TransferRequest, transfer_id)
    if transfer is None:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    _require_municipality_admin(action, transfer.to_municipality_id)
    _ensure_demo_user(db, action.current_user_id, "municipality_admin", transfer.to_municipality_id)
    if action.current_municipality_id != transfer.to_municipality_id:
        raise HTTPException(status_code=403, detail="Target acceptance requires the target municipality context")
    _assert_transfer_status(transfer, {"released_by_source"}, "Target acceptance")
    if transfer.source_approved_at is None:
        raise HTTPException(status_code=409, detail="Target acceptance requires source release")
    source_registration = _active_source_registration(db, transfer)
    source_assistance_dog = bool(source_registration.assistance_dog) if source_registration is not None else False
    source_tax_reduced = bool(source_registration.tax_reduced) if source_registration is not None else False
    source_reduction_reason = source_registration.reduction_reason if source_registration is not None else None
    source_liability_insurance_available = bool(source_registration.liability_insurance_available) if source_registration is not None else False
    source_insurance_policy_number = source_registration.insurance_policy_number if source_registration is not None else None

    transfer_payload = _latest_payload(db, transfer.id)
    if transfer_payload is None:
        raise HTTPException(status_code=409, detail="Released transfer has no payload")
    payload = json.loads(transfer_payload.payload_json)
    first_name, last_name = _name_parts(payload["owner_full_name"])

    target_owner = db.scalar(
        select(Owner).where(
            Owner.municipality_id == transfer.to_municipality_id,
            Owner.first_name == first_name,
            Owner.last_name == last_name,
            Owner.date_of_birth == payload.get("owner_date_of_birth"),
        )
    )
    if target_owner is None:
        target_owner = Owner(
            municipality_id=transfer.to_municipality_id,
            user_id=transfer.consent_actor_user_id,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=payload.get("owner_date_of_birth"),
            street=transfer.target_street or "",
            house_number=transfer.target_house_number or "",
            postal_code=transfer.target_postal_code or "",
            city=transfer.target_city or transfer.to_municipality.name,
        )
        db.add(target_owner)
        db.flush()

    source_registration = _active_source_registration(db, transfer)
    existing_active_dogs = (
        db.scalar(
            select(func.count()).select_from(Dog).where(
                Dog.municipality_id == transfer.to_municipality_id,
                Dog.owner_id == target_owner.id,
                Dog.status == "active",
            )
        )
        or 0
    )
    dog_type = "LISTENHUND" if payload["dangerous_dog"] else "NORMAL"
    tax = calculate_dog_tax(
        db,
        transfer.to_municipality_id,
        existing_active_dogs,
        dog_type,
        assistance_dog=source_assistance_dog,
    )
    dog_position = tax["dog_position"]

    target_dog = Dog(
        municipality_id=transfer.to_municipality_id,
        owner_id=target_owner.id,
        name=payload["dog_name"],
        breed=payload["breed"],
        chip_number=payload["chip_number"],
        insurance_number=payload.get("insurance_number") or transfer.insurance_number,
        dog_type=dog_type,
        is_dangerous=1 if payload["dangerous_dog"] else 0,
        status="active",
    )
    db.add(target_dog)
    db.flush()

    now = datetime.utcnow()
    target_registration = Registration(
        municipality_id=transfer.to_municipality_id,
        owner_id=target_owner.id,
        dog_id=target_dog.id,
        tax_rule_id=tax["tax_rule_id"],
        assessment_year=date.today().year,
        dog_position=dog_position,
        annual_tax_amount=tax["amount_eur"],
        **_registration_case_fields(
            assistance_dog=source_assistance_dog,
            tax_reduced=bool(source_tax_reduced or tax.get("tax_reduced")),
            reduction_reason=tax.get("reduction_reason") or source_reduction_reason,
            liability_insurance_available=source_liability_insurance_available,
            insurance_policy_number=source_insurance_policy_number,
        ),
        currency="EUR",
        status="active",
    )
    db.add(target_registration)
    db.flush()

    tax_assessment = TaxAssessment(
        dog_registration_id=target_registration.id,
        transfer_request_id=transfer.id,
        municipality_id=transfer.to_municipality_id,
        tax_rule_id=tax["tax_rule_id"],
        active_dogs_before=existing_active_dogs,
        dog_position=dog_position,
        amount_eur=tax["amount_eur"],
    )
    db.add(tax_assessment)
    db.flush()

    transfer.target_owner_id = target_owner.id
    transfer.target_dog_id = target_dog.id
    transfer.target_registration_id = target_registration.id
    transfer.status = "completed"
    transfer.target_accepted = 1
    transfer.target_accepted_at = now
    transfer.completed_at = now
    create_audit_log(
        db,
        "TARGET_ACCEPTED_COMPLETED",
        {
            "transfer_request_id": transfer.id,
            "target_registration_id": target_registration.id,
            "dog_position": dog_position,
            "amount_eur": tax["amount_eur"],
            "tax_rule_id": tax["tax_rule_id"],
            "active_dogs_before": existing_active_dogs,
        },
        actor_role="municipality_admin",
        actor_user_id=action.current_user_id,
        actor_municipality_id=transfer.to_municipality_id,
        transfer_request_id=transfer.id,
    )
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def reject_transfer_request(db: Session, transfer_id: int, action: TransferAction) -> dict:
    transfer = db.get(TransferRequest, transfer_id)
    if transfer is None:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    if action.current_municipality_id not in {transfer.from_municipality_id, transfer.to_municipality_id}:
        raise HTTPException(status_code=403, detail="Only involved municipalities can reject")
    _require_municipality_admin(action, action.current_municipality_id or -1)
    _ensure_demo_user(db, action.current_user_id, "municipality_admin", action.current_municipality_id)
    if transfer.status in {"completed", "rejected"}:
        raise HTTPException(status_code=409, detail="Transfer cannot be rejected from its current status")

    transfer.status = "rejected"
    transfer.rejected_at = datetime.utcnow()
    transfer.rejection_reason = action.reason
    create_audit_log(
        db,
        "TRANSFER_REJECTED",
        {"transfer_request_id": transfer.id, "reason": action.reason},
        actor_role="municipality_admin",
        actor_user_id=action.current_user_id,
        actor_municipality_id=action.current_municipality_id,
        transfer_request_id=transfer.id,
    )
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


WORKFLOW_ORDER = {
    "draft": 0,
    "form_prefilled": 1,
    "citizen_submitted": 2,
    "consent_given": 3,
    "abmeldung_generated": 4,
    "source_finance_verified": 5,
    "source_finance_approved": 6,
    "target_finance_verified": 7,
    "target_finance_approved": 8,
    "completed": 9,
}


def _audit(
    db: Session,
    action: str,
    transfer: TransferRequest,
    context: DemoContext,
    details: dict | None = None,
) -> None:
    if context.current_user_id is not None:
        _ensure_demo_user(
            db,
            context.current_user_id,
            context.current_role,
            context.current_municipality_id if context.current_role == "municipality_admin" else None,
        )
    write_audit_log(
        db,
        context.current_user_id,
        context.current_role,
        context.current_municipality_id,
        action,
        "transfer_request",
        transfer.id,
        details or {},
    )


def _get_transfer(db: Session, transfer_id: int) -> TransferRequest:
    transfer = db.get(TransferRequest, transfer_id)
    if transfer is None:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    return transfer


def _get_source_registration(db: Session, registration_id: int) -> Registration:
    registration = db.get(Registration, registration_id)
    if registration is None or registration.status != "active":
        raise HTTPException(status_code=404, detail="Active source registration not found")
    return registration


def _require_registration_access(db: Session, registration: Registration, context: DemoContext) -> tuple[Owner, Dog]:
    owner = db.get(Owner, registration.owner_id)
    dog = db.get(Dog, registration.dog_id)
    if owner is None or dog is None:
        raise HTTPException(status_code=409, detail="Registration owner or dog is missing")
    if context.current_role == "citizen":
        if context.current_user_id is None or owner.user_id != context.current_user_id:
            raise HTTPException(status_code=403, detail="Citizen does not own this registration")
        return owner, dog
    _require_municipality_admin(context, registration.municipality_id)
    return owner, dog


def _require_source_finance(transfer: TransferRequest, context: DemoContext) -> None:
    _require_municipality_admin(context, transfer.from_municipality_id)


def _require_target_finance(transfer: TransferRequest, context: DemoContext) -> None:
    _require_municipality_admin(context, transfer.to_municipality_id)


def _approval(
    db: Session,
    transfer: TransferRequest,
    approval_type: str,
    municipality_id: int,
) -> TransferApproval:
    approval = db.scalar(
        select(TransferApproval).where(
            TransferApproval.transfer_request_id == transfer.id,
            TransferApproval.approval_type == approval_type,
        )
    )
    if approval is None:
        approval = TransferApproval(
            transfer_request_id=transfer.id,
            municipality_id=municipality_id,
            approval_type=approval_type,
            status="draft",
        )
        db.add(approval)
        db.flush()
    return approval


def get_transfer_form_data(db: Session, registration_id: int, current_user: DemoContext) -> dict:
    registration = _get_source_registration(db, registration_id)
    owner, dog = _require_registration_access(db, registration, current_user)
    municipality = db.get(Municipality, registration.municipality_id)
    targets = db.scalars(
        select(Municipality)
        .where(Municipality.id != registration.municipality_id)
        .order_by(Municipality.name.asc())
    ).all()
    return {
        "registration": {
            "id": registration.id,
            "status": registration.status,
            "registered_at": registration.registered_at,
            "assessment_year": registration.assessment_year,
            "annual_tax_amount": registration.annual_tax_amount,
            "assistance_dog": registration.assistance_dog,
            "tax_reduced": registration.tax_reduced,
            "reduction_reason": registration.reduction_reason,
            "liability_insurance_available": registration.liability_insurance_available,
            "insurance_policy_number": registration.insurance_policy_number,
            "dog_position": registration.dog_position,
        },
        "owner": {
            "id": owner.id,
            "first_name": owner.first_name,
            "last_name": owner.last_name,
            "date_of_birth": owner.date_of_birth,
            "street": owner.street,
            "house_number": owner.house_number,
            "postal_code": owner.postal_code,
            "city": owner.city,
            "email": owner.email,
            "phone": owner.phone,
        },
        "dog": {
            "id": dog.id,
            "name": dog.name,
            "breed": dog.breed,
            "birth_date": dog.birth_date,
            "gender": dog.gender,
            "chip_number": dog.chip_number,
            "insurance_number": dog.insurance_number,
            "dog_type": dog.dog_type,
            "is_dangerous": dog.is_dangerous,
            "status": dog.status,
        },
        "source_municipality": {
            "id": municipality.id,
            "name": municipality.name,
            "code": municipality.code,
        },
        "target_municipalities": [
            {"id": target.id, "name": target.name, "code": target.code}
            for target in targets
        ],
    }


def create_workflow_transfer_request(db: Session, payload: TransferCreateRequest, current_user: DemoContext | None = None) -> dict:
    context = current_user or payload
    if context.current_role != "citizen" or context.current_user_id is None:
        raise HTTPException(status_code=403, detail="Citizen context is required")
    registration = _get_source_registration(db, payload.registration_id)
    owner, dog = _require_registration_access(db, registration, context)
    target = db.get(Municipality, payload.target_municipality_id)
    source = db.get(Municipality, registration.municipality_id)
    if target is None or source is None:
        raise HTTPException(status_code=404, detail="Unknown source or target municipality")
    if target.id == source.id:
        raise HTTPException(status_code=400, detail="Target municipality must differ from source municipality")

    # Proactive duplicate check in target municipality
    duplicate_in_target = db.scalar(
        select(Dog).where(
            Dog.municipality_id == target.id,
            Dog.chip_number == dog.chip_number,
            Dog.status == "active",
        )
    )
    if duplicate_in_target is not None:
        raise HTTPException(
            status_code=409,
            detail=f"The dog with chip {dog.chip_number} is already registered as active in {target.name}.",
        )

    insurance_number = (payload.insurance_number or "").strip()
    if not insurance_number:
        raise HTTPException(status_code=400, detail="Insurance number is required.")
    existing_open = db.scalar(
        select(TransferRequest).where(
            TransferRequest.source_registration_id == registration.id,
            TransferRequest.status.notin_(["completed", "source_rejected", "target_rejected", "cancelled", "rejected"]),
        )
    )
    if existing_open is not None:
        raise HTTPException(status_code=409, detail="An open transfer already exists for this registration")
    transfer = TransferRequest(
        citizen_user_id=context.current_user_id,
        dog_id=dog.id,
        owner_id=owner.id,
        source_municipality_id=source.id,
        target_municipality_id=target.id,
        from_municipality_id=source.id,
        to_municipality_id=target.id,
        source_owner_id=owner.id,
        source_dog_id=dog.id,
        source_registration_id=registration.id,
        chip_number=dog.chip_number,
        insurance_number=insurance_number,
        status="citizen_submitted",
        target_street=payload.target_street,
        target_house_number=payload.target_house_number,
        target_postal_code=payload.target_postal_code,
        target_city=payload.target_city,
        move_date=payload.move_date,
        deregistration_date=payload.deregistration_date,
        deregistration_reason=payload.deregistration_reason or "moved_to_other_municipality",
        consent_given=0,
        source_approved=0,
        target_accepted=0,
    )
    db.add(transfer)
    db.flush()
    _audit(db, "TRANSFER_SUBMITTED", transfer, context, {"registration_id": registration.id})
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def create_transfer_request(db: Session, request: TransferRequestCreate | TransferCreateRequest) -> dict:
    if hasattr(request, "registration_id"):
        return create_workflow_transfer_request(db, request)
    return create_legacy_transfer_request(db, request)


def submit_transfer_form(db: Session, transfer_id: int, payload: TransferCreateRequest, current_user: DemoContext) -> dict:
    transfer = _get_transfer(db, transfer_id)
    _require_citizen_owner(db, transfer, current_user)
    _assert_transfer_status(transfer, {"draft", "form_prefilled", "citizen_submitted"}, "Form submission")
    transfer.target_municipality_id = payload.target_municipality_id
    transfer.to_municipality_id = payload.target_municipality_id
    transfer.target_street = payload.target_street
    transfer.target_house_number = payload.target_house_number
    transfer.target_postal_code = payload.target_postal_code
    transfer.target_city = payload.target_city
    transfer.move_date = payload.move_date
    transfer.deregistration_date = payload.deregistration_date
    transfer.deregistration_reason = payload.deregistration_reason
    transfer.insurance_number = (payload.insurance_number or "").strip()
    if not transfer.insurance_number:
        raise HTTPException(status_code=400, detail="Insurance number is required.")
    transfer.status = "citizen_submitted"
    _audit(db, "TRANSFER_SUBMITTED", transfer, current_user)
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def give_workflow_transfer_consent(db: Session, transfer_id: int, consent_payload: TransferConsentRequest) -> dict:
    transfer = _get_transfer(db, transfer_id)
    _require_citizen_owner(db, transfer, consent_payload)
    _assert_transfer_status(transfer, {"citizen_submitted"}, "Consent")
    if not consent_payload.consent_accepted:
        raise HTTPException(status_code=400, detail="Consent must be accepted")
    now = datetime.utcnow()
    transfer.consent_given = 1
    transfer.consent_given_at = now
    transfer.consent_actor_user_id = consent_payload.current_user_id
    transfer.consent_text = consent_payload.consent_text
    transfer.citizen_user_id = consent_payload.current_user_id
    transfer.status = "consent_given"
    _audit(db, "CONSENT_GIVEN", transfer, consent_payload, {"consent_text": consent_payload.consent_text})
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def _generate_abmeldung_content(db: Session, transfer: TransferRequest, generated_at: datetime) -> str:
    owner = _source_owner_query(db, transfer)
    dog = _source_dog_query(db, transfer)
    registration = _active_source_registration(db, transfer)
    source = transfer.from_municipality
    target = transfer.to_municipality
    consent_user = db.get(User, transfer.citizen_user_id or transfer.consent_actor_user_id)
    return f"""Abmeldung Hundesteuer

Owner information:
- First name: {owner.first_name}
- Last name: {owner.last_name}
- Date of birth: {owner.date_of_birth or ""}
- Email: {owner.email or ""}
- Phone: {owner.phone or ""}
- Old street: {owner.street}
- Old house number: {owner.house_number}
- Old postal code: {owner.postal_code}
- Old city: {owner.city}

Dog information:
- Dog name: {dog.name}
- Breed: {dog.breed}
- Birth date: {dog.birth_date or ""}
- Chip number: {dog.chip_number}
- Dog type: {dog.dog_type}

Current registration:
- Source municipality: {source.name}
- Registration ID: {registration.id if registration else ""}
- Registration start date: {registration.registered_at if registration else ""}
- Current status: {registration.status if registration else ""}

Deregistration details:
- Deregistration reason: moved_to_other_municipality
- Deregistration date: {transfer.deregistration_date or ""}
- Move date: {transfer.move_date or ""}
- Target municipality: {target.name}
- New address: {transfer.target_street or ""} {transfer.target_house_number or ""}, {transfer.target_postal_code or ""} {transfer.target_city or ""}

Consent:
- Consent text: Citizen consented to share the data required for municipal dog-tax transfer processing.
- Consent timestamp: {transfer.consent_given_at or ""}
- Citizen name: {consent_user.name if consent_user else ""}

System metadata:
- Transfer request ID: {transfer.id}
- Generated at: {generated_at.isoformat()}
- Document status: generated
"""


def generate_abmeldung_document(db: Session, transfer_id: int, current_user: DemoContext) -> dict:
    transfer = _get_transfer(db, transfer_id)
    _require_citizen_owner(db, transfer, current_user)
    _assert_transfer_status(transfer, {"consent_given"}, "Abmeldung generation")
    now = datetime.utcnow()
    content = _generate_abmeldung_content(db, transfer, now)
    document = db.scalar(
        select(TransferDocument).where(
            TransferDocument.transfer_request_id == transfer.id,
            TransferDocument.document_type == "DOG_TAX_ABMELDUNG",
        )
    )
    if document is None:
        document = TransferDocument(
            transfer_request_id=transfer.id,
            document_type="DOG_TAX_ABMELDUNG",
            document_status="generated",
            generated_content=content,
            generated_at=now,
            created_by_user_id=current_user.current_user_id,
        )
        db.add(document)
    else:
        document.document_status = "generated"
        document.generated_content = content
        document.generated_at = now
        document.created_by_user_id = current_user.current_user_id
    transfer.abmeldung_generated_at = now
    transfer.status = "abmeldung_generated"
    _audit(db, "ABMELDUNG_DOCUMENT_GENERATED", transfer, current_user, {"document_type": "DOG_TAX_ABMELDUNG"})
    db.commit()
    db.refresh(document)
    return _document_dict(document)


def _document_dict(document: TransferDocument) -> dict:
    return {
        "id": document.id,
        "transfer_request_id": document.transfer_request_id,
        "document_type": document.document_type,
        "document_status": document.document_status,
        "generated_content": document.generated_content,
        "generated_at": document.generated_at,
        "submitted_at": document.submitted_at,
        "created_by_user_id": document.created_by_user_id,
    }


def get_abmeldung_document(db: Session, transfer_id: int, current_user: DemoContext) -> dict:
    transfer = _get_transfer(db, transfer_id)
    if current_user.current_role == "citizen":
        _require_citizen_owner(db, transfer, current_user)
    elif current_user.current_role == "municipality_admin":
        if current_user.current_municipality_id == transfer.to_municipality_id and WORKFLOW_ORDER.get(transfer.status, 0) < WORKFLOW_ORDER["source_finance_approved"]:
            raise HTTPException(status_code=403, detail="Target municipality cannot view full Abmeldung before source approval")
        if current_user.current_municipality_id not in {transfer.from_municipality_id, transfer.to_municipality_id}:
            raise HTTPException(status_code=403, detail="Transfer is not visible to this municipality")
    elif current_user.current_role != "platform_admin":
        raise HTTPException(status_code=403, detail="Unsupported role")
    document = db.scalar(
        select(TransferDocument).where(
            TransferDocument.transfer_request_id == transfer.id,
            TransferDocument.document_type == "DOG_TAX_ABMELDUNG",
        )
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Abmeldung document not generated")
    return _document_dict(document)


def source_finance_verify(db: Session, transfer_id: int, notes: FinanceVerifyRequest) -> dict:
    transfer = _get_transfer(db, transfer_id)
    _require_source_finance(transfer, notes)
    _assert_transfer_status(transfer, {"abmeldung_generated"}, "Source finance verification")
    source_registration = _active_source_registration(db, transfer)
    if source_registration is None or source_registration.status not in {"active", "transfer_pending"}:
        raise HTTPException(status_code=409, detail="Source registration is not active for verification")
    if not transfer.consent_given or transfer.consent_given_at is None:
        raise HTTPException(status_code=409, detail="Consent is required before source verification")
    if db.scalar(select(TransferDocument).where(TransferDocument.transfer_request_id == transfer.id, TransferDocument.document_type == "DOG_TAX_ABMELDUNG")) is None:
        raise HTTPException(status_code=409, detail="Abmeldung document is required before source verification")
    duplicate = db.scalar(
        select(TransferRequest).where(
            TransferRequest.id != transfer.id,
            TransferRequest.source_registration_id == transfer.source_registration_id,
            TransferRequest.status.notin_(["completed", "source_rejected", "target_rejected", "cancelled", "rejected"]),
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="Another active transfer exists for this registration")
    now = datetime.utcnow()
    approval = _approval(db, transfer, "SOURCE_FINANCE", transfer.from_municipality_id)
    approval.status = "verified"
    approval.notes = notes.notes
    transfer.source_finance_notes = notes.notes
    approval.verified_by_user_id = notes.current_user_id
    approval.verified_at = now
    transfer.source_verified_at = now
    transfer.status = "source_finance_verified"
    _audit(db, "SOURCE_FINANCE_VERIFIED", transfer, notes, {"notes": notes.notes})
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def source_finance_approve(db: Session, transfer_id: int, notes: FinanceApproveRequest) -> dict:
    transfer = _get_transfer(db, transfer_id)
    _require_source_finance(transfer, notes)
    _assert_transfer_status(transfer, {"source_finance_verified"}, "Source finance approval")
    now = datetime.utcnow()
    approval = _approval(db, transfer, "SOURCE_FINANCE", transfer.from_municipality_id)
    approval.status = "approved"
    approval.notes = notes.notes
    transfer.source_finance_notes = notes.notes
    approval.approved_by_user_id = notes.current_user_id
    approval.approved_at = now
    transfer.source_approved = 1
    transfer.source_approved_at = now
    transfer.status = "source_finance_approved"
    owner = _source_owner_query(db, transfer)
    dog = _source_dog_query(db, transfer)
    payload = _minimal_payload(transfer.from_municipality, transfer.to_municipality, owner, dog, now)
    db.add(TransferPayload(transfer_request_id=transfer.id, payload_json=json.dumps(payload, sort_keys=True, ensure_ascii=False)))
    _audit(db, "SOURCE_FINANCE_APPROVED", transfer, notes, {"notes": notes.notes})
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def source_finance_reject(db: Session, transfer_id: int, reason: FinanceRejectRequest) -> dict:
    transfer = _get_transfer(db, transfer_id)
    _require_source_finance(transfer, reason)
    if transfer.status in {"completed", "target_finance_approved"}:
        raise HTTPException(status_code=409, detail="Source rejection is not allowed after target approval")
    now = datetime.utcnow()
    approval = _approval(db, transfer, "SOURCE_FINANCE", transfer.from_municipality_id)
    approval.status = "rejected"
    approval.notes = reason.notes or reason.reason
    approval.rejected_at = now
    transfer.status = "source_rejected"
    transfer.rejected_at = now
    transfer.rejection_reason = reason.reason
    _audit(db, "SOURCE_FINANCE_REJECTED", transfer, reason, {"reason": reason.reason})
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def target_finance_verify(db: Session, transfer_id: int, notes: FinanceVerifyRequest) -> dict:
    transfer = _get_transfer(db, transfer_id)
    _require_target_finance(transfer, notes)
    _assert_transfer_status(transfer, {"source_finance_approved"}, "Target finance verification")
    if not all([transfer.target_street, transfer.target_house_number, transfer.target_postal_code, transfer.target_city, transfer.move_date]):
        raise HTTPException(status_code=400, detail="Target address and move date are required")
    if not _source_dog_query(db, transfer).chip_number:
        raise HTTPException(status_code=409, detail="Dog data is incomplete")
    duplicate = db.scalar(
        select(Dog).where(
            Dog.municipality_id == transfer.to_municipality_id,
            Dog.chip_number == transfer.chip_number,
            Dog.status == "active",
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="A dog with this chip number is already active in this municipality")
    calculate_dog_tax(db, transfer.to_municipality_id, 0, _source_dog_query(db, transfer).dog_type)
    now = datetime.utcnow()
    approval = _approval(db, transfer, "TARGET_FINANCE", transfer.to_municipality_id)
    approval.status = "verified"
    approval.notes = notes.notes
    transfer.target_finance_notes = notes.notes
    approval.verified_by_user_id = notes.current_user_id
    approval.verified_at = now
    transfer.target_verified_at = now
    transfer.status = "target_finance_verified"
    _audit(db, "TARGET_FINANCE_VERIFIED", transfer, notes, {"notes": notes.notes})
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def target_finance_approve(db: Session, transfer_id: int, notes: FinanceApproveRequest) -> dict:
    transfer = _get_transfer(db, transfer_id)
    _require_target_finance(transfer, notes)
    _assert_transfer_status(transfer, {"target_finance_verified"}, "Target finance approval")
    now = datetime.utcnow()
    approval = _approval(db, transfer, "TARGET_FINANCE", transfer.to_municipality_id)
    approval.status = "approved"
    approval.notes = notes.notes
    approval.approved_by_user_id = notes.current_user_id
    approval.approved_at = now
    transfer.target_accepted = 1
    transfer.target_accepted_at = now
    transfer.target_approved_at = now
    transfer.target_finance_notes = notes.notes
    transfer.status = "target_finance_approved"
    _audit(db, "TARGET_FINANCE_APPROVED", transfer, notes, {"notes": notes.notes})
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def target_finance_reject(db: Session, transfer_id: int, reason: FinanceRejectRequest) -> dict:
    transfer = _get_transfer(db, transfer_id)
    _require_target_finance(transfer, reason)
    if transfer.status in {"completed"}:
        raise HTTPException(status_code=409, detail="Target rejection is not allowed after completion")
    now = datetime.utcnow()
    approval = _approval(db, transfer, "TARGET_FINANCE", transfer.to_municipality_id)
    approval.status = "rejected"
    approval.notes = reason.notes or reason.reason
    approval.rejected_at = now
    transfer.status = "target_rejected"
    transfer.rejected_at = now
    transfer.rejection_reason = reason.reason
    _audit(db, "TARGET_FINANCE_REJECTED", transfer, reason, {"reason": reason.reason})
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def complete_transfer(db: Session, transfer_id: int, current_user: DemoContext) -> dict:
    transfer = _get_transfer(db, transfer_id)
    _require_target_finance(transfer, current_user)
    _assert_transfer_status(transfer, {"target_finance_approved"}, "Transfer completion")
    if transfer.completed_at is not None:
        raise HTTPException(status_code=409, detail="Transfer cannot complete twice")
    source_owner = _source_owner_query(db, transfer)
    source_dog = _source_dog_query(db, transfer)
    source_registration = _active_source_registration(db, transfer)
    source_assistance_dog = bool(source_registration.assistance_dog) if source_registration is not None else False
    source_tax_reduced = bool(source_registration.tax_reduced) if source_registration is not None else False
    source_reduction_reason = source_registration.reduction_reason if source_registration is not None else None
    source_liability_insurance_available = bool(source_registration.liability_insurance_available) if source_registration is not None else False
    source_insurance_policy_number = source_registration.insurance_policy_number if source_registration is not None else None
    duplicate = db.scalar(
        select(Dog).where(
            Dog.municipality_id == transfer.to_municipality_id,
            Dog.chip_number == transfer.chip_number,
            Dog.status == "active",
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="A dog with this chip number is already active in this municipality")
    target_owner = Owner(
        municipality_id=transfer.to_municipality_id,
        user_id=transfer.citizen_user_id,
        first_name=source_owner.first_name,
        last_name=source_owner.last_name,
        date_of_birth=source_owner.date_of_birth,
        street=transfer.target_street or "",
        house_number=transfer.target_house_number or "",
        postal_code=transfer.target_postal_code or "",
        city=transfer.target_city or transfer.to_municipality.name,
        email=source_owner.email,
        phone=source_owner.phone,
    )
    db.add(target_owner)
    db.flush()
    active_before = db.scalar(
        select(func.count()).select_from(Dog).where(
            Dog.municipality_id == transfer.to_municipality_id,
            Dog.owner_id == target_owner.id,
            Dog.status == "active",
        )
    ) or 0
    tax = calculate_dog_tax(
        db,
        transfer.to_municipality_id,
        active_before,
        source_dog.dog_type,
        assistance_dog=source_assistance_dog,
    )
    target_dog = Dog(
        municipality_id=transfer.to_municipality_id,
        owner_id=target_owner.id,
        name=source_dog.name,
        breed=source_dog.breed,
        chip_number=source_dog.chip_number,
        insurance_number=transfer.insurance_number or source_dog.insurance_number,
        birth_date=source_dog.birth_date,
        gender=source_dog.gender,
        dog_type=source_dog.dog_type,
        is_dangerous=source_dog.is_dangerous,
        status="active",
    )
    db.add(target_dog)
    db.flush()
    target_registration = Registration(
        municipality_id=transfer.to_municipality_id,
        owner_id=target_owner.id,
        dog_id=target_dog.id,
        tax_rule_id=tax["tax_rule_id"],
        assessment_year=date.today().year,
        dog_position=tax["dog_position"],
        annual_tax_amount=tax["amount_eur"],
        **_registration_case_fields(
            assistance_dog=source_assistance_dog,
            tax_reduced=bool(source_tax_reduced or tax.get("tax_reduced")),
            reduction_reason=tax.get("reduction_reason") or source_reduction_reason,
            liability_insurance_available=source_liability_insurance_available,
            insurance_policy_number=source_insurance_policy_number,
        ),
        currency="EUR",
        status="active",
    )
    db.add(target_registration)
    db.flush()
    tax_assessment = TaxAssessment(
        transfer_request_id=transfer.id,
        municipality_id=transfer.to_municipality_id,
        tax_rule_id=tax["tax_rule_id"],
        active_dogs_before=active_before,
        dog_position=tax["dog_position"],
        amount_eur=tax["amount_eur"],
    )
    db.add(tax_assessment)
    now = datetime.utcnow()
    source_dog.status = "transferred"
    if source_registration is not None:
        source_registration.status = "transferred"
        source_registration.deregistered_at = now
        source_registration.end_date = transfer.deregistration_date or transfer.move_date
        source_registration.deregistration_reason = "moved_to_other_municipality"
    transfer.target_owner_id = target_owner.id
    transfer.target_dog_id = target_dog.id
    transfer.target_registration_id = target_registration.id
    transfer.completed_at = now
    transfer.status = "completed"
    for action, details in [
        ("TARGET_REGISTRATION_CREATED", {"target_registration_id": target_registration.id}),
        ("SOURCE_REGISTRATION_CLOSED", {"source_registration_id": source_registration.id if source_registration else None}),
        ("TAX_CALCULATED", {"amount_eur": tax["amount_eur"], "tax_rule_id": tax["tax_rule_id"]}),
        ("TRANSFER_COMPLETED", {"transfer_request_id": transfer.id}),
    ]:
        _audit(db, action, transfer, current_user, details)
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(transfer, include_payload=True, db=db)


def create_anmeldung(db: Session, tenant: Municipality, request: AnmeldungRequest) -> dict:
    chipnummer = request.hund.chipnummer.strip() if request.hund.chipnummer else ""
    if not chipnummer:
        raise HTTPException(status_code=400, detail="chipnummer is mandatory")

    duplicate_dog = db.scalar(
        select(Dog).where(
            Dog.municipality_id == tenant.id,
            Dog.chip_number == chipnummer,
            Dog.status == "active",
        )
    )
    if duplicate_dog is not None:
        raise HTTPException(
            status_code=409,
            detail="A dog with this chip number is already active in this municipality",
        )

    owner = Owner(
        municipality_id=tenant.id,
        first_name=request.halter.vorname,
        last_name=request.halter.nachname,
        date_of_birth=request.halter.geburtsdatum,
        street=request.halter.strasse,
        house_number=request.halter.hausnummer,
        postal_code=request.halter.plz,
        city=request.halter.ort,
        email=request.halter.email,
        phone=request.halter.telefon,
    )
    db.add(owner)
    db.flush()

    active_count = db.scalar(
        select(func.count()).select_from(Dog).where(
            Dog.municipality_id == tenant.id,
            Dog.owner_id == owner.id,
            Dog.status == "active",
        )
    )
    active_before = active_count or 0
    tax = calculate_dog_tax(
        db,
        tenant.id,
        active_before,
        request.hund.typ,
        assistance_dog=bool(request.assistance_dog),
    )
    dog_position = tax["dog_position"]

    dog = Dog(
        municipality_id=tenant.id,
        owner_id=owner.id,
        name=request.hund.name,
        breed=request.hund.rasse,
        chip_number=chipnummer,
        birth_date=request.hund.geburtsdatum,
        gender=request.hund.geschlecht,
        dog_type=request.hund.typ,
        is_dangerous=1 if request.hund.typ == "LISTENHUND" else 0,
        status="active",
    )
    db.add(dog)
    db.flush()

    current_year = date.today().year
    registration = Registration(
        municipality_id=tenant.id,
        owner_id=owner.id,
        dog_id=dog.id,
        tax_rule_id=tax["tax_rule_id"],
        assessment_year=current_year,
        dog_position=dog_position,
        annual_tax_amount=tax["amount_eur"],
        **_registration_case_fields(
            assistance_dog=bool(request.assistance_dog),
            tax_reduced=bool(request.tax_reduced or tax.get("tax_reduced")),
            reduction_reason=tax.get("reduction_reason") or request.reduction_reason,
            liability_insurance_available=bool(request.liability_insurance_available),
            insurance_policy_number=request.insurance_policy_number,
        ),
        currency="EUR",
        status="active",
    )
    db.add(registration)
    db.flush()

    create_audit_log(
        db,
        "ANMELDUNG_CREATED",
        {"mandant": tenant.code, "owner_id": owner.id, "dog_id": dog.id, "chipnummer": chipnummer},
        actor_municipality_id=tenant.id,
    )
    create_audit_log(
        db,
        "TAX_ASSESSED",
        {
            "mandant": tenant.code,
            "registration_id": registration.id,
            "amount_eur": tax["amount_eur"],
            "tax_rule_id": tax["tax_rule_id"],
        },
        actor_municipality_id=tenant.id,
    )

    db.commit()
    db.refresh(owner)
    db.refresh(dog)
    db.refresh(registration)

    return {
        "status": 201,
        "message": "Anmeldung erfolgreich erstellt",
        "mandant": tenant.code,
        "personId": owner.id,
        "hundId": dog.id,
        "registrierungId": registration.id,
        "steuerbetrag": tax["amount_eur"],
        "assistance_dog": bool(request.assistance_dog),
        "tax_reduced": bool(request.tax_reduced or tax.get("tax_reduced")),
        "reduction_reason": tax.get("reduction_reason") or request.reduction_reason,
        "liability_insurance_available": bool(request.liability_insurance_available),
        "insurance_policy_number": request.insurance_policy_number,
        "waehrung": "EUR",
        "veranlagungsjahr": current_year,
        "dog_position": dog_position,
        "tax_rule_id": tax["tax_rule_id"],
    }


def create_ummeldung(
    db: Session,
    source: Municipality,
    target: Municipality,
    request: UmmeldungRequest,
) -> dict:
    if source.id == target.id:
        raise HTTPException(status_code=400, detail="Source and target tenants must be different")

    chipnummer = request.chipnummer.strip() if request.chipnummer else ""
    if not chipnummer:
        raise HTTPException(status_code=400, detail="chipnummer is mandatory")

    source_dog = db.scalar(
        select(Dog).where(
            Dog.municipality_id == source.id,
            Dog.chip_number == chipnummer,
            Dog.status == "active",
        )
    )
    if source_dog is None:
        raise HTTPException(
            status_code=404,
            detail="No active dog found in source tenant for this chip number",
        )

    source_owner = db.get(Owner, source_dog.owner_id)
    source_registration = db.scalar(
        select(Registration).where(
            Registration.municipality_id == source.id,
            Registration.dog_id == source_dog.id,
            Registration.status == "active",
        )
    )

    duplicate_target_dog = db.scalar(
        select(Dog).where(
            Dog.municipality_id == target.id,
            Dog.chip_number == chipnummer,
            Dog.status == "active",
        )
    )
    if duplicate_target_dog is not None:
        raise HTTPException(
            status_code=409,
            detail="A dog with this chip number is already active in this municipality",
        )

    transfer_request = TransferRequest(
        from_municipality_id=source.id,
        to_municipality_id=target.id,
        source_owner_id=source_owner.id,
        source_dog_id=source_dog.id,
        source_registration_id=source_registration.id if source_registration is not None else None,
        chip_number=chipnummer,
        status="completed",
    )
    db.add(transfer_request)
    db.flush()

    now = datetime.utcnow()
    payload = {
        "owner_full_name": f"{source_owner.first_name} {source_owner.last_name}".strip(),
        "owner_date_of_birth": source_owner.date_of_birth,
        "dog_name": source_dog.name,
        "breed": source_dog.breed,
        "chip_number": source_dog.chip_number,
        "dangerous_dog": bool(source_dog.is_dangerous),
        "source_municipality_name": source.name,
        "target_municipality_name": target.name,
        "deregistration_date": now.isoformat(),
    }
    transfer_payload = TransferPayload(
        transfer_request_id=transfer_request.id,
        payload_json=json.dumps(payload, sort_keys=True, ensure_ascii=False),
    )
    db.add(transfer_payload)

    source_dog.status = "transferred"
    if source_registration is not None:
        source_registration.status = "deregistered"
        source_registration.deregistered_at = now

    target_owner = Owner(
        municipality_id=target.id,
        first_name=source_owner.first_name,
        last_name=source_owner.last_name,
        date_of_birth=source_owner.date_of_birth,
        street=request.neue_adresse.strasse,
        house_number=request.neue_adresse.hausnummer,
        postal_code=request.neue_adresse.plz,
        city=request.neue_adresse.ort,
        email=source_owner.email,
        phone=source_owner.phone,
    )
    db.add(target_owner)
    db.flush()

    source_assistance_dog = bool(source_registration.assistance_dog) if source_registration is not None else False
    source_tax_reduced = bool(source_registration.tax_reduced) if source_registration is not None else False
    source_reduction_reason = source_registration.reduction_reason if source_registration is not None else None
    source_liability_insurance_available = bool(source_registration.liability_insurance_available) if source_registration is not None else False
    source_insurance_policy_number = source_registration.insurance_policy_number if source_registration is not None else None

    active_count = db.scalar(
        select(func.count()).select_from(Dog).where(
            Dog.municipality_id == target.id,
            Dog.owner_id == target_owner.id,
            Dog.status == "active",
        )
    )
    active_before = active_count or 0
    tax = calculate_dog_tax(
        db,
        target.id,
        active_before,
        "LISTENHUND" if source_dog.is_dangerous else "NORMAL",
        assistance_dog=bool(getattr(request, "assistance_dog", False) or source_assistance_dog),
    )
    dog_position = tax["dog_position"]

    target_dog = Dog(
        municipality_id=target.id,
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

    current_year = date.today().year
    target_registration = Registration(
        municipality_id=target.id,
        owner_id=target_owner.id,
        dog_id=target_dog.id,
        tax_rule_id=tax["tax_rule_id"],
        assessment_year=current_year,
        dog_position=dog_position,
        annual_tax_amount=tax["amount_eur"],
        **_registration_case_fields(
            assistance_dog=bool(getattr(request, "assistance_dog", False) or source_assistance_dog),
            tax_reduced=bool(getattr(request, "tax_reduced", False) or source_tax_reduced or tax.get("tax_reduced")),
            reduction_reason=tax.get("reduction_reason") or getattr(request, "reduction_reason", None) or source_reduction_reason,
            liability_insurance_available=bool(
                getattr(request, "liability_insurance_available", False) or source_liability_insurance_available
            ),
            insurance_policy_number=getattr(request, "insurance_policy_number", None) or source_insurance_policy_number,
        ),
        currency="EUR",
        status="active",
    )
    db.add(target_registration)
    db.flush()

    transfer_request.target_owner_id = target_owner.id
    transfer_request.target_dog_id = target_dog.id
    transfer_request.target_registration_id = target_registration.id
    transfer_request.completed_at = now

    audit_base = {
        "transfer_request_id": transfer_request.id,
        "source_mandant": source.code,
        "target_mandant": target.code,
        "chipnummer": chipnummer,
    }
    if source_registration is None:
        audit_base["source_registration_missing"] = True

    source_case_details = audit_base.copy()
    if source_registration is not None:
        source_case_details["source_registration_id"] = source_registration.id

    for action, details in [
        ("UMMELDUNG_STARTED", audit_base),
        ("SOURCE_CASE_DEREGISTERED", source_case_details),
        ("TRANSFER_PAYLOAD_CREATED", {**audit_base, "transfer_payload_id": transfer_payload.id}),
        ("TARGET_CASE_CREATED", {**audit_base, "target_registration_id": target_registration.id}),
        (
            "TARGET_TAX_ASSESSED",
            {**audit_base, "amount_eur": tax["amount_eur"], "tax_rule_id": tax["tax_rule_id"]},
        ),
        ("UMMELDUNG_COMPLETED", audit_base),
    ]:
        create_audit_log(
            db,
            action,
            details,
            actor_municipality_id=target.id,
            transfer_request_id=transfer_request.id,
        )

    db.commit()
    db.refresh(target_owner)
    db.refresh(target_dog)
    db.refresh(target_registration)
    db.refresh(transfer_request)

    return {
        "status": 200,
        "message": "Ummeldung erfolgreich abgeschlossen",
        "uebernommen_von": source.code,
        "ziel_mandant": target.code,
        "personId": target_owner.id,
        "hundId": target_dog.id,
        "registrierungId": target_registration.id,
        "neuer_steuerbetrag": tax["amount_eur"],
        "assistance_dog": bool(getattr(request, "assistance_dog", False) or source_assistance_dog),
        "tax_reduced": bool(getattr(request, "tax_reduced", False) or source_tax_reduced or tax.get("tax_reduced")),
        "reduction_reason": tax.get("reduction_reason") or getattr(request, "reduction_reason", None) or source_reduction_reason,
        "liability_insurance_available": bool(
            getattr(request, "liability_insurance_available", False) or source_liability_insurance_available
        ),
        "insurance_policy_number": getattr(request, "insurance_policy_number", None) or source_insurance_policy_number,
        "waehrung": "EUR",
        "veranlagungsjahr": current_year,
        "dog_position": dog_position,
        "tax_rule_id": tax["tax_rule_id"],
        "protokoll_id": transfer_request.id,
    }
