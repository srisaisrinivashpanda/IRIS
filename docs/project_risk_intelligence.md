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
