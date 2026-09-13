"""Comprehensive tests for Analytics Backend & Aggregations (PR-09)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.models.project_month import ProjectMonthObservation


@pytest.fixture
def analytics_seed_data(db_session: Session) -> list[ProjectMonthObservation]:
    """Seed multi-month observations with known, deterministically auditable values."""
    records = [
        # Project 1: P1001 (Railways, Maharashtra, DFCCIL) - 4 observations
        ProjectMonthObservation(
            project_code="P1001",
            project_name="Western Dedicated Freight Corridor",
            agency="DFCCIL",
            ministry="RAILWAYS",
            sector="RAILWAYS",
            state="MAHARASHTRA",
            report_month="2025-01",
            original_cost=100.0,
            revised_cost=120.0,
            cumulative_expenditure=20.0,
            physical_progress=10.0,
            source_file="f_2025_01.pdf",
            source_page=1,
            extraction_method="test",
        ),
        ProjectMonthObservation(
            project_code="P1001",
            project_name="Western Dedicated Freight Corridor",
            agency="DFCCIL",
            ministry="RAILWAYS",
            sector="RAILWAYS",
            state="MAHARASHTRA",
            report_month="2025-03",
            original_cost=100.0,
            revised_cost=130.0,
            cumulative_expenditure=40.0,
            physical_progress=25.0,
            source_file="f_2025_03.pdf",
            source_page=1,
            extraction_method="test",
        ),
        ProjectMonthObservation(
            project_code="P1001",
            project_name="Western Dedicated Freight Corridor",
            agency="DFCCIL",
            ministry="RAILWAYS",
            sector="RAILWAYS",
            state="MAHARASHTRA",
            report_month="2025-06",
            original_cost=100.0,
            revised_cost=140.0,
            cumulative_expenditure=60.0,
            physical_progress=40.0,
            source_file="f_2025_06.pdf",
            source_page=1,
            extraction_method="test",
        ),
        ProjectMonthObservation(
            project_code="P1001",
            project_name="Western Dedicated Freight Corridor",
            agency="DFCCIL",
            ministry="RAILWAYS",
            sector="RAILWAYS",
            state="MAHARASHTRA",
            report_month="2026-01",
            original_cost=100.0,
            revised_cost=150.0,
            cumulative_expenditure=80.0,
            physical_progress=60.0,
            source_file="f_2026_01.pdf",
            source_page=1,
            extraction_method="test",
        ),
        # Project 2: P2002 (Road Transport, Gujarat, NHAI) - 2 observations (1 missing progress)
        ProjectMonthObservation(
            project_code="P2002",
            project_name="Ahmedabad Vadodara Expressway",
            agency="NHAI",
            ministry="ROAD TRANSPORT AND HIGHWAYS",
            sector="ROAD TRANSPORT",
            state="GUJARAT",
            report_month="2025-02",
            original_cost=200.0,
            revised_cost=None,
            cumulative_expenditure=50.0,
            physical_progress=None,  # Missing progress
            source_file="f_2025_02.pdf",
            source_page=2,
            extraction_method="test",
        ),
        ProjectMonthObservation(
            project_code="P2002",
            project_name="Ahmedabad Vadodara Expressway",
            agency="NHAI",
            ministry="ROAD TRANSPORT AND HIGHWAYS",
            sector="ROAD TRANSPORT",
            state="GUJARAT",
            report_month="2025-05",
            original_cost=200.0,
            revised_cost=220.0,
            cumulative_expenditure=100.0,
            physical_progress=50.0,
            source_file="f_2025_05.pdf",
            source_page=2,
            extraction_method="test",
        ),
        # Project 3: P3003 (Road Transport, Maharashtra, NHAI) - 1 observation
        ProjectMonthObservation(
            project_code="P3003",
            project_name="Pune Ring Road Section",
            agency="NHAI",
            ministry="ROAD TRANSPORT AND HIGHWAYS",
            sector="ROAD TRANSPORT",
            state="MAHARASHTRA",
            report_month="2025-03",
            original_cost=300.0,
            revised_cost=None,
            cumulative_expenditure=150.0,
            physical_progress=75.0,
            source_file="f_2025_03.pdf",
            source_page=3,
            extraction_method="test",
        ),
    ]
    db_session.add_all(records)
    db_session.commit()
    return records


# -----------------------------------------------------------------------------
# 1. OVERVIEW ENDPOINT & DETERMINISTIC COUNTS
# -----------------------------------------------------------------------------

def test_overview_unfiltered(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Test overview returns deterministic counts and correctly distinguishes unique projects vs observations."""
    resp = client.get("/api/v1/analytics/overview")
    assert resp.status_code == 200
    data = resp.json()

    assert data["observation_count"] == 7
    assert data["unique_project_count"] == 3
    assert data["states_count"] == 2
    assert data["agencies_count"] == 2
    assert data["sectors_count"] == 2
    assert data["districts_count"] is None
    assert data["earliest_observation_month"] == "2025-01"
    assert data["latest_observation_month"] == "2026-01"

    # Coverage metadata
    cov = data["coverage"]
    assert cov["total_observations"] == 7
    assert cov["unique_projects"] == 3
    assert cov["missing_physical_progress_count"] == 1
    assert "district" in cov["unavailable_dimensions"]


def test_unique_project_count_differs_from_observation_count(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Requirement 2: Ensure unique_project_count != observation_count across multi-month data."""
    resp = client.get("/api/v1/analytics/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["unique_project_count"] == 3
    assert data["observation_count"] == 7
    assert data["unique_project_count"] < data["observation_count"]


# -----------------------------------------------------------------------------
# 2. FINANCIAL LATEST-OBSERVATION RULE (USER MANDATED TEST)
# -----------------------------------------------------------------------------

def test_financial_latest_observation_within_filter_scope(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Requirement 13 & User Correction:
    When filtering 2025-01..2025-06, P1's latest observation in scope is 2025-06 (cost=100, rev=140, exp=60).
    It must NOT use P1's globally latest 2026-01 record (rev=150, exp=80).
    Total cost: 100 (P1) + 200 (P2) + 300 (P3) = 600.0.
    Total rev: 140 (P1) + 220 (P2) = 360.0.
    Total exp: 60 (P1) + 100 (P2) + 150 (P3) = 310.0.
    """
    resp = client.get("/api/v1/analytics/overview?from_month=2025-01&to_month=2025-06")
    assert resp.status_code == 200
    data = resp.json()

    assert data["observation_count"] == 6
    assert data["unique_project_count"] == 3
    assert data["total_sanctioned_cost"] == 600.0
    assert data["total_revised_cost"] == 360.0
    assert data["total_cumulative_expenditure"] == 310.0


def test_financials_endpoint_metrics(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Contract test for GET /api/v1/analytics/financials."""
    resp = client.get("/api/v1/analytics/financials?from_month=2025-01&to_month=2025-06")
    assert resp.status_code == 200
    data = resp.json()

    assert data["observation_count"] == 6
    assert data["unique_project_count"] == 3

    m = data["metrics"]
    assert m["projects_with_cost"] == 3
    assert m["total_original_cost"] == 600.0
    assert m["mean_original_cost"] == 200.0
    assert m["projects_with_revised_cost"] == 2
    assert m["total_revised_cost"] == 360.0
    assert m["projects_with_expenditure"] == 3
    assert m["total_cumulative_expenditure"] == 310.0
    # Overruns: P1 (140 > 100 = 40 escalation), P2 (220 > 200 = 20 escalation) => 2 projects, 60.0 escalation
    assert m["cost_revision_projects_count"] == 2
    assert m["total_cost_escalation"] == 60.0


# -----------------------------------------------------------------------------
# 3. PHYSICAL PROGRESS SEMANTICS
# -----------------------------------------------------------------------------

def test_progress_denominator_excludes_missing(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Requirement 14: Progress arithmetic mean denominator excludes missing observations.
    In 2025-01..2025-06:
    Progress values: P1 (10, 25, 40), P2 (None, 50), P3 (75).
    Reporting values: [10, 25, 40, 50, 75] -> sum=200.0, count=5.
    Mean = 200.0 / 5 = 40.0. (NOT 200/6 = 33.33).
    """
    resp = client.get("/api/v1/analytics/progress?from_month=2025-01&to_month=2025-06")
    assert resp.status_code == 200
    data = resp.json()

    m = data["metrics"]
    assert m["total_observations"] == 6
    assert m["reporting_observations"] == 5
    assert m["missing_observations"] == 1
    assert m["mean_physical_progress"] == 40.0
    assert m["min_physical_progress"] == 10.0
    assert m["max_physical_progress"] == 75.0
    assert m["median_physical_progress"] == 40.0

    # Sector breakdown
    assert len(data["by_sector"]) == 2


# -----------------------------------------------------------------------------
# 4. TRENDS & TEMPORAL INTEGRITY
# -----------------------------------------------------------------------------

def test_trends_strictly_observed_months(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Requirement 3 & 4: Only observed months are returned; no synthetic zero months."""
    resp = client.get("/api/v1/analytics/trends")
    assert resp.status_code == 200
    data = resp.json()

    # Observed months in seed: 2025-01, 2025-02, 2025-03, 2025-05, 2025-06, 2026-01 (6 distinct months)
    # Notice: 2025-04 is unobserved in seed and must NOT be in the results!
    months = [item["report_month"] for item in data["items"]]
    assert "2025-04" not in months
    assert months == ["2025-01", "2025-02", "2025-03", "2025-05", "2025-06", "2026-01"]
    assert data["total_months"] == 6
    assert data["earliest_month"] == "2025-01"
    assert data["latest_month"] == "2026-01"


# -----------------------------------------------------------------------------
# 5. GEOGRAPHY, SECTORS, AGENCIES GROUPING & DETERMINISM
# -----------------------------------------------------------------------------

def test_geography_state_grouping_and_determinism(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Requirement 5 & 20: State grouping sorts deterministically by unique_project_count DESC, state ASC."""
    resp = client.get("/api/v1/analytics/geography")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_states"] == 2
    assert data["district_dimension_status"] == "UNAVAILABLE"

    items = data["items"]
    # MAHARASHTRA has 2 projects (P1, P3); GUJARAT has 1 project (P2)
    assert items[0]["state"] == "MAHARASHTRA"
    assert items[0]["unique_project_count"] == 2
    assert items[0]["observation_count"] == 5

    assert items[1]["state"] == "GUJARAT"
    assert items[1]["unique_project_count"] == 1
    assert items[1]["observation_count"] == 2


def test_sectors_grouping_and_determinism(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Requirement 6: Sector grouping."""
    resp = client.get("/api/v1/analytics/sectors")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_sectors"] == 2
    items = data["items"]
    # ROAD TRANSPORT has 2 projects (P2, P3); RAILWAYS has 1 project (P1)
    assert items[0]["sector"] == "ROAD TRANSPORT"
    assert items[0]["unique_project_count"] == 2

    assert items[1]["sector"] == "RAILWAYS"
    assert items[1]["unique_project_count"] == 1


def test_agencies_grouping(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Requirement 7: Agency grouping."""
    resp = client.get("/api/v1/analytics/agencies")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_agencies"] == 2
    items = data["items"]
    assert items[0]["agency"] == "NHAI"
    assert items[0]["unique_project_count"] == 2


# -----------------------------------------------------------------------------
# 6. SHARED FILTERS & VALIDATION ERRORS
# -----------------------------------------------------------------------------

def test_shared_filters_filtering(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Requirement 8: Dynamic filters apply accurately."""
    resp = client.get("/api/v1/analytics/overview?sector=RAILWAYS")
    assert resp.status_code == 200
    data = resp.json()
    assert data["unique_project_count"] == 1
    assert data["observation_count"] == 4

    resp_state = client.get("/api/v1/analytics/overview?state=GUJARAT")
    assert resp_state.status_code == 200
    data_state = resp_state.json()
    assert data_state["unique_project_count"] == 1
    assert data_state["observation_count"] == 2


def test_invalid_month_format_rejected(client: TestClient) -> None:
    """Requirement 9: Invalid month format returns HTTP 400."""
    resp = client.get("/api/v1/analytics/overview?from_month=2025-13")
    assert resp.status_code == 400
    err = resp.json()["error"]
    assert "Invalid month format" in err["message"]

    resp2 = client.get("/api/v1/analytics/overview?to_month=invalid-date")
    assert resp2.status_code == 400
    err2 = resp2.json()["error"]
    assert "Invalid month format" in err2["message"]


def test_reversed_date_range_rejected(client: TestClient) -> None:
    """Requirement 10: from_month > to_month returns HTTP 400."""
    resp = client.get("/api/v1/analytics/overview?from_month=2026-01&to_month=2025-01")
    assert resp.status_code == 400
    err = resp.json()["error"]
    assert "cannot be after to_month" in err["message"]


def test_district_dimension_unsupported_rejected(client: TestClient) -> None:
    """Rejection of structurally unsupported dimension 'district' returns HTTP 400."""
    resp = client.get("/api/v1/analytics/overview?district=PUNE")
    assert resp.status_code == 400
    err = resp.json()["error"]
    assert "district" in err["message"]



def test_empty_filter_result_is_truthful(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Requirement 11 & 12: Empty filter returns truthful empty state without fake zeros."""
    resp = client.get("/api/v1/analytics/overview?state=NONEXISTENT_STATE")
    assert resp.status_code == 200
    data = resp.json()

    assert data["observation_count"] == 0
    assert data["unique_project_count"] == 0
    assert data["total_sanctioned_cost"] is None
    assert data["total_revised_cost"] is None
    assert data["total_cumulative_expenditure"] is None
    assert data["average_physical_progress"] is None
    assert data["earliest_observation_month"] is None
    assert data["latest_observation_month"] is None


def test_empty_filter_trends_is_truthful(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Empty trends returns empty list without synthetic points."""
    resp = client.get("/api/v1/analytics/trends?state=NONEXISTENT_STATE")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_months"] == 0
    assert data["items"] == []


# -----------------------------------------------------------------------------
# 7. PRODUCTION RISK SERVING ANALYTICS CONTRACT TESTS
# -----------------------------------------------------------------------------

def test_risk_analytics_production_contract(client: TestClient) -> None:
    """Requirement 15, 16, 17, 18, 19, 21, 22, 23:
    Risk analytics queries authentic serving SQLite, preserves regime/model provenance,
    provides exact statistical quantiles, and contains no arbitrary risk bands or unserved targets.
    """
    resp = client.get("/api/v1/analytics/risk")
    assert resp.status_code == 200
    data = resp.json()

    # Governed target check
    assert data["target"] == "target_effective_schedule_ext_3m"
    assert data["target_label"] == "PRODUCTION SCHEDULE-EXTENSION RISK"
    assert "cost_overrun" in data["unserved_targets"]
    assert "progress_stagnation" in data["unserved_targets"]

    # In authentic serving DB, 25189 observations and 4120 unique projects
    assert data["assessed_observation_count"] == 25189
    assert data["assessed_project_count"] == 4120

    # Calibrated and raw risk distributions are distinct and mathematical
    cal_dist = data["calibrated_risk_distribution"]
    raw_dist = data["raw_probability_distribution"]
    assert cal_dist is not None
    assert raw_dist is not None
    assert 0.0 <= cal_dist["minimum"] <= cal_dist["maximum"] <= 1.0
    assert 0.0 <= raw_dist["minimum"] <= raw_dist["maximum"] <= 1.0

    # Ensure NO arbitrary LOW/MEDIUM/HIGH keys exist in distributions
    for key in ["low", "medium", "high", "low_risk", "medium_risk", "high_risk"]:
        assert key not in cal_dist
        assert key not in raw_dist

    # Regime breakdown (LEGACY and MODERN)
    regimes = {r["regime"]: r for r in data["regime_breakdown"]}
    assert "LEGACY" in regimes
    assert "MODERN" in regimes
    assert regimes["LEGACY"]["model_id"] == "catboost_full_v1__unweighted"
    assert regimes["MODERN"]["model_id"] == "logistic_static_only__unweighted"

    # Monthly trend preserves evaluation month semantics
    months = [t["evaluation_month"] for t in data["monthly_trend"]]
    assert len(months) == 17
    assert months[0] == "2023-07"
    assert months[-1] == "2026-04"


def test_risk_analytics_with_regime_filter(client: TestClient) -> None:
    """Test risk analytics filtering by regime."""
    resp = client.get("/api/v1/analytics/risk?regime=MODERN")
    assert resp.status_code == 200
    data = resp.json()

    assert data["assessed_observation_count"] == 8190
    assert data["assessed_project_count"] == 1980
    assert len(data["regime_breakdown"]) == 1
    assert data["regime_breakdown"][0]["regime"] == "MODERN"


def test_risk_analytics_empty_filter_result(client: TestClient) -> None:
    """Test risk analytics returns clean empty structure when filter produces 0 rows."""
    resp = client.get("/api/v1/analytics/risk?state=NONEXISTENT_STATE_XYZ")
    assert resp.status_code == 200
    data = resp.json()

    assert data["assessed_observation_count"] == 0
    assert data["assessed_project_count"] == 0
    assert data["calibrated_risk_distribution"] is None
    assert data["raw_probability_distribution"] is None
    assert data["regime_breakdown"] == []
    assert data["monthly_trend"] == []


# -----------------------------------------------------------------------------
# 8. ADDITIONAL CONTRACT, SECURITY & EDGE-CASE TESTS
# -----------------------------------------------------------------------------

def test_project_code_filter(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Filter analytics specifically by project_code."""
    resp = client.get("/api/v1/analytics/overview?project_code=P1001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["unique_project_count"] == 1
    assert data["observation_count"] == 4
    assert data["total_sanctioned_cost"] == 100.0
    assert data["total_revised_cost"] == 150.0
    assert data["total_cumulative_expenditure"] == 80.0


def test_invalid_regime_rejected(client: TestClient) -> None:
    """Invalid regime returns 422 or 400."""
    resp = client.get("/api/v1/analytics/risk?regime=EXPERIMENTAL")
    assert resp.status_code in (400, 422)



def test_excessive_parameter_length_rejected(client: TestClient) -> None:
    """Parameters longer than 100 characters return 400."""
    long_str = "A" * 150
    resp = client.get(f"/api/v1/analytics/overview?state={long_str}")
    assert resp.status_code == 400
    assert "exceeds maximum allowed length" in resp.json()["error"]["message"]


def test_sql_injection_attempt_is_safe(client: TestClient, analytics_seed_data: list[ProjectMonthObservation]) -> None:
    """Malicious SQL fragments in string filters are safely parameterized."""
    injection = "' OR '1'='1"
    resp = client.get(f"/api/v1/analytics/overview?state={injection}")
    assert resp.status_code == 200
    data = resp.json()
    # Should safely return 0 results rather than matching all records
    assert data["observation_count"] == 0
    assert data["unique_project_count"] == 0


def test_progress_zero_reporting_returns_null(db_session: Session, client: TestClient) -> None:
    """When observations exist but none report progress, mean progress is null."""
    obs = ProjectMonthObservation(
        project_code="P_NO_PROG",
        project_name="No Progress Project",
        agency="NONE",
        sector="MISC",
        state="MISC",
        report_month="2025-01",
        original_cost=50.0,
        cumulative_expenditure=10.0,
        physical_progress=None,
        source_file="f.pdf",
        source_page=1,
        extraction_method="test",
    )
    db_session.add(obs)
    db_session.commit()

    resp = client.get("/api/v1/analytics/progress?project_code=P_NO_PROG")
    assert resp.status_code == 200
    data = resp.json()
    m = data["metrics"]
    assert m["total_observations"] == 1
    assert m["reporting_observations"] == 0
    assert m["mean_physical_progress"] is None
    assert m["distribution_quantiles"] is None

