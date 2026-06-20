# Career Vault and Connections Design Extension

Concepts:

- `design/concepts/career-vault-review.png`
- `design/concepts/connections-byok.png`

These screens extend the existing Resume Studio design system without changing its palette, global navigation, typography character, icon family, border rules, or control geometry.

## Career Vault anatomy

- Global navigation rail with Career Vault selected
- Quiet page header with Ask the Vault and Add source actions
- Secondary section rail with Review queue selected
- Open central review table with one expandable evidence row
- Right import rail with file and pasted-text paths

Primary interaction family: risk review, evidence disclosure, accept, correct, reject, and source ingestion.

## Connections anatomy

- Global navigation rail with Connections selected
- Secondary connection rail with AI providers selected
- Open central settings form
- Connected-provider list
- Right credential-safety inspector using the warm sand security field

Primary interaction family: masked key entry, session-only storage, connect, revoke, and disabled persistent-storage explanation.

## Color and type lock

Reuse the tokens in `design/design-system.md` exactly:

- True white surfaces and paper
- Cool gray application background
- Deep ink text
- Teal selection and primary action
- Warm sand evidence/security fields
- Humanist sans-serif application typography
- Serif only for the large product workspace titles, matching the concepts

## Allowed primary copy

Career Vault:

- Career Vault
- Ask the Vault
- Add source
- Overview
- Review queue
- Sources
- Experiences
- Projects
- Skills
- Identities
- Private context
- Review important facts
- Confirm claims that could materially affect your resume.
- Needs review
- Auto-accepted
- Conflicts
- Fact
- Source
- Confidence
- Risk
- Actions
- Reject
- Correct
- Accept
- Import source
- Drop a resume here or choose a file
- PDF, DOC, DOCX, or TXT
- or paste resume text
- Extract career information
- Your master resume is reference-only and will not be modified.

Connections:

- Connections
- AI providers
- GitHub
- Companion devices
- Authorized repositories
- Use your own provider key for resume analysis and generation.
- Provider
- API key
- Storage mode
- Session only
- Removed when this server restarts.
- Encrypted storage
- Connect provider
- Cancel
- Connected providers
- No provider connected yet.
- Credential safety
- Keys are never returned after entry.
- Keys are excluded from logs and traces.
- You can revoke a key at any time.

## Icon inventory

Use the existing Lucide outline family with 1.7–1.9 stroke weight:

- Folder, briefcase, document, and users for global navigation
- House, shield, database, briefcase, folder, bolt, identity card, and lock for Career Vault sections
- Sparkles, GitHub, monitor, and database for Connections sections
- Upload, document, message, key visibility, shield, lock, revoke, and chevron controls

## Responsive continuation

- Collapse global navigation labels at medium widths.
- Collapse the secondary rail before the primary work area.
- Move the right inspector below the central list on narrow screens.
- Keep fact actions reachable and allow review rows to stack without horizontal page overflow.
- Never hide the risk, verification, or evidence state.
