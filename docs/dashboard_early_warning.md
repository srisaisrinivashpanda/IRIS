# Dashboard Early Warning Integration

## 1. Overview & Purpose

PR-12 introduces the **Early Warning / Investigation Signals** layer to the IRIS Dashboard Command Center (`/dashboard`).

In infrastructure monitoring, "Early Warning" does **not** mean running an opaque predictive classifier, assigning arbitrary "LOW / MEDIUM / HIGH" risk categories, or fabricating "danger scores". Rather, it means surfacing **authoritative, empirical evidence from production model serving** to guide an analyst's investigation:

1. **Which observed projects warrant inspection** based on verified backend ranking?
2. **What recent risk-evaluation movement is observable** across chronological evaluation cycles?
3. **What model and regime transitions have occurred** that preclude like-for-like numerical comparison?
4. **What project-level physical and financial changes** accompany observed risk evaluations?
5. **What intelligence is unavailable** (e.g. unserved targets, district dimension)?

---

## 2. Authoritative Data Sources & Contracts

The Early Warning layer is built strictly upon pre-existing, locked backend contracts:

- **`/api/v1/risk/summary`**: Serves portfolio-level evaluation metadata, score distributions, active regimes, and the top-ranked projects (`top_n`) for the authoritative evaluation cycle.
- **`/api/v1/risk/project/{project_code}/history`**: Retrieves exact chronological evaluation points across all assessed months without crosswalk lookups or regime fabrication.
- **`/api/v1/projects/{project_code}/risk-intelligence`**: Provides factual `recent_changes` (`physical_progress_delta`, `expenditure_delta`, `revised_cost_delta`, `completion_date_changed`) and governance metadata.
- **`/api/v1/analytics/risk`**: Provides serving population boundaries (`evaluation_earliest_month`, `evaluation_latest_month`, `assessed_project_count`).

No new backend endpoints, schema modifications, or client-side aggregations were created.

---

## 3. Production Risk Target & Unserved Domains

The **only** machine learning target domain implemented and served in IRIS production is:

- **Target Identifier**: `target_effective_schedule_ext_3m`
- **Domain**: Production Schedule-Extension Risk
- **Horizon**: 3 Months
- **Definition**: Probability of effective schedule extension observed within a 3-month forward horizon.

### Disclosed Unserved Domains
- `cost_overrun`: **UNSERVED / SPECIFICATION ONLY**
- `progress_stagnation`: **UNSERVED / SPECIFICATION ONLY**

No early-warning scores, warning badges, or heuristic alerts are created for unserved target domains.

---

## 4. Probability Semantics

Probabilities are presented with strict separation:

| Field | UI Label | Semantics |
|---|---|---|
| `risk_probability` | **CALIBRATED RISK PROBABILITY** | Continuous probability calibrated via empirical policy (Platt scaling or isotonic regression) reflecting true empirical likelihood. Displayed as e.g. `89.4%`. |
| `raw_probability` | **RAW MODEL PROBABILITY** | Direct tree or margin logistic score prior to operational calibration. Displayed as e.g. `88.0%`. |

Neither value is ever labeled as an "AI Score", "Risk Score", or "Warning Score".

---

## 5. Investigation Queue Semantics

The investigation queue (`DashboardInvestigationQueue`) displays records ranked by production schedule-extension risk:

- **Ordering**: Strictly governed by backend `risk_rank`.
- **Top N**: Defaults to authoritative `top_n` (5 records) from the risk serving API.
- **No Client-Side Thresholding**: No arbitrary probability cutoff (e.g. `risk_probability > 0.70`) is applied. Projects with lower probabilities remain in the queue if ranked there by the serving model.
- **No Fabricated Categorization**: Labels like `HIGH RISK`, `RED ALERT`, `CRITICAL`, or `Top 5%` are prohibited. The queue is explicitly labeled:
  `PROJECTS TO INVESTIGATE · Showing 5 backend-ranked records`
- **Interactive Inspection**: Selecting any row updates the adjacent `DashboardRiskMovement` panel to inspect that project's evaluation trajectory.

---

## 6. Historical Comparability & Granular Rules (Correction 1)

Historical risk observations are evaluated under granular comparability rules rather than a blanket rule:

1. **Calibrated Probability Delta**:
   - Compared **only** across records sharing the same model, same regime, and with calibration active on both observations.
   - Formatted as `+Z.Z percentage points` (e.g. `+8.2 percentage points`).
   - Accompanied by accessible screen-reader narrative text: `"Calibrated probability increased by 8.2 percentage points."`
2. **Raw Model Probability Delta**:
   - Compared **only** when model and regime semantics are identical.
3. **Rank and Percentile Movement**:
   - Displayed whenever both observations supply valid ranks and percentiles.
   - Preserves population size context (`#5 of 1,620 → #1 of 1,625`).
4. **Single Observed Evaluation**:
   - When only one evaluation exists in history, displays:
     `SINGLE OBSERVED EVALUATION: No prior comparable record available.`
     No synthetic baseline or fabricated change is rendered.

---

## 7. Model / Regime Transitions

IRIS serving encompasses two distinct model regimes across Flash Report history:
- `LEGACY` (`catboost_full_v1__unweighted`, covering `2023-01` through `2025-06`)
- `MODERN` (`logistic_static_only__unweighted`, covering `2025-07` through `2026-07`)

When adjacent evaluation records cross a `model_id` or `regime` boundary:
- A prominent alert is rendered: **`MODEL / REGIME TRANSITION DETECTED`**.
- The UI explicitly states:
  > *"Historical comparison is not treated as a like-for-like probability change. The serving model or regime transitioned between adjacent observations."*
- Like-for-like numerical probability deltas are **suppressed** (`Incompatible for delta`).
- Previous and current model IDs and regimes are displayed side-by-side for transparent auditability.

---

## 8. Calibration State Changes

If `calibration_active` transitions between active and uncalibrated states between adjacent evaluations:
- A dedicated status notice is displayed:
  > *"CALIBRATION STATE CHANGED: Previous was UNCALIBRATED, current is ACTIVE."*

---

## 9. Recent Project-Level Change Evidence (Correction 2)

Project-level physical and financial changes are consumed strictly from the authoritative `ProjectRecentChanges` contract (`/api/v1/projects/{code}/risk-intelligence`):

- `physical_progress_delta`: e.g. `+2.5%`
- `expenditure_delta`: e.g. `₹450.25 Cr`
- `revised_cost_delta`: e.g. `₹0.00 Cr`
- `completion_date_changed`: e.g. `Yes` / `No`

If `recent_changes` has `has_prior_observation: false` or is unavailable:
- Renders:
  `RECENT PROJECT-LEVEL CHANGE EVIDENCE: Not available from the current serving contract.`
- No client-side recalculation or inference from monthly observations is performed.

---

## 10. Empty & Error States

- **Empty Queue**: Rendered when no records are returned for the active cycle:
  > *"No project-level investigation records are available for the current evaluation cycle."*
  Explicitly avoids claiming "No Risk" or "All Clear".
- **Error State**: Rendered when serving API requests fail:
  > *"EARLY WARNING DATA UNAVAILABLE"* with an interactive `RETRY` button.

---

## 11. Deep Navigation Pathways

Every investigation record provides direct contextual navigation:
- **INSPECT**: Navigates to `/projects/{project_code}` for canonical project observation history.
- **INTEL**: Navigates to `/intelligence?project={project_code}` with active project pre-selection.
- **DEEP RISK ANALYSIS**: Section header link into `/intelligence`.
- **VIEW ANALYTICS**: Header action into `/analytics`.

---

## 12. Dimensional Limitations

- **State & Sector**: Fully available and supported for filtering and concentration.
- **District**: Structurally omitted in primary source Flash Reports. Disclosed as `DISTRICT = UNAVAILABLE`.
