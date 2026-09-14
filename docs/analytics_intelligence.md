# Analytics Intelligence & Decision Support

## 1. Executive Summary & Purpose

PR-13 introduces the **Analytics Intelligence & Decision Support** layer to the IRIS Portfolio Workspace (`/analytics`).

In institutional public-infrastructure monitoring, decision support does **not** mean generating synthetic narratives with an opaque LLM, manufacturing speculative risk classifications, or creating composite "warning scores." Rather, it provides **contract-faithful, deterministic synthesis of authoritative backend aggregations** to guide executive decision-makers:

1. **What chronological changes occurred** across verified boundary observation months?
2. **Where are public commitments and expenditures concentrated** across sectors, agencies, and states?
3. **What are the true financial and physical-progress indicators**, respecting filter-scoped latest-observation semantics and non-imputation rules?
4. **What does the served machine-learning schedule-extension risk model show**, and how are continuous probabilities distributed across active project populations?
5. **What intelligence is unavailable** (e.g. unserved ML targets, structural district omission)?
6. **What concrete investigative actions should an analyst take next**, backed by corroborated project records?

---

## 2. Authoritative Data Sources & Contracts Reused

The Analytics Intelligence workspace is built entirely upon the authoritative, locked backend contracts established in PR-09 and PR-05/11. No new backend endpoints, schema modifications, or client-side recalculations were introduced.

| Endpoint | Contract Schema | Reused Fields & Decision Support Semantics |
| :--- | :--- | :--- |
| `GET /api/v1/analytics/overview` | `OverviewResponse` | Unique project counts, observation volumes, observation coverage window (`earliest_observation_month` → `latest_observation_month`), missingness audits. |
| `GET /api/v1/analytics/trends` | `TrendsResponse` | Chronological `items` strictly for observed months. Interprets boundary movements for expenditure, physical progress, volume, and mean risk probability without synthetic interpolation. |
| `GET /api/v1/analytics/geography` | `GeographyResponse` | State-level project and expenditure distribution. Discloses structural district omission (`district_dimension_status: UNAVAILABLE`). |
| `GET /api/v1/analytics/sectors` | `SectorsResponse` | Sector project counts, cumulative expenditure, and deterministic ranking. |
| `GET /api/v1/analytics/agencies` | `AgenciesResponse` | Executing agency project counts and cumulative expenditure. Deterministically ranked by `total_cumulative_expenditure`. |
| `GET /api/v1/analytics/financials` | `FinancialsResponse` | Filter-scoped latest qualifying observation per distinct project. Cost revisions, total escalation (₹ Cr), expenditure-to-revised-cost ratio. |
| `GET /api/v1/analytics/progress` | `ProgressResponse` | Non-imputed progress quantiles (Min, P25, Median, P75, P90, Max, Mean) and reporting rate. Missing progress is excluded from the denominator. |
| `GET /api/v1/analytics/risk` | `RiskAnalyticsResponse` | Serving population boundaries (`evaluation_earliest_month` → `evaluation_latest_month`), calibrated vs raw probability distributions, dynamic `regime_breakdown`, and `unserved_targets`. |

---

## 3. URL-Synchronized Filter Semantics & Scope Isolation

PR-13 strictly preserves the shared URL query filter architecture established in PR-10:

```text
Chart / Component Interaction (Click Sector, State, Agency, or Select Filters)
                                   │
                                   ▼
                useAnalyticsFilters (URL Query State)
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
             globalFilters                    riskFilters
      (from/to, state, sector,           (globalFilters + regime)
        agency, project_code)                      │
                   │                               ▼
                   ▼                         /analytics/risk
         /analytics/{overview,trends,
         geography,sectors,agencies,
         financials,progress}
                   │                               │
                   └───────────────┬───────────────┘
                                   ▼
                         TanStack Query Cache
                                   │
                                   ▼
                 Analytics Intelligence Workspace
      (Summary, Trends, Concentration, Financials, Risk, Limitations)
```

### Parameter Scopes & Guardrails
- `from_month` & `to_month`: Validated `YYYY-MM` cadence bounds applied globally across all endpoints.
- `state`, `sector`, `agency`, `project_code`: Canonical, trimmed parameters applied across all analytics endpoints.
- `regime`: **Risk-specific parameter**. Strictly isolated to `/analytics/risk`. It is never passed to non-risk endpoints (`overview`, `trends`, `financials`, `progress`, etc.).

---

## 4. Observation Coverage vs. Risk Evaluation Coverage

A core principle of IRIS is that **portfolio observation coverage and machine-learning risk evaluation coverage represent independent populations with different cadences**:

- **Portfolio Observation Scope**: Encompasses all monthly project records submitted via MoSPI Flash Reports (e.g. `2023-01 → 2026-07`, 64,608 observations across 4,738 unique projects).
- **Risk Evaluation Scope**: Encompasses only projects meeting strict feature qualification and completeness standards evaluated under locked operational serving models (e.g. `2023-07 → 2026-04`, 48,500 observations across 4,120 assessed projects).

### Denominator Safeguards
The UI refuses to compute artificial cross-population metrics such as `"Risk Coverage %"` (`assessed_projects / monitored_projects`) because the denominator definitions and qualifying criteria differ. Each scope is displayed in its own dedicated audit card.

---

## 5. Interpretation Rules & Contract Verification (Correction 1)

All text generated by the interpretation components is **deterministic UI rendering** based strictly on values present in the API response:

1. **Trend Boundary Delta Interpretation**:
   - Compares the first (`items[0]`) and last (`items[items.length - 1]`) chronological observations.
   - Evaluates exact contract fields: `total_cumulative_expenditure`, `average_physical_progress`, `observation_count`, `average_risk_probability`.
   - Never interpolates unobserved intermediate months or zero-fills missing periods.
2. **Single-Observation Safeguard**:
   - When `items.length === 1`, the UI renders:
     > *"Single observation available for report month YYYY-MM. Insufficient observations to establish a trend."*
   - Multi-point delta comparisons are completely suppressed.
3. **Empty State Safeguard**:
   - When `items.length === 0`, renders: *"No monthly observation points are available within the active filter scope."*

---

## 6. Concentration Denominator Rules (Correction 2)

To prevent fabricated proportions or confusing numerators with mismatched denominators:

1. **Provably Compatible Denominators Only**:
   - A portfolio share percentage is computed **only** when the sum of sector or state project counts provably matches the `OverviewResponse.unique_project_count` under the active filter scope.
2. **Incompatible Denominator Behavior**:
   - When denominators are not guaranteed to describe the exact same population, the UI **suppresses percentage shares** and renders:
     > *"Portfolio Share: Exact count only (no compatible portfolio denominator)"*
   - The exact returned integer count (e.g. `200 projects`) is displayed without distortion.
3. **Cumulative Expenditure Concentration**:
   - Uses the exact returned `total_cumulative_expenditure` field without substituting latest expenditure or other financial metrics.
4. **Deterministic Ranking**:
   - Entities are labeled `#1 SECTOR` or `#1 EXPENDITURE` strictly based on backend-sorted ordering or deterministic descending sort on verified numeric columns. Subjective labels like `"dominant"` or `"critical"` are prohibited.

---

## 7. Dynamic Risk Model & Regime Presentation (Correction 3)

In accordance with user corrections, **regime and model identifiers are never hard-coded** as constants (e.g. `"LEGACY"` or `"MODERN"`):

- Active regimes and models are mapped dynamically from `riskData.regime_breakdown`.
- Displays exact returned `regime` name, `model_id`, `unique_project_count`, `observation_count`, and `calibration_active_count`.
- Clicking a regime badge filters the risk intelligence view via `riskFilters.regime`.
- If no regime breakdown is returned, an explicit unavailable state is rendered.

---

## 8. Single Served Target & Unserved ML Domains

The only production machine-learning model served in IRIS is:

- **Target Identifier**: `target_effective_schedule_ext_3m`
- **Domain**: Production Schedule-Extension Risk
- **Horizon**: 3 Months forward
- **Interpretation**: Model-estimated probability of effective schedule extension.

### Explicit Unserved Disclosures
- `cost_overrun`: **UNSERVED / SPECIFICATION ONLY**
- `progress_stagnation`: **UNSERVED / SPECIFICATION ONLY**

The UI prominently discloses that cost overrun and physical progress stagnation are unserved target domains, preventing false assumptions regarding unsupported predictive capabilities.

---

## 9. Continuous Probability Semantics

Probabilities are presented with strict separation of calibrated and raw model outputs:

| Metric | Label | Semantics |
| :--- | :--- | :--- |
| `calibrated_risk_distribution` | **CALIBRATED RISK PROBABILITY** | Continuous probability calibrated via empirical policy (Platt scaling / isotonic regression) reflecting empirical likelihood. |
| `raw_probability_distribution` | **RAW MODEL PROBABILITY** | Pre-calibration margin logistic or tree output. |

### Prohibited Classifications Enforced
- **NO Risk Bands**: No `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` categorical tiers.
- **NO Arbitrary Thresholds**: No cutoffs (e.g. `p > 0.70`).
- **NO TOP-X% Labels**: No `TOP 5%` or `TOP 10%` labels.
- **NO Synthetic Scores**: No `"AI Score"`, `"Warning Score"`, or composite index.

---

## 10. Deep Navigation & Decision Support

The workspace provides direct, evidence-backed navigation into detailed investigation tools:

- **Intelligence Terminal**: Link to `/intelligence` to audit project-level signed TreeSHAP/logistic contributors.
- **Project Risk Intel**: When a `project_code` filter is active, links to `/intelligence?project={project_code}` with pre-selection.
- **Canonical Project Detail**: Link to `/projects/{project_code}` for observation snapshot and trajectory history.
- **Time Window Expansion**: Action to reset date filters if sparse observations prevent longitudinal analysis.

---

## 11. Dimensional Limitations & Structural Omissions

- **District Dimension**: Structurally omitted from source MoSPI Flash Report tables. Clearly flagged as `DISTRICT DIMENSION: UNAVAILABLE` with source explanation.
- **Non-Causal Notice**: Observational aggregates reflect reporting history and project population dynamics; they do not establish causation.
- **Non-Imputation**: Missing values are excluded from arithmetic means and never imputed as 0%.

---

## 12. Verification & Test Suite

The PR-13 implementation is verified across all testing layers:

| Layer | Test Suite | Tests | Result |
| :--- | :--- | :--- | :--- |
| **Frontend Dedicated PR-13** | `AnalyticsIntelligence.test.tsx` | 19 | **PASSED (19/19)** |
| **Frontend PR-10 Workspace** | `AnalyticsWorkspace.test.tsx` | 25 | **PASSED (25/25)** |
| **Frontend Total Suite** | 24 test suites | 243 | **PASSED (243/243)** |
| **Production Build** | `tsc -b && vite build` | — | **PASSED (Code 0)** |
| **Backend Tests** | `pytest backend/tests -v` | 119 | **PASSED (119/119)** |
| **Serving API Tests** | `pytest tests/test_serving_api.py -v` | 13 | **PASSED (13/13)** |
| **Canonical SHA-256 Hashes** | 4 artifact files | 4 | **PASSED (Exact match)** |
