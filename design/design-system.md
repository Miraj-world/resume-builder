# Resume Studio Design System

Concept source: `concepts/resume-studio-primary.png`

## Visual direction

Precision publishing workspace: calm, trustworthy, evidence-forward, and editorial. The canvas is the visual focal point. App chrome uses a humanist sans-serif; resume content uses a restrained serif.

## Color lock

- App background: cool pale gray `#EEF2F3`
- Surface and paper: true white `#FFFFFF`
- Primary text: deep ink `#16232D`
- Muted text: slate `#66747D`
- Borders: `#D7DEE1`
- Primary accent: teal `#007D82`
- Accent hover: dark teal `#00676B`
- Selected surface: pale teal `#E5F3F3`
- Evidence surface: warm sand `#FAF5E9`
- Evidence border: `#DCB875`
- Pending state: amber `#F59F0B`
- Valid state: green `#148451`

No gradients, glow, glass effects, cream page background, or color overlay.

## Typography

- Product UI: Inter-compatible system sans stack
- Resume preview: Georgia-compatible serif stack
- UI control text: 10–13px at the concept's desktop density
- Workspace title: 15px semibold
- Resume candidate name: 29px regular serif
- Resume section heading: 13px uppercase with restrained tracking

## Geometry

- Control and panel radius: 4–6px
- Resume paper has a subtle shadow, not a floating rounded container
- Panels use one-pixel rules rather than nested cards
- Selected resume content uses a thin teal evidence outline
- Evidence uses a sand field, visually distinct from suggestion text

## Container model

- Narrow global navigation rail
- Conversation rail
- Open gray canvas with centered paper
- Fixed inspector rail
- Narrow bottom status rail

## Core component families

- Navigation item: default, hover, selected
- Button: quiet, active, primary
- Tabs: default, active underline
- Resume node: default, selected, locked
- Suggestion: pending, editing, accepted, rejected, modified
- Evidence row: document or structured source
- Status: valid, updated, warning

## Allowed primary-screen copy

- Resume Builder
- Career Vault
- Opportunities
- Resumes
- Connections
- Resume Studio
- Senior Product Engineer — Northstar Labs
- Software Engineer
- Clear
- ATS preview
- Export
- Chat
- Recent
- Make this project more concise and emphasize system design.
- Suggestions
- Active (1)
- All suggestions (4)
- Bullet refinement
- Pending
- Original
- Proposed
- Show diff
- Why this helps
- Evidence
- Locked section
- Reject
- Edit
- Accept
- Page 1 of 1
- No validation issues
- View checks

Representative fictional resume content is permitted inside the paper and evidence examples.

## Responsive behavior

- At medium desktop widths, collapse navigation labels.
- At narrow laptop widths, hide the chat rail while preserving canvas and suggestions.
- At mobile widths, use horizontal primary navigation, stack the inspector below the canvas, and retain suggestion actions.
