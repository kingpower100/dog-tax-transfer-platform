# Changelog

All notable changes to the Once-Only Dog Tax Transfer Platform will be documented in this file.

## [1.1.0] - 2026-05-10

### Added
- **`POST /ummeldung` re-enabled**: Direct one-shot dog transfer endpoint now calls the fully-implemented `create_ummeldung()` service — atomically deregisters source, creates target registration, recalculates tax, and logs 6 audit events. Previously returned HTTP 410.
- **Platform Admin role in frontend**: Wired all 8 existing admin pages (`PlatformOverview`, `Dashboard`, `Tenants`, `Dogs`, `Registrations`, `Transfers`, `TaxRules`, `AuditLogs`) into `App.jsx` under a new `PLATFORM_ADMIN` role. Landing page now includes a Platform Admin access card.
- **Tax rate comparison table on Citizen Dashboard**: `CitizenHome` fetches live tax rules for all municipalities and renders a side-by-side table showing 1st dog, 2nd dog, and Listenhund rates with legal source attribution.
- **`docs/ARCHITECTURE.md`**: Full system architecture document covering stack, multi-tenancy model, database schema, transfer state machine, and API router map.
- **`docs/DEMO_GUIDE.md`**: Step-by-step hackathon demo guide with `curl` examples, startup instructions, legal references for the presentation slide, and the tax difference "wow moment" table.
- **`docs/API_REFERENCE.md`**: Complete API reference for all endpoints with request/response examples and header documentation.
- **`CLAUDE.md`**: Repository guidance file for Claude Code covering commands, architecture, and development patterns.
- **New rule type `SHELTER_REDUCTION`**: Added support for Hamburg § 9a shelter dog reduction (€48/year for 12 months after adoption from Hamburg shelters).

### Changed
- **`start.sh` updated**: Startup script now checks for existing `.venv` before falling back to `.venv_linux`, making it compatible with both Windows-sourced and Linux-native Python environments.
- **`AppHeader` role labels**: Added "Platform Admin" label for the `PLATFORM_ADMIN` role; tenant badge now also shown in Platform Admin view.
- **Tax rules corrected per legal source documents**: 
  - **Berlin**: Removed incorrect DANGEROUS rule (€600). Berlin HuStG BE § 4 defines tax only by dog count (€120/€180), not breed. Listenhunde now correctly use BASIC rate.
  - **Hamburg**: Added SHELTER_REDUCTION rule (€48) per § 9a HuStG HA for first 12 months after shelter adoption.
- **`docs/TAX_LOGIC.md`**: Completely rewritten with accurate legal citations from real statutes (Berlin HuStG BE, Hamburg HuStG HA 1995). Explains flat vs. tiered rates, exemptions, shelter provisions, and fallback logic for Listenhunde.
- **`tax_service.py`**: Enhanced `calculate_dog_tax()` with `shelter_adoption` parameter and fallback logic for Listenhunde in cities without DANGEROUS rule.
- **`models.py`**: Updated `DogTaxRule` CheckConstraint to include `'SHELTER_REDUCTION'` as valid rule_type.
- **`seed.py`**: Berlin no longer seeded with DANGEROUS rule; Hamburg now seeded with SHELTER_REDUCTION at €48.

### Fixed
- **Listenhund tax calculation bug in Berlin**: Previously raised HTTP 404 when calculating tax for Listenhunde in Berlin (which has no DANGEROUS rule). Now correctly falls back to BASIC rate per § 4 HuStG BE (€120/€180 by position).

## [1.0.0] - 2026-05-10

### Added
- **Registration Notice Service**: New backend service to generate formatted "Hundesteuerbescheide" (Registration Notices) for citizens.
- **Notice Viewer UI**: Integrated a "View Notice" button and modal overlay in the Citizen Dashboard to display generated tax documents.
- **Visual Transfer Timeline**: Refactored `TransferFlow` to fetch and display real-time events directly from the hash-chained Audit Log, providing cryptographic evidence of the transfer process.
- **Proactive Duplicate Checks**: Implemented backend validation to prevent redundant transfers or registrations for dogs already active in a target municipality.
- **One-Command Start**: Added root-level `start.sh` script to automate backend/frontend setup, database seeding, and server execution.
- **Comprehensive Documentation**: Created `docs/` directory with detailed guides on Architecture, API Reference, Tax Logic, and Audit Integrity.
- **Project Guidance**: Added `GEMINI.md` and `CLAUDE.md` to establish foundational development mandates and coding standards.

### Changed
- **Refined Tax Logic**: Updated `seed.py` and `tax_service.py` to strictly adhere to real-world municipal statutes for Hannover (tiered rates + dangerous breed premium) and Berlin.
- **Audit Log Transparency**: Enhanced the transfer status page to show a detailed timeline of events with unique cryptographic hashes for every state transition.
- **Repository Cleanup**: Added a comprehensive `.gitignore` and cleared the git cache to ensure only source files (and not `node_modules`, `venv`, or local `.db` files) are tracked.

### Fixed
- **CSV Import Validation**: Verified and corrected the `import_csv.py` utility to ensure sample data from `example_data.csv` is correctly mapped to municipal tax rules.
- **Tenant Isolation Logic**: Strengthened checks in the transfer workflow to maintain strict data separation between municipalities during data handovers.
- **Backend Start Script**: Fixed `start.sh` to correctly handle Linux virtual environments and use `python3 -m uvicorn` for reliable execution.
