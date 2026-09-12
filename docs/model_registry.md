# IRIS Model Registry & ML Governance Specification

## 1. Overview and Mission

The IRIS Model Registry provides an authoritative, centralized, and typed governance surface for machine learning models deployed in the IRIS PAIMANA infrastructure monitoring platform.

The registry is designed under strict governance principles:
- **Single Source of Truth**: All exposed metadata is traceable directly to immutable artifacts (`data/serving/serving_manifest.json`), formal handoff documentation (`docs/MODELING_HANDOFF.md`), calibration specifications (`docs/calibration_policy.md`), and model target specifications (`docs/model_target_spec.md`).
- **Zero Retraining & Zero Mutation**: The registry never trains models, modifies hyperparameters, or alters production artifacts.
- **Truthful Scope**: Only validated production models are presented as operational. Future or specification-only targets are strictly designated as unserved.

Cross-Reference: For runtime serving details, read [`docs/risk_serving_contract.md`](file:///d:/Study/Hackathons/SIH-MAIN/IRIS/docs/risk_serving_contract.md).

---

## 2. Target Domain Registry

| Target ID | Target Name | Domain | Status | Is Served | Horizon | Production Models |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`target_effective_schedule_ext_3m`** | Effective Schedule Extension (>= 3 Months) | `SCHEDULE_RISK` | `IMPLEMENTED_AND_SERVED` | **`true`** | 3 Months | `logistic_static_only__unweighted`, `catboost_full_v1__unweighted` |
| **`target_effective_cost_esc_3m`** | Effective Cost Escalation (3 Months) | `COST_RISK` | `SPECIFICATION_ONLY` | **`false`** | 3 Months | *(None)* |
| **`target_progress_stagnation_3m`** | Physical Progress Stagnation (3 Months) | `PROGRESS_RISK` | `SPECIFICATION_ONLY` | **`false`** | 3 Months | *(None)* |

> [!IMPORTANT]
> **Cost Overrun Risk and Progress Stagnation Risk are specification-only and are not served production ML models.**
> While mathematical formulations are defined in `docs/model_target_spec.md`, no models have been trained, validated, or deployed for these targets in IRIS v1. The API and registry truthfully reflect their unserved status.

---

## 3. Production Model Registry

The production schedule-risk system consists of two locked models operating across mutually exclusive historical coverage windows:

```
[2023-01 ----------------- 2025-06]      [2025-07 ----------------- 2026-07]
          LEGACY REGIME                              MODERN REGIME
  catboost_full_v1__unweighted             logistic_static_only__unweighted
 (Historical Production Serving)             (Active Production Model)
```

### 3.1 Active Model: `logistic_static_only__unweighted`

- **Model ID**: `logistic_static_only__unweighted`
- **Model Name**: Modern Production Logistic Regression (Static-Only)
- **Role**: **Active Production Model** (`is_active: true`, `status: ACTIVE_PRODUCTION`)
- **Regime**: `MODERN`
- **Coverage Period**: `2025-07 through 2026-07`
- **Target**: `target_effective_schedule_ext_3m` (3-month horizon)
- **Model Family**: L2-Regularized Logistic Regression ($C=1.0$)
- **Feature Count**: 12 static-at-$T$ features
- **Features**: `sector`, `agency`, `state`, `original_cost`, `cumulative_expenditure_t`, `revised_cost_t`, `physical_progress_t`, `project_age_months`, `months_to_original_schedule`, `months_to_effective_schedule`, `schedule_revision_lag_months`, `schedule_has_been_revised`
- **Explanation Method**: `LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE` (Linear SHAP equivalent in raw logit margin space)
- **Calibration Scheme**: Temporal Platt Scaling
  - **Status**: `ACTIVE`
  - **Active Origin**: `2026-04` (Fold M5 meets the strict minimum threshold of 1,000 rows across at least 2 chronological OOF months)
  - **Platt Parameters**: Slope $a = 1.20633$, Intercept $b = 0.45513$
  - **Calibration Improvement**: Brier score improves from 0.18024 to 0.16710; 10-bin ECE improves from 0.11217 to 0.08535
  - **Uncalibrated Origins**: Early Modern origins 2025-12 through 2026-03 (M1–M4) structurally lack mature chronological history under strict label embargo and remain uncalibrated
- **Empirical Validation Metrics**:
  - Average Precision (AP / PR-AUC): **0.7587** (95% project-cluster CI: 0.7340–0.7861)
  - ROC-AUC: **0.8419**
- **Serving Artifact**: Deployed in `iris_risk_serving_v1.sqlite3` (8,190 Modern project-month records)

### 3.2 Historical Model: `catboost_full_v1__unweighted`

- **Model ID**: `catboost_full_v1__unweighted`
- **Model Name**: Legacy Production Gradient Boosted Trees (CatBoost Full v1)
- **Role**: **Historical Production Model** (`is_active: false`, `status: HISTORICAL_PRODUCTION`)
- **Regime**: `LEGACY`
- **Coverage Period**: `2023-01 through 2025-06`
- **Target**: `target_effective_schedule_ext_3m` (3-month horizon)
- **Model Family**: Gradient Boosted Decision Trees (CatBoost)
- **Feature Count**: 18 features (16 static + 2 trajectory deltas)
- **Explanation Method**: `CATBOOST_NATIVE_TREESHAP` (TreeSHAP in raw margin space)
- **Calibration Policy**: Uncalibrated (`status: UNCALIBRATED`)
  - Native CatBoost probabilities match operational risk scores; unweighted CatBoost naturally produces reliable calibration on the ~9.5% prevalence legacy portfolio
  - Diagnostic nested-OOF Platt scaling fits support the uncalibrated policy
- **Empirical Validation Metrics**:
  - Average Precision (AP / PR-AUC): **0.4071** (95% project-cluster CI: 0.3541–0.4578)
  - ROC-AUC: **0.7852**
  - Brier Score: **0.0720**
  - Expected Calibration Error (ECE, 10-bin): **0.0287**
- **Serving Artifact**: Deployed in `iris_risk_serving_v1.sqlite3` (16,999 Legacy project-month records)

---

## 4. Serving Artifact Traceability

The registry metadata directly connects to production artifacts:
- **Serving Database**: `data/serving/iris_risk_serving_v1.sqlite3`
  - Enforces engine-level read-only mode via `PRAGMA query_only = ON`
  - Total records: 25,189 project-months (16,999 Legacy + 8,190 Modern)
- **Serving Manifest**: `data/serving/serving_manifest.json`
  - Verified SHA-256 integrity check upon repository initialization
  - Version stamps: `serving_artifact_version = "iris_serving_v1_1"`, `serving_contract_version = "1.1"`

---

## 5. API Endpoints

All endpoints are mounted under `/api/v1/risk/*` and mirrored at root `/risk/*` for frontend proxy compatibility.

### 5.1 `GET /api/v1/risk/models`
- **Description**: Returns all registered production models in deterministic order (active model first).
- **Response**: `ModelRegistryListResponse`
  ```json
  {
    "total": 2,
    "active_model_id": "logistic_static_only__unweighted",
    "models": [...]
  }
  ```

### 5.2 `GET /api/v1/risk/models/active`
- **Description**: Returns the currently active production model (`logistic_static_only__unweighted`).
- **Response**: `ModelRegistryEntry`

### 5.3 `GET /api/v1/risk/models/{model_id}`
- **Description**: Exact model registry entry lookup.
- **Parameters**: `model_id` (string, whitespace automatically trimmed).
- **Errors**:
  - `422 Unprocessable Entity`: Blank or whitespace-only ID.
  - `404 Not Found`: Unknown model ID.
- **Security**: User input is strictly matched against in-memory registry keys; it never touches the filesystem or raw SQL queries.

### 5.4 `GET /api/v1/risk/targets`
- **Description**: Returns registered ML target domains and implementation statuses.
- **Response**: `TargetRegistryListResponse`
  ```json
  {
    "total": 3,
    "implemented_count": 1,
    "targets": [
      {
        "target_id": "target_effective_schedule_ext_3m",
        "status": "IMPLEMENTED_AND_SERVED",
        "is_served": true,
        ...
      },
      {
        "target_id": "target_effective_cost_esc_3m",
        "status": "SPECIFICATION_ONLY",
        "is_served": false,
        ...
      },
      {
        "target_id": "target_progress_stagnation_3m",
        "status": "SPECIFICATION_ONLY",
        "is_served": false,
        ...
      }
    ]
  }
  ```

### 5.5 Backwards Compatibility: `GET /api/v1/risk/model-info`
- Continues to return the existing schema (`serving_artifact_version`, `target`, `horizon_months`, `status`, `models`), populated internally from the registry.
- All existing clients and tests continue to function without modification.
