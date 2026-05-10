# Dog Tax Logic — Data-Driven Rule Engine

This document describes the scalable, data-driven tax calculation engine used by the platform and explains how it correctly implements real German municipal tax statutes.

---

## Architecture: Data-Driven Rule Evaluator

The tax engine is fully database-driven: **adding a new city or exemption type requires only database rows, not code changes.**

### How It Works

1. **Conditions**: Each rule has a `condition` (e.g., `DEFAULT`, `LISTENHUND`, `ASSISTANCE_DOG`, `SHELTER_ADOPTION`, `SOCIAL_BENEFIT`).
2. **Priority**: Rules are evaluated in priority order (highest first). Exemptions get priority 100, reductions get 50, standard rates get 0.
3. **Position**: Each rule optionally specifies a `dog_position` (1, 2, 3) for tiered systems. Position-less rules apply to all positions (flat rates).
4. **Matching**: The engine finds the highest-priority rule whose condition is true and position matches (or is a catch-all).

### Example: Berlin vs Hamburg

| City | Condition | dog_position | amount | priority |
|---|---|---|---|---|
| **Berlin** (tiered) | DEFAULT | 1 | €120 | 0 |
| **Berlin** (tiered) | DEFAULT | 2 | €180 | 0 |
| **Berlin** (tiered) | DEFAULT | 3 | €180 | 0 |
| **Hamburg** (flat) | DEFAULT | NULL | €90 | 0 |
| **Hamburg** | LISTENHUND | NULL | €600 | 50 |
| **Hamburg** | ASSISTANCE_DOG | NULL | €0 | 100 |

**Result:**
- Berlin 4th dog: Evaluator skips position 4 rule (doesn't exist), finds position 3 (highest ≤ 4) → €180
- Hamburg 4th dog: No position tiers → matches position NULL rule → €90
- Hamburg assistance dog: ASSISTANCE_DOG priority 100 > LISTENHUND priority 50 → €0

### Adding a New Exemption (No Code Change)

Example: Add a "police dog" exemption to a city:

```sql
INSERT INTO dog_tax_rules (municipality_id, condition, priority, dog_position, amount_eur, ...)
VALUES (hamburg_id, 'POLICE_DOG', 100, NULL, 0, ...);
```

And update the registration request to include a `police_dog: bool` flag. The engine automatically evaluates it.

---

## Berlin (HuStG BE — Hundesteuergesetz Berlin)

**Legal Reference:** _Gesetz über eine Hundesteuer im Land Berlin_ (HuStG BE), last amended 23.11.2023

**Database representation:**
```
condition    | dog_position | amount | priority
DEFAULT      | 1            | 120    | 0
DEFAULT      | 2            | 180    | 0
DEFAULT      | 3            | 180    | 0
ASSISTANCE_DOG | NULL       | 0      | 100
```

### Basic Rates (§ 4 HuStG BE)

| Dog Position | Annual Tax |
|---|---|
| 1st dog | **€120** |
| 2nd+ dog | **€180** |

**Important:** Berlin law distinguishes dogs **only by count**, not by breed. Listenhunde (dangerous breed dogs) are taxed at the same rate as standard dogs. No LISTENHUND rule exists in Berlin's seed; they fall back to DEFAULT.

### Exemptions (§ 5 HuStG BE)

Owners of the following are **exempt** (condition `ASSISTANCE_DOG`, priority 100):

1. **Certified assistance dogs** for blind or disabled persons
2. **Dogs in training** for rescue, police, or assistance work
3. **Certified rescue dogs** (professional use)
4. **Dogs adopted from Berlin animal shelters** — €0 for **5 years** after adoption
5. Owners receiving **SGB II** (_Bürgergeld_) social benefits
6. Owners receiving **SGB XII** (basic security for elderly/disabled) benefits

---

## Hamburg (HuStG HA — Hundesteuergesetz Hamburg 1995)

**Legal Reference:** _Hundesteuergesetz_ (HuStG HA 1995), current version as of 24.01.1995 with amendments through 19.12.2024

**Database representation:**
```
condition         | dog_position | amount | priority
DEFAULT           | NULL         | 90     | 0
LISTENHUND        | NULL         | 600    | 50
SHELTER_ADOPTION  | NULL         | 48     | 50
ASSISTANCE_DOG    | NULL         | 0      | 100
```

### Basic Rates (§ 6 HuStG HA)

| Dog Type | Annual Tax |
|---|---|
| Standard dog (any breed) | **€90** flat rate |
| Dangerous dog (§ 2 HundeG HA) | **€600** |

**Important:** Hamburg uses a **flat rate of €90 per dog** — there is no tiering by position (1st, 2nd, 3rd dog).

#### Dangerous Dogs (§ 2 HundeG HA)

The following breeds are classified as dangerous (condition `LISTENHUND`):
- Pit Bull Terrier
- American Staffordshire Terrier
- Staffordshire Bull Terrier
- Bullterrier (and mixes of these)

### Shelter Dog Reduction (§ 9a HuStG HA)

Dogs adopted from Hamburg animal shelters (condition `SHELTER_ADOPTION`, priority 50) receive a **reduced rate of €48/year for the first 12 months** after adoption. This applies only to non-dangerous dogs.

**Validity:** This reduction is valid until 31.12.2026 and will be re-evaluated by the Hamburg Senate.

### Exemptions (§ 7 HuStG HA)

The following dog owners are **exempt** (condition `ASSISTANCE_DOG`, priority 100):

1. **Assistance dogs** (guide dogs, mobility dogs, signal dogs, psychiatric service dogs) — since 01.01.2025
2. **Dogs used for rescue** (mountain rescue, police work, etc.)
3. Owners receiving **SGB II** (_Arbeitslosengeld II / Bürgergeld_) social benefits

### Other Provisions

- **§ 3:** Tax liability begins when the dog reaches **3 months of age**
- **§ 5:** Found dogs returned within 2 weeks are **tax-free**
- **§ 8:** Kennel operators and licensed breeders: only the first 2 dogs are taxed; 3rd+ breeding dogs are exempt (on request)
- **§ 9:** Licensed dog traders: only 2 dogs are taxed; other dogs held < 6 months are tax-free

---

## Rule Evaluation Algorithm (Pseudocode)

```python
def calculate_dog_tax(municipality_id, dog_type, active_dogs_before,
                     assistance_dog, shelter_adoption, social_benefit):
    actual_position = active_dogs_before + 1
    
    facts = {
        "LISTENHUND": dog_type == "LISTENHUND",
        "ASSISTANCE_DOG": assistance_dog,
        "SHELTER_ADOPTION": shelter_adoption,
        "SOCIAL_BENEFIT": social_benefit,
        "DEFAULT": True,
    }
    
    # Fetch all rules, ordered by priority DESC then dog_position DESC
    rules = db.query(DogTaxRule).filter(
        municipality_id=municipality_id,
        valid_to IS NULL
    ).order_by(priority DESC, dog_position DESC)
    
    for rule in rules:
        # Check condition match
        if not facts.get(rule.condition):
            continue
        
        # Check position match
        if rule.dog_position is not None and rule.dog_position > actual_position:
            continue
        
        # Match! Return the tax
        return {
            "amount_eur": rule.amount_eur,
            "tax_rule_id": rule.id,
            "dog_position": actual_position,
            "tax_reduced": 1 if rule.priority > 0 else 0,
            "reduction_reason": rule.condition if rule.priority > 0 else None,
        }
    
    raise HTTPException(404, "No tax rule found")
```

---

## Multiple Dogs: How It Handles 4+ Dogs

German statutes define a "3rd and each additional dog" tier. The engine handles this cleanly:

- A rule with `dog_position=3` matches dogs at positions 3, 4, 5, …
- The evaluator matches the **highest-numbered position ≤ actual_position**
- A new city needing a 4th-dog premium: just add a `dog_position=4` row

Example:
- Berlin 10th dog: No pos 10 → finds pos 3 (highest ≤ 10) → €180 ✓
- Hamburg 10th dog: No positional rules → matches pos NULL → €90 ✓

---

## Tax Recalculation on Transfer (Ummeldung)

When a citizen moves from one municipality to another:

1. Source registration is **deregistered** (status = `deregistered`, end_date = move date)
2. The `calculate_dog_tax()` function is called with the **target municipality's** rules
3. The new tax may be different due to different rates and exemptions
4. The `TaxAssessment` record documents the source and target amounts for audit purposes

---

## Cities in Platform

| Municipality | Rate Model | Dangerous | Legal Basis |
|---|---|---|---|
| Berlin | €120 / €180 (tiered by count) | No breed premium | HuStG BE § 4 |
| Hamburg | €90 flat | €600 LISTENHUND | HuStG HA § 6 |
| Hannover | €150 / €276 / €276 (tiered) | €720 LISTENHUND | Local ordinance |
| Leverkusen | €156 / €204 / €252 (tiered) | €720 LISTENHUND | Local ordinance |
| Freiburg | €102 / €204 / €204 (tiered) | €600 LISTENHUND | Local ordinance |

---

## Sources

- [Berlin HuStG BE (Gesetze.Berlin)](https://gesetze.berlin.de/bsbe/document/jlr-HuStGBErahmen)
- [Hamburg HuStG HA (Landesrecht Hamburg)](https://www.landesrecht-hamburg.de/bsha/document/jlr-HuStGHA1995rahmen)
