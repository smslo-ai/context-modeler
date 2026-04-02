# Workplace Mapping

Comprehensive inventory of Shane's workplace dimensions extracted from the Gemini Canvas prototyping session (Jan-Mar 2026). This is the **initial extract** -- Shane will iterate by adding more workflows, systems, teams, and swim lanes over time.

---

## Dimension 1: Business Workflows

| ID | Workflow | Type | Frequency | Owner | Key Insight |
|----|----------|------|-----------|-------|-------------|
| wf-mgmt-escalations | Management Escalations | Critical | Ad-hoc | Director / VP | Requires real-time data, but primary systems (SharePoint) are retrieval-based. Decision latency increases when users navigate folder structures during a crisis. |
| wf-admin-deadlines | Admin Deadlines | Routine | Weekly | Operations Manager | Lowest friction with existing trackers (Jira). Prime candidate for full AI agent handoff -- if friction is low, ambiguity is low. |
| wf-strategic-planning | Strategic Planning | Strategic | Quarterly | Executive Team | "Orphaned" -- fewest system connections of any workflow. Lives in heads, whiteboards, and lost notepads. If it isn't in the graph, the Context Engine cannot support it. |
| wf-system-maintenance | System Maintenance | Operational | Monthly | IT Lead | Well-mapped to tracking tools. Standard infrastructure ops with clear ownership. |
| wf-cross-team-sync | Cross-Team Sync | Routine | Weekly | Project Manager | Heavily dependent on communication hubs. The Bridge Builder persona thrives here. |

### Workflow Gaps (to fill in future iterations)

- Financial reporting workflows (Q3/Q4 cycles, cost basis reconciliation)
- Tax operations deadlines and compliance workflows
- AI tool evaluation and integration workflows (the "AI rush" context)
- Vendor management and procurement workflows
- Onboarding/offboarding processes

---

## Dimension 2: Systems & Infrastructure

| ID | System | Category | Key Friction Points |
|----|--------|----------|-------------------|
| sys-slack-teams | Comm Hub (Slack/Teams) | Comms | **Overloaded hub.** Highest connectivity to all workflows. All context -- regardless of type -- is forced through a single, noisy pipe. Creates "Semantic Noise" that degrades AI retrieval accuracy (RAG). |
| sys-sharepoint | Shared Sites (SharePoint/Drive) | Storage | **Retrieval-based, not push-based.** Information exists but the retrieval path is high-resistance. Browsing folder structures during escalations wastes critical minutes. |
| sys-jira | Project Tracker (Jira/Asana) | Tracking | Well-matched for routine tasks. Over-structured for ad-hoc work. Good automation target. |
| sys-exec-dashboard | Executive Dashboard | Reporting | Well-matched for strategic work and KPI visualization. Low friction with planning workflows. |
| sys-ai-engine | AI Context Engine | Intelligence | Aspirational -- this is the system the app itself models. Represents the intelligent context routing layer. |

### Systems Gaps (to fill in future iterations)

- Specific Power BI reports and dashboards
- Specific SharePoint Lists (not just "SharePoint" generically)
- Email (Outlook/Gmail) as a workflow system
- Calendar as a context signal source
- Excel/Google Sheets for financial modeling
- Internal wikis or knowledge bases
- CI/CD and deployment tools

---

## Dimension 3: User Personas / Behavioral States

| ID | Persona | State | Cognitive Load | Best Mode | Description |
|----|---------|-------|---------------|-----------|-------------|
| usr-firefighter | Reactive Firefighter | High Load | Severe context switching | Morning Triage | Thrives in high-volume, small-task environments. Rapid switching is the feature, not the bug. |
| usr-deep-focus | Deep Focus Architect | Flow | Sustained silence needed | Deep Focus | Attempting architectural work during Triage mode results in ~40% efficiency loss due to context fragmentation. |
| usr-process-admin | Process Admin | Routine | Methodical queue clearing | Any structured mode | Best suited for automation handoff. Low-value tasks with low friction. |
| usr-bridge-builder | Bridge Builder | Social | Connecting teams | Cross-Team Sync | Communication hub dependency. The human routing layer. |

### Persona Gaps (to fill in future iterations)

- "Travel" or "External Client Facing" state
- "Onboarding" state (learning new systems)
- "Crisis" state (distinct from Firefighting -- longer duration, higher stakes)
- Manager-specific personas (people management vs. process management)

---

## Friction Analysis

### Critical Mismatches (friction >= 0.8)

| Workflow | System | Friction | Why |
|----------|--------|----------|-----|
| Strategic Planning | Slack/Teams | 0.90 | Deep work requires prolonged focus and low-latency access to static knowledge. Communication hubs are interrupt-driven, ephemeral, and high-noise. The Deep Focus Architect persona is constantly shifted into Reactive Firefighter state. |
| Mgmt Escalations | SharePoint | 0.85 | Escalations require immediate, real-time access to decision-critical data. SharePoint operates on a browse-and-retrieve model, not push-based. |

### Moderate Mismatches (friction 0.5-0.79)

| Workflow | System | Friction | Why |
|----------|--------|----------|-----|
| Strategic Planning | Jira | 0.70 | Sprint-based tracking doesn't map to quarterly strategic cadence. |
| System Maintenance | Exec Dashboard | 0.65 | Operational details don't belong in executive summaries. |
| System Maintenance | Slack/Teams | 0.55 | Maintenance updates in real-time chat create noise for non-ops teams. |

### Flow States (friction < 0.3)

| Workflow | System | Friction | Why |
|----------|--------|----------|-----|
| Admin Deadlines | Jira | 0.15 | Perfect match: structured, ticket-based system for recurring compliance tasks. |
| Strategic Planning | AI Engine | 0.15 | Intelligent routing supports deep work by design. |
| Cross-Team Sync | Slack/Teams | 0.20 | Communication hub is the natural home for cross-functional alignment. |

---

## Simulation Mode Analysis

### Morning Triage Mode
- **Winner:** Reactive Firefighter -- high volume of small tasks matches high-speed/low-depth environment
- **Loser:** Deep Focus Architect -- attempting architectural work during Triage results in severe efficiency loss
- **Active nodes:** Escalations, Admin Deadlines, Slack/Teams, Firefighter persona
- **Dimmed:** Strategic Planning, Deep Focus persona

### Deep Focus Mode
- **Winner:** Strategic Planning -- when the Context Engine suppresses notifications, the Architect can sustain flow
- **Risk:** Missed escalations if the filter is too aggressive. Needs "Context Gating" -- only metadata-tagged "Critical" items break the focus barrier.
- **Active nodes:** Strategic Planning, AI Engine, Exec Dashboard, Deep Focus persona
- **Dimmed:** Slack/Teams, Escalations, Firefighter, Bridge Builder

### Firefighting Mode
- **Winner:** Escalation handling -- all resources directed to crisis resolution
- **Loser:** Everything else -- routine and strategic work fully suppressed
- **Active nodes:** Escalations, Slack/Teams, Jira, Firefighter persona
- **Dimmed:** Admin Deadlines, Strategic Planning, Deep Focus, Process Admin

---

## 5 Implementation Actions (from Gemini analysis)

1. **Context Zoning** -- Stop treating all apps as multi-purpose. Configure the Context Engine to actively segregate tasks. Create a "Strategy Mode" that auto-mutes all channels except Critical Escalations.

2. **Push Protocol for Escalations** -- Reverse data flow. Instead of users searching for crisis data, build a workflow trigger that pushes a "Crisis Context Pack" into the Communication Hub the moment an escalation is flagged.

3. **Automate the Green Zone** -- Admin Deadlines + Jira has low friction and low ambiguity. Hand these tasks to AI agents entirely, freeing the Process Admin persona for higher-value work.

4. **Persona-Based UI Toggles** -- When a user enters Deep Focus mode (signaled by calendar or manual toggle), the dashboard should hide the Ticket Queue and expand Long-term Metrics view.

5. **Audit Orphaned Workflows** -- Strategic Planning has few system connections. Explicitly map it to a system of record (even a specific Notion page). If it isn't in the graph, the Context Engine cannot support it.

---

## Iteration Notes

This mapping is based on the initial Gemini Canvas session. Shane will expand it with:
- Additional workflows from his financial ops responsibilities
- Specific system instances (named Power BI reports, SharePoint lists, etc.)
- Team structures and reporting lines
- Swim lanes per business process
