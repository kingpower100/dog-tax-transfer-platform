# Dog Tax Logic & Legal Basis

This document defines the tax rules implemented in the platform based on actual German municipal statutes.

---

## Berlin (HuStG BE — Hundesteuergesetz Berlin)

**Legal Reference:** _Gesetz über eine Hundesteuer im Land Berlin_ (HuStG BE), last amended 23.11.2023

### Basic Rates (§ 4 HuStG BE)

| Dog Position | Annual Tax |
|---|---|
| 1st dog | **€120** |
| 2nd+ dog | **€180** |

**Important:** Berlin law distinguishes dogs **only by count**, not by breed. Listenhunde (dangerous breed dogs) are taxed at the same rate as standard dogs.

### Exemptions (§ 5 HuStG BE)

The following dog owners are **exempt from tax** (€0):

1. **Certified assistance dogs** for blind or disabled persons
2. **Dogs in training** for rescue, police, or assistance work
3. **Certified rescue dogs** (professional use)
4. **Dogs adopted from Berlin animal shelters** — €0 for **5 years** after adoption
5. Owners receiving **SGB II** (_Bürgergeld_) social benefits
6. Owners receiving **SGB XII** (basic security for elderly/disabled) benefits

---

## Hamburg (HuStG HA — Hundesteuergesetz Hamburg 1995)

**Legal Reference:** _Hundesteuergesetz_ (HuStG HA 1995), current version as of 24.01.1995 with amendments through 19.12.2024

### Basic Rates (§ 6 HuStG HA)

| Dog Type | Annual Tax |
|---|---|
| Standard dog (any breed) | **€90** flat rate |
| Dangerous dog (§ 2 HundeG HA) | **€600** |

**Important:** Hamburg uses a **flat rate of €90 per dog** — there is no tiering by position (1st, 2nd, 3rd dog). The flat rate applies to all non-dangerous dogs regardless of how many a citizen owns.

#### Dangerous Dogs (§ 2 HundeG HA)

The following breeds are classified as dangerous and subject to the €600 rate:
- Pit Bull Terrier
- American Staffordshire Terrier
- Staffordshire Bull Terrier
- Bullterrier (and mixes of these)

Dogs of other breeds may be classified as individually dangerous by municipal authorities.

### Shelter Dog Reduction (§ 9a HuStG HA)

Dogs adopted from **Hamburg animal shelters** receive a **reduced rate of €48/year for the first 12 months** after adoption. This applies only to non-dangerous dogs.

**Validity:** This reduction is valid until 31.12.2026 and will be re-evaluated by the Hamburg Senate.

### Exemptions (§ 7 HuStG HA)

The following dog owners are **exempt from tax** (€0):

1. **Assistance dogs** (guide dogs, mobility dogs, signal dogs, psychiatric service dogs) — since 01.01.2025
2. **Dogs used for rescue** (mountain rescue, police work, etc.)
3. Owners receiving **SGB II** (_Arbeitslosengeld II / Bürgergeld_) social benefits

### Other Provisions

- **§ 3:** Tax liability begins when the dog reaches **3 months of age**
- **§ 5:** Found dogs returned within 2 weeks are **tax-free**
- **§ 8:** Kennel operators and licensed breeders: only the first 2 dogs are taxed; 3rd+ breeding dogs are exempt (on request)
- **§ 9:** Licensed dog traders: only 2 dogs are taxed; other dogs held < 6 months are tax-free

---

## Implementation Notes

### Shelter Adoption Tracking

The `reduction_reason` field in the `registrations` table tracks whether shelter discounts have been applied. For Hamburg, the 12-month limitation must be enforced at the **administrative** level (when a registration is renewed after 12 months, the SHELTER_REDUCTION rule expires and reverts to the standard rate).

### Listenhund (Dangerous Breed) Handling

- **Hamburg:** Listenhunde are explicitly taxed at €600 (§ 6 HuStG HA)
- **Berlin:** Listenhunde are taxed at standard count-based rates (€120/€180). There is **no breed premium** in Berlin law.
- **Fallback logic:** If a municipality has no DANGEROUS rule (e.g. Berlin), Listenhunde fall back to the standard BASIC rate lookup.

### Multiple Dogs

- **Hamburg:** €90 flat per dog (total = €90 × number_of_dogs)
- **Berlin:** €120 for 1st, €180 for each additional (total = €120 + €180×(count-1))

### Tax Recalculation on Transfer (Ummeldung)

When a citizen moves from one municipality to another:

1. Source registration is **deregistered** (end date = move date)
2. Target municipality calculates a **new registration** using its own tax rules
3. If the dog qualifies for exemptions in the target city, those are applied
4. The `TaxAssessment` record documents the source and target tax amounts for audit purposes

---

## Cities Seeded in the Platform

| Municipality | Rates | Legal Basis |
|---|---|---|
| Berlin | €120 / €180 (count-based, no breed premium) | HuStG BE § 4 |
| Hamburg | €90 flat / €600 dangerous | HuStG HA § 6 |
| Hannover | €150 / €276 / €276 / €720 dangerous | Local tax ordinance |
| Leverkusen | €156 / €204 / €252 / €720 dangerous | Local tax ordinance |
| Freiburg | €102 / €204 / €204 / €600 dangerous | Local tax ordinance |

---

## Sources

- [Berlin HuStG BE (Gesetze.Berlin)](https://gesetze.berlin.de/bsbe/document/jlr-HuStGBErahmen)
- [Hamburg HuStG HA (Landesrecht Hamburg)](https://www.landesrecht-hamburg.de/bsha/document/jlr-HuStGHA1995rahmen)
