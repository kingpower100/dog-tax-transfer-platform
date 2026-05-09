import argparse
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import Dog, DogTaxRule, Municipality, Owner, Registration, TransferRequest, User
from app.services.tax_service import calculate_dog_tax


HAMBURG_SOURCE_URL = "https://www.landesrecht-hamburg.de/bsha/document/jlr-HuStGHA1995rahmen"
BERLIN_SOURCE_URL = "https://gesetze.berlin.de/bsbe/document/jlr-HuStGBErahmen"


def get_or_create_municipality(db: Session, name: str, code: str) -> Municipality:
    municipality = db.scalar(select(Municipality).where(Municipality.code == code))
    if municipality:
        return municipality

    municipality = Municipality(name=name, code=code)
    db.add(municipality)
    db.flush()
    return municipality


def get_or_create_user(
    db: Session,
    name: str,
    email: str,
    password_hash: str,
    role: str,
    municipality: Municipality | None = None,
    user_id: int | None = None,
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user:
        return user

    if user_id is not None:
        existing_by_id = db.get(User, user_id)
        if existing_by_id is not None:
            if existing_by_id.email != email:
                existing_by_id.name = name
                existing_by_id.email = email
                existing_by_id.password_hash = password_hash
                existing_by_id.role = role
                existing_by_id.municipality = municipality
                db.flush()
            return existing_by_id

    user = User(
        id=user_id,
        name=name,
        email=email,
        password_hash=password_hash,
        role=role,
        municipality=municipality,
    )
    db.add(user)
    db.flush()
    return user


def get_or_create_tax_rule(
    db: Session,
    municipality: Municipality,
    rule_type: str,
    dog_position: int | None,
    amount_eur: int,
    valid_from: str,
    source_url: str,
) -> DogTaxRule:
    tax_rule = db.scalar(
        select(DogTaxRule).where(
            DogTaxRule.municipality_id == municipality.id,
            DogTaxRule.rule_type == rule_type,
            DogTaxRule.dog_position.is_(None)
            if dog_position is None
            else DogTaxRule.dog_position == dog_position,
            DogTaxRule.valid_from == valid_from,
        )
    )
    if tax_rule:
        return tax_rule

    tax_rule = DogTaxRule(
        municipality=municipality,
        rule_type=rule_type,
        dog_position=dog_position,
        amount_eur=amount_eur,
        valid_from=valid_from,
        source_url=source_url,
    )
    db.add(tax_rule)
    db.flush()
    return tax_rule


def get_or_create_owner(
    db: Session,
    municipality: Municipality,
    first_name: str,
    last_name: str,
    date_of_birth: str | None,
    street: str,
    house_number: str,
    postal_code: str,
    city: str,
    user: User | None = None,
    email: str | None = None,
    phone: str | None = None,
) -> Owner:
    owner = db.scalar(
        select(Owner).where(
            Owner.municipality_id == municipality.id,
            Owner.first_name == first_name,
            Owner.last_name == last_name,
            Owner.date_of_birth == date_of_birth,
        )
    )
    if owner:
        owner.municipality = municipality
        if user is not None:
            owner.user = user
        owner.first_name = first_name
        owner.last_name = last_name
        owner.date_of_birth = date_of_birth
        owner.street = street
        owner.house_number = house_number
        owner.postal_code = postal_code
        owner.city = city
        if email is not None:
            owner.email = email
        if phone is not None:
            owner.phone = phone
        db.flush()
        return owner

    owner = Owner(
        municipality=municipality,
        user=user,
        first_name=first_name,
        last_name=last_name,
        date_of_birth=date_of_birth,
        street=street,
        house_number=house_number,
        postal_code=postal_code,
        city=city,
        email=email,
        phone=phone,
    )
    db.add(owner)
    db.flush()
    return owner


def get_or_create_dog(
    db: Session,
    municipality: Municipality,
    owner: Owner,
    name: str,
    breed: str,
    chip_number: str,
    dog_type: str,
    is_dangerous: int,
    status: str = "active",
    insurance_number: str | None = None,
) -> Dog:
    dog = db.scalar(
        select(Dog).where(
            Dog.municipality_id == municipality.id,
            Dog.chip_number == chip_number,
            Dog.status == status,
        )
    )
    if dog:
        if insurance_number is not None:
            dog.insurance_number = insurance_number
            db.flush()
        return dog

    dog = Dog(
        municipality=municipality,
        owner=owner,
        name=name,
        breed=breed,
        chip_number=chip_number,
        insurance_number=insurance_number,
        dog_type=dog_type,
        is_dangerous=is_dangerous,
        status=status,
    )
    db.add(dog)
    db.flush()
    return dog


def get_or_create_registration(
    db: Session,
    municipality: Municipality,
    owner: Owner,
    dog: Dog,
    active_dogs_before: int,
    assistance_dog: bool = False,
    tax_reduced: bool = False,
    reduction_reason: str | None = None,
    liability_insurance_available: bool = False,
    insurance_policy_number: str | None = None,
) -> Registration:
    registration = db.scalar(
        select(Registration).where(
            Registration.municipality_id == municipality.id,
            Registration.owner_id == owner.id,
            Registration.dog_id == dog.id,
            Registration.status == "active",
        )
    )
    if registration:
        return registration

    tax = calculate_dog_tax(db, municipality.id, active_dogs_before, dog.dog_type)
    registration = Registration(
        municipality=municipality,
        owner=owner,
        dog=dog,
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
        status="active",
    )
    db.add(registration)
    db.flush()
    return registration


def move_demo_transfers_from_hannover_to_hamburg(
    db: Session,
    berlin: Municipality,
    hannover: Municipality,
    hamburg: Municipality,
    owner: Owner,
) -> None:
    transfers = db.scalars(
        select(TransferRequest)
        .join(Owner, TransferRequest.source_owner_id == Owner.id)
        .where(
            TransferRequest.from_municipality_id == berlin.id,
            TransferRequest.to_municipality_id == hannover.id,
            ((TransferRequest.source_owner_id == owner.id) | (Owner.user_id == owner.user_id) | (Owner.email == owner.email)),
        )
    ).all()
    for transfer in transfers:
        transfer.to_municipality = hamburg
        transfer.target_municipality = hamburg
        if not transfer.target_city or transfer.target_city == "Hannover":
            transfer.target_city = "Hamburg"

        if transfer.target_owner is not None:
            transfer.target_owner.municipality = hamburg
            if transfer.target_owner.city == "Hannover":
                transfer.target_owner.city = "Hamburg"
        if transfer.target_dog is not None:
            transfer.target_dog.municipality = hamburg
        if transfer.target_registration is not None:
            dog_type = transfer.target_dog.dog_type if transfer.target_dog is not None else transfer.source_dog.dog_type
            active_dogs_before = max((transfer.target_registration.dog_position or 1) - 1, 0)
            tax = calculate_dog_tax(db, hamburg.id, active_dogs_before, dog_type)
            transfer.target_registration.municipality = hamburg
            transfer.target_registration.tax_rule_id = tax["tax_rule_id"]
            transfer.target_registration.dog_position = tax["dog_position"]
            transfer.target_registration.annual_tax_amount = tax["amount_eur"]
            if transfer.tax_assessment is not None:
                transfer.tax_assessment.municipality = hamburg
                transfer.tax_assessment.tax_rule_id = tax["tax_rule_id"]
                transfer.tax_assessment.dog_position = tax["dog_position"]
                transfer.tax_assessment.amount_eur = tax["amount_eur"]
    if transfers:
        db.flush()


def seed_database(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        hamburg = get_or_create_municipality(db, "Hamburg", "HAMBURG")
        berlin = get_or_create_municipality(db, "Berlin", "BERLIN")
        hannover = get_or_create_municipality(db, "Hannover", "HANNOVER")
        leverkusen = get_or_create_municipality(db, "Leverkusen", "LEVERKUSEN")
        freiburg = get_or_create_municipality(db, "Freiburg", "FREIBURG")

        stale_registrations = db.scalars(
            select(Registration)
            .join(Dog, Registration.dog_id == Dog.id)
            .where(Registration.status == "active", Dog.status != "active")
        ).all()
        for registration in stale_registrations:
            registration.status = "transferred" if registration.dog.status == "transferred" else "deregistered"
            registration.deregistration_reason = registration.deregistration_reason or "moved_to_other_municipality"
            registration.end_date = registration.end_date or date.today().isoformat()
        if stale_registrations:
            db.flush()

        get_or_create_user(
            db,
            "Platform Admin",
            "platform.admin@test.de",
            "password",
            "platform_admin",
        )
        get_or_create_user(
            db,
            "Compliance Officer",
            "compliance.officer@example.com",
            "password",
            "compliance_officer",
        )
        get_or_create_user(
            db,
            "Hamburg Admin",
            "hamburg.admin@test.de",
            "password",
            "municipality_admin",
            hamburg,
        )
        get_or_create_user(
            db,
            "Berlin Admin",
            "berlin.admin@test.de",
            "password",
            "municipality_admin",
            berlin,
        )
        get_or_create_user(
            db,
            "Hannover Finance",
            "hannover.finance@example.com",
            "password",
            "municipality_admin",
            hannover,
        )
        get_or_create_user(
            db,
            "Leverkusen Finance",
            "leverkusen.finance@example.com",
            "password",
            "municipality_admin",
            leverkusen,
        )
        demo_citizen = get_or_create_user(
            db,
            "Max Müller",
            "julia.wagner@example.de",
            "password123",
            "citizen",
            user_id=1001,
        )
        demo_citizen.name = "Julia Wagner"
        demo_citizen.email = "julia.wagner@example.de"
        db.flush()
        canonical_citizen = db.get(User, 1001)
        if canonical_citizen is not None and demo_citizen.id != canonical_citizen.id:
            demo_citizen.email = f"retired.citizen.{demo_citizen.id}@example.com"
            db.flush()
            for owner in db.scalars(select(Owner).where(Owner.user_id == demo_citizen.id)).all():
                owner.user_id = canonical_citizen.id
            canonical_citizen.name = "Max Müller"
            canonical_citizen.name = "Julia Wagner"
            canonical_citizen.email = "julia.wagner@example.de"
            canonical_citizen.password_hash = "password123"
            canonical_citizen.role = "citizen"
            canonical_citizen.municipality_id = None
            demo_citizen = canonical_citizen
            db.flush()

        get_or_create_tax_rule(
            db,
            hamburg,
            "BASIC",
            None,
            90,
            "2026-01-01",
            HAMBURG_SOURCE_URL,
        )
        get_or_create_tax_rule(
            db,
            hamburg,
            "DANGEROUS",
            None,
            600,
            "2026-01-01",
            HAMBURG_SOURCE_URL,
        )
        get_or_create_tax_rule(
            db,
            hamburg,
            "EXEMPTION",
            None,
            0,
            "2026-01-01",
            HAMBURG_SOURCE_URL,
        )
        get_or_create_tax_rule(
            db,
            berlin,
            "BASIC",
            1,
            120,
            "2026-01-01",
            BERLIN_SOURCE_URL,
        )
        for municipality, first, second, third, dangerous in [
            (hannover, 132, 240, 240, 600),
            (leverkusen, 156, 204, 252, 720),
            (freiburg, 102, 204, 204, 600),
        ]:
            get_or_create_tax_rule(db, municipality, "BASIC", 1, first, "2026-01-01", "demo://municipal-tax-rule")
            get_or_create_tax_rule(db, municipality, "BASIC", 2, second, "2026-01-01", "demo://municipal-tax-rule")
            get_or_create_tax_rule(db, municipality, "BASIC", 3, third, "2026-01-01", "demo://municipal-tax-rule")
            get_or_create_tax_rule(db, municipality, "DANGEROUS", None, dangerous, "2026-01-01", "demo://municipal-tax-rule")
            get_or_create_tax_rule(db, municipality, "EXEMPTION", None, 0, "2026-01-01", "demo://municipal-tax-rule")
        get_or_create_tax_rule(
            db,
            berlin,
            "BASIC",
            2,
            180,
            "2026-01-01",
            BERLIN_SOURCE_URL,
        )
        get_or_create_tax_rule(
            db,
            berlin,
            "BASIC",
            3,
            240,
            "2026-01-01",
            BERLIN_SOURCE_URL,
        )
        get_or_create_tax_rule(
            db,
            berlin,
            "DANGEROUS",
            None,
            600,
            "2026-01-01",
            BERLIN_SOURCE_URL,
        )
        get_or_create_tax_rule(
            db,
            berlin,
            "EXEMPTION",
            None,
            0,
            "2026-01-01",
            BERLIN_SOURCE_URL,
        )

        hamburg_source_owner = get_or_create_owner(
            db,
            hamburg,
            "Demo",
            "Citizen",
            "1990-01-15",
            "Musterweg",
            "10",
            "20095",
            "Hamburg",
            None,
        )
        hamburg_source_dog = get_or_create_dog(
            db,
            hamburg,
            hamburg_source_owner,
            "Milo",
            "Labrador",
            "276099900000111",
            "NORMAL",
            0,
        )
        get_or_create_registration(db, hamburg, hamburg_source_owner, hamburg_source_dog, 0)

        berlin_existing_owner = get_or_create_owner(
            db,
            berlin,
            "Julia",
            "Wagner",
            "1995-05-22",
            "Musterstraße",
            "12",
            "10115",
            "Berlin",
            demo_citizen,
            "julia.wagner@example.de",
        )
        berlin_existing_dog = get_or_create_dog(
            db,
            berlin,
            berlin_existing_owner,
            "Milo",
            "Beagle",
            "276098100005555",
            "NORMAL",
            0,
            insurance_number="DOG-INS-2026-001",
        )
        get_or_create_registration(db, berlin, berlin_existing_owner, berlin_existing_dog, 0)

        berlin_second_dog = get_or_create_dog(
            db,
            berlin,
            berlin_existing_owner,
            "Luna",
            "German Shepherd",
            "276098100006666",
            "LISTENHUND",
            1,
            insurance_number="DOG-INS-2026-002",
        )
        get_or_create_registration(db, berlin, berlin_existing_owner, berlin_second_dog, 1)
        move_demo_transfers_from_hannover_to_hamburg(db, berlin, hannover, hamburg, berlin_existing_owner)

        hannover_owner = get_or_create_owner(
            db,
            hannover,
            "Tina",
            "Haupt",
            "1985-04-22",
            "Königstraße",
            "5",
            "30159",
            "Hannover",
            None,
        )
        hannover_dog = get_or_create_dog(
            db,
            hannover,
            hannover_owner,
            "Rex",
            "Husky",
            "276099900000333",
            "NORMAL",
            0,
        )
        get_or_create_registration(db, hannover, hannover_owner, hannover_dog, 0)

        leverkusen_owner = get_or_create_owner(
            db,
            leverkusen,
            "Mark",
            "Beispiel",
            "1979-08-12",
            "Bahnhofstraße",
            "7",
            "51373",
            "Leverkusen",
        )
        leverkusen_dog = get_or_create_dog(
            db,
            leverkusen,
            leverkusen_owner,
            "Bruno",
            "Boxer",
            "276099900000444",
            "LISTENHUND",
            1,
        )
        get_or_create_registration(db, leverkusen, leverkusen_owner, leverkusen_dog, 0)

        freiburg_owner = get_or_create_owner(
            db,
            freiburg,
            "Sina",
            "Meyer",
            "1992-11-03",
            "Kaiser-Joseph-Straße",
            "9",
            "79098",
            "Freiburg",
        )
        freiburg_dog = get_or_create_dog(
            db,
            freiburg,
            freiburg_owner,
            "Flocke",
            "Terrier",
            "276099900000555",
            "NORMAL",
            0,
        )
        get_or_create_registration(db, freiburg, freiburg_owner, freiburg_dog, 0)

        db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the dog tax database.")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate all tables first.")
    args = parser.parse_args()

    seed_database(reset=args.reset)
    print("Database seeded successfully.")


if __name__ == "__main__":
    main()
