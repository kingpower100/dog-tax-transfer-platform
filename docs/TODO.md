
2 sides: Client (citizen) and municipalities 
They are completly two different parts. 


"Participants will have access to real German municipal dog tax regulations - they should select any two cities to discover how
wildly their tax rules differ!
- [ ] Use excel data as users 
- [ ] Timeline of status
- [ ] What is audit log
- [ ] automated tax calculations that account for different regulations between municipalities #demo
- [ ] demonstrating how the same dog can be taxed differently when transferred from one city to another #demo
- [ ] Bonus: Generate a PDF notice, perform duplicate checks for the chip number within a tenant.

Build a SaaS-ready REST API that provides three capabilities:
1. Register a dog for tax purposes in a municipality (tenant).
2. Transfer an already-registered dog to another municipality when the owner moves.
3. Serve multiple municipalities simultaneously while keeping their data strictly isolated.

# Evaluation Metric: 
- enabling seamless information flow
- maintaining full data protection compliance - with excellence in both dimensions defining a great solution."
- Working code: the API starts with one command
- Live demo: demonstrate POST / Anmeldung and POST / Ummeldung. Show how data flows between tenants and how the log looks.
- One slide or whiteboard sketch: Which two regulations did you use? How do you identify the tenant?
- Choose two real German dog-tax statutes from the internet and implement their tiered rates. You need two statutes so that, after a transfer, the recalculation in the target tenant can be demonstrated. List the statutes you used in the final presentation.
# Audit 
When transferring dog registrations between municipalities, solutions should preserve all historical data by marking cases as
de-registered rather than deleting them, maintaining a complete audit trail.
- Completely delete data from the originating tenant during transfer - for auditing reasons, the case must remain and be marked as deregistered.
# Situation
- [ ] The chip number is a mandatory field - if it is missing, respond with HTTP 400.


# Current:
For a citizen moving from Hannover to Leverkusen this means today:
- de-register in Hannover (form, letter, weeks of processing time),
- then register again in Leverkusen (form, letter, weeks of processing time). 
Two procedures, duplicate data entry, long redundancy.

# Tax calculation
Tiered basic tax depending on the number of dogs in a household (1st dog, 2nd dog, each additional dog)
Higher tax rate for listed dogs