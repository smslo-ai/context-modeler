> **Note (2026-04-04):** Written against the vanilla JS spec. DOMPurify and CSP findings remain relevant. Phase 5 serverless guidance (SEC-07, Vercel rate limiting) is deferred -- no serverless infrastructure was adopted.

# Security & Accessibility Audit: Context-Aware Workplace Modeler

**Audit Date:** 2026-03-29
**Auditor:** Security Engineer Agent
**Documents Reviewed:** `SPEC.md` (Implementation Specification v1.0), `PLAN.md` (Project Plan v1.0)
**Scope:** Pre-implementation specification review -- identifying issues before code is written

---

## PART 1: SECURITY AUDIT

### SEC-01: Sanitize Function Is Not Sufficient for innerHTML Contexts

- **Issue:** The spec defines a sanitize function (Section 9.1) that uses `createTextNode` to escape HTML entities. This works correctly when the escaped string is later inserted via `textContent`. However, the spec also describes building HTML strings for batch rendering of column cards (Section 3.4: "When building complex HTML strings for batch rendering, sanitize each interpolated value"). If sanitized output is interpolated into an HTML template string and then assigned via `innerHTML`, the `createTextNode`-based approach may not cover all attack vectors (e.g., attribute injection if values are placed inside HTML attributes without proper quoting).
- **Location:** SPEC Section 9.1 (`sanitize.js`), Section 3.4 (Node Card rendering via `renderColumns()`)
- **Severity:** High
- **Recommendation:** Adopt one of two strategies consistently:
  1. **Preferred:** Build all DOM nodes using `document.createElement()` and set text via `textContent`. Never use `innerHTML` for user-generated content. This eliminates the XSS surface entirely.
  2. **Alternative:** If `innerHTML` is used for performance or convenience, replace the custom sanitize function with DOMPurify from Phase 1 (not Phase 5). DOMPurify handles attribute contexts, URL schemes (`javascript:`), and edge cases the custom function misses.
- **Plan Impact:** Phase 2, Step 2.1. Elevate DOMPurify adoption from Phase 5 to Phase 2. Add a linting rule or code review checklist item: "No raw `innerHTML` without DOMPurify."

---

### SEC-02: innerHTML Usage in Toast and AI Response Containers

- **Issue:** The toast system (Appendix A) safely uses `textContent`. Good. However, the AI response containers (`#ai-response-container`, `#friction-ai-response`, `.roadmap-ai-response`) are described as rendering "Markdown text" in Phase 5 (Section 7.2). The spec correctly calls for DOMPurify after `marked.js` parsing. But these containers exist in the DOM from Phase 1 onward, and nothing in the spec prevents a developer from accidentally inserting unsanitized content into them before Phase 5 controls are in place.
- **Location:** SPEC Sections 3.5, 3.6, 3.8 (AI response containers), Section 7.4 (marked.js integration)
- **Severity:** Medium
- **Recommendation:** Add a defensive comment or helper function from Phase 1: `function renderAIResponse(container, markdown) { /* stub: always sanitize */ }`. This ensures the pattern is locked in before AI features arrive. When Phase 5 activates, the function adds `marked.parse()` + `DOMPurify.sanitize()` in sequence.
- **Plan Impact:** Phase 2. Add a `renderSafeHTML()` utility alongside `sanitize.js`.

---

### SEC-03: localStorage -- No Schema Validation on Load

- **Issue:** The `loadFromStorage()` function (Section 9.4) parses JSON and returns the result. It does not validate that the parsed object conforms to the expected `OntologyData` schema. An attacker (or a corrupted save) could inject arbitrary data structures, including:
  - Extremely long strings that cause UI rendering issues (DoS)
  - Object shapes that cause runtime errors when code expects arrays
  - Strings containing `<script>` tags that pass through if any rendering path skips sanitization
  - Excessively large arrays that exhaust browser memory
- **Location:** SPEC Section 9.4 (`storage.js`), Section 2.1 (type definitions)
- **Severity:** Medium
- **Recommendation:** Add a `validateOntologyData(parsed)` function that checks:
  1. `parsed` is an object with exactly three keys: `workflows`, `systems`, `personas`
  2. Each is an array with length <= a reasonable maximum (e.g., 100 nodes)
  3. Each node has the required fields with correct types
  4. All string fields are <= their max length (100 for names, 500 for descriptions)
  5. All enum fields (`type`, `category`, `state`, `frequency`) match allowed values
  6. If validation fails, discard the stored data and fall back to defaults, logging a warning
- **Plan Impact:** Phase 2, Step 2.6. Expand localStorage error handling to include schema validation.

---

### SEC-04: localStorage -- Quota Exceeded Produces Silent Failure

- **Issue:** The spec handles `QuotaExceededError` by logging a warning and continuing. The user receives no indication that their data was not saved. They could add nodes, close the browser, and lose everything.
- **Location:** SPEC Section 9.4 (`saveToStorage`)
- **Severity:** Low
- **Recommendation:** When `saveToStorage` catches an error, call `showToast('Data could not be saved. Storage may be full.', 'error')` to notify the user. Consider offering a "Download as JSON" prompt as a fallback.
- **Plan Impact:** Phase 2, Step 2.6. Phase 4, Step 4.6 (data export becomes a mitigation for storage failures).

---

### SEC-05: localStorage -- Cross-Site Data Access on Shared Domains

- **Issue:** If the app is hosted on `smslo-ai.github.io`, all repos under that GitHub Pages org share the same localStorage origin. Another repo at `smslo-ai.github.io/other-project` can read and write `context-modeler-data`. This is a known limitation of GitHub Pages with organization sites.
- **Location:** SPEC Section 9.4, PLAN Section 2.3 (hosting)
- **Severity:** Low (portfolio project, no sensitive data)
- **Recommendation:** Prefix the localStorage key with the app path: `context-modeler:ontology-data` instead of `context-modeler-data`. Better yet, use a custom domain (`modeler.smslo.ai`) which isolates the origin. Document this limitation in the README for transparency.
- **Plan Impact:** Phase 3 or Phase 4. Add to the custom domain task (PLAN Part 6, item #2).

---

### SEC-06: No ID Collision Detection for Injected Content

- **Issue:** The ID generation logic (Section 5.4, step 5) creates IDs by slugifying user input: `name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`. This means a user could craft a name that produces an ID matching a DOM element ID (e.g., "view dashboard" becomes `wf-view-dashboard`). While the data-attribute-based selection (`data-node-id`) mitigates direct DOM conflicts, the `contextMap` lookup uses these IDs. A collision with an existing node ID would corrupt the relationship graph.
- **Location:** SPEC Section 5.4, step 5
- **Severity:** Low
- **Recommendation:** The spec already handles suffix appending (`-2`, `-3`) for data-level collisions. Verify this extends to checking against the reserved DOM IDs (`view-dashboard`, `view-input-studio`, `global-header`, etc.). Add a reserved ID list check.
- **Plan Impact:** Phase 2 implementation detail. Add reserved ID check to `addNode()`.

---

### SEC-07: Phase 5 API Proxy -- Rate Limiting Gap

- **Issue:** The spec mentions "10 requests/minute per IP" rate limiting (Section 7.3) but provides no implementation details. On Vercel serverless functions, the `x-forwarded-for` header can be spoofed unless Vercel's own IP detection is used. Additionally, no authentication is specified -- the `/api/analyze` endpoint is publicly accessible, meaning anyone can use your AI API quota.
- **Location:** SPEC Section 7.3 (Phase 5 Architecture)
- **Severity:** High (when Phase 5 is implemented)
- **Recommendation:**
  1. Use Vercel's `request.headers.get('x-real-ip')` or `request.ip` (Vercel-provided, not spoofable) for rate limiting
  2. Implement rate limiting via Vercel KV (Redis) or Upstash Redis, not in-memory (serverless functions are stateless)
  3. Add a simple CSRF token or origin check to prevent abuse from other sites embedding your API
  4. Set a monthly spend cap on the AI provider dashboard as a safety net
  5. Consider adding a simple passphrase or session token if the portfolio needs to restrict usage
- **Plan Impact:** Phase 5, Step 5.6. Expand rate limiting specification with these implementation details.

---

### SEC-08: Phase 5 -- AI Response Content May Contain Executable Markdown

- **Issue:** The spec correctly applies DOMPurify after `marked.js` parsing (Section 7.4). However, `marked.js` by default renders HTML embedded in markdown. An AI model returning `<img src=x onerror=alert(1)>` in its response would be parsed by `marked.js` into an `<img>` tag. DOMPurify would strip the `onerror`, but the pipeline must be airtight.
- **Location:** SPEC Section 7.4
- **Severity:** Medium (defense-in-depth concern)
- **Recommendation:**
  1. Configure `marked.js` with `{ sanitize: false }` (deprecated) or use `marked.use({ renderer })` to escape raw HTML blocks
  2. Apply DOMPurify with a strict allowlist: `DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'code', 'pre', 'strong', 'em', 'a', 'br'], ALLOWED_ATTR: ['href'] })`
  3. Ensure `href` values are validated to prevent `javascript:` URLs (DOMPurify handles this by default, but explicitly document the expectation)
- **Plan Impact:** Phase 5, Step 5.5. Add DOMPurify configuration to the spec.

---

### SEC-09: No Content Security Policy Specified

- **Issue:** The spec and plan contain no mention of Content Security Policy headers. CSP is the most effective defense-in-depth control against XSS. Without CSP, any XSS bypass in the sanitization layer leads directly to script execution.
- **Location:** Missing from SPEC entirely
- **Severity:** Medium
- **Recommendation:** Add CSP headers via either:
  1. **GitHub Pages:** Add a `<meta>` tag in `index.html` (GitHub Pages does not support custom response headers):
     ```html
     <meta http-equiv="Content-Security-Policy"
           content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';">
     ```
  2. **Vercel (Phase 5):** Add to `vercel.json`:
     ```json
     {
       "headers": [{
         "source": "/(.*)",
         "headers": [{
           "key": "Content-Security-Policy",
           "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com; frame-ancestors 'none';"
         }]
       }]
     }
     ```
  3. Note: Tailwind CSS may require `'unsafe-inline'` for `style-src` unless all styles are extracted to files. This is acceptable but should be documented.
- **Plan Impact:** Phase 2 (add `<meta>` CSP tag) and Phase 5 (upgrade to response header CSP on Vercel).

---

### SEC-10: Dependency Supply Chain Risks

- **Issue:** The project uses four npm dependencies. Current risk assessment:

  | Dependency | Risk Level | Notes |
  |---|---|---|
  | **Vite ^8.0.1** | Low | Widely used, active maintenance. Pin to exact version in `package-lock.json`. |
  | **Tailwind CSS ^4.2.2** | Low | Build-time only, no runtime code shipped to browser. |
  | **Chart.js ^4.5.1** | Low | Mature library, no known critical CVEs. |
  | **DOMPurify** (Phase 5) | Low | Security-critical library, well-audited, maintained by Cure53. |
  | **marked.js** (Phase 5) | Medium | Has had past XSS vulnerabilities (CVE-2022-21680, CVE-2022-21681). Must use latest version and pair with DOMPurify. |

- **Location:** PLAN Section 2.1 (tech stack), SPEC Section 1.2
- **Severity:** Low (current), Medium (Phase 5 with marked.js)
- **Recommendation:**
  1. Run `npm audit` as part of the CI pipeline (PLAN Phase 3, `deploy.yml`)
  2. Enable GitHub Dependabot for automated security updates
  3. Consider `marked.js` alternatives with better security posture: `markdown-it` with explicit plugin control, or use DOMPurify's built-in HTML sanitization without a markdown library (render AI responses as plain text with manual formatting)
  4. Add `npm audit --audit-level=high` as a CI gate that blocks deployment on high/critical findings
- **Plan Impact:** Phase 3. Add `npm audit` step to `deploy.yml`. Enable Dependabot.

---

### SEC-11: Client-Side Data Privacy

- **Issue:** The application stores workplace data (workflow names, system names, persona descriptions) in localStorage. While the default data is generic, users will add real workplace information through the Input Studio. This data persists in the browser indefinitely and is accessible to any JavaScript running on the same origin.
- **Location:** SPEC Sections 2, 4, 9.4
- **Severity:** Low (portfolio project context)
- **Recommendation:**
  1. Add a privacy notice in the Input Studio or About section: "Data you enter is stored locally in your browser. It is not sent to any server (except AI analysis in Phase 5). Clear your browser data to remove it."
  2. The "Reset data" button (Section 5.5) serves as the deletion mechanism -- ensure it is clearly labeled
  3. Phase 4 data export (PLAN Step 4.6) gives users control over their data
  4. Do NOT add analytics or third-party scripts that could exfiltrate localStorage contents
- **Plan Impact:** Phase 4, Step 4.5 (About section). Add privacy notice text.

---

### SEC-12: window.confirm for Reset is Not a Security Control

- **Issue:** The reset flow (Section 5.5) uses `window.confirm()` for confirmation. This is fine for UX but is trivially bypassable by scripts. Since reset is a destructive action that deletes all user data, consider whether a more deliberate confirmation is warranted.
- **Location:** SPEC Section 5.5
- **Severity:** Informational
- **Recommendation:** For a portfolio project, `window.confirm()` is acceptable. If the app evolves, consider a custom modal with a typed confirmation (e.g., "Type RESET to confirm"). No change needed for current scope.
- **Plan Impact:** None.

---

## PART 2: ACCESSIBILITY AUDIT

### A11Y-01: Heatmap Uses Color as the Only Differentiator

- **Issue:** The heatmap (Section 3.6) uses a green-yellow-orange-red color scale to indicate friction levels. The legend uses colored squares with text labels, but the grid cells themselves rely solely on background color. Users with deuteranopia (red-green color blindness, ~8% of males) cannot distinguish green from red cells.
- **Location:** SPEC Section 3.6 (Cognitive Friction Heatmap), `frictionToColor()` function
- **Severity:** High
- **Recommendation:**
  1. Add a text label inside each heatmap cell showing the friction score (e.g., "0.85") or the category label ("High")
  2. Add a pattern overlay as a secondary indicator: hatching for high friction, solid for low
  3. Use a colorblind-safe palette. Replace the green/yellow/orange/red scale with a sequential single-hue palette (e.g., light blue to dark blue) or a diverging palette that works for all color vision types (e.g., blue-white-red, which is distinguishable even in grayscale)
  4. At minimum, add `title` attributes or `aria-label` to each cell: `aria-label="Management Escalations + SharePoint: High Friction (0.85)"`
- **Plan Impact:** Phase 4, Step 4.3. Add as a specific subtask under the accessibility pass.

---

### A11Y-02: Charts Have No Text Alternatives

- **Issue:** The radar chart and bubble chart (Section 3.7, Section 8) are rendered on `<canvas>` elements. Canvas content is completely invisible to screen readers. No `aria-label`, no fallback content, no text alternative is specified.
- **Location:** SPEC Section 3.7, Section 8.1, Section 8.2
- **Severity:** High
- **Recommendation:**
  1. Add `role="img"` and `aria-label` to each canvas element:
     ```html
     <canvas id="chart-radar" role="img"
             aria-label="Radar chart showing ontology readiness scores across 5 dimensions. Current maturity ranges from 30 to 85 percent. Target state ranges from 85 to 95 percent.">
     </canvas>
     ```
  2. Add a visually hidden `<table>` or `<dl>` inside each chart container that presents the same data in text form. Use `class="sr-only"` (Tailwind's screen-reader-only utility)
  3. Chart.js supports the `generateLabels` plugin for legend accessibility. Enable it.
  4. For the bubble chart, the tooltip callback already formats labels -- ensure these are accessible via keyboard focus (see A11Y-03)
- **Plan Impact:** Phase 4, Step 4.3. Add as a specific subtask.

---

### A11Y-03: No Keyboard Navigation for Interactive Elements

- **Issue:** Multiple interactive elements are specified without keyboard support:
  1. **Heatmap cells:** Rendered as `<div>` elements with click handlers. Not focusable. Cannot be activated via keyboard.
  2. **Triad node cards:** Rendered as `<div class="triad-item">` with click handlers. Not focusable. Not announced as interactive.
  3. **Chart.js canvases:** No keyboard interaction specified for tooltips or data point selection.
  4. **Simulation mode cards:** These ARE `<button>` elements (good), so they are keyboard-accessible.
  5. **Tab navigation in Input Studio:** These ARE `<button>` elements (good).
- **Location:** SPEC Section 3.4 (triad items), Section 3.6 (heatmap cells), Section 3.7 (charts)
- **Severity:** High
- **Recommendation:**
  1. **Heatmap cells:** Add `role="button"` and `tabindex="0"` to each cell. Add `keydown` handler for Enter and Space. Or better: render cells as `<button>` elements styled as grid cells.
  2. **Triad node cards:** Add `role="button"` and `tabindex="0"`. Add `keydown` handler. Consider `role="listbox"` + `role="option"` for the column container + items pattern.
  3. **Charts:** Add `tabindex="0"` to canvas containers. Chart.js does not natively support keyboard navigation. The text alternatives (A11Y-02) provide the accessible path; the charts themselves are decorative enhancements of that data.
  4. Add visible focus indicators (see A11Y-04).
- **Plan Impact:** Phase 4, Step 4.3. Major subtask.

---

### A11Y-04: No Visible Focus Indicators Specified

- **Issue:** The spec defines hover states for cards, buttons, and heatmap cells but specifies no focus styles. The global CSS includes `outline: none` on form inputs (Section 6.4, Form Inputs CSS). Removing the default outline without providing a replacement violates WCAG 2.4.7 (Focus Visible).
- **Location:** SPEC Section 6.4 (Form Inputs CSS: `outline: none`), Section 6.5 (Animations -- no focus styles)
- **Severity:** High
- **Recommendation:**
  1. Replace `outline: none` with a visible focus ring:
     ```css
     .form-input:focus {
       outline: 2px solid #4f46e5;
       outline-offset: 2px;
     }
     ```
  2. Use Tailwind's `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2` on all interactive elements. `focus-visible` ensures the ring appears for keyboard users but not mouse users.
  3. Add focus styles to `.mode-card`, `.triad-item`, `.heatmap-cell`, `.nav-btn`, and all `<button>` elements.
  4. Ensure focus ring contrast meets WCAG 2.4.11 (minimum 3:1 against adjacent colors). Indigo-600 (#4F46E5) on white (#FFFFFF) = 6.35:1 ratio. Passes.
- **Plan Impact:** Phase 4, Step 4.3. Apply globally via CSS.

---

### A11Y-05: Color Contrast Failures in the Specified Palette

- **Issue:** Several color combinations in the spec fail WCAG AA contrast requirements.

  | Foreground | Background | Contrast Ratio | Requirement | Result |
  |---|---|---|---|---|
  | Amber #F59E0B (text) | White #FFFFFF | 2.15:1 | 4.5:1 (normal text) | **FAIL** |
  | Amber #F59E0B (badge bg) | Amber-700 #B45309 (badge text) | ~3.2:1 | 4.5:1 (small text at `text-xs`) | **FAIL** |
  | Emerald #10B981 (text) | White #FFFFFF | 3.16:1 | 4.5:1 (normal text) | **FAIL** |
  | Emerald-700 #047857 (badge text) | Emerald-100 #D1FAE5 (badge bg) | 4.87:1 | 4.5:1 | Pass |
  | Indigo #4F46E5 (text) | White #FFFFFF | 6.35:1 | 4.5:1 | Pass |
  | Slate-400 #94A3B8 (text) | White #FFFFFF | 2.82:1 | 4.5:1 (normal text) | **FAIL** |
  | Slate-500 #64748B (text) | White #FFFFFF | 4.63:1 | 4.5:1 | Pass (barely) |
  | White #FFFFFF (text) | Emerald-500 #10B981 (button bg) | 3.16:1 | 4.5:1 (normal text) | **FAIL** |
  | White #FFFFFF (text) | Amber-500 #F59E0B (button bg) | 2.15:1 | 4.5:1 | **FAIL** |
  | Indigo-400 #818CF8 (text) | Slate-900 #0F172A (insight panel bg) | 5.69:1 | 4.5:1 | Pass |
  | Slate-400 #94A3B8 (text) | Slate-900 #0F172A (insight panel bg) | 4.19:1 | 4.5:1 | **FAIL** |
  | Emerald-400 #34D399 (text) | Slate-900 #0F172A (insight panel bg) | 6.78:1 | 4.5:1 | Pass |

- **Location:** SPEC Section 6.1 (Color Palette), Sections 3.4-3.8 (component usage), Section 4 (Input Studio buttons)
- **Severity:** High
- **Recommendation:**
  1. **Amber buttons (CTA "Add Workflow Node"):** Change from `bg-amber-500 text-white` to `bg-amber-600 text-white` (3.04:1, still fails) or `bg-amber-700 text-white` (4.87:1, passes for large text). Better: use `bg-indigo-600 text-white` for form submit buttons for consistency and contrast.
  2. **Emerald buttons ("Add System Node"):** Change from `bg-emerald-500 text-white` to `bg-emerald-700 text-white` (5.55:1, passes).
  3. **Slate-400 text:** Use `slate-500` (#64748B) minimum for any text. Reserve `slate-400` only for decorative or large text (18px+ bold).
  4. **Node counter badge:** The `text-emerald-600 bg-emerald-50` combination is 3.53:1. Change to `text-emerald-800 bg-emerald-50` for 7.03:1.
  5. **Insight panel labels:** Change `text-slate-400` to `text-slate-300` (#CBD5E1) on `bg-slate-900` for 9.73:1.
- **Plan Impact:** Phase 4, Step 4.3. Create a contrast-corrected palette variant. Apply across all components.

---

### A11Y-06: Dynamic Content Updates Not Announced to Screen Readers

- **Issue:** Several dynamic content changes occur without `aria-live` regions:
  1. **Node counter badge** (#node-counter) updates when nodes are added -- not announced
  2. **Insight panel** appears when a node is clicked -- not announced
  3. **Toast notifications** appear and disappear -- not announced
  4. **Friction modal** content populates on cell click -- not announced
  5. **Simulation mode change** causes visual changes to node cards -- not announced
- **Location:** SPEC Sections 3.4, 3.5, 3.6, 5.1, 5.2, Appendix A
- **Severity:** High
- **Recommendation:**
  1. Add `aria-live="polite"` to `#node-counter`:
     ```html
     <span id="node-counter" aria-live="polite" aria-atomic="true">14 Nodes Loaded</span>
     ```
  2. Add `aria-live="assertive"` to the toast container (or use `role="alert"`):
     ```javascript
     toast.setAttribute('role', 'alert');
     ```
  3. Add `aria-live="polite"` to `#insight-panel`. When it becomes visible, screen readers will announce the content.
  4. The friction modal should use `role="dialog"` and `aria-modal="true"` (see A11Y-07).
  5. When simulation mode changes, provide a status update: add a visually hidden status element with `aria-live="polite"` that announces "Switched to Deep Focus mode. 4 nodes highlighted, 4 nodes dimmed."
- **Plan Impact:** Phase 4, Step 4.3. Add ARIA live regions to spec.

---

### A11Y-07: Friction Modal Missing Dialog Semantics and Focus Trap

- **Issue:** The friction detail modal (Section 3.6) is implemented as a `<div>` with `class="hidden"`. It lacks:
  1. `role="dialog"` or the `<dialog>` element
  2. `aria-modal="true"`
  3. `aria-labelledby` pointing to the modal title
  4. Focus trap (Tab key should cycle within the modal, not escape to background content)
  5. Focus management (focus should move to the modal when it opens, return to the triggering cell when it closes)
  6. Escape key handler to close the modal
- **Location:** SPEC Section 3.6 (Friction Detail Modal)
- **Severity:** High
- **Recommendation:**
  1. Use the native `<dialog>` element or add proper ARIA:
     ```html
     <div id="friction-modal" role="dialog" aria-modal="true"
          aria-labelledby="friction-modal-title" class="hidden">
     ```
  2. Add focus trap: when modal is open, Tab cycles between the close button and the resolve button only
  3. On open: store the triggering element, move focus to the modal (or the close button)
  4. On close: return focus to the triggering heatmap cell
  5. Add `keydown` listener for Escape key to close the modal
  6. Add `aria-hidden="true"` to all background content when modal is open (or use `inert` attribute)
- **Plan Impact:** Phase 4, Step 4.3. Major subtask -- rewrite modal as accessible dialog.

---

### A11Y-08: Focus Management on View Switching is Unspecified

- **Issue:** When switching between Dashboard and Input Studio (Section 5.6), the spec says "Scroll to top of page" but does not specify where focus goes. A keyboard user switching views would have focus on the nav button, then the page scrolls, but focus remains on the button. The user must Tab through the entire header again to reach the new view content.
- **Location:** SPEC Section 5.6 (`showView()`)
- **Severity:** Medium
- **Recommendation:**
  1. After switching views, move focus to the first heading of the new view:
     - Dashboard: focus `#hero-section h2`
     - Input Studio: focus the "Ontology Input Studio" heading
  2. Use `element.focus({ preventScroll: false })` to combine focus and scroll
  3. Add `tabindex="-1"` to the heading elements so they can receive programmatic focus without being in the Tab order
- **Plan Impact:** Phase 4, Step 4.3. Add to view switching logic.

---

### A11Y-09: Form Labels Not Programmatically Associated

- **Issue:** The form labels in the Input Studio (Section 4.3-4.5) use `<label>` elements with text, but they are not associated with their inputs via `for`/`id` attributes. The spec shows:
  ```html
  <label class="block text-xs ...">Workflow Name</label>
  <input type="text" id="wf-name" ...>
  ```
  The `<label>` has no `for="wf-name"` attribute. This means clicking the label text does not focus the input, and screen readers may not announce the label when the input receives focus.
- **Location:** SPEC Sections 4.3, 4.4, 4.5 (all three form tabs)
- **Severity:** High
- **Recommendation:** Add `for` attributes to all labels:
  ```html
  <label for="wf-name" class="block text-xs ...">Workflow Name</label>
  <input type="text" id="wf-name" ...>
  ```
  Apply to every label/input pair across all three forms: `wf-name`, `wf-type`, `wf-description`, `wf-owner`, `wf-frequency`, `sys-name`, `sys-category`, `sys-description`, `usr-name`, `usr-state`, `usr-description`.
- **Plan Impact:** Phase 1 (fix in initial HTML structure). Zero effort increase.

---

### A11Y-10: Required Fields Not Indicated for Assistive Technology

- **Issue:** Some form fields have the `required` HTML attribute (e.g., `wf-name`, `sys-name`, `usr-name`), but there is no visual indication of required vs. optional fields. Screen readers will announce "required" due to the HTML attribute, but sighted users get no indicator. Additionally, no `aria-describedby` links error messages to their fields.
- **Location:** SPEC Sections 4.3-4.5 (forms), Section 5.4 (validation -- "show inline error message")
- **Severity:** Medium
- **Recommendation:**
  1. Add a visual required indicator: append `*` to required field labels or add "(required)" text
  2. Add `aria-required="true"` for any fields where the native `required` attribute is not used but the field is required by JS validation
  3. For inline error messages (Section 5.4, step 4d): create an error `<span>` with a unique ID and add `aria-describedby` pointing to it:
     ```html
     <input id="wf-name" aria-describedby="wf-name-error" ...>
     <span id="wf-name-error" class="hidden text-red-500 text-xs" role="alert"></span>
     ```
  4. Use `aria-invalid="true"` on fields that fail validation
- **Plan Impact:** Phase 4, Step 4.3. Add error message structure and ARIA attributes.

---

### A11Y-11: Animations Do Not Respect prefers-reduced-motion

- **Issue:** The spec defines multiple animations (Section 6.5): `fadeInUp` (0.8s), `hover:transform` (lift effects), `.triad-item` transitions (0.3s), heatmap cell hover scale, toast slide-in. None include a `prefers-reduced-motion` media query override. Users with vestibular disorders, motion sensitivity, or seizure conditions may be adversely affected.
- **Location:** SPEC Section 6.5 (Animations)
- **Severity:** Medium
- **Recommendation:** Add a global reduced-motion override in `style.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
  Or, more surgically, override each animation class:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .fade-in-up {
      animation: none;
      opacity: 1;
      transform: none;
    }
    .info-card:hover {
      transform: none;
    }
    .heatmap-cell:hover {
      transform: none;
    }
  }
  ```
- **Plan Impact:** Phase 4, Step 4.3. Add to `style.css`. Low effort.

---

### A11Y-12: Responsive Text and Zoom Support

- **Issue:** The spec uses Tailwind's `text-xs` (0.75rem / 12px) extensively for labels, badges, and descriptions. At 200% browser zoom, these elements would render at 24px (acceptable), but the grid layouts may break. The spec does not mention testing at 200% zoom or ensuring content does not overflow or get clipped.
- **Location:** SPEC Section 6.6 (Responsive Breakpoints), Section 6.3 (Typography)
- **Severity:** Medium
- **Recommendation:**
  1. Specify that all text sizes use `rem` units (Tailwind defaults to this -- confirmed)
  2. Test at 200% zoom and 400% zoom (WCAG 1.4.4 requires 200% without loss of content)
  3. Ensure `overflow-x-auto` is applied to the heatmap container (already specified) and any other horizontal layouts
  4. The three-column ontology explorer collapses to single-column on mobile (`grid-cols-1 md:grid-cols-3`) -- this handles zoom gracefully since zoom triggers mobile breakpoints
  5. Add `min-width: 320px` to the page body to define the minimum supported viewport
- **Plan Impact:** Phase 4, Steps 4.1 and 4.3. Add zoom testing to the responsive audit.

---

### A11Y-13: Input Studio Tab Panel Needs ARIA Tab Pattern

- **Issue:** The Input Studio tabs (Section 4.2) use `<button>` elements with click handlers to toggle content panels. The spec does not implement the ARIA tabs pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`). Without this, screen readers announce the tabs as generic buttons rather than a tab interface, and the expected keyboard behavior (arrow keys to switch tabs) is missing.
- **Location:** SPEC Section 4.2 (Tab Navigation)
- **Severity:** Medium
- **Recommendation:** Implement the WAI-ARIA Tabs pattern:
  ```html
  <div role="tablist" aria-label="Node type">
    <button role="tab" id="tab-btn-workflows" aria-selected="true"
            aria-controls="tab-workflows" class="studio-tab studio-tab-active ...">
      1. Workflows
    </button>
    <button role="tab" id="tab-btn-systems" aria-selected="false"
            aria-controls="tab-systems" class="studio-tab ...">
      2. Systems & Infra
    </button>
    <button role="tab" id="tab-btn-users" aria-selected="false"
            aria-controls="tab-users" class="studio-tab ...">
      3. Business Users
    </button>
  </div>
  <div role="tabpanel" id="tab-workflows" aria-labelledby="tab-btn-workflows">
    ...
  </div>
  ```
  Add keyboard handler: Left/Right arrow keys move between tabs. Home/End jump to first/last tab.
- **Plan Impact:** Phase 4, Step 4.3. Moderate effort -- restructure tab HTML and add keyboard handler.

---

### A11Y-14: Heatmap Legend Needs Accessible Structure

- **Issue:** The heatmap legend (Section 3.6) uses inline `<span>` elements with background colors. Screen readers see "Low Friction Moderate High Friction" as plain text without any association to the color swatches.
- **Location:** SPEC Section 3.6 (Legend markup)
- **Severity:** Low
- **Recommendation:** Wrap the legend in a `<dl>` (definition list) or use `aria-hidden="true"` on the color swatches since they are purely decorative alongside their text labels. The current approach is minimally functional since the text labels ARE present -- the color swatches just provide redundant visual information.
- **Plan Impact:** Phase 4, Step 4.3. Minimal change.

---

### A11Y-15: Triad Items Need Role and State Announcement

- **Issue:** The triad items (node cards) function as selectable buttons with toggle behavior (click to select, click again or click another to deselect). The `.active-context` CSS class changes the visual appearance but does not communicate selection state to assistive technology.
- **Location:** SPEC Sections 3.4, 5.2
- **Severity:** Medium
- **Recommendation:**
  1. Add `role="button"` and `tabindex="0"` to each `.triad-item`
  2. Add `aria-pressed="true"` when the item has `.active-context` class (selected)
  3. Or use `role="option"` within a `role="listbox"` container for each column, with `aria-selected="true"` for selected items
  4. When dimmed by simulation mode, add `aria-description="Dimmed in current simulation mode"` or equivalent contextual text
- **Plan Impact:** Phase 4, Step 4.3. Implement alongside A11Y-03.

---

## SUMMARY

### By Severity

| Severity | Security | Accessibility | Total |
|---|---|---|---|
| Critical | 0 | 0 | 0 |
| High | 2 | 7 | 9 |
| Medium | 4 | 5 | 9 |
| Low | 4 | 1 | 5 |
| Informational | 1 | 0 | 1 |
| **Total** | **11** | **13** | **24** |

Note: No critical findings because the spec already addresses the top two risks (XSS sanitization exists, API key removal is planned). The high-severity items are gaps in coverage or missing accessibility patterns that must be addressed before the app can be considered portfolio-quality.

### By Phase Impact

| Phase | Findings to Address |
|---|---|
| **Phase 1** | A11Y-09 (add `for` attributes to labels -- zero cost during initial HTML creation) |
| **Phase 2** | SEC-01 (upgrade sanitize approach), SEC-02 (safe AI response helper), SEC-03 (schema validation for localStorage), SEC-04 (user notification on storage failure), SEC-06 (reserved ID check), SEC-09 (add CSP meta tag) |
| **Phase 3** | SEC-10 (npm audit in CI, Dependabot), SEC-05 (localStorage key prefix) |
| **Phase 4** | A11Y-01 through A11Y-15 (entire accessibility pass), SEC-11 (privacy notice) |
| **Phase 5** | SEC-07 (rate limiting implementation), SEC-08 (DOMPurify configuration for marked.js) |

### Top 5 Priority Actions

1. **SEC-01 + SEC-09:** Adopt DOMPurify in Phase 2 (not Phase 5) and add CSP meta tag. These two controls together eliminate the XSS attack surface.
2. **A11Y-03 + A11Y-04:** Make all interactive elements keyboard-accessible with visible focus indicators. Without these, the app is unusable for keyboard-only users.
3. **A11Y-05:** Fix the 6 color contrast failures. Several text/background combinations fail WCAG AA. Straightforward color substitutions.
4. **A11Y-01:** Add text labels or patterns to heatmap cells. Color-only information excludes colorblind users from the core visualization.
5. **A11Y-07 + A11Y-09:** Fix the modal dialog pattern and form label associations. These are fundamental HTML semantics that cost almost nothing to implement correctly from the start.
