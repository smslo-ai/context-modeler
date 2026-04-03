# Product Guidelines

## Voice and Tone

Direct, structured, professional. Per Shane's brand voice guidelines:

- Lead with the point
- No hedging or filler
- Use markdown for readability
- Collegial but concise

Applied to the app: UI copy should explain concepts clearly without jargon. Labels and tooltips should be self-explanatory. Error messages should be specific and actionable.

## Design Principles

### 1. Simplicity over features

Build only what the current phase requires. The right amount of complexity is what the task actually demands. No speculative abstractions.

### 2. Security-first

DOMPurify is mandatory for all dynamic content. CSP meta tag in production. localStorage keys prefixed to avoid collisions. Schema validation on data load. Never trust user input.

### 3. Accessibility-first

WCAG 2.1 AA compliance across all components. Keyboard navigation, ARIA roles, focus management, screen reader announcements, sufficient color contrast. Accessibility is not a phase -- it ships with every feature.

### 4. Data sovereignty

All user data stays in the browser (localStorage). No enterprise data leaves the client. This is critical because the modeled workflows may reference confidential enterprise systems and processes.

### 5. Progressive disclosure

Dashboard shows the overview; Input Studio allows deep editing. Simulation modes filter visual noise. AI features (when implemented) surface analysis on demand, not by default.

## Scope Boundaries

- This is a **portfolio piece**, not a SaaS product
- No user accounts, authentication, or multi-device sync
- Dark mode is the primary theme (dark-first); light mode is deferred
- AI features are Phase 5 -- buttons exist but are locked with tooltips
