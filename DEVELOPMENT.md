# Development Guide

## Prerequisites

- Node.js 24
- npm 11 or newer
- Windows for companion monitoring and packaging work

## Install

```powershell
npm install
```

## Run the web app and API

On Windows, double-click `start.bat`. The launcher installs dependencies,
restarts its previously tracked development session, waits for both services,
and opens the app only after they are ready. Runtime logs are written to
`logs/` and the tracked process ID stays in the ignored `.local/` directory.

To start without opening a browser:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1 -NoBrowser
```

The equivalent manual command is:

```powershell
npm run dev
```

- Web: `http://127.0.0.1:5173`
- API health: `http://127.0.0.1:4010/health`

## Storage and sessions

Local development uses a file-backed embedded PostgreSQL runtime under
`data/postgres/`. Career Vault sources, facts, evidence, sessions, and
professional identities therefore survive restarts. The directory is ignored
by Git and must never be committed.

To use a normal PostgreSQL server, set `DATABASE_URL` before starting:

```powershell
$env:DATABASE_URL="postgresql://user:password@127.0.0.1:5432/resume_builder"
npm run dev
```

The local launcher uses `AUTH_MODE=local_development` behavior unless production
mode is active. Production disables the development-session endpoint and must
configure an external identity provider adapter. Client-supplied workspace IDs
are not trusted; the API derives workspace membership from the authenticated
database session.

## Validate the repository

```powershell
npm run check
```

This runs lint, TypeScript checks, unit and contract tests, and production builds.

## Run the local analyzer proof

```powershell
npm run build -w @resume-builder/contracts
npm run analyze -w @resume-builder/companion -- --path "D:\path\to\selected-project"
```

The command prints a structured Project Summary. It does not print raw source code, secret values, or absolute paths. This is an analyzer proof, not yet the packaged Windows companion UI.

## Repository map

```text
apps/
  api/          Fastify application boundary
  companion/    Local analyzer and monitored-folder boundary
  web/          React/Vite Resume Studio shell
  worker/       Background-job boundary
packages/
  contracts/    JSON Schema, TypeScript projections, and policy tests
design/
  concepts/     Accepted visual direction
  design-system.md
```

## Current vertical-slice behavior

The application currently demonstrates:

- Resume and note ingestion into a workspace-scoped Career Vault
- PDF, DOC, DOCX, TXT, and pasted-text extraction
- Risk-aware fact extraction with linked evidence
- Automatic acceptance of low-risk observed skills
- Explicit accept, reject, and correction actions for review facts
- Session-only BYOK provider credentials with masked readback
- Durable Postgres-compatible Career Vault storage
- Database-backed hashed bearer sessions
- Multiple professional identities over one shared fact history
- Selected resume evidence
- Pending suggestion review
- Accept, reject, and edit interactions
- Immutable-version intent messaging
- ATS/plain-text preview
- Export-validation intent
- Temporary conversation input
- Responsive layout behavior

External identity-provider onboarding, GitHub OAuth, real AI calls, production
document export rendering, and the packaged companion UI belong to later work.
Local development uses the same SQL migrations as deployment, while production
connects to PostgreSQL through `DATABASE_URL`.

## Security defaults

- Never commit `.env*`, certificates, keys, credential files, logs, local data, or diagnostic bundles.
- The local analyzer excludes known secret-bearing files, binaries, dependencies, and generated output.
- Do not add source-code excerpts to Project Summary contracts.
- Do not log AI keys, OAuth tokens, private context, resume text, or source code.
- Keep export eligibility deterministic and outside AI output.
