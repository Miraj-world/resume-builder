# Product Requirements Document

## 1. Product summary

Resume Builder is a profession-neutral application that converts a user's career materials into a structured, evidence-backed Career Vault and uses that vault to assemble tailored resumes for specific job opportunities.

The product does not rewrite the user's master resume in place. A master resume is one source among many. Every generated resume is a separate document assembled from structured facts, approved claims, selected projects, professional-identity preferences, and a job-specific strategy.

The first release uses US resume conventions, supports a Windows local companion, uses customer-provided AI API keys, and offers controlled visual layouts.

## 2. Problem statement

People commonly have relevant career evidence scattered across old resumes, LinkedIn exports, notes, repositories, and project folders. Generic AI resume tools lack durable context, struggle to select the best evidence for a particular job, and may create claims the user cannot defend.

Users need a product that:

- Remembers their career history without forcing them to re-explain it for every application
- Understands selected work materials, including project source code
- Chooses the strongest evidence for a particular job
- Explains why content is recommended
- Protects private context from appearing in generated documents
- Keeps the user in control of every material edit
- Produces polished, parseable resumes without changing the master source

## 3. Product principles

1. **Evidence before prose.** The system identifies support before drafting a claim.
2. **The user remains the authority.** AI proposes; the user accepts, rejects, or edits.
3. **Private context is a hard boundary.** Guidance-only and sensitive data cannot become resume content.
4. **One career, multiple identities.** Users can present different legitimate professional narratives without duplicating history.
5. **Profession-neutral core.** The underlying model supports many professions; profession-specific analyzers can extend it.
6. **Source code is explicitly scoped.** Only selected projects and repositories are inspected.
7. **Content and presentation are separate.** Structured resume content can be rendered through controlled layouts.
8. **Every recommendation is explainable.** Project selections and resume edits include reasons and evidence.

## 4. Target users

### Primary launch user

A job seeker with multiple prior roles or projects who wants a tailored US-style resume and is comfortable providing an AI API key.

### Supported user profiles

- Professionals changing roles or industries
- Candidates with multiple professional identities
- Technical users with repositories or project folders
- Nontechnical users whose materials are documents, notes, portfolios, or structured work samples
- Freelancers, founders, students, and traditional employees

The product must not brand or structure the first release as software-engineer-only.

## 5. Goals

- Create a reusable, user-correctable Career Vault from heterogeneous sources.
- Tailor a resume to a job description using verified or observable evidence.
- Recommend the most relevant projects and explain their ranking.
- Provide conversational assistance and a visual editor in one workspace.
- Allow safe local analysis of selected Windows folders.
- Preserve provenance and verification state for every consequential claim.
- Export professional US-style resumes to PDF, DOCX, and plain text.

## 6. Non-goals for the first release

- Editing or overwriting a master resume
- Automatic job application submission
- Country-specific resume formats beyond the United States
- Free-form Canva-style layout editing
- User-uploaded custom resume templates
- Fully local AI execution
- Mobile local-folder inspection
- Guaranteed ATS scoring or claims of hiring outcomes
- Inferring personal ownership, business impact, or metrics solely from source code

## 7. Core concepts

### Career Vault

The structured source of truth containing career facts, evidence, projects, achievements, skills, professional identities, and private guidance.

### Source

An imported or connected material such as a resume, LinkedIn export, note, GitHub repository, uploaded repository, or local project summary.

### Fact

An atomic claim about the user, such as an employment date, skill, project feature, responsibility, or outcome. Facts carry provenance, confidence, risk, verification, and resume-eligibility states.

### Professional identity

An overlay on the shared Career Vault defining target titles, preferred narrative, emphasized skills, default inclusions and exclusions, and private strategy guidance.

### Opportunity

A job description plus user-provided context, preferences, extracted requirements, and the resume versions generated for it.

### Suggestion

A proposed semantic change to resume content. Suggestions are not applied until accepted by the user.

## 8. Fact safety model

Facts must be evaluated across independent dimensions:

### Evidence type

- **Observed:** Directly present in a source or detected in project materials
- **User stated:** Explicitly supplied or confirmed by the user
- **Inferred:** Derived by analysis and not directly proven

### Risk

- **Low:** Objective and unlikely to misrepresent the user, such as a language appearing substantially in a repository
- **Medium:** Context-dependent, such as an architectural pattern or proficiency implication
- **High:** Personal ownership, employment details, metrics, business outcomes, leadership, scale, awards, regulated credentials, or conflicting dates and titles

### Verification state

- Auto-accepted
- Pending review
- User verified
- Rejected
- Superseded
- In conflict

### Resume eligibility

- Eligible
- Guidance only
- Sensitive, explicit-use only
- Excluded

Low-risk facts may be accepted automatically. High-risk facts require user approval. Automatic acceptance does not independently make a fact appropriate for a resume; eligibility and relevance are evaluated separately.

## 9. Functional requirements

### 9.1 Account and workspace

- Users can create an account and a private personal workspace.
- Each workspace is isolated from every other workspace.
- Users can connect one or more AI providers using their own API keys.
- API keys are masked after entry, encrypted at rest when saved, never written to application logs, and removable at any time.
- The system supports a session-only key option and an encrypted persistent option.

### 9.2 Career Vault onboarding

- Users can start from imports or manually create records.
- The onboarding flow explains evidence, verification, private context, and professional identities.
- Users can postpone optional sources and continue with partial data.
- The system presents a summary of imported knowledge and a queue of facts requiring review.

### 9.3 Document and data ingestion

The first release supports:

- PDF resumes
- DOC and DOCX resumes
- LinkedIn exports
- Plain text or rich-text notes
- Uploaded repository archives or folders
- GitHub repositories selected through OAuth
- Structured project summaries synchronized by the Windows companion

For each ingestion, the system must:

- Preserve source provenance
- Extract structured facts
- Detect duplicates and conflicts
- Auto-accept only low-risk facts
- Route high-risk or conflicting facts to review
- Allow users to correct extraction errors
- Allow the source and all derived data to be deleted

### 9.4 Windows companion

- Users can download, install, and pair a Windows-only companion with their account.
- The companion can inspect only folders explicitly selected by the user.
- It monitors selected folders for meaningful changes and performs debounced, incremental rescans.
- It excludes secrets, credentials, environment files, private keys, dependency caches, binaries, generated output, and configured ignore patterns.
- It analyzes source code locally and constructs a structured project summary.
- Source code is not uploaded through this path.
- Users can preview a summary before its first synchronization.
- Users can mark a project trusted, allowing future summaries to synchronize automatically.
- Users can pause monitoring, force a rescan, revoke trust, disconnect a folder, clear local cache, and delete uploaded summaries.
- The companion displays scan state, sync state, errors, and last-successful timestamps.

### 9.5 GitHub OAuth and cloud inspection

- Users can connect GitHub through OAuth.
- Repository access is requested with the least privileges practical.
- Users select repositories individually for analysis.
- Authorized repositories may be temporarily cloned into isolated cloud workers.
- Raw repository data is deleted after analysis according to a published retention policy.
- Only structured summaries and provenance metadata persist by default.
- Users can disconnect GitHub, revoke repository access, and delete derived summaries.
- The UI clearly distinguishes cloud-inspected repositories from locally inspected projects.

### 9.6 Uploaded repositories

- Users can upload a supported repository archive or select a project folder through the browser.
- The product explains that this content will be sent to cloud infrastructure unless local companion processing is selected.
- Secret detection and file exclusions run before durable storage or model processing.
- Users can review and delete the resulting structured summary.

### 9.7 Project summaries

Project summaries may contain:

- Project name and description
- Time period and status
- Languages and frameworks
- Architecture and major components
- Features and workflows
- Tests, deployment, and documentation signals
- User-confirmed responsibilities and ownership
- User-confirmed users, scale, outcomes, and metrics
- Skills demonstrated
- Evidence references and analysis timestamps

Code analysis may observe technologies and structures. It must not treat dependency presence as proof of proficiency or infer personal ownership and business impact without confirmation.

### 9.8 Professional identities

- Users can create multiple identities over one Career Vault.
- Each identity can define a label, target roles, headline, preferred narrative, emphasized skills, default project preferences, default exclusions, and private guidance.
- Shared employment and project records are referenced rather than duplicated.
- Users select an identity for each opportunity and may switch identities before generating a resume.
- Identity-specific preferences cannot modify underlying verified facts.

### 9.9 Private context

- Users can add guidance-only, sensitive, and excluded context.
- The product explains exactly how each visibility level is used.
- Guidance-only context may influence strategy but cannot be quoted, paraphrased, or copied into generated content.
- Sensitive context is unavailable unless explicitly enabled for the active conversation or task.
- Excluded context is never sent to an AI provider.
- The resume-generation process receives eligible evidence and sanitized strategy constraints, not raw private context.
- Users can inspect, reclassify, edit, and delete private context.

### 9.10 Career Vault questions

Users can ask questions such as:

- Which projects best demonstrate a required skill?
- Where is my career evidence weak or contradictory?
- Which achievements still need metrics?
- What information came from a particular source?
- Why was a project recommended?

Answers must cite Career Vault evidence and distinguish observed, confirmed, and inferred information. Conversations are temporary by default. Accepted facts, explicit decisions, and accepted resume changes persist independently from the transcript. Users may explicitly save a conversation.

### 9.11 Job intake and analysis

- Users can paste a job description, upload a supported document, or supply a job URL when supported.
- Users can add company, role, location, notes, page target, selected identity, tone, and priorities.
- The system extracts required skills, preferred skills, responsibilities, seniority indicators, domain signals, keywords, and implied priorities.
- Extracted requirements remain editable.
- The system warns when the description is incomplete or internally inconsistent.

### 9.12 Evidence matching

- Each job requirement is matched to supporting Career Vault evidence.
- Matches include strength, evidence quality, recency, identity fit, and explanation.
- The system identifies unsupported requirements and asks only questions likely to improve the resume.
- Users can dismiss irrelevant requirements or mark them essential.

### 9.13 Project recommendation

Candidate projects are scored using:

- Required-skill relevance
- Responsibility relevance
- Demonstrated complexity
- Verified impact
- Recency
- Evidence confidence
- Industry relevance
- Portfolio proof
- Narrative fit for the selected identity
- Diversity relative to other selected projects

The system penalizes redundant, weakly supported, stale, confidential, or overly similar projects. Every recommendation includes the requirements it supports, the evidence used, confidence, and any confirmation needed. Users make the final selection.

### 9.14 Resume strategy

Before drafting, the system proposes a strategy containing:

- Target positioning and selected identity
- Section order
- Recommended experiences and projects
- Content to emphasize, compress, or omit
- Target length and density
- Evidence gaps and blocking questions
- Private constraints expressed without exposing private source text

Users approve or adjust the strategy before generation.

### 9.15 Resume generation

- A generated resume is a new version and never overwrites an imported master resume.
- Only eligible facts may be used.
- High-risk claims must be user verified before export.
- Unsupported metrics, ownership, credentials, and outcomes are prohibited.
- The generator must follow US resume conventions in the first release.
- Generated sections remain structured independently from the visual template.

### 9.16 Conversational and visual editor

- The main workspace combines conversation, a live resume canvas, and evidence/job-coverage details.
- Users can select a section or item and request a targeted change.
- The AI returns semantic suggestions rather than silently changing the document.
- Each suggestion shows the original text, proposed text, reason, supported job requirements, evidence, confidence, and warnings.
- Users can accept, reject, modify, or defer each suggestion.
- Users can accept a group of suggestions when appropriate.
- Rejected suggestions do not recur unless the user requests reconsideration or the underlying strategy changes.
- Users can lock sections or items against AI modification.
- All accepted changes are undoable through version history.

### 9.17 Controlled layouts

- Content is stored separately from rendering.
- Users can select from a small set of launch templates.
- Permitted controls include typography, accent color, density, section order, and one- or two-page target.
- The application controls margins, hierarchy, wrapping, alignment, and component placement.
- The editor offers a visual preview and an ATS/plain-text preview.
- Layout overflow and parsing risks produce warnings.
- User-uploaded templates are deferred but the rendering model must not preclude them.

### 9.18 Export

- Users can export PDF, DOCX, and plain text.
- Export performs a final validation for unresolved high-risk claims, missing required fields, overflow, and parsing issues.
- Users may proceed past nonblocking warnings but not prohibited-claim failures.
- Each export is associated with an opportunity, identity, resume version, template version, and timestamp.

### 9.19 History and deletion

- Users can view resume versions and restore an earlier version.
- Source deletion offers a clear choice between deleting only the source file and deleting all derived facts that lack other evidence.
- Users can delete opportunities, exports, saved conversations, provider keys, OAuth connections, companion pairings, and their entire account.
- Temporary conversations and transient processing artifacts expire automatically.

## 10. Experience requirements

- Explain unfamiliar concepts in plain language.
- Show progress for long imports, scans, and generation tasks.
- Make privacy state visible at the point of action.
- Never imply that an inferred fact is verified.
- Keep the resume usable while background processing continues.
- Provide actionable recovery for failed imports, expired OAuth, companion offline states, and provider-key errors.
- Meet WCAG 2.2 AA accessibility expectations for core web flows.

## 11. Nonfunctional requirements

### Security and privacy

- Strong tenant isolation
- Encryption in transit and at rest
- Application-level envelope encryption for saved AI credentials
- No API keys, raw source code, private context, or resume content in telemetry logs
- Short-lived OAuth and companion tokens with rotation and revocation
- Isolated, ephemeral repository-analysis workers
- Documented retention and deletion behavior
- Audit events for data access, synchronization, generation, export, and deletion

### Reliability

- Idempotent ingestion and synchronization
- Retryable background jobs with visible status
- Versioned project-summary and resume schemas
- Conflict-safe synchronization from monitored projects
- Graceful degradation when the selected AI provider is unavailable

### Performance targets

- Common Career Vault screens become interactive within 2 seconds under normal conditions.
- Resume editing interactions feel immediate; long AI operations stream progress.
- A typical changed local project is incrementally rescanned rather than fully reprocessed.
- Export rendering completes within a reasonable interactive wait and reports progress if delayed.

### Portability

- AI-provider adapters are replaceable.
- Rendering templates are versioned and independent from resume content.
- The project-summary contract is shared by local and cloud analyzers.
- A future local-AI mode can replace cloud inference without changing Career Vault semantics.

## 12. Success metrics

### Activation

- Percentage of new users who import at least one source
- Percentage who verify their first high-risk fact
- Percentage who create an identity and opportunity

### Core value

- Percentage who reach an approved resume strategy
- Percentage who accept at least one evidence-backed suggestion
- Percentage who export a resume
- Median time from job intake to first export
- Percentage of recommendations with evidence opened by users

### Trust and quality

- Rate of user-reported fabricated or unsupported claims
- High-risk fact rejection rate
- Percentage of exports with unresolved warnings
- Import correction and conflict rates by source type
- Companion sync failure rate

Hiring outcomes may be collected voluntarily but must not be presented as guaranteed product performance.

## 13. Release-one acceptance criteria

The first release is ready when a user can:

1. Create an account and securely configure a customer-provided AI key.
2. Import at least one resume and see low-risk facts plus a high-risk review queue.
3. Create two professional identities over shared Career Vault data.
4. Install and pair the Windows companion.
5. Select a local project, preview its structured summary, trust it, and receive a later automatic monitored update without source-code upload.
6. Connect GitHub, authorize a selected repository, and receive a cloud-generated structured summary.
7. Add private guidance that affects strategy but does not appear in generated content.
8. Create an opportunity from a job description and edit extracted requirements.
9. Review evidence matches and explained project recommendations.
10. Approve a strategy and generate a new resume without altering the master resume.
11. Accept and reject individual AI suggestions in the visual editor.
12. View ATS/plain-text output and export PDF, DOCX, and plain text.
13. Close an unsaved Career Vault conversation and have the transcript expire while accepted facts remain.
14. Delete a source, repository connection, local pairing, AI key, and derived data through understandable controls.

## 14. Later roadmap

- Country-specific conventions and localization
- User-uploaded template ingestion
- macOS and Linux companions
- Fully local document processing, embeddings, storage, and AI
- Profession-specific evidence analyzers
- Application tracking and outcome feedback
- Cover letters, recruiter messages, and interview preparation
- Portfolio and professional-network integrations
- Optional collaboration with coaches or reviewers
