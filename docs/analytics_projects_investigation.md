# Analytics & Projects Cross-Workspace Investigation Workflow (PR-15)

## 1. Purpose

The IRIS Analytics workspace (`/analytics`) surfaces macro-level portfolio aggregations, statistical trajectories, sectoral dominance insights, and authentic schedule-extension risk distributions. The Projects workspace (`/projects`) serves as an evidence-backed Project Portfolio Investigation Directory allowing investigators to inspect individual project observations, history, and metadata.

PR-15 connects these workspaces into a seamless, evidence-grounded cross-workspace investigation workflow. Investigators can transition directly from aggregate patterns to the **compatible project population under the supported Projects filter contract**, without N+1 network overhead, without invented risk tiers, and with zero changes to backend serving contracts.

---

## 2. Core Workflow

```
┌────────────────────────────────────────────────────────┐
│               ANALYTICS WORKSPACE (/analytics)         │
│  - Sectors / Agencies / Geography / Trends / Progress │
│  - Production Schedule-Extension Risk Distributions    │
└──────────────────────────┬─────────────────────────────┘
                           │ User clicks "INVESTIGATE PROJECTS"
                           │ (URL search params + navigation state)
                           ▼
┌────────────────────────────────────────────────────────┐
│               PROJECTS WORKSPACE (/projects)           │
│  - Context Banner: discloses transferred & omitted     │
│  - Compatible project population under Projects filter │
│  - Direct "← BACK TO ANALYTICS" return navigation      │
└────────────────────────────────────────────────────────┘
```

1. **Discovery in Analytics**: An investigator identifies an interesting pattern (e.g. high expenditure in *Road Transport and Highways*, an agency concentration in *NHAI*, or an evaluation month *2026-07*).
2. **Contextual Investigation Trigger**: The investigator activates an `INVESTIGATE PROJECTS` action button or link directly on that aggregate dimension.
3. **Deterministic Navigation**: The application navigates to `/projects` with only authoritative, supported filter parameters encoded in the URL query string (`?sector=...`, `?agency=...`, etc.) and the rich investigation context passed via React Router navigation state.
4. **Context Banner & Population Disclosure**: In `/projects`, a dedicated `ProjectsContextBanner` confirms the active investigation context, lists all transferred filters, explicitly discloses any omitted or non-transferable filters (such as multi-month time ranges or risk regimes), and reminds the user that the view displays the compatible project population under the supported Projects filter contract.
5. **Lossless Return**: Clicking `← BACK TO ANALYTICS` in the banner returns the investigator to the exact originating Analytics view, restoring all filter selections and scroll context.

---

## 3. Truthful Population Semantics

### Approved Language
- `"compatible project population under the supported Projects filter contract"`
- `"Projects matching the transferable Analytics filters"`

### Prohibited Claims
- **Do NOT claim** that Analytics → Projects navigation produces the *"exact project population represented by the Analytics evidence"* unless denominator and filter equivalence is explicitly established by backend contracts.
- **Do NOT claim** that the resulting Projects population is identical to an Analytics KPI denominator merely because sector, agency, or state filters match.

### Rationale
Analytics KPIs often apply specialized analytical criteria (such as non-null progress filtering, latest-observation-per-project deduplication, or serving model assessment criteria). The Projects API returns project observation records matching standard database filter criteria. While the filters match, the row counts or specific observation sets may differ based on missingness, reporting frequency, and time horizon. Disclosing this distinction protects institutional credibility and audits.

---

## 4. Filter Mapping Matrix

| Analytics Filter / Dimension | Transferable? | Target `/projects` Parameter | Semantic Handling / Constraints |
| :--- | :--- | :--- | :--- |
| `sector` | **Yes** | `sector` | Exact match string |
| `agency` | **Yes** | `agency` | Exact match string |
| `state` | **Yes** | `state` | Exact match string |
| `ministry` | **Yes** | `ministry` | Exact match string |
| `project_code` | **Yes** | `project_code` | Exact 6-digit or legacy identifier |
| `report_month` (explicit row/point) | **Yes** | `report_month` | Exact `YYYY-MM` string |
| `from_month` === `to_month` (single) | **Yes** | `report_month` | Single exact month transfers |
| `from_month` !== `to_month` (multi) | **No** | *Omitted* | Multi-month ranges are **NEVER** collapsed into a single month. Disclosed in context banner. |
| `district` | **No** | *Omitted* | Structurally omitted from flash reports; not supported by Projects API. |
| `regime` (risk model regime) | **No** | *Omitted* | Risk regime is an analytical ML model scope; Projects API does not filter by regime. Disclosed in banner. |
| `model_id` | **No** | *Omitted* | Not supported by Projects API. |
| `risk_probability` | **No** | *Omitted* | Continuous float; Projects API does not filter by raw score. |
| `cost_min` / `cost_max` | **No** | *Omitted* | Not supported on standard `/projects` endpoint. |

---

## 5. Single-Month vs. Multi-Month Handling

The `/projects` API accepts a single `report_month` parameter, representing a discrete reporting month.
- **Single-Month Scope**: When the originating Analytics view has `from_month === to_month`, or when the user investigates a specific monthly trend point (e.g. from `AnalyticsTrends` or `AnalyticsRisk`), the exact `report_month` is transferred to `/projects?report_month=YYYY-MM`.
- **Multi-Month Range**: When `from_month !== to_month` (e.g. `2024-01` to `2026-07`), `report_month` is **omitted** from the `/projects` URL. The system **never** arbitrarily collapses the range into the latest or earliest month. Instead, the resulting Projects view displays all historical observations matching the remaining transferable filters (sector, agency, state), and the `ProjectsContextBanner` explicitly informs the investigator:
  > *"Time range (2024-01 → 2026-07): was not collapsed into a single project month. Projects view reflects observations across all reporting months matching the transferable filters."*

---

## 6. Risk Regime Navigation Rules

Under strict IRIS governance rules:
1. **Regime and Model Scopes are Not Transferable**: The Projects API cannot represent model regime or model ID scopes.
2. **Action Suppression on Regime Rows**: In `AnalyticsRisk`, rows in the **Governed Regime & Model Breakdown Table** (e.g., breakdown by `regime` and `model_id`) **suppress** the `INVESTIGATE PROJECTS` action. No action button is exposed on those rows.
3. **No Invented Risk Tiers**: The system strictly refuses to fabricate or translate continuous risk probabilities into heuristic tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) or arbitrary percentiles (`TOP-10%`, `TOP-20%`). Such parameters are never injected into URLs or search queries.
4. **Honest Evaluation Month Navigation**: Monthly trajectory points in `AnalyticsRisk` permit investigation of the compatible project population for that specific evaluation month, but do not claim to preserve model-specific regime boundaries.

---

## 7. Zero N+1 Requests Architecture

Cross-workspace navigation adheres strictly to the zero-N+1 query policy:
- The target URL `/projects?...` loads only the standard project list query via `fetchProjects(queryPayload)`.
- Project table rows do **not** trigger individual risk API calls (`/api/risk/project/...`). Risk intelligence is loaded lazily and on-demand only when an investigator opens the `ProjectInspectionDrawer` or navigates to `/projects/:code`.
- Telemetry totals and options are served from existing cached metadata (`/api/projects/filter-options`, `/api/system/dataset-info`).

---

## 8. Canonical Routes & Forbidden Endpoints

- **Canonical Route**: All project investigation navigation leads strictly to `/projects?...`.
- **Forbidden Route**: `/intelligence/projects` or `/analytics/projects` must **never** be generated or routed to. All project portfolio investigations take place within the canonical `/projects` workspace.

---

## 9. Prohibitions & Anti-Patterns

1. **No Silent Drops**: Never drop a non-transferable filter (like `regime` or time range) without explicitly disclosing the omission in the `ProjectsContextBanner`.
2. **No Invented Contracts**: Do not add unsupported query parameters (e.g. `regime`, `from_month`, `risk_tier`) to the Projects URL.
3. **No Fabricated Predictions**: Never infer or compute risk scores, progress metrics, or status classifications on the client.
4. **No Destructive Dismissal**: Dismissing the `ProjectsContextBanner` in `/projects` hides the banner for the session without clearing the active URL filters.

---

## 10. Investigation Examples

### Example A: Investigating a Leading Sector
1. Investigator navigates to `/analytics`, sets `from_month=2026-07` and `to_month=2026-07`.
2. Under **03. SECTORS**, the investigator observes *Road Transport and Highways* with 100 projects.
3. Clicks **INVESTIGATE PROJECTS** on that row.
4. Browser navigates to:
   ```
   /projects?report_month=2026-07&sector=Road+Transport+and+Highways
   ```
5. `/projects` displays the breadcrumb:
   `IRIS / ANALYTICS / PROJECTS INVESTIGATION`
6. `ProjectsContextBanner` displays:
   - Transferred Pills: `SECTOR: Road Transport and Highways`, `REPORT_MONTH: 2026-07`
   - Population Statement: *"Projects view reflects the compatible project population under the supported Projects filter contract."*
   - Return Button: `← BACK TO ANALYTICS` pointing to `/analytics?from_month=2026-07&to_month=2026-07`.

### Example B: Investigating a Multi-Month Trend Point
1. In `/analytics`, the active date range is `2024-01` to `2026-07` with `agency=NHAI`.
2. Under **01. REVENUE & OBSERVATION TRENDS**, the investigator switches to table view and clicks **INVESTIGATE MONTH** for `2025-05`.
3. Browser navigates to:
   ```
   /projects?report_month=2025-05&agency=NHAI
   ```
4. Row-level `report_month=2025-05` cleanly overrides the global multi-month range.
5. Investigator inspects projects for NHAI in that specific month and returns to Analytics with one click.
