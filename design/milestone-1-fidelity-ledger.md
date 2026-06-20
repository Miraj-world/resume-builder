# Milestone 1 Fidelity Ledger

References:

- `design/concepts/career-vault-review.png`
- `design/concepts/connections-byok.png`
- `design/career-vault-design-system.md`

## Comparison points

| Area | Reference evidence | Rendered implementation | Result |
|---|---|---|---|
| Global anatomy | Narrow primary rail, quiet header, secondary rail, central work area, right inspector | Both screens retain the same five-region hierarchy | Matched |
| Career Vault review | Tabbed review queue, expandable evidence, risk labels, direct actions | Live ingestion produced pending and auto-accepted facts; evidence, risk, source locator, accept, reject, and correct controls rendered | Matched with dynamic data |
| Import surface | File drop zone, pasted-text option, reference-only notice | PDF, DOC, DOCX, TXT, and pasted text are wired to real extraction routes | Matched and functional |
| Connections form | Provider, masked key field, storage choice, connected-provider row | Session-only keys clear after submit, return only masked metadata, and can be revoked | Matched and functional |
| Palette and typography | Cool gray canvas, white surfaces, ink text, teal actions, sand safety field | Existing design tokens are reused without gradients or a competing card system | Matched |
| Controls and icons | Sparse outline icons and quiet bordered controls | Lucide outline components use the locked stroke range | Matched; GitHub is represented by a repository-fork icon because the installed icon package excludes brand glyphs |
| Visible copy | Locked Career Vault and Connections labels | Required labels are preserved; only loading, success, failure, and empty-state messages were added | Matched |
| Accessibility | Semantic navigation, tabs, form labels, status feedback | Primary rail buttons have explicit accessible names; review and credential states are announced or labeled | Improved beyond bitmap reference |
| Responsive continuation | Secondary navigation collapses before the primary task; right inspector moves below | CSS breakpoints stack review rows and move the import/safety panels without hiding evidence or risk state | Implemented; browser viewport emulation was unavailable during this run, so mobile rendering remains a follow-up visual capture |

## Interaction evidence

- Pasted resume text produced four review-required facts and two automatically accepted observed skills.
- Accepting one high-risk claim changed the live counters from `Needs review (4)` / `Auto-accepted (2)` to `Needs review (3)` / `Auto-accepted (3)`.
- A session credential was cleared from the input after submission and exposed only as `••••alue`.
- Revoking the credential returned the connected-provider region to its empty state.
- The live browser reported the expected page identity and no console warnings or errors.

## Intentional boundaries

- The API uses a local workspace header and in-memory storage until production authentication and durable persistence are introduced.
- Persistent encrypted credential storage remains disabled until server-side key management exists.
- GitHub OAuth, professional-identity editing, conflict resolution, source deletion impact, and real AI-provider calls remain later Milestone 1 work.
- The generated concepts are design references only and are not shipped as application assets.
