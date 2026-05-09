import argparse
import csv
import re
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import Dog, Municipality, Owner, Registration
from app.seed import seed_database
from app.services.audit_service import create_audit_log
from app.services.tax_service import calculate_dog_tax


DATE_FORMAT = "%d.%m.%Y"
STATUS_MAP = {
    "Aktiv": "active",
    "Abgemeldet": "deregistered",
}
UMLAUT_REPLACEMENTS = {
    "ä": "AE",
    "ö": "OE",
    "ü": "UE",
    "ß": "SS",
    "Ä": "AE",
    "Ö": "OE",
    "Ü": "UE",
}


@dataclass
class ImportSummary:
    rows_read: int = 0
    municipalities_created: int = 0
    owners_created: int = 0
    dogs_created: int = 0
    registrations_created: int = 0
    rows_skipped: int = 0
    warnings_count: int = 0


def normalize_municipality_code(name: str) -> str:
    normalized = name.strip()
    for source, replacement in UMLAUT_REPLACEMENTS.items():
        normalized = normalized.replace(source, replacement)
    normalized = normalized.upper()
    normalized = re.sub(r"[\s-]+", "_", normalized)
    normalized = re.sub(r"[^A-Z0-9_]", "", normalized)
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    return normalized


def parse_german_date(value: str | None) -> str | None:
    value = (value or "").strip()
    if not value:
        return None
    return datetime.strptime(value, DATE_FORMAT).date().isoformat()


def parse_german_datetime(value: str | None) -> datetime | None:
    value = (value or "").strip()
    if not value:
        return None
    return datetime.strptime(value, DATE_FORMAT)


def split_street_and_house_number(value: str) -> tuple[str, str]:
    value = value.strip()
    match = re.match(r"^(?P<street>.*?)(?:\s+(?P<house_number>\S*\d\S*))$", value)
    if match:
        return match.group("street").strip(), match.group("house_number").strip()
    return value, ""


def is_yes(value: str | None) -> bool:
    return (value or "").strip().casefold() == "ja"


def csv_value(row: dict[str, str], key: str) -> str:
    return (row.get(key) or "").strip()


def csv_value_any(row: dict[str, str], *keys: str) -> str:
    for key in keys:
        if key in row and row.get(key) is not None:
            return (row.get(key) or "").strip()
    return ""


def parse_csv_bool(value: str | None) -> bool:
    return (value or "").strip().casefold() in {"1", "true", "ja", "yes", "y"}


def warn(summary: ImportSummary, message: str) -> None:
    summary.warnings_count += 1
    print(f"WARNING: {message}")


def get_or_create_municipality(db: Session, city: str, summary: ImportSummary) -> Municipality:
    code = normalize_municipality_code(city)
    municipality = db.scalar(select(Municipality).where(Municipality.code == code))
    if municipality is not None:
        return municipality

    municipality = Municipality(name=city, code=code, country="DE")
    db.add(municipality)
    db.flush()
    summary.municipalities_created += 1
    return municipality


def active_dog_count(db: Session, municipality_id: int, owner_id: int) -> int:
    return (
        db.scalar(
            select(func.count()).select_from(Dog).where(
                Dog.municipality_id == municipality_id,
                Dog.owner_id == owner_id,
                Dog.status == "active",
            )
        )
        or 0
    )


def has_duplicate_dog(db: Session, municipality_id: int, chip_number: str, csv_status: str) -> bool:
    existing_dogs = db.scalars(
        select(Dog).where(
            Dog.municipality_id == municipality_id,
            Dog.chip_number == chip_number,
        )
    ).all()
    if any(dog.status == "active" for dog in existing_dogs):
        return True
    if existing_dogs and csv_status == "active":
        return True
    return False


def create_registration_if_possible(
    db: Session,
    row: dict[str, str],
    municipality: Municipality,
    owner: Owner,
    dog: Dog,
    active_dogs_before: int,
    summary: ImportSummary,
) -> None:
    try:
        assistance_dog = parse_csv_bool(csv_value_any(row, "assistenzhund", "assistenzhund"))
        tax = calculate_dog_tax(db, municipality.id, active_dogs_before, dog.dog_type, assistance_dog=assistance_dog)
    except HTTPException as exc:
        if exc.status_code != 404:
            raise
        warn(
            summary,
            f"No tax rule for {municipality.name}; registration skipped for chip {dog.chip_number}",
        )
        return

    status = dog.status
    registered_at = parse_german_datetime(csv_value(row, "anmeldedatum")) or datetime.utcnow()
    assistance_dog = parse_csv_bool(csv_value_any(row, "assistenzhund", "assistenzhund"))
    tax_reduced = parse_csv_bool(csv_value_any(row, "steuerermäßigt", "steuerermÃ¤ÃŸigt"))
    reduction_reason = csv_value_any(row, "ermäßigungsgrund", "ermÃ¤ÃŸigungsgrund") or None
    liability_insurance_available = parse_csv_bool(csv_value_any(row, "haftpflicht_vorhanden"))
    insurance_policy_number = csv_value_any(row, "versicherung_nummer") or None
    if tax.get("tax_reduced"):
        tax_reduced = True
        reduction_reason = tax.get("reduction_reason") or reduction_reason
    registration = Registration(
        municipality_id=municipality.id,
        owner_id=owner.id,
        dog_id=dog.id,
        tax_rule_id=tax["tax_rule_id"],
        assessment_year=date.today().year,
        dog_position=tax["dog_position"],
        annual_tax_amount=tax["amount_eur"],
        assistance_dog=1 if assistance_dog else 0,
        tax_reduced=1 if tax_reduced else 0,
        reduction_reason=reduction_reason,
        liability_insurance_available=1 if liability_insurance_available else 0,
        insurance_policy_number=insurance_policy_number,
        currency="EUR",
        status=status,
        registered_at=registered_at,
        deregistered_at=datetime.utcnow() if status == "deregistered" else None,
    )
    db.add(registration)
    db.flush()
    summary.registrations_created += 1


def import_row(db: Session, row: dict[str, str], summary: ImportSummary) -> None:
    city = csv_value(row, "ort")
    chip_number = csv_value(row, "chip_nummer")
    csv_status_label = csv_value(row, "status")
    dog_status = STATUS_MAP.get(csv_status_label, "active")

    municipality = get_or_create_municipality(db, city, summary)

    if has_duplicate_dog(db, municipality.id, chip_number, dog_status):
        summary.rows_skipped += 1
        warn(
            summary,
            f"Duplicate dog skipped for {municipality.name} with chip {chip_number}",
        )
        db.rollback()
        return

    street, house_number = split_street_and_house_number(csv_value_any(row, "straße", "stra??e"))
    owner = Owner(
        municipality_id=municipality.id,
        user_id=None,
        first_name=csv_value(row, "vorname"),
        last_name=csv_value(row, "nachname"),
        date_of_birth=parse_german_date(csv_value(row, "geburtsdatum")),
        street=street,
        house_number=house_number,
        postal_code=csv_value(row, "plz"),
        city=city,
        email=csv_value(row, "email") or None,
        phone=csv_value(row, "telefon") or None,
    )
    db.add(owner)
    db.flush()
    summary.owners_created += 1

    active_dogs_before = active_dog_count(db, municipality.id, owner.id)
    dangerous = parse_csv_bool(csv_value_any(row, "gefährlicher_hund", "gef??hrlicher_hund"))
    dog = Dog(
        municipality_id=municipality.id,
        owner_id=owner.id,
        name=csv_value(row, "hundename"),
        breed=csv_value(row, "hunderasse"),
        chip_number=chip_number,
        birth_date=parse_german_date(csv_value(row, "geburtsdatum_hund")),
        gender=csv_value(row, "geschlecht_hund") or None,
        dog_type="LISTENHUND" if dangerous else "NORMAL",
        is_dangerous=1 if dangerous else 0,
        status=dog_status,
    )
    db.add(dog)
    db.flush()
    summary.dogs_created += 1

    if dog_status in {"active", "deregistered"}:
        create_registration_if_possible(db, row, municipality, owner, dog, active_dogs_before, summary)

    create_audit_log(
        db,
        action="CSV_IMPORT_DOG",
        details_dict={
            "csv_halter_id": csv_value(row, "halter_id"),
            "csv_hund_id": csv_value(row, "hund_id"),
            "chip_number": chip_number,
            "municipality_code": municipality.code,
        },
        actor_role="system",
        actor_municipality_id=municipality.id,
    )
    db.commit()


def import_csv(file_path: Path, reset: bool = False) -> ImportSummary:
    if reset:
        seed_database(reset=True)
    else:
        Base.metadata.create_all(bind=engine)

    summary = ImportSummary()
    with SessionLocal() as db:
        with file_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file, delimiter=";")
            for row in reader:
                summary.rows_read += 1
                try:
                    import_row(db, row, summary)
                except Exception as exc:
                    db.rollback()
                    summary.rows_skipped += 1
                    warn(summary, f"Row {summary.rows_read} skipped: {exc}")
    return summary


def print_summary(summary: ImportSummary) -> None:
    print(f"rows_read={summary.rows_read}")
    print(f"municipalities_created={summary.municipalities_created}")
    print(f"owners_created={summary.owners_created}")
    print(f"dogs_created={summary.dogs_created}")
    print(f"registrations_created={summary.registrations_created}")
    print(f"rows_skipped={summary.rows_skipped}")
    print(f"warnings_count={summary.warnings_count}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import dog tax sample data from CSV.")
    parser.add_argument("--file", required=True, help="Path to semicolon-separated CSV file.")
    parser.add_argument("--reset", action="store_true", help="Reset and seed the database before import.")
    args = parser.parse_args()

    summary = import_csv(Path(args.file), reset=args.reset)
    print_summary(summary)


if __name__ == "__main__":
    main()
