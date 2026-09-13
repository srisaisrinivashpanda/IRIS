"""Analytics aggregation service providing deterministic, authoritative portfolio metrics."""

from __future__ import annotations

import re
from typing import Any
from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.repositories.analytics_repository import AnalyticsRepository
from backend.app.schemas.analytics import (
    AgenciesResponse,
    AgencyGroup,
    CoverageMetadata,
    FinancialMetrics,
    FinancialsResponse,
    GeographyGroup,
    GeographyResponse,
    OverviewResponse,
    ProgressMetrics,
    ProgressResponse,
    ProgressSectorBreakdown,
    RiskAnalyticsResponse,
    RiskMonthlyTrend,
    RiskRegimeBreakdown,
    ScoreDistribution,
    SectorGroup,
    SectorsResponse,
    TrendPoint,
    TrendsResponse,
)
from backend.app.services.risk_service import get_serving_repository

MONTH_REGEX = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def _validate_month_format(month: str | None, param_name: str) -> str | None:
    """Validate and normalize YYYY-MM month parameter."""
    if month is None:
        return None
    cleaned = month.strip()
    if not cleaned:
        return None
    if not MONTH_REGEX.fullmatch(cleaned):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid month format for '{param_name}': '{cleaned}'. Expected YYYY-MM format (e.g. 2026-07).",
        )
    return cleaned


def _normalize_filter_string(value: str | None, max_length: int = 100) -> str | None:
    """Strip string filter and normalize empty string to None with length check."""
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if len(cleaned) > max_length:
        raise HTTPException(
            status_code=400,
            detail=f"Parameter value exceeds maximum allowed length of {max_length} characters.",
        )
    return cleaned


class AnalyticsService:
    """Service coordinating database and risk serving aggregations."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.risk_repo = get_serving_repository()
        self.repo = AnalyticsRepository(db, self.risk_repo)

    def _validate_and_normalize_filters(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        district: str | None = None,
        regime: str | None = None,
    ) -> dict[str, str | None]:
        """Validate all shared query parameters and guard against unsupported dimensions."""
        # 1. Reject structurally absent dimensions if non-empty
        if district is not None and district.strip():
            raise HTTPException(
                status_code=400,
                detail=(
                    "Filter dimension 'district' is not available in the authoritative source dataset. "
                    "PAIMANA Flash Reports structurally omit district information."
                ),
            )

        # 2. Validate month formats
        norm_from = _validate_month_format(from_month, "from_month")
        norm_to = _validate_month_format(to_month, "to_month")

        # 3. Guard date range ordering
        if norm_from and norm_to and norm_from > norm_to:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid date range: from_month '{norm_from}' cannot be after to_month '{norm_to}'.",
            )

        # 4. Normalize string dimensions
        norm_state = _normalize_filter_string(state)
        norm_sector = _normalize_filter_string(sector)
        norm_agency = _normalize_filter_string(agency)
        norm_project_code = _normalize_filter_string(project_code)
        norm_regime = _normalize_filter_string(regime)

        if norm_regime and norm_regime not in ("LEGACY", "MODERN"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid regime '{norm_regime}'. Allowed values are 'LEGACY' or 'MODERN'.",
            )

        return {
            "from_month": norm_from,
            "to_month": norm_to,
            "state": norm_state,
            "sector": norm_sector,
            "agency": norm_agency,
            "project_code": norm_project_code,
            "regime": norm_regime,
        }

    def get_overview(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        district: str | None = None,
    ) -> OverviewResponse:
        """Return authoritative portfolio overview metrics and coverage metadata."""
        filters = self._validate_and_normalize_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
            district=district,
        )

        data = self.repo.get_overview_aggregation(
            from_month=filters["from_month"],
            to_month=filters["to_month"],
            state=filters["state"],
            sector=filters["sector"],
            agency=filters["agency"],
            project_code=filters["project_code"],
        )

        coverage = CoverageMetadata(
            total_observations=data["observation_count"],
            unique_projects=data["unique_project_count"],
            earliest_month=data["earliest_observation_month"],
            latest_month=data["latest_observation_month"],
            missing_original_cost_count=data["missing_orig_cost"],
            missing_revised_cost_count=data["missing_rev_cost"],
            missing_cumulative_expenditure_count=data["missing_exp"],
            missing_physical_progress_count=data["missing_progress"],
        )

        return OverviewResponse(
            unique_project_count=data["unique_project_count"],
            observation_count=data["observation_count"],
            earliest_observation_month=data["earliest_observation_month"],
            latest_observation_month=data["latest_observation_month"],
            states_count=data["states_count"],
            agencies_count=data["agencies_count"],
            sectors_count=data["sectors_count"],
            districts_count=None,
            total_sanctioned_cost=data["total_sanctioned_cost"],
            total_revised_cost=data["total_revised_cost"],
            total_cumulative_expenditure=data["total_cumulative_expenditure"],
            average_physical_progress=data["average_physical_progress"],
            progress_reporting_observations=data["progress_reporting_observations"],
            assessed_project_count=data["assessed_project_count"],
            coverage=coverage,
        )

    def get_trends(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        district: str | None = None,
    ) -> TrendsResponse:
        """Return monthly chronological observations strictly for observed months."""
        filters = self._validate_and_normalize_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
            district=district,
        )

        raw_trends = self.repo.get_trends(
            from_month=filters["from_month"],
            to_month=filters["to_month"],
            state=filters["state"],
            sector=filters["sector"],
            agency=filters["agency"],
            project_code=filters["project_code"],
        )

        items = [TrendPoint(**t) for t in raw_trends]
        earliest_m = items[0].report_month if items else None
        latest_m = items[-1].report_month if items else None

        return TrendsResponse(
            items=items,
            total_months=len(items),
            earliest_month=earliest_m,
            latest_month=latest_m,
        )

    def get_geography(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        district: str | None = None,
    ) -> GeographyResponse:
        """Return state-level geographic aggregation groups."""
        filters = self._validate_and_normalize_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
            district=district,
        )

        raw_geo = self.repo.get_geography(
            from_month=filters["from_month"],
            to_month=filters["to_month"],
            state=filters["state"],
            sector=filters["sector"],
            agency=filters["agency"],
            project_code=filters["project_code"],
        )

        items = [GeographyGroup(**g) for g in raw_geo]
        return GeographyResponse(
            items=items,
            total_states=len(items),
        )

    def get_sectors(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        district: str | None = None,
    ) -> SectorsResponse:
        """Return sector-level categorical aggregation groups."""
        filters = self._validate_and_normalize_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
            district=district,
        )

        raw_sectors = self.repo.get_sectors(
            from_month=filters["from_month"],
            to_month=filters["to_month"],
            state=filters["state"],
            sector=filters["sector"],
            agency=filters["agency"],
            project_code=filters["project_code"],
        )

        items = [SectorGroup(**s) for s in raw_sectors]
        return SectorsResponse(
            items=items,
            total_sectors=len(items),
        )

    def get_agencies(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        district: str | None = None,
    ) -> AgenciesResponse:
        """Return agency-level categorical aggregation groups."""
        filters = self._validate_and_normalize_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
            district=district,
        )

        raw_agencies = self.repo.get_agencies(
            from_month=filters["from_month"],
            to_month=filters["to_month"],
            state=filters["state"],
            sector=filters["sector"],
            agency=filters["agency"],
            project_code=filters["project_code"],
        )

        items = [AgencyGroup(**a) for a in raw_agencies]
        return AgenciesResponse(
            items=items,
            total_agencies=len(items),
        )

    def get_financials(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        district: str | None = None,
    ) -> FinancialsResponse:
        """Return financial aggregation using latest observation per project in active filter scope."""
        filters = self._validate_and_normalize_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
            district=district,
        )

        data = self.repo.get_financials(
            from_month=filters["from_month"],
            to_month=filters["to_month"],
            state=filters["state"],
            sector=filters["sector"],
            agency=filters["agency"],
            project_code=filters["project_code"],
        )

        return FinancialsResponse(
            metrics=FinancialMetrics(**data["metrics"]),
            observation_count=data["observation_count"],
            unique_project_count=data["unique_project_count"],
        )

    def get_progress(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        district: str | None = None,
    ) -> ProgressResponse:
        """Return physical progress statistics with nulls excluded from arithmetic denominator."""
        filters = self._validate_and_normalize_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
            district=district,
        )

        data = self.repo.get_progress(
            from_month=filters["from_month"],
            to_month=filters["to_month"],
            state=filters["state"],
            sector=filters["sector"],
            agency=filters["agency"],
            project_code=filters["project_code"],
        )

        raw_metrics = data["metrics"]
        quantiles = (
            ScoreDistribution(**raw_metrics["distribution_quantiles"])
            if raw_metrics.get("distribution_quantiles")
            else None
        )

        metrics = ProgressMetrics(
            total_observations=raw_metrics["total_observations"],
            reporting_observations=raw_metrics["reporting_observations"],
            missing_observations=raw_metrics["missing_observations"],
            coverage_rate=raw_metrics["coverage_rate"],
            mean_physical_progress=raw_metrics["mean_physical_progress"],
            median_physical_progress=raw_metrics["median_physical_progress"],
            min_physical_progress=raw_metrics["min_physical_progress"],
            max_physical_progress=raw_metrics["max_physical_progress"],
            distribution_quantiles=quantiles,
        )

        by_sector = [ProgressSectorBreakdown(**s) for s in data["by_sector"]]

        return ProgressResponse(
            metrics=metrics,
            by_sector=by_sector,
        )

    def get_risk(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        regime: str | None = None,
        district: str | None = None,
    ) -> RiskAnalyticsResponse:
        """Return production schedule-extension risk analytics from serving database."""
        filters = self._validate_and_normalize_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
            regime=regime,
            district=district,
        )

        data = self.repo.get_risk_analytics(
            from_month=filters["from_month"],
            to_month=filters["to_month"],
            state=filters["state"],
            sector=filters["sector"],
            agency=filters["agency"],
            project_code=filters["project_code"],
            regime=filters["regime"],
        )

        cal_dist = (
            ScoreDistribution(**data["calibrated_risk_distribution"])
            if data.get("calibrated_risk_distribution")
            else None
        )
        raw_dist = (
            ScoreDistribution(**data["raw_probability_distribution"])
            if data.get("raw_probability_distribution")
            else None
        )

        regime_breakdown = [RiskRegimeBreakdown(**r) for r in data["regime_breakdown"]]
        monthly_trend = [RiskMonthlyTrend(**m) for m in data["monthly_trend"]]

        return RiskAnalyticsResponse(
            assessed_project_count=data["assessed_project_count"],
            assessed_observation_count=data["assessed_observation_count"],
            evaluation_earliest_month=data["evaluation_earliest_month"],
            evaluation_latest_month=data["evaluation_latest_month"],
            calibrated_risk_distribution=cal_dist,
            raw_probability_distribution=raw_dist,
            regime_breakdown=regime_breakdown,
            monthly_trend=monthly_trend,
        )
