from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Owner, TransferRequest
from app.schemas import (
    DemoContext,
    FinanceApproveRequest,
    FinanceRejectRequest,
    FinanceVerifyRequest,
    TransferAction,
    TransferConsentRequest,
    TransferCreateRequest,
    TransferDocumentResponse,
    TransferOut,
    TransferRequestCreate,
)
from app.services.transfer_service import (
    accept_target_transfer,
    approve_source_release,
    complete_transfer,
    create_transfer_request,
    generate_abmeldung_document,
    get_abmeldung_document,
    source_finance_approve,
    source_finance_reject,
    source_finance_verify,
    target_finance_approve,
    target_finance_reject,
    target_finance_verify,
    give_transfer_consent,
    reject_transfer_request,
    serialize_transfer,
)


router = APIRouter()


def demo_context(
    current_role: str = Query(default="municipality_admin"),
    current_municipality_id: int | None = Query(default=None),
    current_user_id: int | None = Query(default=None),
) -> DemoContext:
    return DemoContext(
        current_role=current_role,
        current_municipality_id=current_municipality_id,
        current_user_id=current_user_id,
    )


def visible_transfer_filter(context: DemoContext):
    if context.current_role in {"platform_admin", "compliance_officer"}:
        return True
    if context.current_municipality_id is None:
        raise HTTPException(status_code=400, detail="current_municipality_id is required")
    if context.current_role == "citizen":
        if context.current_user_id is None:
            raise HTTPException(status_code=400, detail="current_user_id is required")
        return (
            TransferRequest.from_municipality_id == context.current_municipality_id,
            TransferRequest.source_owner_id.in_(
                select(Owner.id).where(
                    Owner.user_id == context.current_user_id,
                    Owner.municipality_id == context.current_municipality_id,
                )
            ),
        )
    return or_(
        TransferRequest.from_municipality_id == context.current_municipality_id,
        (
            (TransferRequest.to_municipality_id == context.current_municipality_id)
            & (
                TransferRequest.status.in_([
                    "source_finance_approved",
                    "target_finance_verified",
                    "target_finance_approved",
                    "completed",
                    "target_rejected",
                ])
            )
        ),
    )


def _can_view_payload(context: DemoContext, transfer: TransferRequest, db: Session) -> bool:
    if context.current_role in {"platform_admin", "compliance_officer"}:
        return True
    if context.current_municipality_id not in {transfer.from_municipality_id, transfer.to_municipality_id}:
        return False
    if context.current_role == "citizen":
        source_owner = db.get(Owner, transfer.source_owner_id)
        return (
            context.current_user_id is not None
            and source_owner is not None
            and source_owner.user_id == context.current_user_id
        )
    return True


@router.post("/transfer-requests", response_model=TransferOut)
def create_transfer_request_route(
    request: TransferRequestCreate,
    db: Session = Depends(get_db),
):
    return create_transfer_request(db, request)


@router.post("/transfers", response_model=TransferOut)
def create_transfer_route(
    request: TransferCreateRequest,
    db: Session = Depends(get_db),
):
    return create_transfer_request(db, request)


@router.get("/transfer-requests", response_model=list[TransferOut])
def list_transfer_requests(
    context: DemoContext = Depends(demo_context),
    db: Session = Depends(get_db),
):
    query = select(TransferRequest).order_by(TransferRequest.id.asc())
    visibility = visible_transfer_filter(context)
    if visibility is not True:
        if isinstance(visibility, tuple):
            query = query.where(*visibility)
        else:
            query = query.where(visibility)

    return [
        serialize_transfer(
            transfer,
            include_payload=_can_view_payload(context, transfer, db),
            db=db,
        )
        for transfer in db.scalars(query).all()
    ]


@router.get("/transfer-requests/{transfer_id}", response_model=TransferOut)
def get_transfer_request(
    transfer_id: int,
    context: DemoContext = Depends(demo_context),
    db: Session = Depends(get_db),
):
    transfer = db.get(TransferRequest, transfer_id)
    if transfer is None:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    if context.current_role == "citizen":
        source_owner = db.get(Owner, transfer.source_owner_id)
        if (
            context.current_user_id is None
            or context.current_municipality_id != transfer.from_municipality_id
            or source_owner is None
            or source_owner.user_id != context.current_user_id
        ):
            raise HTTPException(status_code=403, detail="Transfer is not visible to this demo actor")
    elif context.current_role not in {"platform_admin", "compliance_officer"} and context.current_municipality_id not in {
        transfer.from_municipality_id,
        transfer.to_municipality_id,
    }:
        raise HTTPException(status_code=403, detail="Transfer is not visible to this demo actor")
    return serialize_transfer(transfer, include_payload=_can_view_payload(context, transfer, db), db=db)


@router.get("/transfers/{transfer_id}", response_model=TransferOut)
def get_transfer(
    transfer_id: int,
    context: DemoContext = Depends(demo_context),
    db: Session = Depends(get_db),
):
    return get_transfer_request(transfer_id, context, db)


@router.post("/transfer-requests/{transfer_id}/consent", response_model=TransferOut)
def consent_transfer_request(
    transfer_id: int,
    action: TransferAction,
    db: Session = Depends(get_db),
):
    return give_transfer_consent(db, transfer_id, action)


@router.post("/transfers/{transfer_id}/consent", response_model=TransferOut)
def consent_transfer(
    transfer_id: int,
    action: TransferConsentRequest,
    db: Session = Depends(get_db),
):
    return give_transfer_consent(db, transfer_id, action)


@router.post("/transfers/{transfer_id}/generate-abmeldung", response_model=TransferDocumentResponse)
def generate_abmeldung(
    transfer_id: int,
    action: DemoContext,
    db: Session = Depends(get_db),
):
    return generate_abmeldung_document(db, transfer_id, action)


@router.get("/transfers/{transfer_id}/abmeldung-document", response_model=TransferDocumentResponse)
def get_abmeldung(
    transfer_id: int,
    context: DemoContext = Depends(demo_context),
    db: Session = Depends(get_db),
):
    return get_abmeldung_document(db, transfer_id, context)


@router.post("/transfers/{transfer_id}/source-finance/verify", response_model=TransferOut)
def source_verify(
    transfer_id: int,
    action: FinanceVerifyRequest,
    db: Session = Depends(get_db),
):
    return source_finance_verify(db, transfer_id, action)


@router.post("/transfers/{transfer_id}/source-finance/approve", response_model=TransferOut)
def source_approve(
    transfer_id: int,
    action: FinanceApproveRequest,
    db: Session = Depends(get_db),
):
    return source_finance_approve(db, transfer_id, action)


@router.post("/transfers/{transfer_id}/source-finance/reject", response_model=TransferOut)
def source_reject(
    transfer_id: int,
    action: FinanceRejectRequest,
    db: Session = Depends(get_db),
):
    return source_finance_reject(db, transfer_id, action)


@router.post("/transfers/{transfer_id}/target-finance/verify", response_model=TransferOut)
def target_verify(
    transfer_id: int,
    action: FinanceVerifyRequest,
    db: Session = Depends(get_db),
):
    return target_finance_verify(db, transfer_id, action)


@router.post("/transfers/{transfer_id}/target-finance/approve", response_model=TransferOut)
def target_approve(
    transfer_id: int,
    action: FinanceApproveRequest,
    db: Session = Depends(get_db),
):
    return target_finance_approve(db, transfer_id, action)


@router.post("/transfers/{transfer_id}/target-finance/reject", response_model=TransferOut)
def target_reject(
    transfer_id: int,
    action: FinanceRejectRequest,
    db: Session = Depends(get_db),
):
    return target_finance_reject(db, transfer_id, action)


@router.post("/transfers/{transfer_id}/complete", response_model=TransferOut)
def complete_transfer_route(
    transfer_id: int,
    action: DemoContext,
    db: Session = Depends(get_db),
):
    return complete_transfer(db, transfer_id, action)


@router.post("/transfer-requests/{transfer_id}/source-approve", response_model=TransferOut)
def source_approve_transfer_request(
    transfer_id: int,
    action: TransferAction,
    db: Session = Depends(get_db),
):
    return approve_source_release(db, transfer_id, action)


@router.post("/transfer-requests/{transfer_id}/target-accept", response_model=TransferOut)
def target_accept_transfer_request(
    transfer_id: int,
    action: TransferAction,
    db: Session = Depends(get_db),
):
    return accept_target_transfer(db, transfer_id, action)


@router.post("/transfer-requests/{transfer_id}/reject", response_model=TransferOut)
def reject_transfer_request_route(
    transfer_id: int,
    action: TransferAction,
    db: Session = Depends(get_db),
):
    return reject_transfer_request(db, transfer_id, action)


@router.get("/transfers", response_model=list[TransferOut])
def list_transfers_compat(
    current_municipality_id: int | None = Query(default=None),
    current_role: str = Query(default="municipality_admin"),
    current_user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    context = DemoContext(
        current_role=current_role,
        current_municipality_id=current_municipality_id,
        current_user_id=current_user_id,
    )
    query = select(TransferRequest).order_by(TransferRequest.id.asc())
    visibility = visible_transfer_filter(context)
    if visibility is not True:
        if isinstance(visibility, tuple):
            query = query.where(*visibility)
        else:
            query = query.where(visibility)
    return [serialize_transfer(transfer, include_payload=_can_view_payload(context, transfer, db), db=db) for transfer in db.scalars(query).all()]
