# Changelog

All notable changes to the Once-Only Dog Tax Transfer Platform will be documented in this file.

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
