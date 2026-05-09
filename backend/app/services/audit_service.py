import hashlib
import json
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AuditLog


def _hash_log(
    previous_hash: str,
    actor_role: str,
    actor_municipality_id: int | None,
    action: str,
    details_json: str,
    timestamp: datetime,
) -> str:
    payload = (
        previous_hash
        + actor_role
        + str(actor_municipality_id)
        + action
        + details_json
        + timestamp.isoformat()
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def create_audit_log(
    db: Session,
    action: str,
    details_dict: dict,
    actor_role: str = "system",
    actor_user_id: int | None = None,
    actor_municipality_id: int | None = None,
    transfer_request_id: int | None = None,
) -> AuditLog:
    db.flush()
    previous_log = db.scalar(select(AuditLog).order_by(AuditLog.id.desc()).limit(1))
    previous_hash = previous_log.current_hash if previous_log else "GENESIS"
    details_json = json.dumps(details_dict, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    timestamp = datetime.utcnow()
    current_hash = _hash_log(
        previous_hash,
        actor_role,
        actor_municipality_id,
        action,
        details_json,
        timestamp,
    )

    audit_log = AuditLog(
        transfer_request_id=transfer_request_id,
        actor_user_id=actor_user_id,
        actor_role=actor_role,
        actor_municipality_id=actor_municipality_id,
        action=action,
        details_json=details_json,
        previous_hash=previous_hash,
        current_hash=current_hash,
        timestamp=timestamp,
    )
    db.add(audit_log)
    db.flush()
    return audit_log


def write_audit_log(
    db: Session,
    actor_user_id: int | None,
    actor_role: str,
    municipality_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None,
    details: dict,
) -> AuditLog:
    return create_audit_log(
        db,
        action,
        {"entity_type": entity_type, "entity_id": entity_id, **details},
        actor_role=actor_role,
        actor_user_id=actor_user_id,
        actor_municipality_id=municipality_id,
        transfer_request_id=entity_id if entity_type == "transfer_request" else None,
    )


def verify_audit_chain(db: Session) -> dict:
    logs = db.scalars(select(AuditLog).order_by(AuditLog.id.asc())).all()
    previous_hash = "GENESIS"

    for checked_count, log in enumerate(logs, start=1):
        expected_hash = _hash_log(
            previous_hash,
            log.actor_role,
            log.actor_municipality_id,
            log.action,
            log.details_json,
            log.timestamp,
        )
        if log.previous_hash != previous_hash or log.current_hash != expected_hash:
            return {
                "valid": False,
                "checked_logs": checked_count,
                "broken_at_log_id": log.id,
            }
        previous_hash = log.current_hash

    return {"valid": True, "checked_logs": len(logs)}
