# Project Oversight: Once-Only Dog Tax Transfer Platform

## Introduction
The Once-Only Dog Tax Transfer Platform is a SaaS solution designed to streamline the administrative process of dog tax registration and transfers between German municipalities. It implements the EU's "Once-Only Principle" (OOP), ensuring that citizens only need to provide their information once, even when moving between different administrative jurisdictions.

## Problem Statement
In Germany, dog tax is managed independently by over 11,000 municipalities. When a citizen relocates, they must manually deregister their dog in the old city and reregister it in the new one. This leads to:
- Duplicate data entry for citizens.
- Administrative overhead for municipalities.
- Potential gaps in tax collection or compliance.

## Solution Architecture
The platform is built as a multi-tenant SaaS application with a focus on data isolation and secure information flow.

### Key Components:
- **Backend**: FastAPI (Python) provides a high-performance REST API.
- **Database**: SQLite with logical multi-tenancy (tenant isolation via `municipality_id`).
- **Frontend**: React (Vite) with TailwindCSS for a modern, responsive UI.
- **State Machine**: A multi-step workflow for transfers, ensuring consent and verification at each stage.
- **Audit Logging**: A hash-chained audit trail for all significant actions.

## Adherence to Hackathon Goals
- **Seamless Information Flow**: Data moves directly between "Source" and "Target" municipalities upon citizen consent.
- **Data Protection Compliance**: Strict tenant isolation ensures that one municipality cannot access another's data without a valid transfer request.
- **Audit Integrity**: Cases are marked as "transferred" or "deregistered" rather than deleted, preserving historical data.
- **Working Prototype**: The project starts with simple commands and includes a comprehensive seed of demo data.
