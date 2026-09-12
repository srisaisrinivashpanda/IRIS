# IRIS Production Schedule Risk Serving Contract

## 1. Overview and Mission

The IRIS Risk Intelligence layer serves deterministic, auditable, and pre-computed production schedule-risk predictions and feature attributions for ongoing PAIMANA infrastructure projects.

This service is backed by a compact, read-only SQLite serving database (`data/serving/iris_risk_serving_v1.sqlite3`) and an accompanying cryptographic manifest (`data/serving/serving_manifest.json`). The service operates under zero-mutation guarantees: it never trains models on the fly, never computes synthetic risk scores, never crosswalks incompatible project identity regimes, and enforces strict read-only guarantees at the database engine level.

---

## 2. Served Target and Scope

### Single Locked Target: `target_effective_schedule_ext_3m`

The sole ML target deployed in production is **`target_effective_schedule_ext_3m`**:
- **Definition**: A binary classification indicator denoting whether a project's effective completion schedule slips by three or more months over the subsequent three-month observation window.
- **Horizon**: 3 months.
- **Status**: Production Ready (`READY`).

### Truthful Absence of Unvalidated Models
- **Cost-Overrun Risk**: NOT IMPLEMENTED. No cost-overrun model has been validated or accepted for production serving. The API returns no fabricated cost risk scores.
- **Progress-Stagnation Risk**: NOT IMPLEMENTED. Physical progress stagnation models are not part of the active serving contract.
- **Future Labels & Realized Outcomes**: No realized completion dates (`actual_completion_date`), post-observation targets (`future_label`), or completion indicators (`is_completed`, `eventually_completed`) are ever leaked into serving responses.

---

## 3. Production Models & Regime Governance

The production serving database covers two distinct administrative regimes with locked model architectures and verified feature schemas:

| Regime | Model ID | Model Family | Features Count | Explainability Method | Calibration Policy | Historical Coverage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LEGACY** | `catboost_full_v1__unweighted` | Gradient Boosted Decision Trees (CatBoost) | 18 | `CATBOOST_NATIVE_TREESHAP` (TreeSHAP) | Uncalibrated (ranking score = raw probability) | `2023-01` through `2025-06` | `READY` |
| **MODERN** | `logistic_static_only__unweighted` | L2-Regularized Logistic Regression | 12 | `LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE` (Linear SHAP equivalent) | Temporal Platt Scaling (active on `2026-04`) | `2025-07` through `2026-07` | `READY` |

### Calibration Policy
- For the Legacy regime, probabilities reflect locked operational probabilities from CatBoost trees.
- For the Modern regime, temporal Platt scaling is active for evaluated test folds (notably `2026-04`), producing calibrated probabilities (`risk_probability`) alongside uncalibrated raw scores (`raw_probability`).
- When calibration is active, `calibration_active` evaluates to `true`; otherwise `false`.

---

## 4. Serving Artifact Architecture & Integrity

### SQLite Serving Database (`iris_risk_serving_v1.sqlite3`)
- **Tables**:
  - `risk_records`: Evaluated project-month records (25,189 rows).
  - `contributors`: Top directional predictive contributors per record (250,570 rows).
  - `feature_catalog`: Canonical feature names mapped to human-readable display names (36 features).
  - `artifact_metadata`: Cryptographic hashes and version stamps.
- **Indexes**:
  - `risk_month_rank_idx`: Composite index on `(report_month, regime, risk_rank, project_code)`.
  - `risk_project_history_idx`: Composite index on `(project_code, report_month, regime)`.
  - `risk_month_metadata_idx`: Composite index on `(report_month, sector, agency, ministry, state)`.

### Integrity & Read-Only Enforcement
1. **URI Mode**: Connections are established via `file:<path>?mode=ro`.
2. **PRAGMA Enforcement**: Every connection immediately executes `PRAGMA query_only = ON`. Any SQL write mutation raises `sqlite3.OperationalError: attempt to write a readonly database`.
3. **Startup Hash Verification**: The repository verifies the SHA-256 hash of `iris_risk_serving_v1.sqlite3` against `database.sha256` recorded in `serving_manifest.json`. Any mismatch halts startup immediately.

---

## 5. API Endpoints & Behavior

All endpoints are available under `/api/v1/risk/*` and mirrored at root `/risk/*` for frontend proxy compatibility.

### 5.1 `GET /api/v1/risk/model-info`
Returns architectural metadata, model families, feature counts, explainability techniques, and explicit coverage periods for governance transparency.

### 5.2 `GET /api/v1/risk/options`
- **Query Parameters**:
  - `report_month` (optional `str`, format `YYYY-MM`): Selected evaluation month.
- **Returns**: Distinct available report months, default active month (`2026-04`), active regimes, and populated non-null filter options (`sectors`, `agencies`, `ministries`, `states`).
- **Errors**:
  - `422 Unprocessable Entity`: Malformed month string.
  - `404 Not Found`: Selected month not present in database.

### 5.3 `GET /api/v1/risk/summary`
- **Query Parameters**:
  - `report_month` (required `str`, format `YYYY-MM`).
  - `regime` (optional `LEGACY` | `MODERN`).
  - `top_n` (optional `int`, 1–50, default 10).
  - `sector`, `agency`, `ministry`, `state` (optional `str`).
  - `search` (optional `str`, max 200 chars).
- **Returns**: Portfolio project count, 7-point score distribution (`minimum`, `p25`, `median`, `p75`, `p90`, `p95`, `maximum`, `mean`), top-N ranked projects, active regime metadata, and sector-level risk summaries.
- **Errors**:
  - `422 Unprocessable Entity`: Invalid month or parameter bounds.
  - `404 Not Found`: No records match the specified filters.

### 5.4 `GET /api/v1/risk/projects`
- **Query Parameters**:
  - `report_month` (required `str`, format `YYYY-MM`).
  - `page` (optional `int`, ge 1, default 1).
  - `page_size` (optional `int`, ge 1, le 100, default 25).
  - `regime` (optional `LEGACY` | `MODERN`).
  - `min_risk_probability`, `max_risk_probability` (optional `float`, 0.0–1.0).
  - `sector`, `agency`, `ministry`, `state` (optional `str`).
  - `search` (optional `str`, substring match on project code or name).
- **Ordering**: Strictly deterministic by `ORDER BY risk_rank, project_code`.
- **Errors**:
  - `422 Unprocessable Entity`: `min_risk_probability > max_risk_probability` or invalid month.
  - `404 Not Found`: Zero projects matching the query filter.

### 5.5 `GET /api/v1/risk/project/{project_code}`
- **Path Parameter**: `project_code` (required `str`, whitespace automatically trimmed).
- **Query Parameter**: `report_month` (required `str`, format `YYYY-MM`).
- **Returns**: Complete `RiskRecord` including calibrated risk probability, percentile, risk rank, top positive contributors, top negative contributors, and source feature values.
- **Errors**:
  - `422 Unprocessable Entity`: Empty or whitespace-only project code, or malformed month.
  - `404 Not Found`: Exact `(project_code, report_month)` not present.

### 5.6 `GET /api/v1/risk/project/{project_code}/history`
- **Path Parameter**: `project_code` (required `str`, whitespace automatically trimmed).
- **Query Parameter**: `regime` (optional `LEGACY` | `MODERN`).
- **Ordering**: Strictly chronological by `ORDER BY report_month, regime, model_id`.
- **Identity Guarantee**: Exact-code matching only. Does NOT attempt cross-regime identifier bridging between legacy `N########` codes and modern 6-digit codes.
- **Errors**:
  - `422 Unprocessable Entity`: Empty or whitespace-only project code.
  - `404 Not Found`: No historical records exist for this project code.

---

## 6. Input Validation & Edge Case Handling

1. **Project Code Trimming**: Leading and trailing whitespace is stripped before query execution. Whitespace-only strings result in HTTP 422.
2. **Month Format**: Validated against `^\d{4}-(0[1-9]|1[0-2])$`. Whitespace is stripped before regex validation.
3. **Filter Normalization**: Empty or whitespace-only strings provided for categorical filters (`sector`, `agency`, `ministry`, `state`) are normalized to `None`, preventing spurious empty SQL matches.
4. **Deterministic Tie-Breaking**: All ordering clauses include secondary tie-breaking columns (e.g., `ORDER BY risk_rank, project_code` and `ORDER BY direction DESC, rank, feature`) ensuring reproducible outputs across repeated calls.
