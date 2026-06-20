# Technical Stack and Architecture Decisions

Status: Accepted for the initial scaffold. Revisit through explicit architecture decision records rather than incidental dependency changes.

## ADR-001 — TypeScript monorepo with npm workspaces

### Decision

Use one repository containing:

- `apps/web` — React and Vite
- `apps/api` — Fastify modular API
- `apps/worker` — asynchronous cloud jobs
- `apps/companion` — Windows companion boundary and local analyzer
- `packages/contracts` — versioned JSON Schema and TypeScript types

Use npm workspaces because npm is already available with the selected Node runtime and supports linked local packages without an additional package-manager dependency.

### Consequences

- Shared tooling and contracts are easy to validate.
- Web and cloud services share TypeScript conventions.
- The companion may introduce native modules later; its build remains isolated as a workspace.
- Repository-wide commands must preserve workspace build order.

Reference: [npm workspaces documentation](https://docs.npmjs.com/cli/v11/using-npm/workspaces)

## ADR-002 — Node.js 24 runtime baseline

### Decision

Use Node.js 24 for local development, CI, API, workers, and JavaScript-based companion tooling. Pin the major version and allow maintained minor/security updates.

### Rationale

- It satisfies the current Vite and Fastify engine requirements.
- The development machine already uses Node 24.
- One runtime reduces tooling drift across the initial monorepo.

Reference: [Node.js release status](https://nodejs.org/en/about/previous-releases)

## ADR-003 — React 19 with Vite 8

### Decision

Build the web application with React 19, TypeScript, and Vite 8.

### Rationale

- Resume Studio is a dense interactive editor that benefits from a client application and focused component boundaries.
- Vite provides a small, direct development and production build pipeline.
- The initial product does not require server-rendered marketing pages or framework-specific server components.

### Guardrails

- Keep `App` as composition glue.
- Split navigation, conversation, canvas, suggestion, and status regions into focused components.
- Load future heavy editors and render previews only when activated.
- Avoid sequential independent data requests.
- Keep server payloads narrow and cache stable reference data.

Reference: [Vite getting started guide](https://vite.dev/guide/)

## ADR-004 — Fastify modular API

### Decision

Use Fastify 5 for the cloud application API.

### Rationale

- Strong TypeScript support and schema-oriented route design suit contract-heavy APIs.
- A modular monolith avoids early distributed-system complexity.
- Repository analysis and rendering can still run in separate isolated workers.

### Boundaries

Initial modules:

- Identity and workspace
- Credentials and connections
- Sources and ingestion
- Career Vault
- Professional identities
- Opportunities and matching
- Resume documents and suggestions
- Exports
- Companion synchronization

Reference: [Fastify TypeScript documentation](https://fastify.dev/docs/latest/Reference/TypeScript/)

## ADR-005 — PostgreSQL as the transactional source of truth

### Decision

Use PostgreSQL for normalized Career Vault records, provenance, resume versions, suggestions, job state, and audit metadata.

### Rationale

- The domain is relational and depends on strong constraints and transactions.
- JSON columns can hold versioned, bounded extension data without replacing normalized ownership and policy fields.
- Resume version creation and suggestion acceptance require transactional consistency.

### Guardrails

- Every tenant-owned table includes `workspace_id` directly or through a nonambiguous parent.
- Authorization remains in application policy and database query structure.
- Content-bearing logs are prohibited.
- Schema migrations are forward and rollback tested.

Reference: [PostgreSQL current documentation](https://www.postgresql.org/docs/current/)

## ADR-006 — JSON Schema Draft 2020-12 for cross-process contracts

### Decision

Define Career Fact, Evidence Reference, Project Summary, Resume Document, and Resume Suggestion as versioned JSON Schema Draft 2020-12 documents. Validate with Ajv.

### Rationale

- Local companion, cloud analyzers, API, workers, and web tooling need a language-neutral contract.
- JSON Schema supports generated fixtures, compatibility tests, and runtime validation.
- TypeScript types remain developer conveniences; JSON Schema is the transport authority.

Reference: [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12)

## ADR-007 — Separate evidence, verification, and eligibility

### Decision

Never compress evidence type, risk, verification, and resume eligibility into a single confidence field.

### Rationale

A directly observed fact may still be private. A user-verified fact may still be irrelevant. An auto-accepted technical observation may not prove personal proficiency. Independent states are necessary for honest export decisions.

### Enforcement

- Export checks run deterministically outside AI.
- High-risk facts require explicit user verification.
- Guidance-only, sensitive, and excluded items are unavailable to the composer.
- Resume nodes retain fact references.

## ADR-008 — AI gateway with customer-provided credentials

### Decision

All provider calls pass through a provider-neutral cloud gateway. Users choose session-only or encrypted persistent credential storage.

### Rationale

- The product can support multiple providers without provider logic leaking into domain services.
- BYOK avoids bundling model usage into the initial business model.
- A later local provider can implement the same task interface.

### Guardrails

- API keys are never returned, logged, or included in traces.
- Persistent keys use envelope encryption with a managed key service.
- Task payload builders use allowlisted data classes.
- Provider errors are converted to safe user-facing categories.
- Model output is schema validated before domain use.

## ADR-009 — Strategy privacy firewall

### Decision

Only a strategy-planning stage may receive permitted private guidance. It emits sanitized constraints. The resume composer receives eligible evidence and sanitized constraints, never raw private guidance.

### Consequences

- Planner and composer are separate tasks and audit events.
- The composer service lacks data-layer permission to read private-context records.
- Constraint records expire with or before their resume strategy.
- Excluded context is unavailable to both stages.

## ADR-010 — Semantic suggestions and immutable resume versions

### Decision

AI changes are semantic patches against structured resume nodes. Accepting or modifying a suggestion creates a new immutable resume version.

### Consequences

- Rejecting a suggestion has no document side effect.
- Suggestions become stale when their base version changes.
- Version history is explainable and reversible.
- Rendered files are outputs, never the source of truth.

## ADR-011 — Controlled renderer before custom templates

### Decision

Store content separately from presentation and launch with controlled templates. Add user-uploaded templates only after the content and pagination contract stabilizes.

### Rationale

- Controlled layouts improve ATS projection, accessibility, pagination, and export consistency.
- Free-form editing would complicate semantic suggestions and DOCX/PDF parity.

## ADR-012 — Windows companion with a constrained local analyzer

### Decision

The companion owns filesystem access, monitoring, secret filtering, local static analysis, summary preview, trust state, and synchronization. The initial scaffold implements the analyzer as a dependency-light TypeScript boundary. The packaged desktop shell is planned around Electron after the analyzer contract and security model are proven.

### Rationale

- TypeScript accelerates the first Windows-only implementation and shares contract tooling.
- Electron provides a mature desktop UI and update ecosystem.
- The analyzer remains a separable process so a future native implementation can replace it.

### Security requirements

- Context isolation and sandboxing enabled for renderer processes
- Node integration disabled in remote or untrusted content
- Strict Content Security Policy
- No navigation to untrusted origins
- IPC methods allowlisted and validated
- Tokens stored with Windows-provided secure facilities
- Signed application and update artifacts

Reference: [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security)

## ADR-013 — Static repository inspection without executing project code

### Decision

Local and cloud analyzers inspect files, manifests, configuration, documentation structure, and safe static signals. They do not run project scripts or install repository dependencies in the first release.

### Rationale

- Running untrusted code dramatically expands the security boundary.
- The initial product needs evidence of structure and technology, not behavioral execution.
- Ownership, impact, proficiency, and scale still require user confirmation.

## ADR-014 — Background jobs with explicit state

### Decision

Imports, analysis, matching, generation, rendering, synchronization, and deletion run as idempotent jobs with user-visible status. Start with a database-backed job abstraction; introduce dedicated queue infrastructure only when measured load requires it.

### Consequences

- Fewer infrastructure dependencies during the vertical slice.
- Job interfaces must not depend on in-process execution.
- Every job type defines retry, timeout, cancellation, and dead-letter behavior.

## ADR-015 — Object storage for original documents and exports

### Decision

Use an S3-compatible encrypted object store for explicitly retained source documents, transient repository uploads, rendered exports, and optional diagnostic bundles.

### Guardrails

- Database records contain opaque object references, not public URLs.
- Access uses short-lived signed operations.
- Deletion jobs remove objects and derived indexes.
- Local companion source code never enters object storage.

## Initial version baseline

Versions are pinned by the generated lockfile. The scaffold begins with the current compatible major versions verified during creation:

- Node.js 24
- React 19
- Vite 8
- TypeScript 6
- Fastify 5
- JSON Schema Draft 2020-12 with Ajv 8
- Vitest 4
- Electron 42 reserved for the packaged companion milestone; it is not installed in the lightweight analyzer proof

Minor and patch upgrades require the normal test and build gates. Major upgrades require an ADR update.

## ADR-016 — Embedded PostgreSQL compatibility for local development

### Decision

Use file-backed PGlite for zero-configuration local development and test runs.
Use node-postgres with `DATABASE_URL` for deployed PostgreSQL. Both adapters run
the same ordered SQL migrations and implement the same parameterized query and
transaction boundary.

### Rationale

- Local development must preserve Career Vault data without requiring users to
  configure a database account before opening the application.
- The production source of truth remains PostgreSQL as required by ADR-005.
- Restart-persistence tests can exercise PostgreSQL data types, constraints, and
  transactions without introducing Docker as a test prerequisite.

### Guardrails

- PGlite is a development runtime, not the multi-user production database.
- Production must provide `DATABASE_URL`; the embedded data directory is never
  copied into a deployment image.
- Schema changes are made only through ordered migrations shared by both adapters.
- Tests must prove session, source, fact, evidence, and identity survival across
  a complete database close and reopen.
