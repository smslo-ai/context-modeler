# Context-Aware Workplace Modeler -- UX Architecture Audit

**Auditor:** ArchitectUX Agent
**Date:** 2026-03-29
**Source Materials:** SPEC.md (v1.0), PLAN.md (v1.0), 10 Gemini prototype screenshots
**Scope:** Responsive design, empty/loading/error states, interaction feedback, information hierarchy, mobile experience, portfolio presentation quality

---

## 1. RESPONSIVE DESIGN GAPS

### 1.1 Three-Column Ontology Explorer Collapse

- **Issue**: The spec defines `grid-cols-1 md:grid-cols-3` (line 581) for the ontology explorer, meaning all three columns stack vertically below 768px. No intermediate layout (e.g., 2+1 at tablet) is defined. On a phone, the user sees a single long scroll of Workflows, then Systems, then Personas -- destroying the side-by-side relationship comparison that makes the triad meaningful.
- **Impact**: The core visualization -- seeing how Workflows, Systems, and Personas relate across columns -- is completely lost on mobile. The user cannot visually trace connections between columns because they are hundreds of pixels apart vertically.
- **Severity**: Critical
- **Recommendation**: Implement a tabbed column switcher on mobile (< 768px) with three tab buttons ("Workflows", "Systems", "Personas") that toggle visibility of each column. Show only one column at a time. When a node is clicked and related nodes are in a different column, auto-switch to that column with a "See N connected nodes in Systems" affordance. Alternatively, consider a horizontal swipe carousel for the three columns.
- **Plan Phase**: Phase 4 (4.1 -- Responsive design audit)

### 1.2 Heatmap on Narrow Screens

- **Issue**: The heatmap uses CSS Grid with `grid-template-columns: 160px repeat(N, 1fr)` and wraps in `overflow-x-auto`. With 5 workflows as columns plus a 160px label column, the minimum content width is approximately 560px. The spec provides `overflow-x-auto` (line 740), which enables horizontal scrolling, but there is no visual indicator that the grid scrolls horizontally (no scroll shadow, no "swipe to see more" hint).
- **Impact**: On mobile (320-375px viewports), users will see the system labels and approximately 1-2 friction cells. The remaining cells are hidden off-screen with no affordance suggesting they exist. Users may believe the heatmap is broken or incomplete.
- **Severity**: High
- **Recommendation**: (1) Add horizontal scroll shadow indicators (CSS `background-attachment: local` technique or JS-based fade overlays on left/right edges). (2) On screens below 640px, rotate workflow header labels 45-90 degrees and reduce the label column from 160px to 100px. (3) Add a subtitle: "Scroll horizontally to see all workflow columns" on mobile. (4) Consider transposing the matrix on mobile (workflows as rows, systems as columns) if it fits better.
- **Plan Phase**: Phase 4 (4.1)

### 1.3 Form Layout Responsiveness

- **Issue**: The Input Studio forms use `grid-cols-1 md:grid-cols-2` for field pairs (lines 1047, 1081), which is correct. However, the system link checkboxes also use `grid-cols-2` (line 1111) without a responsive prefix, meaning two-column checkboxes persist even on 320px screens where checkbox labels may truncate.
- **Impact**: On narrow screens, long system names like "Shared Sites (SharePoint)" will wrap awkwardly or overflow within the checkbox grid, making labels partially unreadable.
- **Severity**: Medium
- **Recommendation**: Change checkbox grid to `grid-cols-1 sm:grid-cols-2` to stack on the smallest screens. Add `truncate` or `break-words` to checkbox label text as a fallback.
- **Plan Phase**: Phase 4 (4.1)

### 1.4 Simulation Control Panel Positioning on Mobile

- **Issue**: The hero section uses `grid-cols-1 lg:grid-cols-3` (line 444), placing the Simulation Control Panel in the right column on desktop and below the hero text on mobile. On mobile, the user must scroll past the hero text to discover simulation controls. There is no sticky or floating treatment for these controls.
- **Impact**: On mobile, the simulation mode buttons are above the ontology explorer but below the hero text. If the user scrolls down to the explorer, they cannot see or change the simulation mode without scrolling back up. This creates a disconnect between control and visualization.
- **Severity**: Medium
- **Recommendation**: (1) On mobile, make the simulation control panel sticky (position: sticky with an appropriate top offset below the header). (2) Alternatively, collapse it into a compact horizontal pill bar that remains visible at the top of the explorer section. (3) Consider a floating action button (FAB) on mobile that opens a bottom sheet with simulation controls.
- **Plan Phase**: Phase 4 (4.1)

---

## 2. EMPTY / LOADING / ERROR STATES

### 2.1 No Loading State Defined

- **Issue**: The spec defines the initialization sequence (Section 1.5) as synchronous: load state, render nav, render dashboard, render input studio, init charts. There is no loading indicator during this process. While the init is fast for 14 default nodes, users on slow devices or with large custom ontologies may see a brief flash of unstyled/empty content.
- **Impact**: On slow connections (loading the self-hosted Inter font, Chart.js library), the page may render with system fonts and then reflow when Inter loads. No skeleton screens or content placeholders exist.
- **Severity**: Low
- **Recommendation**: (1) Add a minimal CSS-only loading spinner inside `<div id="app">` in `index.html` that gets replaced on first render. (2) Use `font-display: swap` (already specified in Section 6.3 -- good). (3) Add skeleton placeholder cards for the three ontology columns that display before `renderColumns()` completes.
- **Plan Phase**: Phase 4 (4.2 -- Loading states and empty states)

### 2.2 First Visit / Empty localStorage

- **Issue**: The spec handles this correctly in concept: `loadFromStorage()` returns `null` if localStorage is empty, and the store falls back to `getDefaultData()` (Section 1.5, step 2). The app always starts with 14 default nodes. However, there is no first-use onboarding or explanation of what these default nodes represent or why they exist.
- **Impact**: A first-time visitor (including a hiring manager) sees pre-loaded data with names like "Management Escalations" and "Reactive Firefighter" with zero context about whose workplace this models. They have no way to know if this is demo data or real data. The app does not introduce itself.
- **Severity**: High
- **Recommendation**: (1) Add a first-visit welcome modal or inline banner that says "This is a demo workplace model with sample data. Explore the dashboard or add your own nodes in the Input Studio." (2) Store a `hasVisited` flag in localStorage. (3) Provide a "Tour" or "How it works" button in the header that replays the welcome flow. (4) See also Section 6.4 (onboarding) for portfolio-specific recommendations.
- **Plan Phase**: Phase 4 (4.2, 4.5)

### 2.3 Feedback After Adding a Node

- **Issue**: The spec defines a toast notification: "Node added: {name}" with 3-second auto-dismiss (Section 5.4, step 14). This is adequate but minimal. After adding a node, the user stays on the Input Studio view. They cannot see the node appear in the ontology explorer or heatmap without manually switching views.
- **Impact**: The user has no visual confirmation that the node was integrated into the system graph. They must trust the toast and switch to Dashboard to verify. This breaks the feedback loop.
- **Severity**: Medium
- **Recommendation**: (1) After adding a node, include a link in the toast: "Node added: {name} -- View on Dashboard" that switches the view and scrolls to the relevant column. (2) Show the updated node count in the Input Studio header banner. (3) Consider adding a small "recent additions" list at the bottom of each Input Studio tab.
- **Plan Phase**: Phase 4 (4.2)

### 2.4 Form Validation Error States

- **Issue**: The spec says "If validation fails: show inline error message, return early" (Section 5.4, step 4d). No error message design, positioning, styling, or wording is specified. No error state styling exists for form inputs (red border, error icon, error text below field).
- **Impact**: Developers implementing validation will invent their own error patterns, leading to inconsistency. Users may not understand why submission failed because error messaging is undesigned.
- **Severity**: High
- **Recommendation**: Define explicit error states: (1) Add `border-red-500` and `ring-red-500` classes to invalid inputs. (2) Show a `<p class="text-xs text-red-500 mt-1">` below each invalid field with a specific message (e.g., "Workflow name is required", "Name must be 100 characters or fewer"). (3) Focus the first invalid field on submit. (4) Clear error styling on input change.
- **Plan Phase**: Phase 2 (validation is security-adjacent) or Phase 4

### 2.5 Heatmap with 0 Workflows or 0 Systems

- **Issue**: The spec does not describe what `renderHeatmap()` should produce when there are zero workflows (no columns) or zero systems (no rows). The grid generation logic would produce either a 0-column or 0-row grid, which is either invisible or shows only header labels with no data.
- **Impact**: If a user resets data and removes all workflows (not currently possible with soft reset, but hypothetically possible with future delete functionality), the heatmap section would display an empty white card with only the legend. This looks broken.
- **Severity**: Low (currently impossible with default data, but future-proofing matter)
- **Recommendation**: Add empty state handling: if workflows.length === 0 or systems.length === 0, render a centered message inside the heatmap container: "Add at least one workflow and one system in the Input Studio to generate the friction heatmap." Include a button linking to Input Studio.
- **Plan Phase**: Phase 4 (4.2)

### 2.6 Charts with No Data

- **Issue**: Both charts use hardcoded static data (Section 8.1, 8.2). They never reflect the user's ontology. The radar chart shows "Current Maturity" vs "Target State" for five arbitrary dimensions. The bubble chart shows seven workflow items that don't correspond to the actual ontology data.
- **Impact**: The charts feel disconnected from the rest of the application. A user who adds new workflows will not see them reflected in the charts. For a portfolio piece, this makes the charts look like static images pretending to be interactive.
- **Severity**: Medium
- **Recommendation**: (1) In Phase 4, make the radar chart data-driven: compute scores from ontology composition (e.g., "Workflow Def" score = workflows.length / 10 * 100, capped). (2) Make the bubble chart plot actual workflows from ontologyData, using linkedSystems.length as complexity and type-mapped values as strategic value. (3) If this is too complex for Phase 4, add a disclaimer label below each chart: "Sample data -- charts will reflect your ontology in a future update."
- **Plan Phase**: Phase 4 (4.2) or Phase 5

---

## 3. INTERACTION FEEDBACK

### 3.1 Simulation Mode Activation Feedback

- **Issue**: The spec defines visual feedback via `mode-card-active` class (border color change to indigo, background shift to indigo-50). This is adequate for the control panel itself. However, the corresponding changes to the ontology explorer (dimmed/highlighted nodes) happen via CSS transitions with no announcement or explanation.
- **Impact**: A user who clicks "Deep Focus" will see some cards fade and others brighten, but there is no text explanation of what happened. First-time users will not understand why certain nodes dimmed. The relationship between the mode and the visual change is implicit.
- **Severity**: Medium
- **Recommendation**: (1) Add a dynamic subtitle under the "Context Ontology Explorer" heading that updates with the active mode: "Showing Deep Focus mode -- low-distraction workflows and systems are highlighted." (2) Add a brief tooltip or annotation on dimmed nodes: "Dimmed in Deep Focus mode." (3) Consider a brief animation pulse on highlighted nodes when mode changes.
- **Plan Phase**: Phase 4 (4.2)

### 3.2 Node Click Immediate Feedback

- **Issue**: The spec defines `active-context` class application with a left indigo border and background color change (Section 5.2, CSS in Section 6.5). The transition timing is `0.3s cubic-bezier`. This provides visual feedback, but the clicked node itself does not have a distinct "selected" state separate from "connected" -- both use the same `active-context` class.
- **Impact**: When clicking a node, the user cannot distinguish the selected node from its connected nodes. All highlighted nodes look identical. This weakens the mental model of "I clicked this, and these are related."
- **Severity**: Medium
- **Recommendation**: Create a separate `.selected-node` class with stronger visual treatment: (1) Thicker left border (4px vs 3px). (2) Darker indigo background (`indigo-100` vs `indigo-50`). (3) A subtle scale transform (`scale(1.02)`). (4) Bold the node name. Connected nodes keep the existing `active-context` treatment.
- **Plan Phase**: Phase 2 (part of "Fix context mode simulation") or Phase 4

### 3.3 Form Submit Success Confirmation

- **Issue**: The spec defines a toast notification for success (Section 5.4, step 14) and form field reset (step 13). The toast is positioned at bottom-right (Appendix A). No other confirmation exists.
- **Impact**: Adequate for desktop. On mobile, the toast at bottom-right may be partially obscured by the mobile browser's bottom bar or system gestures. The form reset (fields going blank) is an implicit confirmation, but some users may interpret it as a glitch.
- **Severity**: Low
- **Recommendation**: (1) On mobile, position the toast at the top of the viewport instead of bottom-right. (2) Add a brief green checkmark animation on the submit button (button text temporarily changes to "Added!" with a check icon for 1.5 seconds before reverting). (3) Scroll the form back to the top after submission.
- **Plan Phase**: Phase 4 (4.2)

### 3.4 Reset Confirmation Dialog

- **Issue**: The spec uses `window.confirm()` for reset confirmation (Section 5.5, step 1). This is a browser-native modal that looks inconsistent with the app's design language and cannot be styled.
- **Impact**: The native confirm dialog breaks the visual cohesion of the app. On mobile browsers, it can be jarring. It also looks amateurish in a portfolio context -- hiring managers notice these details.
- **Severity**: Medium
- **Recommendation**: Replace `window.confirm()` with a custom modal matching the friction modal design (Section 3.6): white card, centered, with backdrop overlay, styled "Cancel" and "Reset" buttons. The "Reset" button should be red to signal destructive action. Use the same show/hide pattern as `#friction-modal`.
- **Plan Phase**: Phase 4 (4.2)

### 3.5 Loading Spinners for AI Features (Phase 5 Stubs)

- **Issue**: AI buttons currently call `showAIStub()` which fires a toast. The spec does not define loading spinners, skeleton content, or streaming indicators for when real AI calls are implemented in Phase 5.
- **Impact**: No immediate impact (Phase 1-4 uses stubs). But Phase 5 AI calls to a serverless function will have 2-10 second latency. Without loading indicators, users will click the button and see nothing for several seconds.
- **Severity**: Low (deferred to Phase 5 implementation)
- **Recommendation**: Pre-define the loading UX now for Phase 5: (1) Replace button text with a spinner + "Analyzing..." on click. (2) Show a pulsing skeleton in the response container. (3) Stream the response token-by-token if the AI provider supports streaming. (4) Add an "elapsed time" indicator for requests over 3 seconds.
- **Plan Phase**: Phase 5

---

## 4. INFORMATION HIERARCHY

### 4.1 Dashboard Density

- **Issue**: The Dashboard view contains, in order: Hero section with simulation controls, three-column ontology explorer, insight panel (conditional), full-width heatmap, two charts side by side, four roadmap cards. This is a lot of content on a single scroll. On a 1080p monitor, approximately 3-4 full scrolls are needed to see everything.
- **Impact**: Users (especially hiring managers with 30 seconds to evaluate) may not scroll past the ontology explorer. The heatmap, charts, and roadmap -- all valuable content -- risk being unseen.
- **Severity**: High
- **Recommendation**: (1) Add a sticky section navigation (anchor links) below the header: "Explorer | Heatmap | Charts | Roadmap" that highlights the current scroll position. (2) Consider collapsible/accordion sections for Heatmap, Charts, and Roadmap so users can focus on what interests them. (3) Add a "scroll to explore more" indicator after the ontology explorer. (4) For portfolio presentation, consider a brief visual summary/stats bar above the explorer: "5 Workflows, 5 Systems, 4 Personas, 25 Friction Points" to give instant context.
- **Plan Phase**: Phase 4 (4.5 -- About section / project story)

### 4.2 Simulation Controls vs. Ontology Explorer Relationship

- **Issue**: The simulation controls sit in the hero section's right column. The ontology explorer is a separate section below. There is no visual connector (arrow, dashed line, color thread) between the controls and the explorer. The label "Simulation Control" and the section title "Context Ontology Explorer" use different visual languages and do not reference each other.
- **Impact**: First-time users may not realize that clicking "Deep Focus" changes the explorer below. The cause-and-effect relationship is spatially disconnected.
- **Severity**: Medium
- **Recommendation**: (1) Move the simulation controls to a horizontal bar directly above the ontology explorer columns, inside the same section card. (2) Add a connecting label: "Select a mode to filter the explorer below." (3) When a mode is activated, briefly animate the explorer section border or background to draw attention to the change.
- **Plan Phase**: Phase 4 (4.1 or 4.5)

### 4.3 "Context Triad" Terminology

- **Issue**: The hero text introduces the concept of "three dimensions: Business Demand, System Capability, and User State." The ontology explorer uses different labels: "Business Workflows (Demand)", "Systems & Infra (Supply)", "Users & Personas (State)." The term "Context Triad" does not appear in the UI but is used conceptually. "Supply" appears in the column badge but not in the hero text, which says "System Capability."
- **Impact**: Inconsistent terminology creates cognitive load. Users must map "Business Demand" to "Business Workflows (Demand)" and "System Capability" to "Systems & Infra (Supply)" -- the latter being a non-obvious mapping.
- **Severity**: Low
- **Recommendation**: (1) Align terminology: use "Demand," "Supply," and "State" consistently in both the hero text and column headers. (2) Update the hero text to match: "Business Demand (Workflows), System Supply (Infrastructure), and User State (Personas)." (3) Consider a small visual key/legend connecting the three colored badges to the three concepts.
- **Plan Phase**: Phase 4 (4.5)

### 4.4 Heatmap Purpose Clarity

- **Issue**: The heatmap section heading says "Cognitive Friction Heatmap" with a subtitle "Context Engineering analysis of workflow-system compatibility." The color legend shows Low/Moderate/High. However, the concept of "cognitive friction" is never explained. What does a red cell mean in practical terms? Why should the user care?
- **Impact**: Users unfamiliar with context engineering (which includes most hiring managers) will see a colorful grid but not understand its significance. The heatmap becomes decoration rather than insight.
- **Severity**: Medium
- **Recommendation**: (1) Add a one-sentence explainer above the grid: "Each cell shows how well a workflow fits a system. Green = natural fit (low context switching). Red = mismatch (high cognitive overhead)." (2) Add a "What is cognitive friction?" tooltip or expandable info icon. (3) The friction modal (which appears on cell click) already provides good detail -- make the click affordance more obvious with a "Click any cell for details" prompt.
- **Plan Phase**: Phase 4 (4.5)

---

## 5. MOBILE EXPERIENCE

### 5.1 Touch Targets

- **Issue**: Several interactive elements fall below the 44x44px minimum touch target recommended by Apple's HIG and WCAG 2.1 AAA: (1) The "Reset data" text button in the header (no padding specified, likely ~30px tall). (2) Heatmap cells are `min-height: 2.5rem` (40px) with no min-width specified; at 1fr with 5+ columns, cells could be 40-60px wide but only 40px tall. (3) The "Generate Prompt" link button in the insight panel has no padding and relies on text size alone. (4) Checkbox labels in Input Studio forms at `text-sm` without explicit padding.
- **Impact**: Users on touch devices will misfire taps, especially on the heatmap grid and small text links. This creates frustration and makes the app feel unresponsive.
- **Severity**: High
- **Recommendation**: (1) Add explicit `min-h-[44px] min-w-[44px]` to all interactive elements. (2) For the "Reset data" button, add padding: `px-3 py-2`. (3) For heatmap cells, set `min-height: 44px`. (4) For text link buttons ("Generate Prompt", "Resolve & Assign Friction"), add `py-2 px-3` padding. (5) For checkbox labels, add `py-2` padding for tap area.
- **Plan Phase**: Phase 4 (4.3 -- Accessibility pass)

### 5.2 Gesture Support

- **Issue**: No swipe or pinch interactions are defined anywhere in the spec. The ontology explorer stacks vertically on mobile (no swipe between columns). The heatmap supports horizontal scroll via overflow but no pinch-to-zoom.
- **Impact**: Mobile users expect swipe navigation for tabbed/paged content. The lack of gestures makes the app feel like a desktop page crammed onto mobile rather than a mobile-aware experience.
- **Severity**: Low
- **Recommendation**: (1) If implementing the recommended tabbed column switcher for the ontology explorer (Section 1.1), add swipe-left/right gesture to switch between columns using `touch` events or a lightweight library. (2) For the heatmap, consider adding pinch-to-zoom using CSS `transform: scale()` with touch event handlers. (3) These are polish items -- functional scrolling is sufficient for MVP.
- **Plan Phase**: Phase 4 (4.1) -- optional enhancement

### 5.3 Viewport Height / Mobile Browser Chrome

- **Issue**: The spec uses `sticky top-0` for the header (line 387), which is correct. However, no consideration is given to mobile browser chrome (address bar, bottom navigation bar). On iOS Safari, the viewport height changes as the user scrolls (address bar collapses), which can cause layout shifts. The hero section height is not constrained, and the Input Studio banner uses negative margin (`-mt-4`, line 1002) which may behave unpredictably.
- **Impact**: On iOS Safari, the initial viewport may cut off content at the bottom. The `100vh` issue is well-documented: using it on mobile causes overflow because the browser chrome is not subtracted. The negative margin on the Input Studio card may cause it to overlap the dark banner inconsistently across browsers.
- **Severity**: Medium
- **Recommendation**: (1) Use `dvh` (dynamic viewport height) units instead of `vh` where viewport-relative sizing is used. (2) Test the Input Studio banner + card overlap with negative margin on iOS Safari and Chrome for Android. (3) Add `overscroll-behavior: none` on the body to prevent elastic bounce on iOS. (4) Ensure the sticky header accounts for the safe area on devices with notches: `top: env(safe-area-inset-top)`.
- **Plan Phase**: Phase 4 (4.1)

### 5.4 Font Sizes on Mobile

- **Issue**: The spec uses `text-sm` (14px) for body/descriptions and `text-xs` (12px) for labels/badges throughout. The hero heading is `text-3xl` (30px). These sizes are readable on desktop but `text-xs` (12px) on mobile requires good eyesight, especially for the heatmap headers at `0.65rem` (10.4px) which is below minimum legibility thresholds.
- **Impact**: Heatmap column headers at 10.4px will be unreadable on mobile without zooming. Badge text at 12px is borderline. Users with accessibility needs will struggle.
- **Severity**: High
- **Recommendation**: (1) Increase heatmap header font size to at least `text-xs` (12px), preferably `text-sm` (14px) on all screen sizes. (2) Never go below 12px for any text in the application. (3) Consider `sm:text-xs text-sm` pattern -- larger on mobile, smaller on desktop where there is more space. (4) Test with browser zoom at 200% per WCAG 1.4.4.
- **Plan Phase**: Phase 4 (4.3 -- Accessibility pass)

---

## 6. PORTFOLIO PRESENTATION QUALITY

### 6.1 Visual Design Polish

- **Issue**: The prototype screenshots show a clean, professional design with clear visual hierarchy: white cards, slate borders, indigo accent color, good use of whitespace. The spec faithfully reproduces this. However, the design is heavily "utility-default Tailwind" -- it looks like every well-built Tailwind dashboard. There is nothing visually distinctive that would make this project memorable in a portfolio.
- **Impact**: A hiring manager reviewing multiple portfolios will see yet another Tailwind dashboard with rounded corners and indigo buttons. The project will blend in rather than stand out.
- **Severity**: Medium
- **Recommendation**: (1) Add one distinctive visual element -- for example, subtle animated connection lines between the three ontology columns (SVG paths or CSS borders that visually connect selected nodes across columns). (2) Consider a custom gradient or branded color moment in the hero section. (3) Add subtle micro-interactions: card hover lifts, mode switch animations, heatmap cell pulse on hover. (4) The dark insight panel is a good contrast moment -- extend this design language to other interactive states.
- **Plan Phase**: Phase 4 (4.5)

### 6.2 AI Prototype Rough Edges

- **Issue**: Several elements reveal the "AI prototype" origin: (1) The `showAIStub()` pattern -- 8+ buttons that all show the same toast saying "coming in Phase 5" will feel broken to a portfolio viewer. (2) The charts show static data unrelated to the ontology. (3) The roadmap section has four "Generate Action Plan" buttons that all do nothing. (4) The hero text reads like a product pitch, not a portfolio project description.
- **Impact**: A hiring manager clicking "Analyze Logic" and seeing "AI features coming in Phase 5" will think the project is incomplete or abandoned. Stubbed features actively harm the impression more than not having them at all.
- **Severity**: Critical
- **Recommendation**: (1) Remove or disable AI stub buttons in pre-Phase-5 deployments. Replace them with a graceful locked state: gray out the button, add a lock icon, and show a tooltip "AI analysis -- coming soon" on hover. Do not show a toast. (2) Alternatively, remove AI buttons entirely until Phase 5 and replace them with static insight text (pre-written analysis). (3) For roadmap "Generate Action Plan" buttons, replace with pre-written checklists that are always visible -- this demonstrates the concept without requiring AI.
- **Plan Phase**: Phase 2 or Phase 4

### 6.3 10-Second Comprehension Test

- **Issue**: The first thing a visitor sees is: Logo "C" + "Context-Aware Workplace Modeler" + subtitle "Ontology Engine & Feasibility Analysis" + hero heading "Modeling the Context-Aware Enterprise." None of this tells the visitor: (1) What this project does in plain language. (2) Who built it. (3) Why it matters. The subtitle "Ontology Engine & Feasibility Analysis" is jargon that will confuse non-technical viewers.
- **Impact**: A hiring manager will spend 5-10 seconds on the page. If they cannot understand what they are looking at, they leave. "Ontology Engine" is not a term most people outside semantic web circles use. The project's value proposition is buried in paragraph text below the fold.
- **Severity**: Critical
- **Recommendation**: (1) Change the subtitle to plain language: "A portfolio project by Shane Slosar -- mapping how workflows, tools, and people interact in a workplace." (2) Add a one-line value prop above the hero heading: "Built with vanilla JS, Vite, and Tailwind CSS." This immediately signals: who built it, what it demonstrates, and what tech stack it uses. (3) Add a prominent "About This Project" link in the header. (4) Consider a brief animated intro sequence (3-4 seconds) that visually demonstrates the concept: three icons connecting with lines.
- **Plan Phase**: Phase 4 (4.5 -- About section)

### 6.4 Onboarding / First-Use Experience

- **Issue**: No onboarding flow exists. The app loads directly into the Dashboard with pre-populated data and no guidance. The user does not know: what the three columns represent, how to interact with them, what the simulation modes do, or that they can add their own data in the Input Studio.
- **Impact**: For a portfolio piece, self-discovery is not a strength -- it is a liability. Viewers will not invest time figuring out the interface. They need to be guided to the "aha moment" within seconds.
- **Severity**: Critical
- **Recommendation**: Implement a lightweight onboarding flow (not a lengthy tutorial): (1) First-visit overlay with three steps (3 short tooltip popovers): Step 1 points to ontology explorer ("Your workplace modeled in three dimensions"), Step 2 points to simulation controls ("See how different work modes affect your context"), Step 3 points to heatmap ("Discover friction between workflows and systems"). (2) Add a "?" help button in the header that replays the onboarding. (3) Keep onboarding under 15 seconds total. (4) Store `onboarding-complete` in localStorage.
- **Plan Phase**: Phase 4 (4.5)

### 6.5 Story Clarity About Context Engineering

- **Issue**: The term "context engineering" appears in the heatmap subtitle and hero text but is never defined or connected to a broader narrative. The project's positioning as a "context engineering" portfolio piece is implicit. There is no explanation of why context engineering matters, what problem it solves, or how this tool demonstrates the concept.
- **Impact**: The project misses its primary portfolio goal: demonstrating Shane's understanding of context engineering. Without narrative framing, the project looks like a generic workplace dashboard rather than a thoughtful exploration of a specific concept.
- **Severity**: High
- **Recommendation**: (1) Add an "About" modal or section that tells the story: "Context engineering is the practice of designing what information reaches an AI agent (or person) at the right time. This tool models a workplace through three lenses -- demand, supply, and state -- to visualize how context flows and where friction occurs." (2) Link to external resources or blog posts about context engineering. (3) Frame the project as a learning journey: "I built this to explore how workplaces can be modeled as knowledge graphs." (4) Include a brief "What I Learned" section.
- **Plan Phase**: Phase 4 (4.5)

---

## 7. ADDITIONAL FINDINGS

### 7.1 No Dark Mode Support

- **Issue**: The entire spec assumes a light theme. No dark mode variables, media query for `prefers-color-scheme: dark`, or theme toggle is defined. The CSS custom properties in Section 6.2 are hardcoded light values with no dark alternatives.
- **Impact**: (1) Users who prefer dark mode will see a bright white page, which is inconsistent with modern web expectations. (2) The dark insight panel (Section 3.5) actually previews what a dark theme could look like -- the contrast between this dark panel and the white page feels intentional but the rest of the app does not follow through. (3) Many portfolio reviewers work in dark-themed environments (IDEs, terminals) and notice when sites lack dark mode.
- **Severity**: Medium
- **Recommendation**: (1) Add a `[data-theme="dark"]` set of CSS custom property overrides. (2) Add a theme toggle in the header (light/dark/system). (3) Map all hardcoded colors to CSS custom properties. (4) The existing color palette maps cleanly to dark mode: slate-900 becomes the background, white becomes card surfaces in a darker shade, indigo accent stays the same.
- **Plan Phase**: Phase 4 (4.3 or 4.5)

### 7.2 No Keyboard Navigation Defined

- **Issue**: The spec defines click handlers for all interactive elements but no keyboard interaction patterns. No `tabindex`, `role`, `aria-label`, `aria-expanded`, or keyboard event handlers (`keydown` for Enter/Space on custom buttons, Escape to close modals) are specified.
- **Impact**: (1) The app is inaccessible to keyboard-only users. (2) The heatmap grid cells are `<div>` elements with click handlers -- they are not focusable or operable via keyboard. (3) The friction modal has no focus trap. (4) Screen readers will not announce state changes (mode switches, insight panel appearance). (5) This is both an accessibility and a portfolio quality issue -- accessibility awareness is a hiring signal.
- **Severity**: High
- **Recommendation**: (1) Add `tabindex="0"` and `role="button"` to all clickable `<div>` elements (triad items, heatmap cells). (2) Add `keydown` handlers for Enter and Space on these elements. (3) Add `role="dialog"` and focus trap to friction modal. (4) Add `aria-live="polite"` to the insight panel container so screen readers announce when it appears. (5) Add `aria-pressed` to mode cards. (6) Add Escape key handler to close modals.
- **Plan Phase**: Phase 4 (4.3 -- Accessibility pass)

### 7.3 No Node Delete or Edit Capability

- **Issue**: The Input Studio provides forms to add nodes, but there is no way to edit or delete existing nodes. The only way to remove nodes is a full reset to defaults.
- **Impact**: Users who add a node with a typo or wrong data are stuck with it unless they reset everything. This will frustrate anyone who experiments with the Input Studio and makes a mistake.
- **Severity**: Medium
- **Recommendation**: (1) Add a small "x" delete button on each node card in the ontology explorer (with confirmation). (2) Add an "edit" icon that opens the Input Studio pre-filled with the node's data. (3) At minimum, add a "delete last added" undo capability. (4) This is a UX expectation for any CRUD interface.
- **Plan Phase**: Phase 4 (unassigned -- suggest adding to Phase 4 scope as 4.8)

### 7.4 No Data Persistence Indicator

- **Issue**: The app uses localStorage for data persistence, but there is no UI indicator showing whether data is saved, unsaved, or loaded from storage. Users do not know that their data persists across page refreshes.
- **Impact**: Users may worry about losing their data and avoid investing time in adding nodes. Or they may be surprised that custom data appears on their next visit.
- **Severity**: Low
- **Recommendation**: (1) Add a small status indicator near the node counter: "Saved locally" with a check icon, or "Using demo data" if localStorage is empty. (2) Show a brief "Data restored from your last session" toast on page load if localStorage had saved data.
- **Plan Phase**: Phase 4 (4.2)

---

## Summary: Prioritized Findings

### Critical (4 findings -- must fix before portfolio deployment)

| # | Finding | Section | Plan Phase |
|---|---------|---------|------------|
| C1 | No onboarding or first-use experience | 6.4 | Phase 4 |
| C2 | 10-second comprehension failure -- jargon-heavy intro, no author attribution | 6.3 | Phase 4 |
| C3 | AI stub buttons actively harm impression -- 8+ "coming soon" dead ends | 6.2 | Phase 2/4 |
| C4 | Three-column explorer loses all meaning when stacked vertically on mobile | 1.1 | Phase 4 |

### High (7 findings -- significant UX impact)

| # | Finding | Section | Plan Phase |
|---|---------|---------|------------|
| H1 | Heatmap has no scroll affordance on mobile -- content hidden off-screen | 1.2 | Phase 4 |
| H2 | No first-visit context for demo data | 2.2 | Phase 4 |
| H3 | Form validation error states unspecified | 2.4 | Phase 2/4 |
| H4 | Touch targets below 44px on multiple elements | 5.1 | Phase 4 |
| H5 | Heatmap text at 10.4px -- below legibility threshold | 5.4 | Phase 4 |
| H6 | No keyboard navigation or ARIA attributes defined | 7.2 | Phase 4 |
| H7 | Context engineering story not told -- project's purpose unclear | 6.5 | Phase 4 |

### Medium (10 findings -- noticeable UX friction)

| # | Finding | Section | Plan Phase |
|---|---------|---------|------------|
| M1 | Simulation controls disconnected from explorer on mobile | 1.4 | Phase 4 |
| M2 | Node added feedback lacks view-switching link | 2.3 | Phase 4 |
| M3 | Charts show static data unrelated to ontology | 2.6 | Phase 4/5 |
| M4 | No dynamic label explaining what simulation mode does | 3.1 | Phase 4 |
| M5 | Selected node indistinguishable from connected nodes | 3.2 | Phase 2/4 |
| M6 | Reset uses browser-native confirm dialog | 3.4 | Phase 4 |
| M7 | Heatmap "cognitive friction" concept unexplained | 4.4 | Phase 4 |
| M8 | No dark mode support | 7.1 | Phase 4 |
| M9 | No node edit or delete capability | 7.3 | Phase 4 |
| M10 | Mobile viewport height issues with iOS browser chrome | 5.3 | Phase 4 |

### Low (6 findings -- minor polish items)

| # | Finding | Section | Plan Phase |
|---|---------|---------|------------|
| L1 | No loading skeleton on initial render | 2.1 | Phase 4 |
| L2 | Heatmap empty state undefined | 2.5 | Phase 4 |
| L3 | Toast position may be obscured by mobile browser bar | 3.3 | Phase 4 |
| L4 | Checkbox layout issues on narrow screens | 1.3 | Phase 4 |
| L5 | No swipe gestures for mobile column navigation | 5.2 | Phase 4 |
| L6 | No data persistence indicator | 7.4 | Phase 4 |

---

## Phase 4 Scope Expansion Recommendation

The current PLAN.md allocates Phase 4 to "Polish & Portfolio Quality" with three PRs. Based on this audit, Phase 4 carries the majority of findings (23 of 27). Recommend splitting Phase 4 into sub-phases:

- **Phase 4A -- Responsive & Mobile** (PR #7): Findings C4, H1, H4, H5, M1, M10, L3, L4, L5
- **Phase 4B -- Empty States & Feedback** (PR #8): Findings H3, M2, M4, M5, M6, L1, L2, L6, M9
- **Phase 4C -- Accessibility** (PR #9): Findings H6, H5 (additional pass), touch targets
- **Phase 4D -- Portfolio Story & Onboarding** (PR #10): Findings C1, C2, C3, H2, H7, M3, M7, M8

This increases the PR count from 3 to 4 but ensures each PR has a focused scope and testable deliverables.
