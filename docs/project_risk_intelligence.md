# Project Risk Intelligence Backend Specification

## 1. Overview and Purpose

The Project Risk Intelligence service provides a unified, typed, and deterministic project-level intelligence response assembled from existing, truthful data sources in the IRIS platform.

> [!IMPORTANT]
> **Project Risk Intelligence is an orchestration layer over existing project observations and the production schedule-risk serving system.**
> It is **NOT** a new predictive model, a runtime prediction engine, or a synthetic generative AI summary.
>
> **Cost Overrun Risk and Progress Stagnation Risk are not implemented production models.**
> While target formulations exist as specifications in `docs/model_target_spec.md`, no production ML models are served for cost risk or progress stagnation. The API explicitly reports these domains as unserved.

---

## 2. Architecture & Data Sources

The service unifies disparate verified records into a single coherent structure:

```
                  ┌───────────────────────────────────────────────┐
                  │      GET /api/v1/projects/{code}/             │
                  │            risk-intelligence                  │
                  └──────────────────────┬────────────────────────┘
                                         │
                         ProjectIntelligenceService
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  ProjectRepository              ServingRepository                  Model Registry
  (Canonical Database)           (SQLite Risk Artifact)             (PR-02 Governance)
        │                                │                                │
  ┌─────┴──────────────┐           ┌─────┴──────────────┐           ┌─────┴──────────────┐
  │ - Identity         │           │ - Current Risk     │           │ - Model Family     │
  │ - Latest Snapshot  │           │ - Chrono History   │           │ - Target Metadata  │
  │ - Trajectory       │           │ - Signed Drivers   │           │ - Calibration      │
  │ - Factual Signals  │           │ - Regime / Ranks   │           │ - Active Status    │
  │ - Adjacent Deltas  │           └────────────────────┘           └────────────────────┘
  └────────────────────┘
```

### Data Sources
1. **Canonical Observations**:
   - Primary: Stored monthly observations via `ProjectRepository`.
   - Trajectory: Chronological series ordered by `report_month ASC`.
2. **Production Risk Serving**:
   - Stored in `data/serving/iris_risk_serving_v1.sqlite3` with read-only SQLite enforcement (`PRAGMA query_only = ON`).
   - Serves the sole implemented production ML target: `target_effective_schedule_ext_3m`.
3. **Model Registry**:
   - Centralized governance from `src/serving/registry.py` (PR-02).
   - Traceable link to active model (`logistic_static_only__unweighted`) or historical model (`catboost_full_v1__unweighted`).

---

## 3. API Contract

### Endpoint
```http
GET /api/v1/projects/{project_code}/risk-intelligence
```

### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `project_code` | `string` | Yes | Canonical source project identifier (e.g. `617936`, `N10000001`). Surrounding whitespace is automatically trimmed. |

### Status Codes
- `200 OK`: Project exists. Full intelligence record returned.
- `404 Not Found`: Project code does not exist in the project database.
- `422 Unprocessable Entity`: Project code is empty or whitespace-only.

---

## 4. Response Structure & Semantics

The response schema is defined by `ProjectRiskIntelligenceResponse`:

```json
{
  "project": {
    "project_code": "617936",
    "project_name": "Dedicated Freight Corridor (Western)",
    "agency": "DFCCIL",
    "ministry": "RAILWAYS",
    "sector": "RAILWAYS",
    "state": "MAHARASHTRA",
    "legacy_ocms_code": null,
    "pmgid": null
  },
  "snapshot": {
    "report_month": "2026-07",
    "physical_progress": 92.5,
    "financial_progress": 88.4,
    "cumulative_expenditure": 47500.0,
    "original_cost": 28181.0,
    "revised_cost": 52000.0,
    "approval_date": "2008-02",
    "start_date": "2008-10",
    "original_completion_date": "2018-03",
    "revised_completion_date": "2026-12"
  },
  "risk": {
    "risk_probability": 0.3842,
    "raw_probability": 0.3211,
    "risk_rank": 42,
    "risk_percentile": 0.825,
    "population_size": 1625,
    "report_month": "2026-04",
    "regime": "MODERN",
    "model_id": "logistic_static_only__unweighted",
    "target": "target_effective_schedule_ext_3m",
    "calibration_active": true
  },
  "model": {
    "model_id": "logistic_static_only__unweighted",
    "target": "target_effective_schedule_ext_3m",
    "model_family": "L2-Regularized Logistic Regression (C=1.0)",
    "status": "ACTIVE_PRODUCTION",
    "is_active": true,
    "coverage_period": "2025-07 through 2026-07",
    "calibration_policy": "Temporal Platt scaling active from origin 2026-04",
    "explanation_method": "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE"
  },
  "history": [
    {
      "report_month": "2026-03",
      "risk_probability": 0.3512,
      "raw_probability": 0.3512,
      "risk_rank": 48,
      "risk_percentile": 0.810,
      "population_size": 1620,
      "regime": "MODERN",
      "model_id": "logistic_static_only__unweighted",
      "calibration_active": false
    }
  ],
  "drivers": {
    "top_positive": [],
    "top_negative": [],
    "strongest_drivers": []
  },
  "signals": {
    "cost_revised": true,
    "schedule_revised": true,
    "cost_revision_ratio": 1.8452,
    "cost_revision_count": 3,
    "schedule_extension_count": 4,
    "reporting_months_count": 25,
    "first_reported_month": "2024-06",
    "latest_reported_month": "2026-07"
  },
  "recent_changes": {
    "has_prior_observation": true,
    "prior_report_month": "2026-06",
    "physical_progress_delta": 0.5,
    "expenditure_delta": 120.0,
    "revised_cost_delta": null,
    "completion_date_changed": false
  },
  "data_availability": {
    "has_project_data": true,
    "has_risk_assessment": true,
    "has_risk_history": true,
    "has_drivers": true,
    "snapshot_report_month": "2026-07",
    "risk_report_month": "2026-04",
    "cost_risk_ml_served": false,
    "progress_stagnation_ml_served": false
  }
}
```

---

## 5. Domain Rules & Guarantees

### 5.1 Temporal Independence
- `snapshot.report_month` and `risk.report_month` are **separate and independent fields**.
- Project observation snapshots reflect the latest published Flash Report in the dataset.
- Risk assessments reflect the latest mature prediction origin available in the serving artifact under strict temporal embargo.
- The two months must never be conflated into a single manufactured timestamp.

### 5.2 Model Regime Transitions
- Risk history preserves the actual `model_id` and `regime` (`LEGACY` vs `MODERN`) on every historical point.
- The transition between CatBoost uncalibrated operational scores and Logistic Regression with Platt scaling remains transparent.

### 5.3 Deterministic Driver Ordering
- Signed contributions are preserved exactly as computed in raw margin/logit space.
- Directions are strictly `"POSITIVE"` (increasing schedule risk) or `"NEGATIVE"` (decreasing schedule risk).
- Strongest drivers are sorted deterministically:
  1. `abs(contribution) DESC`
  2. `rank ASC`
  3. `feature ASC`

### 5.4 Factual Observational Signals
- `signals` and `recent_changes` are derived **strictly from stored observation rows**.
- If a project has only 1 observation, `recent_changes.has_prior_observation` is `false` and all deltas are `null` (not zero).
- Cost revisions and schedule extensions are counted from verified transition events in the project trajectory.

### 5.5 Honest Missing-Data Semantics
- If a project exists in the project database but has no records in the risk serving artifact:
  - HTTP status is **`200 OK`** (not 404).
  - `risk` is `null`.
  - `model` is `null`.
  - `history` is `[]`.
  - `drivers` collections are empty.
  - `data_availability.has_risk_assessment` is `false`.
- If a project does not exist at all:
  - HTTP status is **`404 Not Found`**.

---

## 6. Frontend Integration & Project Detail Experience (PR-04)

The IRIS Project Detail view consumes `GET /api/v1/projects/{project_code}/risk-intelligence` via TanStack React Query (`queryKey: ["projects", project_code, "risk-intelligence"]`):

1. **Temporal Independence**:
   - `snapshot.report_month` (e.g. `2026-07`) and `risk.report_month` (e.g. `2026-04`) are presented separately.
   - The UI maintains this temporal boundary explicitly and never conflates them into a single timestamp.

2. **Truthful No-Risk State**:
   - When `data_availability.has_risk_assessment` is `false` (`risk: null`), the UI renders an honest unavailable state (`SCHEDULE RISK: Not assessed for this project`).
   - It does not fabricate a 0% risk probability, a "Low Risk" badge, or synthetic model information.

3. **Localized Error Handling**:
   - Network or serving failures produce a localized alert in the risk section without breaking other Project Detail sections (identity, trajectory, milestones, expenditure).

4. **Unserved Machine Learning Domains**:
   - Cost Overrun Risk and Progress Stagnation Risk are truthfully reported as `DATA PENDING` in accordance with `data_availability.cost_risk_ml_served: false` and `data_availability.progress_stagnation_ml_served: false`.
   - Factual signals (cost revision events, schedule extension counts) are kept visually and semantically distinct from machine learning predictions.

---

## 7. Dedicated Intelligence Terminal Core (PR-05)

The dedicated IRIS Intelligence Terminal (`/intelligence`) provides a comprehensive operational risk workstation for analysts, integrating project risk intelligence directly into the intelligence view while retaining existing portfolio risk telemetry:

### 7.1 Architectural Position & URL Contract
- Located at `/intelligence` with URL addressability via query parameter: `/intelligence?project={project_code}`.
- Synchronized bidirectionally with URL parameters using React Router (`useSearchParams`).
- Selecting a project updates the URL without reloading the page (`?project=CODE`).
- Clearing the selected project cleanly transitions back to the base `/intelligence` URL with the zero-fake-metrics empty state.

### 7.2 Dedicated Terminal Workstation States
1. **Empty / No Project Selected (`/intelligence`)**:
   - Renders the terminal container with clear guidance to search or enter a canonical project code.
   - Strictly avoids displaying zeroed-out, default, or synthetic risk numbers (`0.0%`, "Low Risk", "#0").
   - Preserves all historical Portfolio Risk Overview and explorer tables below the terminal.
2. **Loading State**:
   - Accessible loading indicator (`role="status"`, `aria-live="polite"`) announcing the retrieval of the specific project code.
   - Does not flicker placeholder percentages or default cards.
3. **Error State**:
   - Clear diagnostic feedback on request failure or network disconnection.
   - Provides options to retry transmission or clear the selection to search for another project.
4. **Loaded Assessed State (`risk !== null`)**:
   - **Header & Identity**: Displays canonical project code, project name, agency, sector, state, ministry, and legacy identifiers (OCMS, PMGID) alongside a direct navigation link to `/projects/:code`.
   - **Temporal Independence**: Distinct strips display Project Snapshot Month vs Risk Assessment Month.
   - **Operational Risk Assessment**: Displays calibrated probability, raw probability, portfolio rank, population size, percentile (`P{percentile}` strictly as reported without deriving `TOP X%`), assessment month, model ID, and target dynamically.
   - **Signed Risk Drivers**: Dual-column layout categorizing positive (risk-increasing) and negative (risk-decreasing) feature contributions in raw margin logit space.
   - **Factual Signals & Recent Changes**: Factual observational signals (cost revision count & ratio, schedule extension count, observation span) and deterministic month-over-month deltas. Initial observations honestly state that no prior observation is available rather than fabricating deltas.
   - **Historical Risk Trajectory**: Chronological line chart (Recharts) and structured data table. If evaluations span multiple regimes or model architectures, an explicit regime transition banner highlights model differences.
   - **Model Specification & Traceability**: Keyboard-accessible collapsible governance panel disclosing model ID, target formulation, model family, active status, coverage period, calibration policy, and explanation method.
   - **Serving System Audit**: Unserved ML domains (Cost Overrun Risk and Progress Stagnation Risk) are explicitly and truthfully marked as `DATA PENDING`.
5. **Loaded Unassessed State (`risk === null`)**:
   - Truthfully displays `NOT ASSESSED` rather than 0% probability or "Low Risk".
   - Explains that the project is recorded in canonical PAIMANA infrastructure monitoring records, but no operational schedule-risk assessment is currently served in the production model serving layer.

---

## 8. Advanced Intelligence Visualizations (PR-06)

The visual analytical layer of the IRIS Intelligence Terminal presents authoritative machine learning outputs and project observations without altering data contracts, model weights, or serving artifacts:

### 8.1 Data Faithfulness & Analytical Principles
- **No Interpolation or Smoothing**: Historical charts render strictly observed report months. Missing months between observations are never filled, smoothed, or interpolated with synthetic points.
- **Zero Subjective Categorization**: Risk probability is presented on an objective 0% to 100% horizontal analytical scale. Subjective threshold labels (such as "Low / Medium / High Risk") are never introduced without authoritative model governance taxonomy.
- **Calibrated vs Raw Probability Distinction**:
  - Operational probability (`risk_probability`) is rendered as a solid primary series.
  - Raw model logit score (`raw_probability`) is rendered as a secondary dashed series.
  - When calibration is inactive (`calibration_active: false`), no synthetic calibrated probability is manufactured; the UI indicates that calibration is inactive / raw.
- **Dynamic Regime & Model Transition Markers**:
  - The transition between CatBoost (LEGACY) and Logistic Regression (MODERN) is evaluated dynamically from the project's historical records.
  - Reference lines and transition banners appear only when a project's history spans multiple regimes or distinct model architectures. Projects with records exclusively in one regime do not display spurious transition markers.
- **Signed Margin Drivers (Diverging Representation)**:
  - Recharts diverging horizontal bar chart centered at the 0.0 model intercept baseline.
  - Features with positive margin contributions extend rightward in coral (`#BA1A1A`), elevating extension risk.
  - Features with negative margin contributions extend leftward in dark green (`#1A3C2B`), reducing extension risk.
  - Drivers are explicitly labeled as **Signed Margin Contributions** in raw logit space, never as causal effects or percentage changes.
  - Backend ordering and full driver counts are preserved.
- **Portfolio Position & Percentile**:
  - Displays `#risk_rank` within `population_size` alongside a linear track marker for `P{percentile}`.
  - Strictly presents reported percentile without inventing derived "TOP X%" rankings.
- **Single-Observation & Empty States**:
  - A project with a single historical evaluation displays a discrete evaluation card with exact metrics and an explicit note that longitudinal trend lines require multiple observation periods. No misleading single-point trend line is drawn.
  - Empty history renders an honest unavailable state without zero lines or default markers.
  - Unassessed projects (`risk: null`) render `NOT ASSESSED` without zero gauges or zero-value charts.
- **Temporal Alignment Provenance**:
  - Project Snapshot Month and Risk Assessment Month are displayed via discrete temporal markers, highlighting evaluation cycle synchronization or lag without generating fake timestamps or continuous timelines.

---

## 9. Risk Explainability & Driver Analysis (PR-07)

The explainability layer of the IRIS Intelligence Terminal deepens the analytical transparency of served risk assessments without fabricating data, modifying ML models, or changing backend serving artifacts:

### 9.1 Explainability Architecture & Mathematical Semantics
- **Raw Margin / Logit Space**: All driver contributions $\phi_j$ are represented strictly in raw model margin logit units ($z = \beta_0 + \sum_j \phi_j$), **not** as percentage probability changes or causal risk shifts.
- **Displayed vs Complete Decomposition**: The serving contract exposes top-N slices (`top_positive`, `top_negative`, `strongest_drivers`), which are subset representations of the full 36-feature vector. Accordingly, cumulative positive and negative metrics are truthfully labeled:
  - `"Displayed positive contribution sum"`
  - `"Displayed negative contribution sum"`
  - Accompanied by explicit notes indicating they represent the sum of displayed top-N drivers in margin logit units rather than the complete 36-feature model decomposition.
- **Strict Non-Causal Policy**:
  - Model explanations represent statistical feature contributions within an empirical classification model.
  - The UI and documentation strictly avoid causal terminology (e.g. "causes", "caused by", "reducing this will fix", "if you lower X, risk will drop").
  - Direction labels are defined as `"Risk-increasing contribution (+)"` and `"Risk-decreasing contribution (-)"` within the statistical model.

### 9.2 Authoritative Feature Families
Feature family classifications are derived authoritatively from `schemas/schedule_extension_3m_v1.contract.json`, comprising exactly 9 families across all 36 engineered features:
1. **Static Project Attributes**: Initial structural characteristics (`original_cost_log`, `original_duration_months`).
2. **Administrative Hierarchy**: Governance and organizational entities (`agency_enc`, `ministry_enc`, `sector_enc`).
3. **Geography / Location**: Geographic classification (`state_enc`).
4. **Cost Baseline & Revisions**: Cost growth, revisions, and expenditure ratios (`cost_revision_count`, `cost_growth_ratio`, `expenditure_to_revised_cost_ratio`).
5. **Schedule Horizon & Revisions**: Schedule extensions, slippage, and revised horizons (`schedule_extension_count`, `schedule_growth_ratio`, `months_remaining_to_revised_completion`).
6. **Expenditure Trajectory**: Longitudinal expenditure rates and momentum (`expenditure_velocity_3m`, `expenditure_acceleration_6m`).
7. **Physical Progress Trajectory**: Progress completion pace and stagnation indicators (`physical_progress_velocity_3m`, `physical_progress_acceleration_6m`).
8. **Longitudinal Inactivity & Lags**: Inactivity counters, stale reporting, and reporting gaps (`months_since_last_progress_change`, `reporting_lag_months`).
9. **Project Scale & Ratio**: Interaction ratios and relative financial/scale scale (`burn_rate_vs_schedule_pace`, `cost_per_month_planned`).

### 9.3 Model-Specific Explanation Methods
Explanation methods are resolved dynamically from model governance metadata for the specific assessed `model_id`:
- **CatBoost Legacy Model (`catboost_full_v1__unweighted`)**:
  - Explanation Method: `TreeSHAP (Margin Logit Space)`
  - Mathematical Semantics: Exact TreeSHAP additive feature contributions $\phi_i(x)$ computed directly from decision tree split paths in log-odds space.
- **Logistic Regression Active Model (`logistic_static_only__unweighted`)**:
  - Explanation Method: `Logistic Coefficient × Transformed Feature Product`
  - Mathematical Semantics: Additive linear contribution $\beta_j \cdot x_j$ in log-odds space before Platt scaling calibration.
- The interface dynamically renders the truthful method for the active assessment rather than generic composite text.

### 9.4 Four Core Explainability Workstation Areas
1. **Driver Summary (`IntelligenceDriverSummary`)**:
   - Telemetry strip displaying total available drivers, lead positive contributor, lead negative contributor, displayed positive contribution sum, and displayed negative contribution sum.
   - Truthful empty states when no assessment exists or when no drivers are served.
2. **Driver Detail & Decomposition (`IntelligenceDriverDetail`)**:
   - Diverging bar chart (`IrisSignedDriversChart`) centered at the 0.0 margin baseline.
   - Interactive direction filtering: `ALL (N)`, `RISK-INCREASING (+)`, and `RISK-DECREASING (-)`.
   - Sorting toggles: `MODEL ORDER` (preserving exact serving sequence) and `MAGNITUDE (DESC)`.
   - Accessible data table view providing full screen-reader transparency.
   - Screen-reader accessible directional announcements (e.g. `"+0.412 — risk-increasing"`).
3. **Model Evidence ("Why this score?") (`IntelligenceModelEvidence`)**:
   - Contextual panel detailing operational calibrated probability alongside raw probability, model ID, regime, evaluation origin month, target definition, and dynamic explanation method.
   - Breakdown table contextualizing how individual signed drivers combine in model log-odds space.
4. **Governance Limitations & Provenance**:
   - Discloses evaluation embargo lags, static vs longitudinal feature scope, and observational data constraints.
   - Prominent non-causal disclaimer reminding analysts that observed associations do not guarantee interventional outcomes.
