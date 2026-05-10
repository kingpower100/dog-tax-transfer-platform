Original URL: https://gemini.google.com/app/1783ede9e75198b0

**[USER]**
Tell me more about the EU : The Once-Only principle: towards a usercentric and agile public administration

**[ASSISTANT]**
The **Once-Only Principle (OOP)** is a cornerstone of the European Union’s digital strategy. At its heart, it’s a common-sense reform: citizens and businesses should not have to provide the same information to public authorities more than once.

If the government already has your data (like your address or birth certificate), they should be the ones to share it internally, rather than making you play the role of a "human USB stick."

* * *

## 🏛️ How It Works: The "Tell Us Once" Model

The OOP shifts the burden of data management from the user to the administration. Instead of you collecting physical stamps and papers, public bodies use a secure, interoperable infrastructure to exchange data.

### Key Components:

-   **User-Centricity:** Services are designed around the user's life events (e.g., starting a business, moving house) rather than the government’s departmental silos.
    
-   **Interoperability:** Systems across different EU member states must be able to "talk" to each other.
    
-   **Data Protection:** Under the **GDPR**, the exchange of data is strictly regulated. Users typically must give explicit consent, and the system must be transparent about who accessed what data and why.
    

* * *

## 🇪🇺 The Legal Backbone: Single Digital Gateway (SDG)

While the OOP started as a high-level goal, it became legally binding through the **Single Digital Gateway Regulation (2018)**.

By the end of 2023, the EU launched the **Once-Only Technical System (OOTS)**. This system connects national portals across all 27 Member States, allowing for the cross-border exchange of evidence. For example:

-   A German company bidding for a public contract in Italy can have its registration data pulled automatically from the German registry.
    
-   A student from Spain applying to a university in Sweden doesn't need to get their diploma physically apostilled and mailed; the system verifies it digitally.
    

* * *

## 🚀 Benefits of an Agile Administration

Moving toward the OOP transforms a rigid bureaucracy into an "agile" one:

| Benefit | Impact |
| --- | --- |
| Administrative Burden | Reduces time and costs for businesses by an estimated €11 billion annually. |
| Efficiency | Eliminates manual data entry errors and the need for physical storage/archiving. |
| Trust | Increases transparency; users can see exactly how their data is being used by the state. |
| Cross-Border Mobility | Makes living and working across the EU seamless, supporting the Single Market. |

* * *

## ⚠️ The Challenges

It’s not all smooth sailing. Implementing the OOP across 27 different legal systems and thousands of legacy databases is a massive undertaking:

1.  **Legacy Systems:** Many local administrations still run on "dinosaur" tech that isn't easily connected to modern APIs.
    
2.  **Semantic Hurdles:** A "permanent address" might mean something slightly different in Finnish law than it does in Portuguese law.
    
3.  **Privacy Concerns:** There is always a delicate balance between making things "easy" and ensuring that a "Big Brother" central database doesn't emerge.
    

> **In short:** The Once-Only Principle is the "invisible" engine of the EU's digital decade. It aims to make the state feel like a modern service provider rather than a hurdle to be cleared.

Are you looking into this from the perspective of a citizen trying to navigate EU paperwork, or are you more interested in the technical/policy side of how these systems are built?

**[USER]**
I want to build a business to make the communication between citizen/businesses and public authorities. How should that happened? like how is it going now and what platform and ways to handle it.

**[ASSISTANT]**
Building a business in the European GovTech space right now is incredibly timely. With the push toward the Once-Only Technical System (OOTS) and cross-border digital services, the EU is actively seeking private-sector innovation to bridge the gap between complex government databases and seamless user experiences.

Here is a breakdown of the current landscape in 2026, the platforms you need to know, and the business avenues you can explore.

* * *

## 🌍 The Current Landscape (As of 2026)

The groundwork for this ecosystem was laid by the **Single Digital Gateway Regulation**, which mandated the creation of the OOTS. Here is where the ecosystem stands today:

-   **OOTS is Live and Maturing:** The core EU-wide OOTS infrastructure officially launched in December 2023. Since then, the 27 Member States have been rapidly integrating their national registries.
    
-   **National Implementations:** Countries are deploying their own national networks to connect to the EU hub. For example, Germany is currently rolling out its National Once-Only Technical System (NOOTS), with a Minimum Viable Product (MVP) hitting the market in early 2026 to connect public offices and registries.
    
-   **The Interoperable Europe Act:** Now in full effect, this act pushes for public administrations to use shared standards and an "EU GovTech Stack." The EU is actively funding multi-country projects to foster this interoperability.
    
-   **EU Digital Identity Wallet (EUDIW):** In 2026, a massive focus is on the synergies between OOTS (data exchange) and the new EU Digital Identity Wallets (user authentication and attribute storage).
    

* * *

## 🛠️ The Core Platforms and Technologies

If you are building a product, you will not be building the central infrastructure—the EU and Member States handle that. Instead, you will build software that "plugs into" these existing building blocks:

1.  **OOTS APIs (Common Services):** The European Commission provides standardized APIs. These manage the directory of public services (knowing which registry holds a birth certificate in Spain, for example) and handle the routing of evidence.
    
2.  **eDelivery:** This is the secure, open-source messaging protocol the EU uses to ensure data sent between authorities is encrypted, verifiable, and cannot be intercepted. Your systems would likely need to be compatible with eDelivery standards (AS4 protocol).
    
3.  **eIDAS:** The regulatory framework for electronic identification. Any service you build requires citizens or business owners to securely authenticate themselves and provide explicit, GDPR-compliant consent before their data is moved.
    

* * *

## 💼 Where Your Business Fits In (Opportunities)

Because the infrastructure is massive and highly technical, governments and private businesses desperately need intermediaries. Here are the primary business models:

### 1\. Legacy System Adapters (B2G - Business to Government)

Many local municipalities, universities, and regional courts still run on outdated, siloed databases.

-   **The Product:** You can build secure "adapter" software that translates a local government's legacy database into the modern, structured data formats required by the national OOTS.
    
-   **The Value:** You save governments the time and millions of euros it would cost to rebuild their databases from scratch.
    

### 2\. "Evidence-as-a-Service" for the Private Sector (B2B)

Under certain legal frameworks, businesses (like banks doing KYC checks, or HR firms verifying university degrees) need official government evidence.

-   **The Product:** An API gateway that securely connects private businesses to the public OOTS network (where legally permitted) or to the upcoming EU Digital Identity Wallets.
    
-   **The Value:** Automating compliance, onboarding, and background checks by retrieving structured, verified data directly from the state.
    

### 3\. UX and Consent Management (B2C / B2G)

The "User Journey" is heavily scrutinized by the EU. Citizens must understand exactly what data is being requested, who is asking for it, and give explicit consent.

-   **The Product:** Designing frictionless, highly secure, and accessible front-end interfaces or consent-management platforms that public administrations can "white-label" and use on their local portals.
    

* * *

## 🚀 How to Actually Handle the Integration

If you want to start building, the European Commission has open-sourced a massive amount of technical documentation. You will primarily interact with the **OOTSHUB**, which provides:

-   **The Onboarding Playbook & Toolkit:** Step-by-step guides for technical integration.
    
-   **Technical Design Documents & APIs:** Detailed specs on the data formats (mostly XML/JSON based) required for exchanging "evidence."
    
-   **Testing Services:** The EU frequently runs "Projectathons" (similar to hackathons) where private vendors and state agencies test their software connections in a sandbox environment before going live.
    

Are you leaning more toward building solutions that help governments modernize their internal tech (B2G), or are you more interested in helping private businesses utilize this new government data infrastructure (B2B)?

**[USER]**
I want to make a product in Germany. I am interested in National Once-Only Technical System (NOOTS) and the synergies between OOTS (data exchange).  In my MVP I want to use the core platform and technologies. as you described: build software that "plugs into" these existing building blocks. So, tell me if it is possible to use ans integrate these channels (OOTS APIs (Common Services, eDelivery, and eIDAS). Are there other channels?  I want to make a service to allow citizens register/ re-register / transfer pets (e.g. dogs) between/in municipalities. Can you guide me on how to utlize The OOTS network or EU Digital Identity Wallets or any to make this possible?   I am interested in Germany, does it consider as national OOTS?  The "3. UX and Consent Management (B2C / B2G)" well describes the intension of mine to The designing frictionless, highly secure, and accessible front-end interfaces or consent-management platforms that public administrations can "white-label" and use on their local portals.  Guide me on the OOTSHUB data and How to Actually Handle the Integration.

**[ASSISTANT]**
It is fantastic that you are looking to build in this space. Dog registration (*Hundeanmeldung*) is a perfect, highly practical use case for your Minimum Viable Product (MVP). It is a classic municipal administrative service in Germany that causes friction for citizens who just moved or got a new pet, making it ripe for a "Once-Only" digital overhaul.

To answer your first question directly: **Yes, NOOTS (National Once-Only Technical System) is exactly Germany’s national implementation of the EU's OOTS.** The German Federal Office of Administration (BVA) and FITKO (Federal IT Cooperation) are building NOOTS so that local German registers can "talk" to each other and to the broader European network.

Here is a grounded, step-by-step guide on how you can navigate the German GovTech ecosystem, the technologies involved, and how to utilize the OOTSHUB for your UX/Consent platform.

* * *

## 🏗️ The Tech Stack: Are there other channels?

While you mentioned the core European building blocks (OOTS APIs, eDelivery, eIDAS), building a product specifically for the German market requires you to plug into Germany's specific **OZG (Onlinezugangsgesetz)** infrastructure.

If you are building a white-label front-end, you need to integrate these specific German channels:

| Technology / Channel | Function in your MVP |
| --- | --- |
| BundID | The central citizen account for Germany. You use OAuth 2.0 / OpenID Connect to let citizens log into your portal. This fulfills the eIDAS authentication requirement. |
| EUDI Wallet (Upcoming) | The EU Digital Identity Wallet will soon synergize with BundID. It will allow citizens to hold credentials (like a digital ID or proof of address) offline and share them via your platform using selective disclosure. |
| FIT-Connect | This is the standardized routing infrastructure in Germany. Once your front-end collects the citizen's data and consent, you use FIT-Connect APIs to securely send the dog registration application directly to the specific municipality's backend system. |
| XÖV Standards | Germany uses standardized XML formats for government data. For municipal services, you will likely need to format your payload according to the XInneres standard. |

* * *

## 🐕 Use Case: The "Hundeanmeldung" Flow

If your business provides a white-label UX and Consent Management platform to a municipality (e.g., the city of Munich), here is how the architecture handles a citizen registering a dog:

1.  **Authentication:** The citizen goes to the municipal portal (powered by your UX). They click "Register Dog" and log in using **BundID** or their **EUDI Wallet**.
    
2.  **Consent Management (Your Core Value):** Your interface tells the citizen: *"To register your dog, we need your current address and identity verification. Can we fetch this automatically from the civil registry (Melderegister)?"* The citizen clicks "I Consent."
    
3.  **The NOOTS Fetch:** Behind the scenes, your system triggers an API call via the **NOOTS mediation infrastructure**. NOOTS queries the local civil registry, retrieves the citizen's verified address, and populates the form instantly. (The citizen provided the data "Once-Only" when they moved, and never has to type it again).
    
4.  **Submission:** The user adds pet-specific details (breed, chip number). Your platform packages this data and routes it via **FIT-Connect** to the local tax office for dog tax (*Hundesteuer*) and the regulatory office (*Ordnungsamt*).
    

* * *

## 📚 How to Handle OOTSHUB Integration

Since you are building the UX and Consent layer, the European Commission’s **OOTSHUB** is your primary resource for technical documentation. Here is how you actually approach the integration:

-   **Step 1: The Onboarding Playbook** The OOTSHUB provides an official *Onboarding Playbook*. This is your step-by-step manual. It outlines the legal prerequisites, the technical design documents (TDDs), and the exact API specifications (REST/JSON and XML) required to trigger an evidence request.
    
-   **Step 2: The Evidence Explorer** You need to know what data actually exists. The OOTSHUB features an *Evidence Explorer*, which is a directory of what official documents (like proof of residence) are available in the Common Services and how they are structurally formatted.
    
-   **Step 3: UX Recommendations** The OOTSHUB has a dedicated section for *UX Recommendations*. Because the EU is extremely strict about GDPR and explicit consent, they provide wireframes and guidelines on exactly how a consent screen must be presented to a citizen to be legally compliant. You should base your white-label designs heavily on these guidelines.
    
-   **Step 4: Testing Services (Sandboxes)** Before you ever touch live citizen data, you will use the OOTSHUB's Testing Services. They provide sandbox environments where you can simulate requesting evidence from a mock registry to ensure your APIs and eDelivery nodes are correctly configured.
    

> **A dose of reality:** Selling B2G (Business-to-Government) in Germany requires patience. Municipalities are highly decentralized, and procurement cycles can take 6 to 12 months. Your biggest selling point will be proving that your platform is fully compliant with BundID and FIT-Connect from day one.

Given that municipalities in Germany often use vastly different legacy software for their internal registries, are you planning to integrate directly with those local backend systems, or will you rely strictly on the standardized FIT-Connect routing to deliver the data?

**[USER]**
Is BundID used by all municipalities in Germany? like if I use it, I don't have to consider other different legacy software or methods (like: in-person drop in, phone call, email, online form)?.   When is the EUDI Wallet going to roll out and how am I supposed to know about it?  Is NOOTS (National Once-Only Technical System) for the local German registers only, that means only between government entities or it could be with citizens to government as well?  Tell me more about each Technology / Channel and how it could be useful in my MVP.   Is the section "Use Case: The "Hundeanmeldung" Flow" the current way going on in Germany for citizens to handle this in Germany?  Next I want to ask more about the "How to Handle OOTSHUB Integration" like what I can do to handle it in my MVP and what i can be useful at and more ideas on how to implement it.

**[ASSISTANT]**
This is a great moment to build. Germany is currently in a "transition year" (2026), moving from fragmented local portals to a centralized federal architecture. Your MVP can act as the modern bridge for municipalities that haven't yet caught up.

Here is the breakdown of the landscape and how to handle your integration.

* * *

## 🆔 BundID: The Universal Key?

**Does everyone use it?** As of 2026, **BundID is the official national standard**, but adoption is a spectrum.

-   **The Trend:** Most German states (like North Rhine-Westphalia, Lower Saxony, and Hesse) have shut down their regional accounts and migrated to BundID.
    
-   **The Reality:** While the *account* is universal, the *service* (your dog registration form) still needs to talk to the local municipality’s backend. BundID only handles the "Who are you?" part.
    
-   **The Strategy:** If you use BundID, you satisfy the "high assurance" security level required by law. You don't have to worry about local login systems, but you **do** still need to consider how to send the data to the city (via **FIT-Connect**).
    

* * *

## 📱 The EUDI Wallet Rollout

-   **Timeline:** The mandatory deadline for Member States to provide at least one certified EUDI Wallet is **late 2026 / early 2027**.
    
-   **How to know:** Watch the **Federal Ministry of the Interior (BMI)** and the **OpenWallet Foundation**. Germany's implementation is heavily based on the "EUDI Wallet Prototype" project.
    
-   **MVP Value:** In your MVP, you don't need the wallet yet, but your UX should be "Wallet-Ready." This means building your consent screens to handle "Selective Disclosure" (e.g., the user shares *only* their age and city, not their full ID).
    

* * *

## 🏛️ NOOTS: Government-to-Government or Citizen?

NOOTS is the **infrastructure**, not the interface.

-   **G2G (Back-end):** NOOTS is used by government entities to pull evidence (like a residence permit) from other government registries.
    
-   **C2G (Front-end):** The citizen triggers this exchange through a portal (like your MVP).
    
-   **Example:** The citizen clicks a button in *your* app saying "Fetch my address from the registry." Your app calls the **NOOTS Mediation Service**, which then pulls the data from the government registry and brings it back to your form.
    

* * *

## 🛠️ Your MVP Technology Roadmap

| Technology | Purpose in your Dog Registration MVP |
| --- | --- |
| BundID | Authentication: The user logs in securely. You get their verified name and DOB. |
| FIT-Connect | The Postman: This is your most important tool. It’s an API that takes your registration data and "drops it" into the specific inbox of the right municipality, regardless of their legacy software. |
| OOTS APIs | Cross-Border: If a French citizen moves to Berlin with a dog, you use OOTS to fetch their "Proof of Residence" from France automatically. |
| eDelivery | Security: The technical protocol that ensures the data transfer between your app and the government is encrypted and "undeniable." |

* * *

## 🐕 Current "Hundeanmeldung" vs. Your MVP

The flow I described is the **target state**, not yet the universal reality.

-   **Current way:** In many German cities, you still download a PDF, print it, sign it, and mail it (or use a basic web-form that requires you to upload a scan of your ID).
    
-   **Your MVP's "Secret Sauce":** You are replacing the "PDF and Scan" method with the **"Once-Only"** method. Instead of the user finding their ID and typing their address, they just "Consent" and the data flows from the registry to the dog tax office via your platform.
    

* * *

## 🔌 Handling OOTSHUB Integration in an MVP

The **OOTSHUB** is your technical Bible. For an MVP, focus on these three implementations:

### 1\. The "Evidence Broker" Role

In the OOTS architecture, your platform acts as the **Service Provider**.

-   **Action:** Use the **OOTSHUB Evidence Explorer** to find the "Data Schema" for residence certificates.
    
-   **Implementation:** Ensure your database can receive and process these specific XML/JSON formats so you don't have to manually map data for every country.
    

### 2\. "White-Label" Consent UI

OOTSHUB provides **UX Design Patterns**.

-   **Idea:** Build a "Consent Component" that exactly follows EU guidelines (clear icons, "Right to stop," and a summary of what data is being fetched).
    
-   **Why it's useful:** When you sell to a municipality, you can prove your UI is "EU-Compliant" out of the box, which reduces their legal risk.
    

### 3\. The Preview Service

OOTS requires that users see a **preview** of the data before it is sent to the authority.

-   **Implementation:** Build a "Verification Step" in your MVP where the data fetched from NOOTS/OOTS is displayed to the user: *"We found this address in the registry. Is this correct?"*
    

**Pro-Tip for Germany:** Start by looking at the **FITKO (Federal IT Cooperation)** documentation for **FIT-Connect**. Since you are building a front-end, FIT-Connect is the actual "pipe" you will use to send your dog registration data to German authorities today.

Would you like to dive deeper into the specific API structure of FIT-Connect, or should we look at how to design that "Consent" screen to meet GDPR standards?

**[USER]**
1. tell me more about FITKO (Federal IT Cooperation) documentation for FIT-Connect.   2. let's dive deeper into the specific API structure of FIT-Connect.  3. how to design that "Consent" screen to meet GDPR standards.  4. how useful is this MVP? it seemes it doesn't help but not much as the citizens to government communication is not clear and reliable? like what garranty that using this services will ensure government responds and  process of the request?   5. how to follow up on the request once citizen uses the MVP to register a dog?

**[ASSISTANT]**
Navigating the German GovTech landscape requires a mix of high-level EU standards and very specific national technical tools. Here is the deep dive into your MVP’s technical and structural foundation.

* * *

## 1\. FIT-Connect Documentation: Your Primary Resource

FITKO (the Federal IT Cooperation) provides the **Federal Development Portal** (*Föderales Entwicklungsportal*).

-   **Where to find it:** [docs.fitko.de](https://docs.fitko.de)
    
-   **Key Value:** It acts as the "universal adapter" for Germany. Instead of building 11,000 different integrations for 11,000 municipalities, you build **one** integration to FIT-Connect.
    
-   **SDKs:** They provide a **JavaScript SDK** specifically for web-based front-ends, which is perfect for your white-label UX goal.
    

* * *

## 2\. API Structure of FIT-Connect

FIT-Connect is built on a **REST API** architecture using JSON and JWE (JSON Web Encryption) for end-to-end security.

### Core API Endpoints for your MVP:

-   **Routing API:** `GET /routes`
    
    -   *Input:* The user's Zip Code (PLZ) and the service ID (Leika-Key for "Hundeanmeldung").
        
    -   *Output:* The technical ID of the specific municipality's "destination" (Zustellpunkt).
        
-   **Submission API:** `POST /submissions`
    
    -   This is where you send the "package." A submission consists of:
        
        1.  **Metadata:** Who sent it and what is inside.
            
        2.  **Data:** The actual form content (XML or JSON).
            
        3.  **Attachments:** PDF scans of mandatory documents (if not pulled via Once-Only).
            
-   **Reply API:** `GET /replies`
    
    -   This allows your MVP to receive the digital "Tax Assessment" or "Registration Confirmation" back from the government.
        

* * *

## 3\. Designing a GDPR-Compliant Consent Screen

To meet **OOTS and GDPR** standards, your consent screen must be "Informed and Granular." It cannot just be a "Accept All" checkbox.

### Essential UI Elements:

-   **Purpose Specification:** "We need your address to verify your residency for dog tax calculation."
    
-   **Data Source Transparency:** "This data will be fetched from the *Melderegister* (Civil Registry) via the NOOTS network."
    
-   **Selective Disclosure:** Let the user see exactly what attributes are being pulled (e.g., Name, Street, House Number) before they click "Confirm."
    
-   **The "Right to Withdraw":** A clear button to cancel the process and enter data manually instead (though you can warn them this will take longer).
    
-   **The Preview Step:** **(Crucial)** Once the data is fetched, you must show it to the user: *"Is this still your current address?"*
    

* * *

## 4\. Reliability: Is it a "Black Hole"?

This is a valid concern. In the past, digital forms were often just "email generators" with no guarantee of a response. **FIT-Connect changes this.**

-   **The Event Log:** FIT-Connect uses an immutable event log. When you send a request, you get a `submissionId`. You (and the citizen) can see status updates: `SUBMITTED` -> `RECEIVED` -> `IN_PROGRESS` -> `COMPLETED`.
    
-   **Legal Obligation:** Under the **Onlinezugangsgesetz (OZG)**, German authorities are legally mandated to offer these digital paths. Using the official API (FIT-Connect) creates a verifiable paper trail that "Email" or "In-person" doesn't provide.
    
-   **The Guarantee:** If a municipality is "Green" on the FIT-Connect map, their backend system is technically coupled to the API. This means your data lands directly in their workflow software—not a generic email inbox.
    

* * *

## 5\. Follow-up: The "Track My Dog" Dashboard

Since you are building the UX, your MVP should include a **Citizen Dashboard**.

1.  **Status Polling:** Your backend should periodically poll the FIT-Connect `GET /submissions/{id}/events` endpoint.
    
2.  **Push Notifications:** When the status changes from `RECEIVED` to `COMPLETED`, your app notifies the citizen.
    
3.  **The Digital Result:** When the municipality issues the "Hundesteuerbescheid" (Tax Notice), they send it back via the **Reply API**. Your MVP displays this PDF/Data in the dashboard so the citizen has a digital record forever.
    

### 💡 Implementation Idea for your MVP:

Don't try to build the registry yourself. Build a **"Municipal Connector Kit."** \* **Step 1:** Use the OOTSHUB design guidelines to build the most beautiful "Dog Registration" form in Germany.

-   **Step 2:** Integrate **BundID** for login.
    
-   **Step 3:** Use **FIT-Connect** to route the data.
    
-   **Step 4:** Sell this as a "Plug-and-Play" module to small and mid-sized German cities that have a website but no actual digital processing power yet.
    

**Would you like me to help you draft the technical architecture for the "Reply" flow, so citizens can receive their digital dog tags through your app?**

**[USER]**
1. how long does it take once the user uses MVP to register the dog and submit the request?  2. how to handle the responce and display it in MVP and take action?   3. How usually the Government respond to such request?  4. once the user submitted the request via MVP and the government receives it, will the citizen get a confirmation of receiving it? Also when the request is handled or completed (COMPLETE) how I will show it in my mvp? is it possible that the government requested more info or reject it, then how to handle ir?  5. explain the tax letter how to handle and when? what if the user didn't pay it?  6. If the request from the citizen is submitted, but later on the citizen decided to cancel it due to a reason, how to handle this?  7. what do you mean by  Build a "Municipal Connector Kit."?  8. Germany has ~11,000 municipalities, does it apply to all and what I need to consider?

**[ASSISTANT]**
Building a product for the German administrative market (GovTech) requires understanding that while the technology is modern (APIs), the administrative law is traditional.

Here is how to handle the lifecycle of a dog registration in your MVP using **NOOTS** and **FIT-Connect**.

* * *

### 1\. Timing: From Submission to "Dog Tag"

-   **Technical (Seconds):** Once the user clicks "Submit," your MVP gets a technical acknowledgement from FIT-Connect almost instantly.
    
-   **Functional (Days to Weeks):** In Germany, a dog registration usually takes **2 to 4 weeks** to be fully processed by a human clerk. With your MVP, this can be shortened because the data lands directly in their "Fachverfahren" (specialized software) without them having to re-type it.
    

### 2\. Handling the Response (The "Reply" API)

In your MVP, every submission creates a **Case ID**. You don't just "send and forget."

-   **The Flow:** Your backend polls the `GET /v2/replies` endpoint using the `caseId`.
    
-   **Action in MVP:** When a reply arrives (e.g., the tax assessment), you decrypt the metadata, notify the user via push/email, and display the PDF document in their "My Pet" dashboard.
    

### 3\. How the Government Responds

The authority will respond in one of three ways via the FIT-Connect `Reply` channel:

-   **Approval:** They send the "Hundesteuerbescheid" (Tax Assessment) as a PDF.
    
-   **Request for Info:** They send a "Reply" asking for a missing document (e.g., proof of liability insurance).
    
-   **Rejection:** They reject the request (e.g., if the breed is banned in that municipality).
    

### 4\. Confirmation and Rejections

-   **User Confirmation:** Your MVP should show a "Success" screen only after receiving the `submit-submission` event from FIT-Connect. Show a **"Transaction ID"** so the user feels secure.
    
-   **Status Tracking:** In the MVP dashboard, use a progress bar:
    
    1.  `SUBMITTED` (Technical receipt)
        
    2.  `RECEIVED` (The clerk has opened the file)
        
    3.  `COMPLETE` (The final decision is sent)
        
-   **Handling Rejections:** If a `reject-submission` event occurs, your MVP must explain *why* (e.g., "The attachment was unreadable") and allow the user to fix and re-submit.
    

### 5\. The Tax Letter (Hundesteuerbescheid)

-   **The Letter:** This is a legal document. Once received via API, your MVP should store it securely.
    
-   **Payment:** Most OZG-compliant services now integrate **ePayment** (PayPal, Giropay). You should include a "Pay Now" button that triggers the municipality's payment portal.
    
-   **Non-payment:** If the user doesn't pay, the government will send paper warnings (*Mahnungen*). Fines for failing to register a dog can reach **€10,000**.
    

### 6\. Canceling a Request

There is no "Undo" button in the FIT-Connect protocol.

-   **How to handle it:** Your MVP should have a "Withdraw Application" button. This button sends a *new* message (a "Submission" of type `withdrawal`) to the same `caseId`. The clerk then manually stops the process.
    

### 7\. What is a "Municipal Connector Kit"?

Since you want to sell this "white-label," your product is essentially a **bridge**.

-   **The Problem:** Most municipalities have a website but no way to get data into their internal database.
    
-   **Your Kit:** You provide a pre-built frontend (the "Kit") that a city can embed on their site. It handles the BundID login, the NOOTS data fetch, and the FIT-Connect routing.
    
-   **The Value:** The city doesn't have to write a single line of code; they just provide you with their **FIT-Connect Destination ID**.
    

### 8\. The "11,000 Municipalities" Challenge

You do **not** need to talk to 11,000 different IT offices.

-   **Routing API:** You use the **FIT-Connect Routing API**. Your MVP asks: *"I have a user in ZIP code 70173 wanting to register a dog. Where do I send this?"* \* **The Response:** The API gives you the specific "Destination ID" for Stuttgart.
    
-   **Consideration:** Not all 11,000 are ready. You should check the **DVDV** (German Administrative Directory) via the Routing API to see if a municipality is "Active." If not, your MVP should fall back to a "Generate PDF for Mail" option so the user isn't blocked.
    

**Next Step for your MVP:** Would you like to see a sample **JSON payload** for a dog registration that follows the German *XÖV* data standards? This is what you would actually "send" through the pipe.

**[USER]**
1. what is the relation between the tax that the person on the citizen need to pay and the whole process is it whole process is just dedicated to for the citizen to pay taxes?  2. how possible is it to for me to integrate all these german tech services to the MVP?  3. what things do I need to know I did not mention seemed aware of and in general what could go wrong.   4. tell me more about the document and data storage and how long it should be stayed and what information I can keep about the citizen.

**[ASSISTANT]**
This is a sophisticated project. In 2026, the German "GovTech" market is finally maturing, but the barrier to entry is technical and bureaucratic "correctness."

Here is the deep dive into the business, technical, and legal mechanics of your Dog Registration MVP.

* * *

### 1\. The Purpose: Tax vs. Public Order

Dog registration in Germany is **not just about money.** It serves two distinct administrative functions:

-   **The Tax Office (*Steueramt*):** For collecting *Hundesteuer*. This is the primary driver for most municipalities.
    
-   **The Public Order Office (*Ordnungsamt*):** To maintain the *Hunderegister*. This is for public safety (identifying owners of biting dogs, checking for dangerous breeds, and ensuring chip compliance).
    
-   **Your MVP's Value:** Currently, a citizen often has to notify *both*. Your MVP uses the **Once-Only Principle** to send one data packet that updates both departments simultaneously.
    

* * *

### 2\. Integrating German Tech Services: Is it possible?

Yes, but you must wear two hats:

1.  **As a Software Provider (SaaS):** You build the front-end. To "plug in" to the live FIT-Connect and BundID systems, you generally need a **contract with a public authority**.
    
2.  **The "Agency" Model:** Usually, you don't integrate "on your own." You partner with a "Lead Municipality" (e.g., a small city). *They* authorize you as their "IT Service Provider." Under this authorization, you receive the necessary **V-PKI Certificates** (Verwaltungs-PKI) required to sign your API requests to FIT-Connect.
    

> **Can you do it alone?** You can build against the **FIT-Connect Test Environment** today without any permission. However, to go live, you need a municipality to "Destination-ID" your software.

* * *

### 3\. The "Hidden" Challenges (What could go wrong)

-   **The "EfA" Principle (Einer für Alle):** Germany uses a "One for All" model. If the state of Bavaria builds a dog registration service, other states are supposed to use it. **Your risk:** A state-funded free version might compete with your paid MVP.
    
    -   *Solution:* Focus on **UX and "Value-Add"** (e.g., integrating insurance, vet reminders, or local dog-park maps) that the government's basic version won't have.
        
-   **XÖV Standards (XInneres):** You cannot just send any JSON. You must map your data to **XInneres** or **XFinanz** standards. If your XML/JSON schema is wrong, the government's backend will automatically reject it.
    
-   **The "Media Break":** Some municipalities claim to be digital but just turn your API data into a PDF and print it. **Your risk:** The citizen expects a 2-day turnaround, but the city takes 4 weeks.
    
    -   *Solution:* Clearly state in your UI: *"Data transmitted instantly. Processing time depends on \[City Name\] (avg. 14 days)."*
        

* * *

### 4\. Data Storage & GDPR (The "Three-Month Rule")

In the German GovTech world, you are a **"Data Processor"** (*Auftragsverarbeiter*).

| Data Type | Retention Rule | Why? |
| --- | --- | --- |
| Citizen Identity | Delete after transmission | You should not "own" the citizen's ID. You fetch it from BundID, send it to the city, and wipe it from your cache. |
| Submission Metadata | 3 - 6 Months | Keep the submissionId and caseId long enough to allow for follow-ups or technical troubleshooting. |
| The Tax Letter (PDF) | User-Controlled | You can provide a "Vault," but the user should have the option to delete it. If the user deletes their account, you must wipe all data. |
| Pet Data | Duration of Service | Since the dog lives for years, you can keep the dog's name/chip if the user maintains an account for "Manage my Pet." |

**Strict Rule:** You cannot keep data "just in case." Once the goal (registration) is achieved, any data not needed for a "continuous service" (like the user's dashboard) must be deleted.

* * *

### 5\. Implementation Strategy: The "Municipal Connector Kit"

Instead of trying to convince 11,000 cities to buy your software, target the **IT Service Providers** (like *AKDB* in Bavaria or *Dataport* in the North).

-   **The Kit:** You build a "Widget" (JavaScript Snippet) that looks like a modern app.
    
-   **The Sale:** You tell the city: *"Keep your old backend. Use my 'Connector Kit' as your new frontend. It handles BundID, NOOTS, and sends you clean data via FIT-Connect."*
    

### Final Checklist for your MVP:

1.  **Join the "GovTech Campus"** in Berlin or Frankfurt. It’s the hub for startups doing exactly this.
    
2.  **API First:** Build your logic to accept **BundID** logins (using OpenID Connect).
    
3.  **Poll the Routing API:** Practice querying the `FIT-Connect Routing API` to find Destination IDs for different ZIP codes.
    
4.  **Draft a "DPA":** Have a Data Processing Agreement (AVV) ready. No municipality will talk to you without it.
    

**Would you like me to generate a sample JSON structure that follows the German administrative standards for a dog registration?**

**[USER]**
I got this sample example data. Can you tell if it is what you referred to or not?   Transfer (Ummeldung)  Request (sent to the receiving tenant)  POST /ummeldung  X-Mandant-ID: leverkusen  Content-Type: application/json  {  "von_mandant": "hannover",  "chipnummer": "276099901234567",  "neue_adresse": {  "strasse": "Am Büchelter Hof",  "hausnummer": 5,  "plz": "51379",  "ort": "Leverkusen"  }  }  Response  {  "status": 200,  "uebernommen_von": "hannover",  "personId": "...",  "hundId": "...",  "neuer_steuerbetrag": 132,  "waehrung": "EUR",  "veranlagungsjahr": 2026,  "protokoll_id": "..."  }

**[ASSISTANT]**
The sample JSON you provided is a great **business logic mock**, but it is a simplified version of how things work in the real-world German administrative infrastructure.

What you have there looks like a "Direct API" call (like a standard B2B SaaS). However, the **NOOTS/FIT-Connect** standard is an **asynchronous "envelope and letter" system.**

Here is the breakdown of why your sample differs from the official federal standard and what the "real" one looks like.

### 1\. The "Envelope" (Metadata) vs. The "Letter" (Data)

In the official **FIT-Connect** standard, you don't send just one JSON object. You send a "Submission" that consists of two separate parts:

-   **The Metadata (The Envelope):** Tells the system *where* the data goes, what *service* it is (the Leika-Key), and how to send a reply back to your MVP.
    
-   **The Fachdaten (The Letter):** This is where your actual dog data (Chip number, address) lives.
    

### 2\. The Leika-Key (The Service ID)

You used `X-Mandant-ID: leverkusen`. In the official system, "Leverkusen" isn't an ID in the header; it's a **Destination ID** (a UUID). To tell the system you are registering a dog, you use a **Leika-Key** (the universal German ID for administrative services).

-   **Dog Registration Leika-Key:** `99010001001000` (this tells any German city: "This is a dog tax event").
    

### 3\. The "Real" FIT-Connect Submission Packet

Instead of your POST to `/ummeldung`, a real submission to the FIT-Connect Gateway looks more like this:

**The Metadata Schema (Simplified):**

```
{
  "$schema": "https://schema.fitko.de/fit-connect/metadata/1.1.0/metadata.schema.json",
  "contentStructure": {
    "data": {
      "submissionSchema": {
        "schemaUri": "https://schema.your-mvp.de/dog-transfer/1.0.0.json",
        "mimeType": "application/json"
      }
    }
  },
  "replyChannel": {
    "fitConnect": {
      "processStandards": ["XInneres-Hund"],
      "encryptionPublicKey": "..." 
    }
  }
}

```

**The Actual Data (Your Part):** Your JSON is the "Fachdaten." In the real world, this would be encrypted (JWE) so that even FIT-Connect cannot read it—only the city of Leverkusen can.

* * *

### How the Data Travels (Diagram)

To understand how your MVP "plugs in," you need to see the path from your app to the clerk's desk.

### 4\. What was missing in your sample?

-   **Encryption:** The government requires **End-to-End Encryption**. Your MVP must encrypt the dog data using the municipality’s public key before sending it.
    
-   **Authentication:** The `personId` shouldn't be a random string; it’s usually the **Sub-ID from BundID** (the unique identifier for that citizen).
    
-   **The "Response" reality:** In your sample, the response immediately gives a `neuer_steuerbetrag: 132`. In reality, the response to a POST is just a `submissionId` (an acknowledgment). The tax amount (`132 EUR`) comes days later as a **Reply event** that your MVP must "fetch."
    

### 5\. Why "Ummeldung" is the perfect NOOTS use case

Your sample mentions `von_mandant: hannover`. This is exactly where **NOOTS** shines:

1.  Your MVP sends the request to **Leverkusen**.
    
2.  Leverkusen sees the dog was previously in **Hannover**.
    
3.  Leverkusen's backend uses **NOOTS** to automatically pull the "Deregistration Certificate" from Hannover’s registry without the citizen having to upload a PDF.
    

### Is your sample useful?

**Yes, for your internal development.** It defines your "Data Schema." When you register your service at the **FITKO Self-Service Portal**, you will tell them: *"My MVP sends data that looks like this JSON."* The government then prepares their "Specialized Procedure" (*Fachverfahren*) to map your fields to their database.

**Next Question:** Do you want to see how to wrap your JSON in the mandatory **JWE (JSON Web Encryption)** format? This is the most technically difficult part of the "Plug-in" process.