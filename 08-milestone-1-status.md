# Milestone 1 Implementation Status

Status: durable Career Vault and professional-identity slices implemented; milestone remains in progress.

## Implemented

- PostgreSQL migrations for users, workspaces, sessions, sources, facts, evidence, and identities
- File-backed embedded Postgres for zero-config local development
- Real PostgreSQL deployment adapter through `DATABASE_URL`
- Hashed bearer sessions with database-derived workspace membership
- Production-safe auth mode boundary; local session creation is disabled in production
- PDF, DOC, DOCX, TXT, and pasted-text resume ingestion
- Reference-only source records
- Deterministic candidate extraction with evidence locators
- Low-risk observed-skill auto-acceptance
- High- and medium-risk review queue
- Accept, reject, and correct API operations
- Career Vault review and import interface
- Session-only BYOK credentials with masked metadata and revocation
- Connections interface and credential-safety guidance
- Professional identity creation, editing, default selection, and archival
- Shared-fact identity overlays with role, narrative, and emphasized-skill preferences
- One-click Windows startup and tracked restart flow

## Deliberately not claimed complete

- External OIDC provider integration and production account onboarding
- Encrypted persistent provider credentials
- Provider-key validation against live AI services
- Duplicate and conflict detection
- Source deletion and impact previews
- Preferred/excluded projects, section priorities, tone, and identity-private guidance
- GitHub OAuth and authorized cloud repository analysis
- Packaged Windows companion pairing and monitored-folder UI

## Verification

- API type checks and focused tests cover authentication, ingestion, fact review, supported document extraction, credential secrecy, identity policy, and persistence across process restarts.
- Web component tests cover the existing Resume Studio, Career Vault ingestion and approval, and credential masking.
- Live browser checks cover ingestion, counter transitions, evidence display, credential masking, revocation, accessibility names, page identity, and console health.
- `start.bat` was exercised twice to verify both clean startup and tracked restart behavior.
