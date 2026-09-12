"""Production serving integration tests for IRIS schedule risk against the real serving artifact."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.app.services.risk_service import get_serving_repository, reset_cached_repository


@pytest.fixture(autouse=True)
def ensure_production_artifact() -> None:
    """Ensure the test runs against the real production serving artifact."""
    reset_cached_repository()
    repo = get_serving_repository()
    assert repo.database_path.is_file(), "Production serving SQLite artifact is missing"


def test_production_model_info_contract(client: TestClient) -> None:
    """Verify production model governance endpoint returns exact locked models and coverage periods."""
    response = client.get("/api/v1/risk/model-info")
    assert response.status_code == 200
    data = response.json()

    assert data["target"] == "target_effective_schedule_ext_3m"
    assert data["horizon_months"] == 3
    assert data["status"] == "READY"
    assert len(data["models"]) == 2

    # Legacy CatBoost model
    legacy = next(m for m in data["models"] if m["regime"] == "LEGACY")
    assert legacy["model_id"] == "catboost_full_v1__unweighted"
    assert "CatBoost" in legacy["family"]
    assert legacy["features_count"] == 18
    assert legacy["explanation_method"] == "CATBOOST_NATIVE_TREESHAP"
    assert legacy["coverage_period"] == "2023-01 through 2025-06"
    assert legacy["status"] == "READY"

    # Modern Logistic model
    modern = next(m for m in data["models"] if m["regime"] == "MODERN")
    assert modern["model_id"] == "logistic_static_only__unweighted"
    assert "Logistic Regression" in modern["family"]
    assert modern["features_count"] == 12
    assert modern["explanation_method"] == "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE"
    assert modern["coverage_period"] == "2025-07 through 2026-07"
    assert modern["status"] == "READY"


def test_production_modern_project_retrieval(client: TestClient) -> None:
    """Verify retrieval of a real Modern regime project with Platt calibration active."""
    response = client.get(
        "/api/v1/risk/project/617936",
        params={"report_month": "2026-04"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["project_code"] == "617936"
    assert data["report_month"] == "2026-04"
    assert data["regime"] == "MODERN"
    assert data["model_id"] == "logistic_static_only__unweighted"
    assert data["calibration_active"] is True
    assert data["risk_rank"] == 1
    assert data["risk_percentile"] == 1.0
    assert data["population_size"] == 1625

    # Verify contributors
    positives = data["top_positive_contributors"]
    negatives = data["top_negative_contributors"]
    assert len(positives) > 0
    assert len(negatives) > 0

    # Verify positive contributors are strictly sorted by rank and positive direction
    for i, item in enumerate(positives, start=1):
        assert item["direction"] == "POSITIVE"
        assert item["rank"] == i
        assert item["contribution"] >= 0.0
        assert item["display_name"] is not None

    for i, item in enumerate(negatives, start=1):
        assert item["direction"] == "NEGATIVE"
        assert item["rank"] == i
        assert item["contribution"] <= 0.0
        assert item["display_name"] is not None


def test_production_legacy_project_retrieval(client: TestClient) -> None:
    """Verify retrieval of a real Legacy regime project with TreeSHAP contributors."""
    response = client.get(
        "/api/v1/risk/project/N24001573",
        params={"report_month": "2025-03"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["project_code"] == "N24001573"
    assert data["report_month"] == "2025-03"
    assert data["regime"] == "LEGACY"
    assert data["model_id"] == "catboost_full_v1__unweighted"
    assert data["calibration_active"] is False
    assert data["risk_rank"] == 1
    assert data["risk_percentile"] == 1.0
    assert data["population_size"] == 1446


def test_production_project_history_ordering_and_no_crosswalk(client: TestClient) -> None:
    """Verify project history is strictly chronological and never mixes regimes or crosswalks."""
    response = client.get("/api/v1/risk/project/617936/history")
    assert response.status_code == 200
    data = response.json()

    assert data["project_code"] == "617936"
    assert data["count"] == 5
    months = [item["report_month"] for item in data["items"]]
    assert months == ["2025-12", "2026-01", "2026-02", "2026-03", "2026-04"]

    for item in data["items"]:
        assert item["project_code"] == "617936"
        assert item["regime"] == "MODERN"


def test_production_parameter_validation_and_trimming(client: TestClient) -> None:
    """Verify strict validation and whitespace trimming for project_code and report_month."""
    # Whitespace in project_code should be trimmed and succeed
    res_trimmed = client.get(
        "/api/v1/risk/project/%20%20617936%20%20",
        params={"report_month": "2026-04"},
    )
    assert res_trimmed.status_code == 200
    assert res_trimmed.json()["project_code"] == "617936"

    # Empty or whitespace-only project code in history endpoint returns 422
    res_empty = client.get("/api/v1/risk/project/%20%20/history")
    assert res_empty.status_code == 422

    # Unknown project returns 404
    res_404 = client.get(
        "/api/v1/risk/project/UNKNOWN_99999",
        params={"report_month": "2026-04"},
    )
    assert res_404.status_code == 404

    # Malformed month format returns 422
    res_month_422 = client.get(
        "/api/v1/risk/project/617936",
        params={"report_month": "2026-13"},
    )
    assert res_month_422.status_code == 422

    # Non-existent month returns 404
    res_month_404 = client.get(
        "/api/v1/risk/projects",
        params={"report_month": "2099-01"},
    )
    assert res_month_404.status_code == 404


def test_production_determinism_and_ranking_order(client: TestClient) -> None:
    """Verify that repeated requests produce byte-for-byte identical output and strict risk rank."""
    url = "/api/v1/risk/projects?report_month=2026-04&page=1&page_size=15"
    res1 = client.get(url)
    res2 = client.get(url)

    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.text == res2.text

    items = res1.json()["items"]
    assert len(items) == 15
    for i, item in enumerate(items, start=1):
        assert item["risk_rank"] == i


def test_production_sqlite_read_only_pragma() -> None:
    """Verify that the SQLite serving connection actively enforces PRAGMA query_only."""
    repo = get_serving_repository()
    connection = repo._connect()
    try:
        cursor = connection.execute("PRAGMA query_only")
        row = cursor.fetchone()
        assert row[0] == 1

        with pytest.raises(sqlite3.OperationalError, match="readonly"):
            connection.execute("CREATE TABLE test_violation (id INT)")
    finally:
        connection.close()


def test_production_zero_future_or_completion_labels(client: TestClient) -> None:
    """Verify that realized labels and completed metadata are absent from production responses."""
    prohibited = [
        "actual_completion_date",
        "future_label",
        "is_completed",
        "eventually_completed",
        "completion_report_month",
    ]

    response = client.get(
        "/api/v1/risk/project/617936",
        params={"report_month": "2026-04"},
    )
    assert response.status_code == 200
    text = response.text
    for term in prohibited:
        assert term not in text, f"Prohibited label {term} found in response"
