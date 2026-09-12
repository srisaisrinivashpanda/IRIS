"""Authoritative centralized Model Registry and ML Governance definitions for IRIS.

All metadata exposed here is traceable to:
- data/serving/serving_manifest.json
- docs/MODELING_HANDOFF.md
- docs/calibration_policy.md
- docs/model_target_spec.md
- docs/explanation_contract.md
"""

from __future__ import annotations

from typing import Any

# Authoritative feature lists for locked models
MODERN_STATIC_FEATURES: list[str] = [
    "sector",
    "agency",
    "state",
    "original_cost",
    "cumulative_expenditure_t",
    "revised_cost_t",
    "physical_progress_t",
    "project_age_months",
    "months_to_original_schedule",
    "months_to_effective_schedule",
    "schedule_revision_lag_months",
    "schedule_has_been_revised",
]

LEGACY_FULL_FEATURES: list[str] = [
    "sector",
    "agency",
    "state",
    "original_cost",
    "cumulative_expenditure_t",
    "revised_cost_t",
    "physical_progress_t",
    "project_age_months",
    "months_to_original_schedule",
    "months_to_effective_schedule",
    "schedule_revision_lag_months",
    "schedule_has_been_revised",
    "months_since_start",
    "expenditure_to_original_cost_ratio",
    "revised_to_original_cost_ratio",
    "cost_has_been_revised",
    "exp_delta_1m",
    "exp_delta_3m",
]

# Centralized Model Registry Definitions
MODELS: dict[str, dict[str, Any]] = {
    "logistic_static_only__unweighted": {
        "model_id": "logistic_static_only__unweighted",
        "model_name": "Modern Production Logistic Regression (Static-Only)",
        "target": "target_effective_schedule_ext_3m",
        "domain": "SCHEDULE_RISK",
        "regime": "MODERN",
        "model_family": "L2-Regularized Logistic Regression",
        "status": "ACTIVE_PRODUCTION",
        "is_active": True,
        "coverage_period": "2025-07 through 2026-07",
        "horizon_months": 3,
        "features_count": len(MODERN_STATIC_FEATURES),
        "features": MODERN_STATIC_FEATURES,
        "explanation_method": "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE",
        "calibration": {
            "status": "ACTIVE",
            "policy": "Temporal Platt Scaling (active on 2026-04; origins M1-M4 uncalibrated due to strict label embargo)",
            "method": "PLATT_SCALING",
            "active_origin": "2026-04",
            "slope": 1.20633,
            "intercept": 0.45513,
            "brier_before": 0.18024,
            "brier_after": 0.16710,
        },
        "serving": {
            "status": "DEPLOYED",
            "artifact_version": "iris_serving_v1_1",
            "contract_version": "1.1",
            "database_filename": "iris_risk_serving_v1.sqlite3",
            "record_count": 8190,
        },
        "metrics": {
            "average_precision": 0.7587,
            "average_precision_ci": [0.7340, 0.7861],
            "roc_auc": 0.8419,
            "brier_score": 0.16710,
            "ece": 0.08535,
            "evaluation_notes": (
                "Pooled Modern evaluation across 5 walk-forward origins. "
                "Platt calibration active on 2026-04 (M5); Brier improves from 0.18024 to 0.16710, "
                "ECE from 0.11217 to 0.08535."
            ),
        },
        "limitations": [
            (
                "Early Modern origins 2025-12 through 2026-03 (M1-M4) structurally lack "
                "mature chronological history under strict label embargo and remain uncalibrated."
            ),
            (
                "Project codes shifted from legacy format to 6-digit codes in July 2025; "
                "no direct identifier crosswalk exists across the June/July 2025 boundary."
            ),
        ],
    },
    "catboost_full_v1__unweighted": {
        "model_id": "catboost_full_v1__unweighted",
        "model_name": "Legacy Production Gradient Boosted Trees (CatBoost Full v1)",
        "target": "target_effective_schedule_ext_3m",
        "domain": "SCHEDULE_RISK",
        "regime": "LEGACY",
        "model_family": "Gradient Boosted Decision Trees (CatBoost)",
        "status": "HISTORICAL_PRODUCTION",
        "is_active": False,
        "coverage_period": "2023-01 through 2025-06",
        "horizon_months": 3,
        "features_count": len(LEGACY_FULL_FEATURES),
        "features": LEGACY_FULL_FEATURES,
        "explanation_method": "CATBOOST_NATIVE_TREESHAP",
        "calibration": {
            "status": "UNCALIBRATED",
            "policy": (
                "Uncalibrated (ranking score matches raw operational probability; "
                "naturally well-calibrated on ~9.5% prevalence legacy portfolio)"
            ),
            "method": None,
            "active_origin": None,
            "slope": None,
            "intercept": None,
            "brier_before": None,
            "brier_after": None,
        },
        "serving": {
            "status": "DEPLOYED",
            "artifact_version": "iris_serving_v1_1",
            "contract_version": "1.1",
            "database_filename": "iris_risk_serving_v1.sqlite3",
            "record_count": 16999,
        },
        "metrics": {
            "average_precision": 0.4071,
            "average_precision_ci": [0.3541, 0.4578],
            "roc_auc": 0.7852,
            "brier_score": 0.0720,
            "ece": 0.0287,
            "evaluation_notes": (
                "Pooled Legacy evaluation across 12 walk-forward origins. "
                "Resolves probability distortion without class weighting; "
                "ECE is 0.0287 and Brier score is 0.0720."
            ),
        },
        "limitations": [
            (
                "February 2025 exhibits known source-reporting anomalies and heightened "
                "volatility across evaluation folds."
            ),
            (
                "Historical serving coverage only; not active for post-June 2025 project "
                "observations."
            ),
        ],
    },
}

ACTIVE_MODEL_ID = "logistic_static_only__unweighted"

# ML Target Domains Registry
TARGETS: dict[str, dict[str, Any]] = {
    "target_effective_schedule_ext_3m": {
        "target_id": "target_effective_schedule_ext_3m",
        "name": "Effective Schedule Extension (>= 3 Months)",
        "domain": "SCHEDULE_RISK",
        "status": "IMPLEMENTED_AND_SERVED",
        "is_served": True,
        "horizon_months": 3,
        "description": (
            "Predicts whether an ongoing infrastructure project's effective completion "
            "schedule slips by 3 or more months within the subsequent 3-month observation window."
        ),
        "production_models": [
            "logistic_static_only__unweighted",
            "catboost_full_v1__unweighted",
        ],
    },
    "target_effective_cost_esc_3m": {
        "target_id": "target_effective_cost_esc_3m",
        "name": "Effective Cost Escalation (3 Months)",
        "domain": "COST_RISK",
        "status": "SPECIFICATION_ONLY",
        "is_served": False,
        "horizon_months": 3,
        "description": (
            "Specification for 3-month interim cost escalation early-warning. "
            "Not trained, not validated, not served in IRIS v1."
        ),
        "production_models": [],
    },
    "target_progress_stagnation_3m": {
        "target_id": "target_progress_stagnation_3m",
        "name": "Physical Progress Stagnation (3 Months)",
        "domain": "PROGRESS_RISK",
        "status": "SPECIFICATION_ONLY",
        "is_served": False,
        "horizon_months": 3,
        "description": (
            "Specification for physical progress stagnation (delta <= 0). "
            "Not trained, not validated, not served in IRIS v1."
        ),
        "production_models": [],
    },
}


def get_model_registry() -> list[dict[str, Any]]:
    """Return all production models in deterministic order (active model first)."""
    ordered_ids = [
        ACTIVE_MODEL_ID,
        *(mid for mid in sorted(MODELS) if mid != ACTIVE_MODEL_ID),
    ]
    return [MODELS[mid] for mid in ordered_ids]


def get_active_model() -> dict[str, Any]:
    """Return the currently active production model."""
    return MODELS[ACTIVE_MODEL_ID]


def get_model_by_id(model_id: str) -> dict[str, Any] | None:
    """Exact model lookup with whitespace normalization."""
    cleaned = model_id.strip()
    return MODELS.get(cleaned)


def get_target_registry() -> list[dict[str, Any]]:
    """Return all registered target domains in deterministic order."""
    # Served targets first, then specifications in alphabetical order
    served = [t for t in TARGETS.values() if t["is_served"]]
    unserved = sorted(
        [t for t in TARGETS.values() if not t["is_served"]],
        key=lambda item: item["target_id"],
    )
    return [*served, *unserved]


def get_target_by_id(target_id: str) -> dict[str, Any] | None:
    """Exact target lookup with whitespace normalization."""
    cleaned = target_id.strip()
    return TARGETS.get(cleaned)
