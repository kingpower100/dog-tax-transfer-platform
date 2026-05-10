# Tax Calculation Logic

## Tiered Tax Rates
The platform implements tiered basic tax rates depending on the number of dogs in a household, as is common in German municipal statutes.

### Example Rules (Hardcoded in Seed Data):
| Municipality | 1st Dog | 2nd Dog | Additional Dogs | Dangerous Breed |
|--------------|---------|---------|-----------------|-----------------|
| **Berlin**   | €120    | €180    | €240            | €600            |
| **Hannover** | €132    | €240    | €240            | €600            |
| **Leverkusen**| €156    | €204    | €252            | €720            |
| **Hamburg**  | €90     | €90     | €90             | €600            |

## Calculation Process
1. **Identify Dog Position**: The system checks the number of active dogs already registered to the owner in that municipality.
2. **Apply Rules**:
   - **Exemption**: If the dog is marked as an "Assistance Dog", the tax is €0.
   - **Dangerous Breed**: If the dog is a "Listenhund" (listed breed), a higher specific rate is applied.
   - **Basic Tier**: Otherwise, the rate for the 1st, 2nd, or 3rd+ dog is selected.
3. **Tax Assessment**: A `TaxAssessment` record is created to document the calculation at the time of registration or transfer.

## Demonstrating "Once-Only" Impact
When a dog is transferred from Hannover to Leverkusen:
- In Hannover (Source), the dog might be the only dog (€132).
- In Leverkusen (Target), if the owner already has one dog, the transferred dog becomes the 2nd dog and is taxed at the higher rate (€204).
- This recalculation happens automatically during the transfer process without citizen re-entry of dog details.
