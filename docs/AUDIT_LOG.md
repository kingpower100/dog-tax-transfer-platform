# Audit Log and Data Integrity

## Purpose
To ensure transparency, accountability, and legal compliance, every significant action in the platform is recorded in a centralized but tenant-aware audit log.

## Features
- **Immutability**: Once an audit log is written, it cannot be modified.
- **Hash-Chaining**: (Proposed/Implemented) Each log entry contains a hash of the previous entry to prevent tampering with the log sequence.
- **Actor Attribution**: Every log identifies who performed the action (Citizen, Admin, or System) and their role.
- **Tenant Context**: Logs are associated with the municipality where the action occurred.

## Logged Events
- `ANMELDUNG_CREATED`: New dog registration.
- `TRANSFER_REQUEST_CREATED`: Initiation of a transfer.
- `CONSENT_GIVEN`: Citizen approval of data flow.
- `SOURCE_APPROVED_RELEASE`: Source municipality releasing data.
- `TARGET_ACCEPTED_COMPLETED`: Target municipality finalising the transfer.
- `TAX_ASSESSED`: Recording a new tax calculation.

## Data Retention
The platform adheres to the principle of not deleting historical data. Transfers mark old records as inactive, ensuring a complete audit trail of where a dog has been registered throughout its life.
