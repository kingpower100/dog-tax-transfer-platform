from sqlalchemy.orm import Session
from app.models import Registration, Dog, Owner, Municipality

def generate_registration_notice(db: Session, registration_id: int) -> str:
    registration = db.get(Registration, registration_id)
    if not registration:
        return "Registration not found."

    dog = db.get(Dog, registration.dog_id)
    owner = db.get(Owner, registration.owner_id)
    municipality = db.get(Municipality, registration.municipality_id)

    notice = f"""
    HUNDESTEUERBESCHEID
    -------------------
    Stadt/Gemeinde: {municipality.name}
    
    BESCHEID-DETAILS
    Registrierungs-ID: {registration.id}
    Datum: {registration.registered_at.strftime('%d.%m.%Y')}
    Veranlagungsjahr: {registration.assessment_year}
    
    HALTER-INFORMATIONEN
    Name: {owner.first_name} {owner.last_name}
    Adresse: {owner.street} {owner.house_number}, {owner.postal_code} {owner.city}
    
    HUND-INFORMATIONEN
    Name: {dog.name}
    Rasse: {dog.breed}
    Chip-Nummer: {dog.chip_number}
    Hunde-Typ: {dog.dog_type}
    
    STEUER-FESTSETZUNG
    Hund-Position: {registration.dog_position}
    Jährlicher Steuerbetrag: {registration.annual_tax_amount:.2f} {registration.currency}
    
    STATUS: {registration.status.upper()}
    """
    if registration.assistance_dog:
        notice += "\nHinweis: Steuerbefreiung aufgrund von Assistenzhund-Status.\n"
    elif registration.tax_reduced:
        notice += f"\nHinweis: Steuerermäßigung gewährt ({registration.reduction_reason}).\n"
        
    notice += """
    -------------------
    Vielen Dank für Ihre Registrierung.
    Dies ist ein automatisch erstellter Beleg.
    """
    
    return notice.strip()
