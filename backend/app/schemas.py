from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class HalterIn(BaseModel):
    vorname: str
    nachname: str
    geburtsdatum: str | None = None
    strasse: str
    hausnummer: str
    plz: str
    ort: str
    email: str | None = None
    telefon: str | None = None


class HundIn(BaseModel):
    name: str
    chipnummer: str | None = None
    rasse: str
    geburtsdatum: str | None = None
    geschlecht: str | None = None
    typ: Literal["NORMAL", "LISTENHUND"]


class AnmeldungRequest(BaseModel):
    halter: HalterIn
    hund: HundIn
    assistance_dog: bool = False
    tax_reduced: bool = False
    reduction_reason: str | None = None
    liability_insurance_available: bool = False
    insurance_policy_number: str | None = None


class AnmeldungResponse(BaseModel):
    status: int
    message: str
    mandant: str
    personId: int
    hundId: int
    registrierungId: int
    steuerbetrag: int
    assistance_dog: bool = False
    tax_reduced: bool = False
    reduction_reason: str | None = None
    liability_insurance_available: bool = False
    insurance_policy_number: str | None = None
    waehrung: str
    veranlagungsjahr: int
    dog_position: int
    tax_rule_id: int


class NeueAdresseIn(BaseModel):
    strasse: str
    hausnummer: str
    plz: str
    ort: str


class UmmeldungRequest(BaseModel):
    von_mandant: str
    chipnummer: str
    neue_adresse: NeueAdresseIn
    assistance_dog: bool = False
    tax_reduced: bool = False
    reduction_reason: str | None = None
    liability_insurance_available: bool = False
    insurance_policy_number: str | None = None


class UmmeldungResponse(BaseModel):
    status: int
    message: str
    uebernommen_von: str
    ziel_mandant: str
    personId: int
    hundId: int
    registrierungId: int
    neuer_steuerbetrag: int
    assistance_dog: bool = False
    tax_reduced: bool = False
    reduction_reason: str | None = None
    liability_insurance_available: bool = False
    insurance_policy_number: str | None = None
    waehrung: str
    veranlagungsjahr: int
    dog_position: int
    tax_rule_id: int
    protokoll_id: int


class DemoContext(BaseModel):
    current_role: Literal[
        "citizen",
        "municipality_admin",
        "municipality_finance",
        "source_municipality_finance",
        "target_municipality_finance",
        "compliance_officer",
        "platform_admin",
    ]
    current_municipality_id: int | None = None
    current_user_id: int | None = None


class TransferRequestCreate(DemoContext):
    from_municipality_id: int
    to_municipality_id: int
    chip_number: str


class TransferAction(DemoContext):
    reason: str | None = None
    notes: str | None = None


class DogRegistrationRequest(DemoContext):
    municipality_id: int
    owner: dict
    dog: dict
    assistance_dog: bool = False
    tax_reduced: bool = False
    reduction_reason: str | None = None
    liability_insurance_available: bool = False
    insurance_policy_number: str | None = None


class RegistrationFinanceAction(DemoContext):
    notes: str | None = None
    reason: str | None = None


class TransferCreateRequest(DemoContext):
    registration_id: int
    target_municipality_id: int
    insurance_number: str | None = None
    target_street: str
    target_house_number: str
    target_postal_code: str
    target_city: str
    move_date: str
    deregistration_date: str
    deregistration_reason: str = "moved_to_other_municipality"
    assistance_dog: bool = False
    tax_reduced: bool = False
    reduction_reason: str | None = None
    liability_insurance_available: bool = False
    insurance_policy_number: str | None = None


class TransferConsentRequest(DemoContext):
    consent_accepted: bool = Field(default=True)
    consent_text: str | None = None


class FinanceVerifyRequest(DemoContext):
    notes: str | None = None


class FinanceApproveRequest(DemoContext):
    notes: str | None = None


class FinanceRejectRequest(DemoContext):
    reason: str
    notes: str | None = None


class TransferDocumentResponse(BaseModel):
    id: int
    transfer_request_id: int
    document_type: str
    document_status: str
    generated_content: str
    generated_at: datetime | None
    submitted_at: datetime | None
    created_by_user_id: int | None


class TransferFormDataResponse(BaseModel):
    registration: dict
    owner: dict
    dog: dict
    source_municipality: dict
    target_municipalities: list[dict]


class TransferStatusTimelineResponse(BaseModel):
    transfer_request_id: int
    events: list[dict]


class MunicipalityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    country: str
    created_at: datetime


class DogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    municipality_id: int
    owner_id: int
    name: str
    breed: str
    chip_number: str
    insurance_number: str | None = None
    birth_date: str | None
    gender: str | None
    dog_type: str
    is_dangerous: int
    status: str
    created_at: datetime
    updated_at: datetime


class RegistrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    municipality_id: int
    owner_id: int
    dog_id: int
    tax_rule_id: int | None
    assessment_year: int
    dog_position: int
    annual_tax_amount: int
    assistance_dog: int
    tax_reduced: int
    reduction_reason: str | None = None
    liability_insurance_available: int
    insurance_policy_number: str | None = None
    currency: str
    status: str
    registered_at: datetime
    deregistered_at: datetime | None
    created_at: datetime
    updated_at: datetime


class TaxAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dog_registration_id: int | None = None
    transfer_request_id: int | None = None
    municipality_id: int
    tax_rule_id: int
    active_dogs_before: int
    dog_position: int
    amount_eur: int
    created_at: datetime
    calculated_at: datetime | None = None


class TransferOut(BaseModel):
    id: int
    citizen_user_id: int | None = None
    dog_id: int | None = None
    owner_id: int | None = None
    source_registration_id: int | None = None
    source_municipality_id: int | None = None
    target_municipality_id: int | None = None
    target_owner_id: int | None = None
    target_dog_id: int | None = None
    target_registration_id: int | None = None
    from_municipality: str
    to_municipality: str
    dog_name: str | None = None
    chip_number: str
    insurance_number: str | None = None
    status: str
    target_street: str | None = None
    target_house_number: str | None = None
    target_postal_code: str | None = None
    target_city: str | None = None
    move_date: str | None = None
    deregistration_date: str | None = None
    deregistration_reason: str | None = None
    consent_given: int
    consent_given_at: datetime | None = None
    consent_actor_user_id: int | None = None
    abmeldung_generated_at: datetime | None = None
    source_verified_at: datetime | None = None
    source_approved: int
    source_approved_at: datetime | None = None
    target_verified_at: datetime | None = None
    target_accepted: int
    target_accepted_at: datetime | None = None
    target_approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    rejected_at: datetime | None = None
    rejection_reason: str | None = None
    annual_tax_amount: int | None = None
    dog_position: int | None = None
    transfer_payload: dict | None = None
    tax_assessment: TaxAssessmentOut | None = None
    tax_preview: dict | None = None


TransferResponse = TransferOut


class CitizenUserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str


class CitizenOwnerOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    date_of_birth: str | None = None
    street: str
    house_number: str
    postal_code: str
    city: str
    municipality_id: int
    municipality_name: str


class CitizenDogRegistrationOut(BaseModel):
    dog_id: int
    registration_id: int
    dog_name: str
    chip_number: str
    insurance_number: str | None = None
    breed: str
    dog_type: str
    municipality_id: int
    municipality_name: str
    registration_status: str
    registration_start_date: datetime | None = None
    registration_end_date: str | None = None
    annual_tax_eur: int | None = None
    tax_rule_id: int | None = None
    tax_rule_reference: str | None = None
    tax_assessment_id: int | None = None
    active_transfer_id: int | None = None
    active_transfer_status: str | None = None


class CitizenMeResponse(BaseModel):
    user: CitizenUserOut
    owner: CitizenOwnerOut | None = None
    dogs: list[CitizenDogRegistrationOut]


class TaxRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    municipality_id: int
    rule_type: str
    dog_position: int | None
    amount_eur: int
    valid_from: str
    valid_to: str | None
    source_url: str
    legal_reference: str | None
    created_at: datetime


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transfer_request_id: int | None
    actor_user_id: int | None
    actor_role: str
    actor_municipality_id: int | None
    action: str
    details_json: str
    previous_hash: str | None
    current_hash: str
    timestamp: datetime
