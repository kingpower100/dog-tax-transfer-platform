# Once-Only Dog Tax Transfer Platform

## Professional Summary

The Once-Only Dog Tax Transfer Platform is a secure municipal SaaS application for managing dog tax registration and municipality-to-municipality transfer workflows. It enables German municipalities to process citizen registrations, validate consent, exchange transfer-scoped data, calculate local tax obligations, and maintain a traceable audit history across the complete lifecycle.

The platform is designed around administrative reliability, tenant isolation, GDPR-aware data minimization, and secure API-driven workflows.

## Problem Statement

Municipal dog tax processes often require citizens to resubmit information that already exists in another municipality. This creates administrative friction, duplicated records, inconsistent tax assessments, and unnecessary exposure of personal data.

Municipal staff need a secure way to:

- verify existing dog and owner records
- confirm citizen consent
- transfer only the data required for the receiving municipality
- calculate tax according to local rules
- preserve a reliable audit trail
- prevent cross-municipality data access

## Solution Overview

This platform provides a controlled transfer layer between municipalities. A citizen can initiate a dog relocation workflow, the source municipality validates and releases the existing registration data, and the target municipality accepts the transfer, recalculates tax, and creates the local registration.

Core capabilities include:

- citizen dog registration intake
- secure inter-municipality transfer handling
- source and target municipality approval gates
- consent-based data exchange
- tenant-scoped dashboards
- automated target-municipality tax calculation
- immutable audit event tracking
- API-level workflow enforcement

## Security-First Architecture

The platform is built with security boundaries at the backend service layer, not only in the user interface. Municipal actions are validated server-side through role checks, municipality scope checks, transfer state checks, and consent requirements.

Security principles include:

- municipality-scoped access control
- transfer-scoped visibility
- role-based API authorization
- controlled state transitions
- minimized transfer payloads
- audit logging for critical workflow actions
- secure defaults for sensitive transfer data

## Once-Only Principle

The once-only principle reduces repeated citizen data submission by reusing verified source municipality records when a dog moves between municipalities.

Instead of asking the citizen to re-enter all owner, dog, and registration details, the platform uses the existing source registration as the authoritative basis for the transfer. The target municipality receives only the information required to establish the new local registration and calculate tax.

This reduces:

- duplicate manual entry
- inconsistent owner and dog records
- unnecessary document handling
- avoidable personal data exposure

## Multi-Tenant SaaS Architecture

The platform is structured around municipality tenants. Each tenant represents an individual municipality with its own data scope, tax rules, registrations, dogs, owners, approvals, and audit visibility.

Tenant isolation rules:

- municipalities can access only their own tenant data
- transfer records are visible only to the source municipality, target municipality, or authorized platform roles
- dog, owner, registration, tax rule, document, and audit queries are scoped by municipality
- frontend-provided municipality values are treated as untrusted and validated by backend rules
- administrative actions require the actor to belong to the relevant municipality scope

## GDPR-Oriented Workflow

The transfer workflow is designed around data minimization and explicit consent.

GDPR-oriented controls include:

- consent required before transfer processing
- transfer payloads limited to required owner, dog, registration, and move data
- no unrelated citizen history in transfer responses
- no password hashes or internal secrets in API output
- scoped audit log visibility
- municipality-specific access boundaries
- minimized list responses for operational dashboards

## Secure Transfer Workflow

The transfer lifecycle is controlled by backend state validation. Each transition must happen in the correct order and under the correct municipality role.

Primary lifecycle:

1. `draft`
2. `citizen_submitted`
3. `consent_given`
4. `abmeldung_generated`
5. `source_finance_verified`
6. `source_finance_approved`
7. `target_finance_verified`
8. `target_finance_approved`
9. `completed`

The source municipality can verify and approve only transfers where it is the source tenant. The target municipality can verify, approve, and complete only transfers where it is the target tenant.

## Audit Trail And Accountability

Important actions are recorded as audit events, including:

- transfer creation
- consent capture
- document generation
- source verification
- source approval
- target verification
- target approval
- tax calculation
- registration creation
- transfer completion
- rejection events
- denied cross-tenant access attempts

Audit entries include actor role, actor municipality, transfer reference, timestamp, action type, and structured metadata. This supports administrative accountability and operational traceability.

## Automated Municipality Tax Calculation

Tax calculation is performed by the backend using the target municipality's tax rules. The frontend cannot override the calculated amount.

The calculation flow ensures:

- target municipality rules are used for target registrations
- dog position is calculated within the target municipality scope
- listed or dangerous dog rules are applied where relevant
- the tax rule ID is stored for auditability
- tax assessment records are linked to registrations or transfers

## Technical Architecture

Frontend:

- React
- Vite
- Tailwind CSS

Backend:

- FastAPI
- SQLAlchemy
- SQLite
- Pydantic schemas
- JWT-based transfer security model

Core backend modules:

- municipality and tenant resolution
- dog and owner registration services
- transfer lifecycle services
- tax calculation services
- audit logging services
- tenant-scoped routers

## JWT And Transfer Security Model

The platform uses JWT concepts for scoped transfer authorization. Transfer-scoped tokens are designed to carry only authorization metadata, not sensitive personal data.

Transfer token claims include:

- `transfer_id`
- `source_municipality_id`
- `target_municipality_id`
- `scope`
- `iss`
- `aud`
- `exp`

The target municipality verifies issuer, audience, expiration, transfer ID, and scope before accepting protected transfer operations.

## Example Transfer Lifecycle

1. A citizen initiates a dog move from the source municipality to the target municipality.
2. The platform links the transfer request to the existing active source registration.
3. The citizen grants consent for transfer-scoped municipal processing.
4. The source municipality verifies the current registration and releases the transfer package.
5. The target municipality verifies the incoming transfer, address, consent, and required documents.
6. The backend calculates tax using target municipality rules.
7. The target municipality approves and finalizes the local registration.
8. Audit events preserve the full administrative history.

## Current Capabilities

- citizen registration request processing
- municipality dashboards for source and target workflows
- incoming and outgoing transfer management
- document generation for deregistration workflows
- target municipality tax assessment
- registration activation and transfer completion
- tenant-scoped API responses
- audit log visibility by municipality involvement
- transfer lifecycle validation
- secure response schemas for operational API use

## Future Improvements

- integration with production identity providers
- full OpenID Connect municipal SSO
- hardware-backed key management for transfer encryption
- database migration automation
- expanded document verification workflows
- notification delivery for citizen and municipal staff
- advanced reporting for municipal finance teams
- deployment profiles for managed cloud environments

## Professional Closing

The Once-Only Dog Tax Transfer Platform provides a secure foundation for modern municipal administration. It combines once-only data reuse, consent-based transfer processing, tenant isolation, automated tax calculation, and auditability into a focused government-tech workflow for German municipalities.
