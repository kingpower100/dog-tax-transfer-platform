from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Municipality(Base):
    __tablename__ = "municipalities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)
    code = Column(Text, nullable=False, unique=True)
    country = Column(Text, nullable=False, default="DE", server_default="DE")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    users = relationship("User", back_populates="municipality")
    owners = relationship("Owner", back_populates="municipality")
    dogs = relationship("Dog", back_populates="municipality")
    tax_rules = relationship("DogTaxRule", back_populates="municipality")
    registrations = relationship("Registration", back_populates="municipality")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('citizen', 'municipality_admin', 'platform_admin')",
            name="ck_users_role",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    role = Column(Text, nullable=False)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    municipality = relationship("Municipality", back_populates="users")
    owner_profile = relationship("Owner", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="actor_user")


class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, autoincrement=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    first_name = Column(Text, nullable=False)
    last_name = Column(Text, nullable=False)
    date_of_birth = Column(Text, nullable=True)
    street = Column(Text, nullable=False)
    house_number = Column(Text, nullable=False)
    postal_code = Column(Text, nullable=False)
    city = Column(Text, nullable=False)
    email = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    municipality = relationship("Municipality", back_populates="owners")
    user = relationship("User", back_populates="owner_profile")
    dogs = relationship("Dog", back_populates="owner")
    registrations = relationship("Registration", back_populates="owner")


class Dog(Base):
    __tablename__ = "dogs"
    __table_args__ = (
        CheckConstraint("dog_type IN ('NORMAL', 'LISTENHUND')", name="ck_dogs_dog_type"),
        CheckConstraint("is_dangerous IN (0, 1)", name="ck_dogs_is_dangerous"),
        CheckConstraint(
            "status IN ('active', 'transferred', 'deregistered')",
            name="ck_dogs_status",
        ),
        Index("idx_dogs_municipality_chip", "municipality_id", "chip_number"),
        Index(
            "uq_active_chip_per_municipality",
            "municipality_id",
            "chip_number",
            unique=True,
            sqlite_where=(Column("status") == "active"),
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)
    name = Column(Text, nullable=False)
    breed = Column(Text, nullable=False)
    chip_number = Column(Text, nullable=False)
    insurance_number = Column(Text, nullable=True)
    birth_date = Column(Text, nullable=True)
    gender = Column(Text, nullable=True)
    dog_type = Column(Text, nullable=False)
    is_dangerous = Column(Integer, nullable=False, default=0, server_default="0")
    status = Column(Text, nullable=False, default="active", server_default="active")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    municipality = relationship("Municipality", back_populates="dogs")
    owner = relationship("Owner", back_populates="dogs")
    registrations = relationship("Registration", back_populates="dog")


class DogTaxRule(Base):
    __tablename__ = "dog_tax_rules"
    __table_args__ = (
        CheckConstraint("rule_type IN ('BASIC', 'DANGEROUS', 'EXEMPTION')", name="ck_tax_rules_rule_type"),
        CheckConstraint("amount_eur >= 0", name="ck_tax_rules_amount_eur"),
        UniqueConstraint(
            "municipality_id",
            "rule_type",
            "dog_position",
            "valid_from",
            name="uq_tax_rule_natural_key",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    rule_type = Column(Text, nullable=False)
    dog_position = Column(Integer, nullable=True)
    amount_eur = Column(Integer, nullable=False)
    valid_from = Column(Text, nullable=False)
    valid_to = Column(Text, nullable=True)
    source_url = Column(Text, nullable=False)
    legal_reference = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    municipality = relationship("Municipality", back_populates="tax_rules")
    registrations = relationship("Registration", back_populates="tax_rule")


class Registration(Base):
    __tablename__ = "registrations"
    __table_args__ = (
        CheckConstraint("dog_position >= 1", name="ck_registrations_dog_position"),
        CheckConstraint("annual_tax_amount >= 0", name="ck_registrations_annual_tax_amount"),
        CheckConstraint(
            "status IN ('active', 'transferred', 'deregistered')",
            name="ck_registrations_status",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    tax_rule_id = Column(Integer, ForeignKey("dog_tax_rules.id"), nullable=True)
    assessment_year = Column(Integer, nullable=False)
    dog_position = Column(Integer, nullable=False)
    annual_tax_amount = Column(Integer, nullable=False)
    assistance_dog = Column(Integer, nullable=False, default=0, server_default="0")
    tax_reduced = Column(Integer, nullable=False, default=0, server_default="0")
    reduction_reason = Column(Text, nullable=True)
    liability_insurance_available = Column(Integer, nullable=False, default=0, server_default="0")
    insurance_policy_number = Column(Text, nullable=True)
    currency = Column(Text, nullable=False, default="EUR", server_default="EUR")
    status = Column(Text, nullable=False, default="active", server_default="active")
    registered_at = Column(DateTime, nullable=False, server_default=func.now())
    deregistered_at = Column(DateTime, nullable=True)
    end_date = Column(Text, nullable=True)
    deregistration_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    municipality = relationship("Municipality", back_populates="registrations")
    owner = relationship("Owner", back_populates="registrations")
    dog = relationship("Dog", back_populates="registrations")
    tax_rule = relationship("DogTaxRule", back_populates="registrations")


class TaxAssessment(Base):
    __tablename__ = "tax_assessments"
    __table_args__ = (
        UniqueConstraint("transfer_request_id", name="uq_tax_assessments_transfer_request_id"),
        UniqueConstraint("dog_registration_id", name="uq_tax_assessments_dog_registration_id"),
        CheckConstraint("active_dogs_before >= 0", name="ck_tax_assessments_active_dogs_before"),
        CheckConstraint("dog_position >= 1", name="ck_tax_assessments_dog_position"),
        CheckConstraint("amount_eur >= 0", name="ck_tax_assessments_amount_eur"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    dog_registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=True)
    transfer_request_id = Column(Integer, ForeignKey("transfer_requests.id"), nullable=True)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    tax_rule_id = Column(Integer, ForeignKey("dog_tax_rules.id"), nullable=False)
    active_dogs_before = Column(Integer, nullable=False)
    dog_position = Column(Integer, nullable=False)
    amount_eur = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    calculated_at = Column(DateTime, nullable=False, server_default=func.now())

    transfer_request = relationship("TransferRequest", back_populates="tax_assessment")
    dog_registration = relationship("Registration")
    municipality = relationship("Municipality")
    tax_rule = relationship("DogTaxRule")


class TransferRequest(Base):
    __tablename__ = "transfer_requests"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'form_prefilled', 'citizen_submitted', 'consent_given', "
            "'abmeldung_generated', 'source_finance_verified', 'source_finance_approved', "
            "'target_finance_verified', 'target_finance_approved', 'completed', "
            "'source_rejected', 'target_rejected', 'cancelled', "
            "'pending_source_approval', 'released_by_source', 'rejected')",
            name="ck_transfer_requests_status",
        ),
        CheckConstraint("consent_given IN (0, 1)", name="ck_transfer_requests_consent_given"),
        CheckConstraint("source_approved IN (0, 1)", name="ck_transfer_requests_source_approved"),
        CheckConstraint("target_accepted IN (0, 1)", name="ck_transfer_requests_target_accepted"),
        CheckConstraint(
            "from_municipality_id != to_municipality_id",
            name="ck_transfer_requests_different_municipalities",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    citizen_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=True)
    source_municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=True)
    target_municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=True)
    from_municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    to_municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    source_owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False)
    source_dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    source_registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=True)
    target_owner_id = Column(Integer, ForeignKey("owners.id"), nullable=True)
    target_dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=True)
    target_registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=True)
    chip_number = Column(Text, nullable=False)
    insurance_number = Column(Text, nullable=True)
    status = Column(Text, nullable=False, default="draft", server_default="draft")
    target_street = Column(Text, nullable=True)
    target_house_number = Column(Text, nullable=True)
    target_postal_code = Column(Text, nullable=True)
    target_city = Column(Text, nullable=True)
    move_date = Column(Text, nullable=True)
    deregistration_date = Column(Text, nullable=True)
    deregistration_reason = Column(Text, nullable=True)
    consent_text = Column(Text, nullable=True)
    consent_given = Column(Integer, nullable=False, default=0, server_default="0")
    consent_given_at = Column(DateTime, nullable=True)
    consent_actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    abmeldung_generated_at = Column(DateTime, nullable=True)
    source_verified_at = Column(DateTime, nullable=True)
    source_approved = Column(Integer, nullable=False, default=0, server_default="0")
    source_approved_at = Column(DateTime, nullable=True)
    target_verified_at = Column(DateTime, nullable=True)
    target_accepted = Column(Integer, nullable=False, default=0, server_default="0")
    target_accepted_at = Column(DateTime, nullable=True)
    target_approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    completed_at = Column(DateTime, nullable=True)
    source_finance_notes = Column(Text, nullable=True)
    target_finance_notes = Column(Text, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    from_municipality = relationship("Municipality", foreign_keys=[from_municipality_id])
    to_municipality = relationship("Municipality", foreign_keys=[to_municipality_id])
    citizen_user = relationship("User", foreign_keys=[citizen_user_id])
    dog = relationship("Dog", foreign_keys=[dog_id])
    owner = relationship("Owner", foreign_keys=[owner_id])
    source_municipality = relationship("Municipality", foreign_keys=[source_municipality_id])
    target_municipality = relationship("Municipality", foreign_keys=[target_municipality_id])
    source_owner = relationship("Owner", foreign_keys=[source_owner_id])
    source_dog = relationship("Dog", foreign_keys=[source_dog_id])
    source_registration = relationship("Registration", foreign_keys=[source_registration_id])
    target_owner = relationship("Owner", foreign_keys=[target_owner_id])
    target_dog = relationship("Dog", foreign_keys=[target_dog_id])
    target_registration = relationship("Registration", foreign_keys=[target_registration_id])
    payloads = relationship("TransferPayload", back_populates="transfer_request")
    documents = relationship("TransferDocument", back_populates="transfer_request")
    approvals = relationship("TransferApproval", back_populates="transfer_request")
    tax_assessment = relationship("TaxAssessment", back_populates="transfer_request", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="transfer_request")


class TransferPayload(Base):
    __tablename__ = "transfer_payloads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transfer_request_id = Column(Integer, ForeignKey("transfer_requests.id"), nullable=False)
    payload_json = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    transfer_request = relationship("TransferRequest", back_populates="payloads")


class TransferDocument(Base):
    __tablename__ = "transfer_documents"
    __table_args__ = (
        CheckConstraint(
            "document_type IN ('DOG_TAX_ABMELDUNG', 'TRANSFER_SUMMARY')",
            name="ck_transfer_documents_document_type",
        ),
        CheckConstraint(
            "document_status IN ('draft', 'generated', 'submitted', 'accepted', 'rejected')",
            name="ck_transfer_documents_document_status",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    transfer_request_id = Column(Integer, ForeignKey("transfer_requests.id"), nullable=False)
    document_type = Column(Text, nullable=False)
    document_status = Column(Text, nullable=False, default="draft", server_default="draft")
    generated_content = Column(Text, nullable=False)
    generated_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    transfer_request = relationship("TransferRequest", back_populates="documents")
    created_by_user = relationship("User")


class TransferApproval(Base):
    __tablename__ = "transfer_approvals"
    __table_args__ = (
        CheckConstraint(
            "approval_type IN ('SOURCE_FINANCE', 'TARGET_FINANCE')",
            name="ck_transfer_approvals_approval_type",
        ),
        CheckConstraint(
            "status IN ('draft', 'verified', 'approved', 'rejected')",
            name="ck_transfer_approvals_status",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    transfer_request_id = Column(Integer, ForeignKey("transfer_requests.id"), nullable=False)
    municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    approval_type = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="draft", server_default="draft")
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    transfer_request = relationship("TransferRequest", back_populates="approvals")
    municipality = relationship("Municipality")
    verified_by_user = relationship("User", foreign_keys=[verified_by_user_id])
    approved_by_user = relationship("User", foreign_keys=[approved_by_user_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        CheckConstraint(
            "actor_role IN ('citizen', 'municipality_admin', 'platform_admin', 'system')",
            name="ck_audit_logs_actor_role",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    transfer_request_id = Column(Integer, ForeignKey("transfer_requests.id"), nullable=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_role = Column(Text, nullable=False)
    actor_municipality_id = Column(Integer, ForeignKey("municipalities.id"), nullable=True)
    action = Column(Text, nullable=False)
    details_json = Column(Text, nullable=False)
    previous_hash = Column(Text, nullable=True)
    current_hash = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=False, server_default=func.now())

    transfer_request = relationship("TransferRequest", back_populates="audit_logs")
    actor_user = relationship("User", back_populates="audit_logs")
    actor_municipality = relationship("Municipality")
