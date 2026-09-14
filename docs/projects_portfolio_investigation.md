# Project Portfolio Investigation Workspace (PR-14)

## Overview & Mission

PR-14 upgrades the `/projects` workspace from a basic project listing into an institutional, evidence-backed **Project Portfolio Investigation** workspace. It bridges the authoritative project-month infrastructure observations from MoSPI Flash Reports with operational risk intelligence, longitudinal project analysis, and taxonomy discovery—without introducing any backend schema changes, client-side risk recomputation, or synthetic classifications.

---

## Architectural Architecture

```text
ProjectsPage
 ├── ProjectsHeader (Telemetry strip, breadcrumbs, operation badges)
 ├── ProjectsPortfolioSummary (Portfolio observation volume vs. risk evaluation coverage)
 ├── ProjectSearch (URL-synchronized taxonomy filters & search with conditional ministry)
 ├── ProjectsInvestigationTable (Accessible 11-column table with deterministic sorting & row actions)
 │    ├── Project identity (Code & Name, link to /projects/{code})
 │    ├── Sector, Agency, State
 │    ├── Latest observed month (report_month)
 │    ├── Authentic financial values (Original Cost, Revised Cost, Cumulative Expenditure)
 │    ├── Physical progress (non-imputed percentage with authentic progress bar)
 │    └── Action buttons (INSPECT drawer, DETAILS link, RISK INTEL link)
 ├── ProjectInspectionDrawer (Deep inspection drawer with single-project risk intelligence query)
 │    ├── Identity & taxonomy summary
 │    ├── Latest snapshot metrics (authentic non-recomputed financials & progress)
 │    ├── Schedule timeline (Approval, Original Completion, Revised Completion)
 │    ├── Risk intelligence evidence:
 │    │    ├── Served target: target_effective_schedule_ext_3m
 │    │    ├── Calibrated risk probability vs. raw model probability
 │    │    ├── Dynamic evaluation regime (LEGACY / MODERN) & model ID
 │    │    ├── Recent factual changes (progress delta, expenditure delta, cost revision delta)
 │    │    ├── Truthful notice if unassessed: "Risk evaluation unavailable for this project."
 │    │    └── Unserved specification domains disclosure (cost_overrun, progress_stagnation)
 │    ├── Canonical source provenance
 │    └── Deep navigation actions (/projects/{code} and /intelligence?project={code})
 └── ProjectsEvidenceAndLimitations (7 explicit methodological boundaries)
```

---

## 4 Review Corrections Contract Adherence

### 1. Project Query Contract Verification
- **Authoritative Backend Parameters**: The backend `list_projects` endpoint accepts:
  `page`, `page_size`, `project_code`, `report_month`, `sector`, `state`, `agency`, `ministry`, `search`, `sort_by`, `sort_order`.
- **URL Single Source of Truth**: The workspace synchronizes filters, sorting, and pagination via `useSearchParams()`. When parameters update, only supported parameters are committed to the URL and sent to the backend.
- **Deterministic Sorting**: Sorting operates over authoritative database fields (`report_month`, `project_name`, `project_code`, `original_cost`, `revised_cost`, `cumulative_expenditure`, `physical_progress`). No client-side artificial ranking or fake server pagination contracts are introduced.

### 2. Project Table Risk Contract (Zero N+1 Waterfalls)
- **Constraint**: `ProjectSummaryItem` does not contain risk fields.
- **Enforcement**: The `ProjectsInvestigationTable` does **NOT** query risk intelligence for rows in the table. There is strictly zero N+1 network waterfall.
- **Actions**: Each row renders three explicit actions:
  1. `INSPECT`: Opens `ProjectInspectionDrawer`, which initiates a single query to `/projects/{code}/risk-intelligence` for the selected project only.
  2. `DETAILS`: Direct canonical link to `/projects/{code}`.
  3. `RISK INTEL`: Direct canonical link to `/intelligence?project={code}`.

### 3. Ministry Filter Contract
- **Constraint**: Ministry taxonomy is present in `FilterOptionsResponse` only when populated by the backend.
- **Enforcement**: The `ministry` `<select>` in `ProjectSearch` is rendered conditionally:
  `{options?.ministries && options.ministries.length > 0 && (...) }`
- If ministries are absent or empty, the select element is completely omitted from the DOM.
- No client-side ministry derivation or taxonomy fabrication is performed.

### 4. Financial Observation Semantics
- **Constraint**: Financial values must reflect authoritative backend observation semantics directly.
- **Enforcement**: `original_cost`, `revised_cost`, `cumulative_expenditure`, `physical_progress`, and `report_month` are rendered directly as returned from `ProjectSummaryItem`.
- The frontend does not attempt to recompute "latest" observation in the browser.
- **Null Semantics**: Missing values are rendered as `—`, never `0`, `₹0`, or `0%`.

---

## 7 Explicit Methodological Boundaries

The workspace renders a visible disclosure card (`ProjectsEvidenceAndLimitations`) documenting:

1. **Observational Non-Causal Telemetry**: Observations represent historical self-reported submissions from MoSPI Flash Reports. Observed delays and cost revisions are empirical reporting events, not causal blame.
2. **Observation Scope vs. Risk Evaluation Coverage**: Portfolio discovery covers all historical monthly Flash Report records (64,000+), while active operational risk assessment is evaluated strictly on the latest locked cohort meeting feature completeness requirements (4,000+). Denominators remain separate.
3. **Single Served Machine Learning Target**: Only `target_effective_schedule_ext_3m` (3-month schedule extension risk) is served. Probabilities represent calibrated likelihood of extension beyond 90 days.
4. **Unserved Specification Domains**: Cost overrun and progress stagnation models exist only in technical specification and are NOT operationally served. No synthetic cost risk scores or composite health indexes are fabricated.
5. **Non-Imputation of Missing Observations**: Empty source values are strictly preserved as unobserved (`—`). Unreported physical progress is never treated as 0%, and unassessed projects display a truthful notice.
6. **Structural District Omission**: Flash Reports report state-level jurisdiction only. No sub-state or district taxonomy is fabricated or inferred.
7. **Deterministic Column Sorting**: Sorting operates deterministically on database columns without inventing proprietary urgency scores or risk bands.

---

## Prohibited Terminology & Governance Safeguards

The workspace strictly enforces the complete absence of:
- Risk tiers: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- Quantile/ranking classifications: `TOP 5%`, `TOP 10%`, `TOP 20%`
- Composite scores: `AI SCORE`, `WARNING SCORE`, `HEALTH SCORE`
- Fabricated risk: Unassessed projects never receive `0%` or synthetic probabilities.
- Forbidden route: The destination `/intelligence/projects` is strictly rejected; navigation routes are `/projects/{code}` and `/intelligence?project={code}`.

---

## Verification & Test Suite

### Automated Test Coverage
The PR-14 test suite in `frontend/src/test/components/projects/ProjectsPortfolioInvestigation.test.tsx` covers:
- Review Correction 1: URL search params synchronization and query contract verification.
- Review Correction 2 (Test A): Verification of zero N+1 risk intelligence queries during multi-project table rendering.
- Review Correction 2: Verification of single-project risk intelligence query in drawer.
- Review Correction 3 (Test B): Conditional rendering and omission of ministry filter when absent from contract options.
- Review Correction 4 (Test D): Direct rendering of financial fields without browser recomputation.
- Review Correction 4: Non-imputation of null financials and null progress as `—`.
- Fixture A: Modern project with authentic progress bar and financial fields.
- Fixture B: Legacy project identifier (`N12345678`) and legacy regime rendering.
- Fixture C: Missing physical progress rendering as `—` with empty track.
- Fixture D: All null financials and null progress rendering as `—`.
- Fixture E: Risk-unassessed project displaying truthful `"Risk evaluation unavailable for this project."` notice without fake 0%.
- Fixture F: Explicit disclosure of `cost_overrun` and `progress_stagnation` as unserved specification domains.
- Fixture G: Distinct calibrated probability vs. raw model probability display.
- Prohibited labels assertion: Zero instances of LOW/MEDIUM/HIGH/CRITICAL or AI/WARNING/HEALTH scores.
- Canonical navigation routes: `/projects/{projectCode}` and `/intelligence?project={projectCode}` verified; rejection of `/intelligence/projects`.
- Interactive sorting toggles and URL parameter synchronization.
- Filter reset and scope pill clearing.
- Error banner with retry button.
- Empty search results state.
- Keyboard navigation: Enter on row navigates to project detail; Escape closes inspection drawer.
- Structural omission: Absence of district dropdown in search.
- Loading skeleton in table.
- 7 methodological caveats in evidence disclosures.
