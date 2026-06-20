# Shared Data Contracts

## Contract authority

The JSON Schema files in `packages/contracts/schemas` are authoritative for transport between the browser, API, workers, cloud analyzers, and Windows companion. TypeScript types are developer-facing projections and must not weaken runtime validation.

## Versioning policy

Each root payload contains:

- `schemaVersion`
- Stable entity identifier
- Workspace or source ownership where appropriate
- Creation or analysis timestamp

Compatibility rules:

- Additive optional fields are backward compatible.
- Existing enum values are never repurposed.
- New enum values require consumers to handle unknown values safely before release.
- Required-field removal, meaning changes, and incompatible type changes require a new major schema version.
- Producers validate before sending.
- Consumers validate before domain use.
- The current and previous compatible version remain covered by contract tests during migrations.

## Contract 1 — Evidence Reference

Purpose: Locate support without copying an entire source into downstream payloads.

Required concepts:

- Evidence ID
- Source ID and source kind
- Evidence type
- Safe locator
- Confidence
- Observation timestamp

Privacy rules:

- Local project locators use relative safe paths or redacted identifiers.
- Evidence references never contain credentials or source-code contents.
- Optional excerpts obey source classification and task permission.

## Contract 2 — Career Fact

Purpose: Represent an atomic claim and its independent safety states.

Required concepts:

- Subject and predicate
- Structured value
- Evidence type: observed, user stated, or inferred
- Risk: low, medium, or high
- Verification state
- Resume eligibility
- Evidence references

Export rule: a high-risk fact is not exportable until user verified. A fact remains nonexportable when guidance only, sensitive, excluded, rejected, superseded, or conflicted.

## Contract 3 — Project Summary

Purpose: Provide one common output for the local companion, GitHub cloud analyzer, and uploaded-repository analyzer.

Required concepts:

- Analysis source, method, revision, and timestamp
- Safe project overview
- Observed technology signals with evidence
- Components and features
- Quality signals
- Candidate inferences
- Warnings and exclusion statistics

Prohibited content for a local-companion payload:

- Raw source code
- Secret values
- Environment-variable values
- Absolute local paths
- Full file contents
- Unbounded excerpts

## Contract 4 — Resume Document

Purpose: Store template-independent, evidence-linked resume content.

Required concepts:

- Opportunity, identity, strategy, and version references
- Ordered semantic node tree
- Node-level evidence links
- Lock state
- Country convention
- Validation state

Presentation settings are intentionally outside this contract.

## Contract 5 — Resume Suggestion

Purpose: Describe a pending semantic patch without mutating the document.

Required concepts:

- Base resume version
- Target node
- Operation
- Original and proposed values
- Reason
- Evidence and job-requirement references
- Confidence and warnings
- Pending, accepted, rejected, modified, or stale state

State rules:

- Only pending suggestions may be directly accepted or rejected.
- Acceptance creates a new resume version.
- A changed base node makes the suggestion stale.
- Rejection never mutates resume content.

## Validation layers

1. **Schema validation** — shape, required fields, formats, and enumerations
2. **Domain validation** — permitted state transitions and ownership
3. **Policy validation** — privacy, eligibility, verification, and export rules
4. **Evidence validation** — active evidence and conflict state
5. **Presentation validation** — pagination and ATS projection

AI output passing schema validation is still untrusted until domain and policy validation succeed.

## Fixture policy

Every contract includes:

- Minimum valid fixture
- Representative complete fixture
- Missing-required-field invalid fixture
- Invalid-enum fixture
- Privacy-violation fixture where applicable

Fixtures must use fictional, non-identifying data and must not contain real API keys, private repositories, resumes, or source code.
