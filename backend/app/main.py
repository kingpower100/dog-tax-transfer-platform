from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, inspect, select
from sqlalchemy.orm import Session

from app.routers import (
    anmeldung,
    audit_logs,
    citizen,
    dogs,
    municipalities,
    registrations,
    tax_rules,
    transfers,
    ummeldung,
)
from app.database import Base, engine, get_db
from app import models
from app.seed import seed_database


app = FastAPI(title="Once-Only Dog Tax Transfer Layer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):517[0-9]$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(municipalities.router)
app.include_router(tax_rules.router)
app.include_router(anmeldung.router)
app.include_router(ummeldung.router)
app.include_router(citizen.router)
app.include_router(dogs.router)
app.include_router(registrations.router)
app.include_router(transfers.router)
app.include_router(audit_logs.router)


def ensure_demo_schema() -> None:
    with engine.begin() as connection:
        registration_columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(registrations)")}
        registration_migrations = {
            "end_date": "ALTER TABLE registrations ADD COLUMN end_date TEXT",
            "deregistration_reason": "ALTER TABLE registrations ADD COLUMN deregistration_reason TEXT",
            "assistance_dog": "ALTER TABLE registrations ADD COLUMN assistance_dog INTEGER NOT NULL DEFAULT 0 CHECK (assistance_dog IN (0, 1))",
            "tax_reduced": "ALTER TABLE registrations ADD COLUMN tax_reduced INTEGER NOT NULL DEFAULT 0 CHECK (tax_reduced IN (0, 1))",
            "reduction_reason": "ALTER TABLE registrations ADD COLUMN reduction_reason TEXT",
            "liability_insurance_available": "ALTER TABLE registrations ADD COLUMN liability_insurance_available INTEGER NOT NULL DEFAULT 0 CHECK (liability_insurance_available IN (0, 1))",
            "insurance_policy_number": "ALTER TABLE registrations ADD COLUMN insurance_policy_number TEXT",
        }
        for column_name, sql in registration_migrations.items():
            if column_name not in registration_columns:
                connection.exec_driver_sql(sql)

        tax_rule_sql = connection.exec_driver_sql(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'dog_tax_rules'"
        ).scalar()
        if tax_rule_sql is not None and "EXEMPTION" not in tax_rule_sql:
            connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
            connection.exec_driver_sql(
                """
                CREATE TABLE IF NOT EXISTS dog_tax_rules_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    municipality_id INTEGER NOT NULL REFERENCES municipalities(id),
                    rule_type TEXT NOT NULL,
                    dog_position INTEGER,
                    amount_eur INTEGER NOT NULL,
                    valid_from TEXT NOT NULL,
                    valid_to TEXT,
                    source_url TEXT NOT NULL,
                    legal_reference TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT ck_tax_rules_rule_type CHECK (rule_type IN ('BASIC', 'DANGEROUS', 'EXEMPTION')),
                    CONSTRAINT ck_tax_rules_amount_eur CHECK (amount_eur >= 0),
                    CONSTRAINT uq_tax_rule_natural_key UNIQUE (municipality_id, rule_type, dog_position, valid_from)
                )
                """
            )
            connection.exec_driver_sql(
                """
                INSERT OR IGNORE INTO dog_tax_rules_new (
                    id,
                    municipality_id,
                    rule_type,
                    dog_position,
                    amount_eur,
                    valid_from,
                    valid_to,
                    source_url,
                    legal_reference,
                    created_at
                )
                SELECT
                    id,
                    municipality_id,
                    rule_type,
                    dog_position,
                    amount_eur,
                    valid_from,
                    valid_to,
                    source_url,
                    legal_reference,
                    created_at
                FROM dog_tax_rules
                """
            )
            connection.exec_driver_sql("DROP TABLE dog_tax_rules")
            connection.exec_driver_sql("ALTER TABLE dog_tax_rules_new RENAME TO dog_tax_rules")
            connection.exec_driver_sql("PRAGMA foreign_keys=ON")

        dog_columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(dogs)")}
        if "insurance_number" not in dog_columns:
            connection.exec_driver_sql("ALTER TABLE dogs ADD COLUMN insurance_number TEXT")

        assessment_columns_info = list(connection.exec_driver_sql("PRAGMA table_info(tax_assessments)"))
        assessment_columns = {row[1] for row in assessment_columns_info}
        transfer_notnull = any(row[1] == "transfer_request_id" and row[3] == 1 for row in assessment_columns_info)
        if "dog_registration_id" not in assessment_columns or "calculated_at" not in assessment_columns or transfer_notnull:
            connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
            connection.exec_driver_sql(
                """
                CREATE TABLE IF NOT EXISTS tax_assessments_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    dog_registration_id INTEGER REFERENCES registrations(id),
                    transfer_request_id INTEGER REFERENCES transfer_requests(id),
                    municipality_id INTEGER NOT NULL REFERENCES municipalities(id),
                    tax_rule_id INTEGER NOT NULL REFERENCES dog_tax_rules(id),
                    active_dogs_before INTEGER NOT NULL,
                    dog_position INTEGER NOT NULL,
                    amount_eur INTEGER NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            existing_insert_columns = [
                "id",
                "transfer_request_id",
                "municipality_id",
                "tax_rule_id",
                "active_dogs_before",
                "dog_position",
                "amount_eur",
                "created_at",
            ]
            if assessment_columns:
                connection.exec_driver_sql(
                    f"""
                    INSERT OR IGNORE INTO tax_assessments_new ({",".join(existing_insert_columns)}, calculated_at)
                    SELECT {",".join(existing_insert_columns)}, created_at FROM tax_assessments
                    """
                )
                connection.exec_driver_sql("DROP TABLE tax_assessments")
            connection.exec_driver_sql("ALTER TABLE tax_assessments_new RENAME TO tax_assessments")
            connection.exec_driver_sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_tax_assessments_transfer_request_id ON tax_assessments(transfer_request_id)"
            )
            connection.exec_driver_sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_tax_assessments_dog_registration_id ON tax_assessments(dog_registration_id)"
            )
            connection.exec_driver_sql("PRAGMA foreign_keys=ON")

        columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(transfer_requests)")}
        migrations = {
            "citizen_user_id": "ALTER TABLE transfer_requests ADD COLUMN citizen_user_id INTEGER",
            "dog_id": "ALTER TABLE transfer_requests ADD COLUMN dog_id INTEGER",
            "owner_id": "ALTER TABLE transfer_requests ADD COLUMN owner_id INTEGER",
            "source_municipality_id": "ALTER TABLE transfer_requests ADD COLUMN source_municipality_id INTEGER",
            "target_municipality_id": "ALTER TABLE transfer_requests ADD COLUMN target_municipality_id INTEGER",
            "insurance_number": "ALTER TABLE transfer_requests ADD COLUMN insurance_number TEXT",
            "target_street": "ALTER TABLE transfer_requests ADD COLUMN target_street TEXT",
            "target_house_number": "ALTER TABLE transfer_requests ADD COLUMN target_house_number TEXT",
            "target_postal_code": "ALTER TABLE transfer_requests ADD COLUMN target_postal_code TEXT",
            "target_city": "ALTER TABLE transfer_requests ADD COLUMN target_city TEXT",
            "move_date": "ALTER TABLE transfer_requests ADD COLUMN move_date TEXT",
            "deregistration_date": "ALTER TABLE transfer_requests ADD COLUMN deregistration_date TEXT",
            "deregistration_reason": "ALTER TABLE transfer_requests ADD COLUMN deregistration_reason TEXT",
            "consent_text": "ALTER TABLE transfer_requests ADD COLUMN consent_text TEXT",
            "consent_given_at": "ALTER TABLE transfer_requests ADD COLUMN consent_given_at DATETIME",
            "consent_actor_user_id": "ALTER TABLE transfer_requests ADD COLUMN consent_actor_user_id INTEGER",
            "abmeldung_generated_at": "ALTER TABLE transfer_requests ADD COLUMN abmeldung_generated_at DATETIME",
            "source_verified_at": "ALTER TABLE transfer_requests ADD COLUMN source_verified_at DATETIME",
            "source_approved_at": "ALTER TABLE transfer_requests ADD COLUMN source_approved_at DATETIME",
            "target_verified_at": "ALTER TABLE transfer_requests ADD COLUMN target_verified_at DATETIME",
            "target_accepted_at": "ALTER TABLE transfer_requests ADD COLUMN target_accepted_at DATETIME",
            "target_approved_at": "ALTER TABLE transfer_requests ADD COLUMN target_approved_at DATETIME",
            "completed_at": "ALTER TABLE transfer_requests ADD COLUMN completed_at DATETIME",
            "source_finance_notes": "ALTER TABLE transfer_requests ADD COLUMN source_finance_notes TEXT",
            "target_finance_notes": "ALTER TABLE transfer_requests ADD COLUMN target_finance_notes TEXT",
            "rejected_at": "ALTER TABLE transfer_requests ADD COLUMN rejected_at DATETIME",
            "rejection_reason": "ALTER TABLE transfer_requests ADD COLUMN rejection_reason TEXT",
        }
        for column_name, sql in migrations.items():
            if column_name not in columns:
                connection.exec_driver_sql(sql)

        connection.exec_driver_sql(
            "UPDATE transfer_requests SET status = 'draft' WHERE status IS NULL"
        )
        connection.exec_driver_sql(
            "UPDATE transfer_requests SET consent_given = 0 WHERE consent_given IS NULL"
        )
        connection.exec_driver_sql(
            "UPDATE transfer_requests SET source_approved = 0 WHERE source_approved IS NULL"
        )
        connection.exec_driver_sql(
            "UPDATE transfer_requests SET target_accepted = 0 WHERE target_accepted IS NULL"
        )
        connection.exec_driver_sql(
            "UPDATE transfer_requests SET citizen_user_id = consent_actor_user_id WHERE citizen_user_id IS NULL AND consent_actor_user_id IS NOT NULL"
        )
        connection.exec_driver_sql(
            "UPDATE transfer_requests SET dog_id = source_dog_id WHERE dog_id IS NULL"
        )
        connection.exec_driver_sql(
            "UPDATE transfer_requests SET owner_id = source_owner_id WHERE owner_id IS NULL"
        )
        connection.exec_driver_sql(
            "UPDATE transfer_requests SET source_municipality_id = from_municipality_id WHERE source_municipality_id IS NULL"
        )
        connection.exec_driver_sql(
            "UPDATE transfer_requests SET target_municipality_id = to_municipality_id WHERE target_municipality_id IS NULL"
        )


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_demo_schema()
    seed_database(reset=False)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/debug/tables")
def debug_tables(
    current_role: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict[str, dict[str, int]]:
    if current_role != "platform_admin":
        raise HTTPException(status_code=403, detail="Debug table counts are platform-admin only")
    inspector = inspect(engine)
    counts = {}

    for table_name in inspector.get_table_names():
        table = Base.metadata.tables[table_name]
        counts[table_name] = db.scalar(select(func.count()).select_from(table)) or 0

    return {"tables": counts}
