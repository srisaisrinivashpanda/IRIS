"""Comprehensive integration and contract tests for Project Risk Intelligence Backend."""

from __future__ import annotations

import csv
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.core.errors import NotFoundError
from backend.app.models.project_month import ProjectMonthObservation
from backend.app.services.project_intelligence import ProjectIntelligenceService
from backend.app.services.risk_service import get_serving_repository, reset_cached_repository


def _parse_optional_float(val: str | None) -> float | None:
    if val is None or val == "":
        return None
    try:
        return float(val)
    except ValueError:
        return None


def _parse_optional_int(val: str | None) -> int | None:
    if val is None or val == "":
        return None
    try:
        return int(val)
    except ValueError:
        return None


@pytest.fixture
def seed_intelligence_projects(db_session: Session) -> list[str]:
    """Seed real project observations from canonical dataset for targeted testing."""
    reset_cached_repository()
    repo = get_serving_repository()
    assert repo.database_path.is_file(), "Production serving SQLite artifact must exist"

    repo_root = Path(__file__).resolve().parents[2]
    csv_path = repo_root / "data" / "processed" / "projects_monthly.csv"
    assert csv_path.is_file(), "Canonical projects_monthly.csv must exist"

    target_codes = {"617936", "N24001573"}
    seeded_obs: list[ProjectMonthObservation] = []

    with csv_path.open("r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            p_code = row["project_code"]
            if p_code in target_codes:
                obs = ProjectMonthObservation(
                    project_code=p_code,
                    legacy_ocms_code=row.get("legacy_ocms_code") or None,
                    pmgid=row.get("pmgid") or None,
                    project_name=row.get("project_name") or "",
                    agency=row.get("agency") or None,
                    ministry=row.get("ministry") or None,
                    sector=row.get("sector") or None,
                    state=row.get("state") or None,
                    approval_date=row.get("approval_date") or None,
                    start_date=row.get("start_date") or None,
                    original_completion_date=row.get("original_completion_date") or None,
                    revised_completion_date=row.get("revised_completion_date") or None,
                    original_cost=_parse_optional_float(row.get("original_cost")),
                    revised_cost=_parse_optional_float(row.get("revised_cost")),
                    cumulative_expenditure=_parse_optional_float(row.get("cumulative_expenditure")),
                    physical_progress=_parse_optional_float(row.get("physical_progress")),
                    report_month=row["report_month"],
                    approval_date_raw=row.get("approval_date_raw") or None,
                    start_date_raw=row.get("start_date_raw") or None,
                    original_completion_date_raw=row.get("original_completion_date_raw") or None,
                    revised_completion_date_raw=row.get("revised_completion_date_raw") or None,
                    original_cost_raw=row.get("original_cost_raw") or None,
                    revised_cost_raw=row.get("revised_cost_raw") or None,
                    cumulative_expenditure_raw=row.get("cumulative_expenditure_raw") or None,
                    physical_progress_raw=row.get("physical_progress_raw") or None,
                    source_file=row.get("source_file") or "test.pdf",
                    source_page=_parse_optional_int(row.get("source_page")) or 1,
                    source_pages=row.get("source_pages") or None,
                    source_row_number=_parse_optional_int(row.get("source_row_number")),
                    source_serial_number=_parse_optional_int(row.get("source_serial_number")),
                    extraction_method=row.get("extraction_method") or "test",
                )
                seeded_obs.append(obs)

    # Also seed a project with NO risk records in the SQLite serving database
    unserved_obs = ProjectMonthObservation(
        project_code="PROJECT_WITHOUT_RISK_001",
        project_name="Rural Electrification Feeder Line",
        agency="REC",
        ministry="MINISTRY OF POWER",
        sector="POWER",
        state="ODISHA",
        report_month="2026-07",
        approval_date="2021-03",
        original_completion_date="2024-03",
        revised_completion_date="2025-06",
        original_cost=500.0,
        revised_cost=620.0,
        cumulative_expenditure=480.0,
        physical_progress=75.0,
        source_file="FlashReport_July_2026.pdf",
        source_page=50,
        extraction_method="test",
    )
    seeded_obs.append(unserved_obs)

    for o in seeded_obs:
        db_session.add(o)
    db_session.commit()

    return list(target_codes) + ["PROJECT_WITHOUT_RISK_001"]


# ---------------------------------------------------------------------------
# Test Category A & E & F & H & M & O: Valid Modern Project Integration
# ---------------------------------------------------------------------------


def test_project_risk_intelligence_valid_modern_project(
    client: TestClient, seed_intelligence_projects: list[str]
) -> None:
    """Verify complete Project Risk Intelligence contract on real Modern project 617936."""
    res = client.get("/api/v1/projects/617936/risk-intelligence")
    assert res.status_code == 200
    data = res.json()

    # Identity
    project = data["project"]
    assert project["project_code"] == "617936"
    assert "NH-63" in project["project_name"]
    assert project["agency"] == "MoRTH"
    assert project["sector"] == "Roads & Highways"
    assert project["state"] == "Telangana"

    # Latest Snapshot (from canonical observation 2026-07)
    snapshot = data["snapshot"]
    assert snapshot is not None
    assert snapshot["report_month"] == "2026-07"
    assert snapshot["physical_progress"] == 100.0
    assert snapshot["original_cost"] == 253.99
    assert snapshot["revised_cost"] == 183.26

    # Production Risk (from latest mature risk assessment 2026-04)
    risk = data["risk"]
    assert risk is not None
    assert risk["report_month"] == "2026-04"
    assert risk["regime"] == "MODERN"
    assert risk["model_id"] == "logistic_static_only__unweighted"
    assert risk["target"] == "target_effective_schedule_ext_3m"
    assert risk["calibration_active"] is True
    assert risk["risk_rank"] == 1
    assert risk["risk_percentile"] == 1.0
    assert risk["population_size"] == 1625

    # Temporal Consistency: Snapshot month and risk month are strictly distinct
    assert snapshot["report_month"] != risk["report_month"]
    assert data["data_availability"]["snapshot_report_month"] == "2026-07"
    assert data["data_availability"]["risk_report_month"] == "2026-04"

    # Model Governance Traceability
    model = data["model"]
    assert model is not None
    assert model["model_id"] == "logistic_static_only__unweighted"
    assert model["target"] == "target_effective_schedule_ext_3m"
    assert "Logistic Regression" in model["model_family"]
    assert model["is_active"] is True
    assert model["coverage_period"] == "2025-07 through 2026-07"
    assert "Platt" in (model["calibration_policy"] or "")

    # Drivers
    drivers = data["drivers"]
    assert len(drivers["strongest_drivers"]) > 0
    first_driver = drivers["strongest_drivers"][0]
    assert first_driver["direction"] in ("POSITIVE", "NEGATIVE")
    assert isinstance(first_driver["contribution"], float)
    assert first_driver["rank"] >= 1


# ---------------------------------------------------------------------------
# Test Category G & M: Valid Legacy Project & Model Regime Traceability
# ---------------------------------------------------------------------------


def test_project_risk_intelligence_valid_legacy_project(
    client: TestClient, seed_intelligence_projects: list[str]
) -> None:
    """Verify legacy project N24001573 correctly identifies CatBoost uncalibrated regime and history."""
    res = client.get("/api/v1/projects/N24001573/risk-intelligence")
    assert res.status_code == 200
    data = res.json()

    project = data["project"]
    assert project["project_code"] == "N24001573"

    risk = data["risk"]
    assert risk is not None
    assert risk["regime"] == "LEGACY"
    assert risk["model_id"] == "catboost_full_v1__unweighted"
    assert risk["calibration_active"] is False

    # Model Governance
    model = data["model"]
    assert model is not None
    assert model["model_id"] == "catboost_full_v1__unweighted"
    assert model["is_active"] is False
    assert "CatBoost" in model["model_family"]

    # History contains chronological legacy points
    history = data["history"]
    assert len(history) == 11
    for idx in range(len(history) - 1):
        assert history[idx]["report_month"] < history[idx + 1]["report_month"]
        assert history[idx]["regime"] == "LEGACY"
        assert history[idx]["model_id"] == "catboost_full_v1__unweighted"


# ---------------------------------------------------------------------------
# Test Category B: Unknown Project Returns HTTP 404
# ---------------------------------------------------------------------------


def test_project_risk_intelligence_unknown_project_404(
    client: TestClient, seed_intelligence_projects: list[str]
) -> None:
    """Verify unknown project code returns clean HTTP 404 without database exception leaks."""
    res = client.get("/api/v1/projects/UNKNOWN_PROJECT_999999/risk-intelligence")
    assert res.status_code == 404
    body = res.json()
    err_code = body.get("error", {}).get("code") or body.get("code")
    assert err_code == "NOT_FOUND"


# ---------------------------------------------------------------------------
# Test Category C: Blank or Whitespace-Only Code Returns HTTP 422
# ---------------------------------------------------------------------------


def test_project_risk_intelligence_blank_code_422(
    client: TestClient, seed_intelligence_projects: list[str]
) -> None:
    """Verify blank or whitespace-only project code returns HTTP 422."""
    res_empty = client.get("/api/v1/projects/%20%20/risk-intelligence")
    assert res_empty.status_code == 422


# ---------------------------------------------------------------------------
# Test Category D: Whitespace Normalization
# ---------------------------------------------------------------------------


def test_project_risk_intelligence_whitespace_normalization(
    client: TestClient, seed_intelligence_projects: list[str]
) -> None:
    """Verify surrounding whitespace in project_code is trimmed before lookup."""
    res = client.get("/api/v1/projects/%20617936%20/risk-intelligence")
    assert res.status_code == 200
    assert res.json()["project"]["project_code"] == "617936"


# ---------------------------------------------------------------------------
# Test Category L: Project Without Risk Assessment Returns HTTP 200 with Nulls
# ---------------------------------------------------------------------------


def test_project_risk_intelligence_project_without_risk(
    client: TestClient, seed_intelligence_projects: list[str]
) -> None:
    """Verify existing project with no serving risk records returns HTTP 200 with risk=null."""
    res = client.get("/api/v1/projects/PROJECT_WITHOUT_RISK_001/risk-intelligence")
    assert res.status_code == 200
    data = res.json()

    assert data["project"]["project_code"] == "PROJECT_WITHOUT_RISK_001"
    assert data["snapshot"]["report_month"] == "2026-07"
    assert data["risk"] is None
    assert data["model"] is None
    assert data["history"] == []
    assert data["drivers"]["top_positive"] == []
    assert data["drivers"]["top_negative"] == []
    assert data["drivers"]["strongest_drivers"] == []

    avail = data["data_availability"]
    assert avail["has_project_data"] is True
    assert avail["has_risk_assessment"] is False
    assert avail["has_risk_history"] is False
    assert avail["has_drivers"] is False
    assert avail["snapshot_report_month"] == "2026-07"
    assert avail["risk_report_month"] is None


# ---------------------------------------------------------------------------
# Test Category I & J: Factual Timeline Signals and Adjacent-Month Deltas
# ---------------------------------------------------------------------------


def test_project_risk_intelligence_factual_signals_and_deltas(
    client: TestClient, seed_intelligence_projects: list[str]
) -> None:
    """Verify signals and recent changes strictly derive from stored observation history."""
    res = client.get("/api/v1/projects/617936/risk-intelligence")
    assert res.status_code == 200
    data = res.json()

    signals = data["signals"]
    assert signals["reporting_months_count"] == 8
    assert signals["first_reported_month"] == "2025-12"
    assert signals["latest_reported_month"] == "2026-07"
    assert signals["cost_revised"] is True

    changes = data["recent_changes"]
    assert changes["has_prior_observation"] is True
    assert changes["prior_report_month"] == "2026-06"
    assert isinstance(changes["physical_progress_delta"], (int, float))

    # Single-observation project has no prior observation
    res_single = client.get("/api/v1/projects/PROJECT_WITHOUT_RISK_001/risk-intelligence")
    assert res_single.status_code == 200
    single_changes = res_single.json()["recent_changes"]
    assert single_changes["has_prior_observation"] is False
    assert single_changes["prior_report_month"] is None
    assert single_changes["physical_progress_delta"] is None
    assert single_changes["expenditure_delta"] is None


# ---------------------------------------------------------------------------
# Test Category K: Explicitly Unserved ML Targets
# ---------------------------------------------------------------------------


def test_project_risk_intelligence_unserved_targets_explicit(
    client: TestClient, seed_intelligence_projects: list[str]
) -> None:
    """Verify cost overrun and progress stagnation ML domains are strictly unserved."""
    res = client.get("/api/v1/projects/617936/risk-intelligence")
    assert res.status_code == 200
    data = res.json()

    avail = data["data_availability"]
    assert avail["cost_risk_ml_served"] is False
    assert avail["progress_stagnation_ml_served"] is False

    text = res.text
    assert "cost_overrun_probability" not in text
    assert "progress_stagnation_probability" not in text


# ---------------------------------------------------------------------------
# Test Category N: Response Determinism
# ---------------------------------------------------------------------------


def test_project_risk_intelligence_determinism(
    client: TestClient, seed_intelligence_projects: list[str]
) -> None:
    """Verify repeated requests produce identical parsed JSON and driver ordering."""
    res1 = client.get("/api/v1/projects/617936/risk-intelligence")
    res2 = client.get("/api/v1/projects/617936/risk-intelligence")

    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json() == res2.json()


# ---------------------------------------------------------------------------
# Direct Service Unit Verification (Outside FastAPI)
# ---------------------------------------------------------------------------


def test_project_intelligence_service_direct(
    db_session: Session, seed_intelligence_projects: list[str]
) -> None:
    """Verify ProjectIntelligenceService behavior directly against domain repository."""
    service = ProjectIntelligenceService(db_session)

    # Valid execution
    resp = service.get_project_risk_intelligence("617936")
    assert resp.project.project_code == "617936"
    assert resp.data_availability.has_project_data is True

    # Blank code raises ValueError
    with pytest.raises(ValueError, match="cannot be blank"):
        service.get_project_risk_intelligence("   ")

    # Unknown project raises NotFoundError (not FastAPI HTTPException)
    with pytest.raises(NotFoundError):
        service.get_project_risk_intelligence("NONEXISTENT_PROJECT_CODE")
