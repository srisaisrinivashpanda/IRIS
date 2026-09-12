"""Comprehensive contract tests for IRIS Model Registry and ML Governance API."""

from __future__ import annotations

import json
from fastapi.testclient import TestClient

from backend.app.services.risk_service import get_serving_repository, reset_cached_repository


def test_models_list_authoritative_contract(client: TestClient) -> None:
    """Verify GET /api/v1/risk/models returns deterministic list of authoritative production models."""
    response = client.get("/api/v1/risk/models")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 2
    assert data["active_model_id"] == "logistic_static_only__unweighted"
    assert len(data["models"]) == 2

    # Verify deterministic ordering: Active modern model first, Legacy historical model second
    model_ids = [m["model_id"] for m in data["models"]]
    assert model_ids == [
        "logistic_static_only__unweighted",
        "catboost_full_v1__unweighted",
    ]

    for model in data["models"]:
        assert model["target"] == "target_effective_schedule_ext_3m"
        assert model["domain"] == "SCHEDULE_RISK"
        assert model["horizon_months"] == 3
        assert model["features_count"] == len(model["features"])
        assert model["serving"]["status"] == "DEPLOYED"
        assert model["serving"]["artifact_version"] == "iris_serving_v1_1"
        assert model["serving"]["contract_version"] == "1.1"
        assert model["serving"]["database_filename"] == "iris_risk_serving_v1.sqlite3"


def test_single_implemented_target_governance(client: TestClient) -> None:
    """Verify target registry establishes schedule-risk as only served target, with cost/progress as spec-only."""
    response = client.get("/api/v1/risk/targets")
    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 3
    assert data["implemented_count"] == 1

    targets_by_id = {t["target_id"]: t for t in data["targets"]}

    # Schedule extension target: Implemented and served
    schedule = targets_by_id["target_effective_schedule_ext_3m"]
    assert schedule["status"] == "IMPLEMENTED_AND_SERVED"
    assert schedule["is_served"] is True
    assert schedule["domain"] == "SCHEDULE_RISK"
    assert schedule["horizon_months"] == 3
    assert set(schedule["production_models"]) == {
        "logistic_static_only__unweighted",
        "catboost_full_v1__unweighted",
    }

    # Cost escalation target: Specification only, unserved
    cost = targets_by_id["target_effective_cost_esc_3m"]
    assert cost["status"] == "SPECIFICATION_ONLY"
    assert cost["is_served"] is False
    assert cost["domain"] == "COST_RISK"
    assert cost["horizon_months"] == 3
    assert cost["production_models"] == []

    # Progress stagnation target: Specification only, unserved
    progress = targets_by_id["target_progress_stagnation_3m"]
    assert progress["status"] == "SPECIFICATION_ONLY"
    assert progress["is_served"] is False
    assert progress["domain"] == "PROGRESS_RISK"
    assert progress["horizon_months"] == 3
    assert progress["production_models"] == []


def test_active_model_endpoint(client: TestClient) -> None:
    """Verify GET /api/v1/risk/models/active returns the exact active Modern production model."""
    response = client.get("/api/v1/risk/models/active")
    assert response.status_code == 200
    model = response.json()

    assert model["model_id"] == "logistic_static_only__unweighted"
    assert model["model_name"] == "Modern Production Logistic Regression (Static-Only)"
    assert model["is_active"] is True
    assert model["status"] == "ACTIVE_PRODUCTION"
    assert model["regime"] == "MODERN"
    assert "Logistic Regression" in model["model_family"]
    assert model["coverage_period"] == "2025-07 through 2026-07"
    assert model["features_count"] == 12

    # Calibration governance
    calib = model["calibration"]
    assert calib["status"] == "ACTIVE"
    assert calib["method"] == "PLATT_SCALING"
    assert calib["active_origin"] == "2026-04"
    assert calib["slope"] == 1.20633
    assert calib["intercept"] == 0.45513
    assert calib["brier_before"] == 0.18024
    assert calib["brier_after"] == 0.16710

    # Serving artifact record count
    assert model["serving"]["record_count"] == 8190


def test_legacy_model_lookup_and_calibration(client: TestClient) -> None:
    """Verify GET /api/v1/risk/models/{model_id} for historical Legacy CatBoost model."""
    response = client.get("/api/v1/risk/models/catboost_full_v1__unweighted")
    assert response.status_code == 200
    model = response.json()

    assert model["model_id"] == "catboost_full_v1__unweighted"
    assert model["model_name"] == "Legacy Production Gradient Boosted Trees (CatBoost Full v1)"
    assert model["is_active"] is False
    assert model["status"] == "HISTORICAL_PRODUCTION"
    assert model["regime"] == "LEGACY"
    assert "CatBoost" in model["model_family"]
    assert model["coverage_period"] == "2023-01 through 2025-06"
    assert model["features_count"] == 18

    # Uncalibrated operational scores
    calib = model["calibration"]
    assert calib["status"] == "UNCALIBRATED"
    assert calib["method"] is None
    assert calib["slope"] is None

    # Authoritative evaluation metrics
    metrics = model["metrics"]
    assert metrics is not None
    assert metrics["average_precision"] == 0.4071
    assert metrics["average_precision_ci"] == [0.3541, 0.4578]
    assert metrics["roc_auc"] == 0.7852
    assert metrics["brier_score"] == 0.0720
    assert metrics["ece"] == 0.0287

    # Serving artifact record count
    assert model["serving"]["record_count"] == 16999


def test_modern_model_metrics_traceability(client: TestClient) -> None:
    """Verify authoritative metrics for the modern logistic regression model."""
    response = client.get("/api/v1/risk/models/logistic_static_only__unweighted")
    assert response.status_code == 200
    model = response.json()

    metrics = model["metrics"]
    assert metrics is not None
    assert metrics["average_precision"] == 0.7587
    assert metrics["average_precision_ci"] == [0.7340, 0.7861]
    assert metrics["roc_auc"] == 0.8419
    assert metrics["brier_score"] == 0.16710
    assert metrics["ece"] == 0.08535


def test_model_lookup_whitespace_handling(client: TestClient) -> None:
    """Verify leading and trailing whitespace in model_id is trimmed."""
    response = client.get("/api/v1/risk/models/%20%20logistic_static_only__unweighted%20%20")
    assert response.status_code == 200
    data = response.json()
    assert data["model_id"] == "logistic_static_only__unweighted"


def test_model_lookup_validation_and_path_safety(client: TestClient) -> None:
    """Verify unknown IDs, empty inputs, and path traversal strings return appropriate errors."""
    # Empty / whitespace-only model ID -> 422
    res_empty = client.get("/api/v1/risk/models/%20%20")
    assert res_empty.status_code == 422

    # Unknown model ID -> 404
    res_unknown = client.get("/api/v1/risk/models/xgboost_unknown_model")
    assert res_unknown.status_code == 404
    err_msg = res_unknown.json().get("error", {}).get("message") or res_unknown.json().get("detail", "")
    assert "not found in registry" in err_msg

    # Path traversal string -> 404 (does not access arbitrary paths)
    res_traversal = client.get("/api/v1/risk/models/..%2F..%2Fmodel")
    assert res_traversal.status_code == 404


def test_serving_artifact_governance_integrity(client: TestClient) -> None:
    """Verify that serving artifact metadata in registry sums to exact SQLite project-month count."""
    response = client.get("/api/v1/risk/models")
    assert response.status_code == 200
    data = response.json()

    total_records = sum(m["serving"]["record_count"] for m in data["models"])
    assert total_records == 25189


def test_backwards_compatibility_model_info(client: TestClient) -> None:
    """Verify GET /api/v1/risk/model-info continues to return its exact established contract."""
    response = client.get("/api/v1/risk/model-info")
    assert response.status_code == 200
    data = response.json()

    assert data["serving_artifact_version"] == "iris_serving_v1_1"
    assert data["target"] == "target_effective_schedule_ext_3m"
    assert data["horizon_months"] == 3
    assert data["status"] == "READY"
    assert len(data["models"]) == 2

    legacy = next(m for m in data["models"] if m["regime"] == "LEGACY")
    assert legacy["model_id"] == "catboost_full_v1__unweighted"
    assert legacy["coverage_period"] == "2023-01 through 2025-06"
    assert legacy["features_count"] == 18

    modern = next(m for m in data["models"] if m["regime"] == "MODERN")
    assert modern["model_id"] == "logistic_static_only__unweighted"
    assert modern["coverage_period"] == "2025-07 through 2026-07"
    assert modern["features_count"] == 12


def test_registry_determinism(client: TestClient) -> None:
    """Verify that repeated requests produce identical parsed JSON responses."""
    url = "/api/v1/risk/models"
    res1 = client.get(url)
    res2 = client.get(url)

    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json() == res2.json()


def test_direct_risk_routes_proxy(client: TestClient) -> None:
    """Verify /risk routes mounted at root work identically to /api/v1/risk routes."""
    res_direct_models = client.get("/risk/models")
    res_v1_models = client.get("/api/v1/risk/models")
    assert res_direct_models.status_code == 200
    assert res_direct_models.json() == res_v1_models.json()

    res_direct_active = client.get("/risk/models/active")
    res_v1_active = client.get("/api/v1/risk/models/active")
    assert res_direct_active.status_code == 200
    assert res_direct_active.json() == res_v1_active.json()

    res_direct_targets = client.get("/risk/targets")
    res_v1_targets = client.get("/api/v1/risk/targets")
    assert res_direct_targets.status_code == 200
    assert res_direct_targets.json() == res_v1_targets.json()
