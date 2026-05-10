# Transfer Workflow (Once-Only Principle)

## The "Ummeldung" Process
The platform automates the transfer of registration data between municipalities.

### 1. Initiation
A citizen or a municipality officer initiates a `TransferRequest`. The system identifies the "Source" municipality (where the dog is currently active) and the "Target" municipality (where the dog is moving).

### 2. Citizen Consent
Per GDPR and OOP standards, the citizen must provide explicit consent for the data transfer. This action is logged and triggers the next phase.

### 3. Source Release
The source municipality verifies the request and "releases" the dog. 
- The dog's status in the source municipality is changed to `transferred`.
- The registration is marked as `deregistered` with a reason of `moved_to_other_municipality`.
- A `TransferPayload` (snapshot of data) is created.

### 4. Target Acceptance & Recalculation
The target municipality receives the payload.
- A new `Owner` profile (if not already existing) and `Dog` record are created in the target tenant.
- **Automatic Recalculation**: The `TaxService` calculates the new annual tax based on the target municipality's specific rules.
- A new `Registration` is activated in the target municipality.

### 5. Completion
The transfer is marked as `completed`, and the citizen can view their new registration and tax assessment in the portal.

## Audit Integrity
At no point is data deleted. The "Source" municipality retains the record of the dog's previous registration for auditing and historical tax verification, while the "Target" municipality gains a new, active record.
