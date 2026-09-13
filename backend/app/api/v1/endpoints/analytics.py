"""FastAPI endpoints for portfolio analytics, temporal trends, geography, and risk metrics."""

from __future__ import annotations

from typing import Annotated, Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.schemas.analytics import (
    AgenciesResponse,
    FinancialsResponse,
    GeographyResponse,
    OverviewResponse,
    ProgressResponse,
    RiskAnalyticsResponse,
    SectorsResponse,
    TrendsResponse,
)
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get(
    "/overview",
    response_model=OverviewResponse,
    summary="Get Portfolio Overview Analytics",
    description=(
        "Retrieve high-level portfolio overview aggregates, project counts, financial totals, "
        "and data coverage metadata. Financial metrics use the latest qualifying observation per "
        "unique project within the active filter scope to prevent row multiplication."
    ),
)
def get_overview(
    from_month: Annotated[str | None, Query(description="Start month (YYYY-MM)")] = None,
    to_month: Annotated[str | None, Query(description="End month (YYYY-MM)")] = None,
    state: Annotated[str | None, Query(description="Filter by state")] = None,
    sector: Annotated[str | None, Query(description="Filter by sector")] = None,
    agency: Annotated[str | None, Query(description="Filter by agency")] = None,
    project_code: Annotated[str | None, Query(description="Filter by project code")] = None,
    district: Annotated[str | None, Query(description="Filter by district (unsupported)")] = None,
    db: Session = Depends(get_db),
) -> OverviewResponse:
    """Return portfolio overview metrics."""
    service = AnalyticsService(db)
    return service.get_overview(
        from_month=from_month,
        to_month=to_month,
        state=state,
        sector=sector,
        agency=agency,
        project_code=project_code,
        district=district,
    )


@router.get(
    "/trends",
    response_model=TrendsResponse,
    summary="Get Temporal Observation Trends",
    description=(
        "Retrieve chronological monthly project aggregates strictly for observed months. "
        "No synthetic continuous zero-months are manufactured."
    ),
)
def get_trends(
    from_month: Annotated[str | None, Query(description="Start month (YYYY-MM)")] = None,
    to_month: Annotated[str | None, Query(description="End month (YYYY-MM)")] = None,
    state: Annotated[str | None, Query(description="Filter by state")] = None,
    sector: Annotated[str | None, Query(description="Filter by sector")] = None,
    agency: Annotated[str | None, Query(description="Filter by agency")] = None,
    project_code: Annotated[str | None, Query(description="Filter by project code")] = None,
    district: Annotated[str | None, Query(description="Filter by district (unsupported)")] = None,
    db: Session = Depends(get_db),
) -> TrendsResponse:
    """Return chronological monthly trends."""
    service = AnalyticsService(db)
    return service.get_trends(
        from_month=from_month,
        to_month=to_month,
        state=state,
        sector=sector,
        agency=agency,
        project_code=project_code,
        district=district,
    )


@router.get(
    "/geography",
    response_model=GeographyResponse,
    summary="Get Geographic Aggregation by State",
    description=(
        "Retrieve state-level grouped project and expenditure metrics. "
        "District-level aggregation is structurally unavailable from source reports."
    ),
)
def get_geography(
    from_month: Annotated[str | None, Query(description="Start month (YYYY-MM)")] = None,
    to_month: Annotated[str | None, Query(description="End month (YYYY-MM)")] = None,
    state: Annotated[str | None, Query(description="Filter by state")] = None,
    sector: Annotated[str | None, Query(description="Filter by sector")] = None,
    agency: Annotated[str | None, Query(description="Filter by agency")] = None,
    project_code: Annotated[str | None, Query(description="Filter by project code")] = None,
    district: Annotated[str | None, Query(description="Filter by district (unsupported)")] = None,
    db: Session = Depends(get_db),
) -> GeographyResponse:
    """Return state geographic aggregation."""
    service = AnalyticsService(db)
    return service.get_geography(
        from_month=from_month,
        to_month=to_month,
        state=state,
        sector=sector,
        agency=agency,
        project_code=project_code,
        district=district,
    )


@router.get(
    "/sectors",
    response_model=SectorsResponse,
    summary="Get Categorical Aggregation by Sector",
    description="Retrieve sector-level grouped project, expenditure, and physical progress metrics.",
)
def get_sectors(
    from_month: Annotated[str | None, Query(description="Start month (YYYY-MM)")] = None,
    to_month: Annotated[str | None, Query(description="End month (YYYY-MM)")] = None,
    state: Annotated[str | None, Query(description="Filter by state")] = None,
    sector: Annotated[str | None, Query(description="Filter by sector")] = None,
    agency: Annotated[str | None, Query(description="Filter by agency")] = None,
    project_code: Annotated[str | None, Query(description="Filter by project code")] = None,
    district: Annotated[str | None, Query(description="Filter by district (unsupported)")] = None,
    db: Session = Depends(get_db),
) -> SectorsResponse:
    """Return sector categorical aggregation."""
    service = AnalyticsService(db)
    return service.get_sectors(
        from_month=from_month,
        to_month=to_month,
        state=state,
        sector=sector,
        agency=agency,
        project_code=project_code,
        district=district,
    )


@router.get(
    "/agencies",
    response_model=AgenciesResponse,
    summary="Get Categorical Aggregation by Agency",
    description="Retrieve agency-level grouped project, expenditure, and physical progress metrics.",
)
def get_agencies(
    from_month: Annotated[str | None, Query(description="Start month (YYYY-MM)")] = None,
    to_month: Annotated[str | None, Query(description="End month (YYYY-MM)")] = None,
    state: Annotated[str | None, Query(description="Filter by state")] = None,
    sector: Annotated[str | None, Query(description="Filter by sector")] = None,
    agency: Annotated[str | None, Query(description="Filter by agency")] = None,
    project_code: Annotated[str | None, Query(description="Filter by project code")] = None,
    district: Annotated[str | None, Query(description="Filter by district (unsupported)")] = None,
    db: Session = Depends(get_db),
) -> AgenciesResponse:
    """Return agency categorical aggregation."""
    service = AnalyticsService(db)
    return service.get_agencies(
        from_month=from_month,
        to_month=to_month,
        state=state,
        sector=sector,
        agency=agency,
        project_code=project_code,
        district=district,
    )


@router.get(
    "/financials",
    response_model=FinancialsResponse,
    summary="Get Portfolio Financial Metrics",
    description=(
        "Retrieve project-level financial metrics (sanctioned cost, revised cost, expenditure, "
        "cost escalation) calculated strictly from the latest qualifying observation per distinct project "
        "within the active filter scope."
    ),
)
def get_financials(
    from_month: Annotated[str | None, Query(description="Start month (YYYY-MM)")] = None,
    to_month: Annotated[str | None, Query(description="End month (YYYY-MM)")] = None,
    state: Annotated[str | None, Query(description="Filter by state")] = None,
    sector: Annotated[str | None, Query(description="Filter by sector")] = None,
    agency: Annotated[str | None, Query(description="Filter by agency")] = None,
    project_code: Annotated[str | None, Query(description="Filter by project code")] = None,
    district: Annotated[str | None, Query(description="Filter by district (unsupported)")] = None,
    db: Session = Depends(get_db),
) -> FinancialsResponse:
    """Return portfolio financial metrics."""
    service = AnalyticsService(db)
    return service.get_financials(
        from_month=from_month,
        to_month=to_month,
        state=state,
        sector=sector,
        agency=agency,
        project_code=project_code,
        district=district,
    )


@router.get(
    "/progress",
    response_model=ProgressResponse,
    summary="Get Physical Progress Analytics",
    description=(
        "Retrieve physical progress statistical distribution and sectoral breakdown. "
        "Missing progress observations are excluded from the arithmetic mean denominator and "
        "are never coerced to 0%."
    ),
)
def get_progress(
    from_month: Annotated[str | None, Query(description="Start month (YYYY-MM)")] = None,
    to_month: Annotated[str | None, Query(description="End month (YYYY-MM)")] = None,
    state: Annotated[str | None, Query(description="Filter by state")] = None,
    sector: Annotated[str | None, Query(description="Filter by sector")] = None,
    agency: Annotated[str | None, Query(description="Filter by agency")] = None,
    project_code: Annotated[str | None, Query(description="Filter by project code")] = None,
    district: Annotated[str | None, Query(description="Filter by district (unsupported)")] = None,
    db: Session = Depends(get_db),
) -> ProgressResponse:
    """Return physical progress statistics."""
    service = AnalyticsService(db)
    return service.get_progress(
        from_month=from_month,
        to_month=to_month,
        state=state,
        sector=sector,
        agency=agency,
        project_code=project_code,
        district=district,
    )


@router.get(
    "/risk",
    response_model=RiskAnalyticsResponse,
    summary="Get Production Schedule-Extension Risk Analytics",
    description=(
        "Retrieve authentic risk serving statistics for target_effective_schedule_ext_3m. "
        "Includes exact quantiles, model and regime breakdown, and evaluation month trend. "
        "No arbitrary LOW/MEDIUM/HIGH risk bands or unsupported ML targets."
    ),
)
def get_risk(
    from_month: Annotated[str | None, Query(description="Start evaluation month (YYYY-MM)")] = None,
    to_month: Annotated[str | None, Query(description="End evaluation month (YYYY-MM)")] = None,
    state: Annotated[str | None, Query(description="Filter by state")] = None,
    sector: Annotated[str | None, Query(description="Filter by sector")] = None,
    agency: Annotated[str | None, Query(description="Filter by agency")] = None,
    project_code: Annotated[str | None, Query(description="Filter by project code")] = None,
    regime: Annotated[Literal["LEGACY", "MODERN"] | None, Query(description="Filter by model regime")] = None,
    district: Annotated[str | None, Query(description="Filter by district (unsupported)")] = None,
    db: Session = Depends(get_db),
) -> RiskAnalyticsResponse:
    """Return production schedule extension risk analytics."""
    service = AnalyticsService(db)
    return service.get_risk(
        from_month=from_month,
        to_month=to_month,
        state=state,
        sector=sector,
        agency=agency,
        project_code=project_code,
        regime=regime,
        district=district,
    )
