from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AuditLog, Owner, TransferRequest
from app.schemas import AuditLogOut
from app.services.audit_service import verify_audit_chain


router = APIRouter()


@router.get("/audit-logs", response_model=list[AuditLogOut])
def list_audit_logs(
    current_role: str = Query(default="municipality_admin"),
    current_municipality_id: int | None = Query(default=None),
    current_user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    logs = db.scalars(select(AuditLog).order_by(AuditLog.id.asc())).all()
    if current_role in {"platform_admin", "compliance_officer"}:
        return logs
    if current_municipality_id is None:
        raise HTTPException(status_code=400, detail="current_municipality_id is required")
    if current_role == "citizen":
        if current_user_id is None:
            raise HTTPException(status_code=400, detail="current_user_id is required")
        visible_transfer_ids = select(TransferRequest.id).join(Owner, TransferRequest.source_owner_id == Owner.id).where(
            TransferRequest.from_municipality_id == current_municipality_id,
            Owner.user_id == current_user_id,
        )
        transfer_ids = set(db.scalars(visible_transfer_ids).all())
        return [
            log
            for log in logs
            if log.transfer_request_id is not None
            and log.transfer_request_id in transfer_ids
        ]
    return [
        log
        for log in logs
        if log.actor_municipality_id == current_municipality_id
        or (
            log.transfer_request is not None
            and current_municipality_id
            in {
                log.transfer_request.from_municipality_id,
                log.transfer_request.to_municipality_id,
            }
        )
    ]


@router.get("/audit-logs/verify")
def verify_audit_logs(
    current_role: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if current_role != "platform_admin":
        raise HTTPException(status_code=403, detail="Audit chain verification is platform-admin only")
    return verify_audit_chain(db)
