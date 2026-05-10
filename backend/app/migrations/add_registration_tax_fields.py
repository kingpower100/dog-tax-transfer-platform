"""
Migration script to add tax-case fields to the registrations table.

This migration adds the following fields to support German municipal tax-case information:
- assistance_dog (INTEGER with CHECK constraint 0 or 1)
- tax_reduced (INTEGER with CHECK constraint 0 or 1) 
- reduction_reason (TEXT, nullable)
- liability_insurance_available (INTEGER with CHECK constraint 0 or 1)
- insurance_policy_number (TEXT, nullable)

These fields belong to registrations, not dogs, as they are tax-case properties
that can change between different registrations/municipalities.
"""

from sqlite3 import Connection
from typing import Optional

from app.database import SessionLocal, engine


def run_migration(conn: Connection) -> None:
    """Add the new registration fields with proper constraints."""
    
    # Check if columns already exist
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(registrations)")
    columns = [row[1] for row in cursor.fetchall()]
    
    # Add assistance_dog column if it doesn't exist
    if 'assistance_dog' not in columns:
        conn.execute("""
            ALTER TABLE registrations 
            ADD COLUMN assistance_dog INTEGER NOT NULL DEFAULT 0
        """)
        print("Added assistance_dog column")
    
    # Add tax_reduced column if it doesn't exist
    if 'tax_reduced' not in columns:
        conn.execute("""
            ALTER TABLE registrations 
            ADD COLUMN tax_reduced INTEGER NOT NULL DEFAULT 0
        """)
        print("Added tax_reduced column")
    
    # Add reduction_reason column if it doesn't exist
    if 'reduction_reason' not in columns:
        conn.execute("""
            ALTER TABLE registrations 
            ADD COLUMN reduction_reason TEXT
        """)
        print("Added reduction_reason column")
    
    # Add liability_insurance_available column if it doesn't exist
    if 'liability_insurance_available' not in columns:
        conn.execute("""
            ALTER TABLE registrations 
            ADD COLUMN liability_insurance_available INTEGER NOT NULL DEFAULT 0
        """)
        print("Added liability_insurance_available column")
    
    # Add insurance_policy_number column if it doesn't exist
    if 'insurance_policy_number' not in columns:
        conn.execute("""
            ALTER TABLE registrations 
            ADD COLUMN insurance_policy_number TEXT
        """)
        print("Added insurance_policy_number column")
    
    # Create a new table with all constraints
    conn.execute("""
        CREATE TABLE IF NOT EXISTS registrations_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            municipality_id INTEGER NOT NULL,
            owner_id INTEGER NOT NULL,
            dog_id INTEGER NOT NULL,
            tax_rule_id INTEGER,
            assessment_year INTEGER NOT NULL,
            dog_position INTEGER NOT NULL,
            annual_tax_amount INTEGER NOT NULL,
            assistance_dog INTEGER NOT NULL DEFAULT 0,
            tax_reduced INTEGER NOT NULL DEFAULT 0,
            reduction_reason TEXT,
            liability_insurance_available INTEGER NOT NULL DEFAULT 0,
            insurance_policy_number TEXT,
            currency TEXT NOT NULL DEFAULT 'EUR',
            status TEXT NOT NULL DEFAULT 'active',
            registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            deregistered_at DATETIME,
            end_date TEXT,
            deregistration_reason TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (municipality_id) REFERENCES municipalities (id),
            FOREIGN KEY (owner_id) REFERENCES owners (id),
            FOREIGN KEY (dog_id) REFERENCES dogs (id),
            FOREIGN KEY (tax_rule_id) REFERENCES dog_tax_rules (id),
            CHECK (dog_position >= 1),
            CHECK (annual_tax_amount >= 0),
            CHECK (status IN ('active', 'transferred', 'deregistered')),
            CHECK (assistance_dog IN (0, 1)),
            CHECK (tax_reduced IN (0, 1)),
            CHECK (liability_insurance_available IN (0, 1))
        )
    """)
    
    # Copy data from old table to new table
    conn.execute("""
        INSERT INTO registrations_new (
            id, municipality_id, owner_id, dog_id, tax_rule_id, assessment_year,
            dog_position, annual_tax_amount, assistance_dog, tax_reduced, reduction_reason,
            liability_insurance_available, insurance_policy_number, currency, status,
            registered_at, deregistered_at, end_date, deregistration_reason,
            created_at, updated_at
        )
        SELECT 
            id, municipality_id, owner_id, dog_id, tax_rule_id, assessment_year,
            dog_position, annual_tax_amount, 
            COALESCE(assistance_dog, 0) as assistance_dog,
            COALESCE(tax_reduced, 0) as tax_reduced,
            reduction_reason,
            COALESCE(liability_insurance_available, 0) as liability_insurance_available,
            insurance_policy_number, currency, status,
            registered_at, deregistered_at, end_date, deregistration_reason,
            created_at, updated_at
        FROM registrations
    """)
    
    # Drop old table and rename new table
    conn.execute("DROP TABLE registrations")
    conn.execute("ALTER TABLE registrations_new RENAME TO registrations")
    
    # Recreate indexes
    conn.execute("CREATE INDEX IF NOT EXISTS ix_registrations_municipality_id ON registrations (municipality_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS ix_registrations_owner_id ON registrations (owner_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS ix_registrations_dog_id ON registrations (dog_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS ix_registrations_tax_rule_id ON registrations (tax_rule_id)")
    
    print("Migration completed successfully")


def main() -> None:
    """Run the migration."""
    print("Starting migration: Add registration tax fields...")
    
    with engine.connect() as conn:
        run_migration(conn)
        conn.commit()
    
    print("Migration completed!")


if __name__ == "__main__":
    main()
