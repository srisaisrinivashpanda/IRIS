"""Pydantic schemas for analytics endpoints and portfolio aggregations."""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class ScoreDistribution(BaseModel):
    """Statistical summary of continuous numeric population."""

    minimum: float
    p25: float
    median: float
    p75: float
    p90: float
    p95: float
    maximum: float
    mean: float

    model_config = ConfigDict(from_attributes=True)


class CoverageMetadata(BaseModel):
    """Observational coverage and availability metadata."""

    total_observations: int
    unique_projects: int
    earliest_month: str | None = None
    latest_month: str | None = None
    missing_original_cost_count: int = 0
    missing_revised_cost_count: int = 0
    missing_cumulative_expenditure_count: int = 0
    missing_physical_progress_count: int = 0
    unavailable_dimensions: dict[str, str] = Field(
        default_factory=lambda: {
            "district": "Structurally omitted from source flash reports",
            "project_status": "All flash report records represent ongoing projects",
        }
    )

    model_config = ConfigDict(from_attributes=True)


class OverviewResponse(BaseModel):
    """Portfolio overview aggregation response."""

    unique_project_count: int
    observation_count: int
    earliest_observation_month: str | None = None
    latest_observation_month: str | None = None
    states_count: int = 0
    agencies_count: int = 0
    sectors_count: int = 0
    districts_count: int | None = None

    total_sanctioned_cost: float | None = None
    total_revised_cost: float | None = None
    total_cumulative_expenditure: float | None = None
    average_physical_progress: float | None = None
    progress_reporting_observations: int = 0

    assessed_project_count: int = 0
    financial_basis: str = (
        "Latest qualifying observation per unique project within active filter scope"
    )
    progress_basis: str = (
        "Arithmetic mean of non-null physical_progress observations within active filter scope"
    )
    coverage: CoverageMetadata

    model_config = ConfigDict(from_attributes=True)


class TrendPoint(BaseModel):
    """Monthly observation aggregation point."""

    report_month: str
    observation_count: int
    unique_project_count: int
    total_cumulative_expenditure: float | None = None
    average_cumulative_expenditure: float | None = None
    total_original_cost: float | None = None
    total_revised_cost: float | None = None
    average_physical_progress: float | None = None
    progress_reporting_count: int = 0
    risk_assessed_project_count: int = 0
    average_risk_probability: float | None = None
    average_raw_probability: float | None = None

    model_config = ConfigDict(from_attributes=True)


class TrendsResponse(BaseModel):
    """Time-series aggregation response."""

    items: list[TrendPoint]
    total_months: int
    earliest_month: str | None = None
    latest_month: str | None = None
    disclaimer: str = (
        "Only observed months are included. No synthetic continuous periods or zero-months are manufactured."
    )

    model_config = ConfigDict(from_attributes=True)


class GeographyGroup(BaseModel):
    """State-level geographic aggregation group."""

    state: str
    unique_project_count: int
    observation_count: int
    total_cumulative_expenditure: float | None = None
    average_physical_progress: float | None = None
    progress_reporting_count: int = 0
    assessed_project_count: int = 0
    average_risk_probability: float | None = None

    model_config = ConfigDict(from_attributes=True)


class GeographyResponse(BaseModel):
    """Geographic aggregation response."""

    items: list[GeographyGroup]
    total_states: int
    district_dimension_status: str = "UNAVAILABLE"
    district_dimension_reason: str = "District is structurally omitted from source flash reports."

    model_config = ConfigDict(from_attributes=True)


class SectorGroup(BaseModel):
    """Sector categorical aggregation group."""

    sector: str
    unique_project_count: int
    observation_count: int
    total_original_cost: float | None = None
    total_cumulative_expenditure: float | None = None
    average_physical_progress: float | None = None
    progress_reporting_count: int = 0
    assessed_project_count: int = 0
    average_risk_probability: float | None = None

    model_config = ConfigDict(from_attributes=True)


class SectorsResponse(BaseModel):
    """Sector aggregation response."""

    items: list[SectorGroup]
    total_sectors: int

    model_config = ConfigDict(from_attributes=True)


class AgencyGroup(BaseModel):
    """Agency categorical aggregation group."""

    agency: str
    unique_project_count: int
    observation_count: int
    total_original_cost: float | None = None
    total_cumulative_expenditure: float | None = None
    average_physical_progress: float | None = None
    progress_reporting_count: int = 0
    assessed_project_count: int = 0
    average_risk_probability: float | None = None

    model_config = ConfigDict(from_attributes=True)


class AgenciesResponse(BaseModel):
    """Agency aggregation response."""

    items: list[AgencyGroup]
    total_agencies: int

    model_config = ConfigDict(from_attributes=True)


class FinancialMetrics(BaseModel):
    """Detailed financial metrics aggregated across unique projects."""

    projects_with_cost: int = 0
    total_original_cost: float | None = None
    mean_original_cost: float | None = None

    projects_with_revised_cost: int = 0
    total_revised_cost: float | None = None
    mean_revised_cost: float | None = None

    projects_with_expenditure: int = 0
    total_cumulative_expenditure: float | None = None
    mean_cumulative_expenditure: float | None = None

    cost_revision_projects_count: int = 0
    total_cost_escalation: float | None = None
    overall_expenditure_to_revised_cost_ratio: float | None = None
    overall_expenditure_to_original_cost_ratio: float | None = None

    model_config = ConfigDict(from_attributes=True)


class FinancialsResponse(BaseModel):
    """Portfolio financial aggregation response."""

    metrics: FinancialMetrics
    aggregation_basis: str = (
        "Project-level financial metrics are calculated using the latest qualifying observation "
        "per distinct project within the active filter scope to avoid multi-month row inflation."
    )
    observation_count: int
    unique_project_count: int

    model_config = ConfigDict(from_attributes=True)


class ProgressSectorBreakdown(BaseModel):
    """Sectoral physical progress breakdown."""

    sector: str
    reporting_count: int
    missing_count: int
    mean_physical_progress: float | None = None

    model_config = ConfigDict(from_attributes=True)


class ProgressMetrics(BaseModel):
    """Physical progress statistical metrics."""

    total_observations: int
    reporting_observations: int
    missing_observations: int
    coverage_rate: float
    mean_physical_progress: float | None = None
    median_physical_progress: float | None = None
    min_physical_progress: float | None = None
    max_physical_progress: float | None = None
    distribution_quantiles: ScoreDistribution | None = None

    model_config = ConfigDict(from_attributes=True)


class ProgressResponse(BaseModel):
    """Physical progress aggregation response."""

    metrics: ProgressMetrics
    by_sector: list[ProgressSectorBreakdown]
    progress_basis: str = (
        "Missing progress values are excluded from the arithmetic mean denominator and are never imputed as 0%."
    )

    model_config = ConfigDict(from_attributes=True)


class RiskRegimeBreakdown(BaseModel):
    """Breakdown of assessed risk records by locked regime and model."""

    regime: str
    model_id: str
    unique_project_count: int
    observation_count: int
    calibration_active_count: int

    model_config = ConfigDict(from_attributes=True)


class RiskMonthlyTrend(BaseModel):
    """Monthly evaluation risk statistics."""

    evaluation_month: str
    assessed_project_count: int
    assessed_observation_count: int
    mean_risk_probability: float | None = None
    mean_raw_probability: float | None = None

    model_config = ConfigDict(from_attributes=True)


class RiskAnalyticsResponse(BaseModel):
    """Production schedule-extension risk analytics response."""

    target: str = "target_effective_schedule_ext_3m"
    target_label: str = "PRODUCTION SCHEDULE-EXTENSION RISK"
    assessed_project_count: int
    assessed_observation_count: int
    evaluation_earliest_month: str | None = None
    evaluation_latest_month: str | None = None
    calibrated_risk_distribution: ScoreDistribution | None = None
    raw_probability_distribution: ScoreDistribution | None = None
    regime_breakdown: list[RiskRegimeBreakdown]
    monthly_trend: list[RiskMonthlyTrend]
    governance_notice: str = (
        "Risk statistics represent model-estimated probability of 3-month schedule extension "
        "for active projects under production regime models. Unserved targets (cost overrun, "
        "progress stagnation) are unavailable. Denominator represents authentic risk-serving records."
    )
    unserved_targets: list[str] = Field(
        default_factory=lambda: ["cost_overrun", "progress_stagnation"]
    )

    model_config = ConfigDict(from_attributes=True)
