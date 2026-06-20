# Implementation Roadmap

## Delivery strategy

Build one evidence-backed vertical slice before expanding to the full product surface:

`Import resume -> review facts -> create opportunity -> match evidence -> recommend projects -> generate resume -> review suggestions -> export`

The Windows companion and cloud repository analyzer are developed as early risk tracks, but they integrate into the same versioned Project Summary contract rather than creating separate Career Vault models.

## Release gates

Every milestone must preserve these gates:

1. No exported claim without eligible evidence or explicit user confirmation.
2. Private guidance is unavailable to the resume composer.
3. AI document edits remain pending until accepted.
4. Raw local source code never crosses the companion boundary.
5. High-risk facts cannot be auto-verified.
6. Source and derived-data deletion remains traceable.

## Milestone 0 — Foundations

### Outcomes

- Runnable monorepo with web, API, worker, companion, and shared-contract boundaries
- Versioned JSON Schema contracts
- Initial Resume Studio concept and interactive shell
- Continuous lint, type-check, test, and build commands
- Architecture decisions recorded before feature growth

### Work

- Establish npm workspaces and TypeScript configuration.
- Create React/Vite application shell.
- Create Fastify API health boundary.
- Create worker and local companion analysis boundaries.
- Add JSON Schema validation with representative fixtures.
- Add provider-neutral AI gateway interfaces without connecting a provider.
- Add security-focused ignore defaults for local project analysis.
- Define environment-variable policy and secret-safe `.gitignore` rules.

### Exit criteria

- A clean checkout installs and passes `npm run check`.
- The web shell demonstrates accept, reject, edit, ATS-preview, and export-intent interactions.
- The companion proof can summarize a selected folder without emitting file contents.
- Invalid contract fixtures fail validation.

## Milestone 1 — Career Vault vertical slice

### Outcomes

- A user can import a resume and review extracted facts.
- Facts preserve evidence, risk, verification, and eligibility independently.
- Multiple professional identities reference shared facts.

### Epics

#### Workspace and authentication

- Account creation and session management
- Personal workspace tenant boundary
- Authorization checks on every API operation
- Audit metadata without user-content logging

#### BYOK credential management

- Session-only AI key flow
- Encrypted persistent-key flow
- Provider validation and safe error mapping
- Credential rotation and deletion

#### Document ingestion

- PDF and DOCX upload validation
- Text and structural extraction
- Resume-section segmentation
- Candidate-fact extraction
- Provenance locators
- Duplicate and conflict detection
- Original-source retention controls

#### Fact review

- Low-risk auto-acceptance policy
- High-risk review queue
- Conflict resolution
- Eligibility and privacy controls
- Source-deletion impact preview

#### Professional identities

- Identity creation and editing
- Target roles and narrative preferences
- Preferred and excluded evidence
- Identity-specific private guidance

### Exit criteria

- An imported master resume remains unchanged.
- A user can inspect the source of every extracted consequential fact.
- Conflicting employment dates block affected resume claims.
- Two identities can produce different selections from one shared Career Vault.

## Milestone 2 — Opportunity intelligence

### Outcomes

- A user can create an opportunity from a job description.
- The system explains requirement-to-evidence matches and project recommendations.
- Focused questions create facts only with explicit save or confirmation.

### Epics

- Job-description parsing and editable requirements
- Skill and responsibility normalization with original wording preserved
- Evidence matching and match explanations
- Gap detection and prioritized questions
- Project scoring and diversity penalties
- Resume strategy proposal and approval
- Privacy firewall producing sanitized strategy constraints

### Exit criteria

- Every recommended project names the requirements and evidence behind its score.
- Guidance-only text influences strategy without reaching the composer payload.
- The user can dismiss irrelevant requirements and override project choices.

## Milestone 3 — Resume Studio vertical slice

### Outcomes

- The system assembles a new structured resume from approved evidence.
- The user edits through conversation and the live visual canvas.
- AI modifications are reviewable semantic suggestions.

### Epics

- Template-independent resume tree
- Initial generation from approved strategy
- Resume-node evidence links
- Suggestion creation, accept, reject, modify, defer, and stale detection
- Locked sections and targeted requests
- Version history and restore-as-new-version
- Controlled layouts
- ATS/plain-text projection
- PDF, DOCX, and plain-text export
- Final claim and layout validation

### Exit criteria

- Accepting a suggestion creates a new immutable resume version.
- Rejecting a suggestion leaves the resume unchanged.
- Export blocks unresolved high-risk claims.
- PDF, DOCX, and plain text represent the same structured content.

## Milestone 4 — Windows companion

### Outcomes

- Windows users can pair a device, select local folders, preview summaries, and trust monitored projects.
- Source code remains on the device.

### Epics

- Signed Windows installer and secure pairing
- Windows credential-store integration
- Folder selection and monitoring
- Debounced incremental rescans
- Built-in and user-configurable ignore rules
- Secret, binary, generated-output, and dependency filtering
- Local static project analysis
- Versioned Project Summary construction
- Preview-required and trusted-auto-sync states
- Offline queue, retry, pause, rescan, disconnect, and local-cache deletion
- Signed update channel and safe diagnostics

### Exit criteria

- Network inspection confirms that sync payloads contain structured summaries but no source code.
- Rapid file changes create one stable incremental analysis rather than a sync storm.
- Revoking a device prevents future synchronization.
- A failed scan preserves the last-known-good summary.

## Milestone 5 — GitHub and cloud repository analysis

### Outcomes

- Users can authorize selected GitHub repositories and receive structured summaries from isolated cloud analysis.

### Epics

- GitHub OAuth and least-privilege repository selection
- Repository authorization lifecycle
- Isolated ephemeral analysis worker
- Secret filtering before model access
- Static inspection without executing untrusted code
- Commit-based provenance
- Clone destruction and retention verification
- Reanalysis, revocation, and derived-data deletion

### Exit criteria

- Only selected repositories are cloned.
- Clones are destroyed after analysis and deletion is observable.
- A revoked repository cannot be reanalyzed.
- Local and cloud project summaries validate against the same schema.

## Milestone 6 — Launch hardening

### Product quality

- Complete onboarding and recovery states
- Accessibility audit against WCAG 2.2 AA expectations
- Responsive behavior for supported web workflows
- Empty, loading, failure, offline, and retry states
- Controlled template pagination QA

### Security and privacy

- Threat-model review
- Tenant-isolation tests
- Credential and token rotation tests
- Logging and telemetry content audit
- Dependency and artifact scanning
- Repository-worker isolation review
- Data export and deletion verification
- Privacy documentation and retention controls

### Reliability

- Idempotent ingestion and synchronization tests
- Background-job retries and dead-letter recovery
- Load tests for imports, matching, generation, and rendering
- Schema migration and rollback rehearsals
- Backup and restore validation

### Launch criteria

- Product-requirement release acceptance criteria pass end to end.
- No known path can export guidance-only, sensitive, excluded, rejected, conflicted, or unverified high-risk content.
- Companion and repository analysis pass security review.
- A fresh Windows test machine completes installation, pairing, analysis, monitoring, and revocation.

## Initial backlog order

### Now

1. Stabilize the five shared contracts.
2. Add representative valid and invalid contract fixtures.
3. Implement database migrations for workspace, source, evidence, fact, identity, opportunity, resume, and suggestion cores.
4. Add authenticated API boundaries and policy checks.
5. Build document-upload and fact-review screens.
6. Build deterministic export-eligibility checks before connecting AI.

### Next

7. Add provider-neutral AI gateway and BYOK flows.
8. Add job requirement extraction and editable analysis.
9. Add evidence matching and project ranking.
10. Add strategy approval and privacy firewall.
11. Connect structured resume generation to Resume Studio.
12. Add production renderers and export validation.

### Parallel risk track

13. Expand the companion analyzer proof into a signed Windows application.
14. Prototype folder monitoring and safe incremental summary synchronization.
15. Prototype isolated GitHub repository analysis using the same schema.

## Testing strategy

### Unit tests

- Risk and eligibility policy
- Fact conflict behavior
- Project scoring
- Suggestion state transitions
- Secret and ignore filters
- Schema validators

### Contract tests

- Every producer validates emitted payloads.
- Every consumer tests the current and previous compatible schema version.
- Unknown additive fields remain tolerated.
- Breaking changes require a new major schema version.

### Integration tests

- Import to fact review
- Private guidance to sanitized strategy constraint
- Strategy to structured resume
- Suggestion acceptance to new resume version
- Companion summary to Career Vault evidence
- OAuth repository analysis to clone deletion

### End-to-end tests

- First-run happy path
- High-risk claim blocked at export
- Temporary conversation expiration with durable accepted action
- Source deletion and evidence invalidation
- Offline companion reconnection and idempotent sync

## Definition of done

A feature is done only when it includes:

- Tenant authorization
- Privacy and eligibility behavior
- Provenance where factual data is created
- Loading, empty, error, and retry states
- Accessible keyboard and screen-reader behavior
- Unit or integration coverage proportional to risk
- Audit metadata without prohibited content
- Deletion behavior
- Updated contract or documentation when the boundary changes
