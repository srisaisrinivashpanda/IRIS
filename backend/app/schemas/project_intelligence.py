"""Typed Pydantic response schemas for Project Risk Intelligence."""

from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

from src.serving.schemas import Contributor


class ProjectIntelligenceIdentity(BaseModel):
    """Authoritative project identity metadata from canonical observations."""

    project_code: str
    project_name: str
    agency: str | None = None
    ministry: str | None = None
    sector: str | None = None
    state: str | None = None
    legacy_ocms_code: str | None = None
    pmgid: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProjectIntelligenceSnapshot(BaseModel):
    """Latest observed project status from the most recent monthly Flash Report."""

    report_month: str
    physical_progress: float | None = None
    financial_progress: float | None = None
    cumulative_expenditure: float | None = None
    original_cost: float | None = None
    revised_cost: float | None = None
    approval_date: str | None = None
    start_date: str | None = None
    original_completion_date: str | None = None
    revised_completion_date: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProjectIntelligenceRisk(BaseModel):
    """Current production schedule-risk assessment from the serving layer."""

    risk_probability: float = Field(ge=0.0, le=1.0)
    raw_probability: float = Field(ge=0.0, le=1.0)
    risk_rank: int = Field(ge=1)
    risk_percentile: float = Field(gt=0.0, le=1.0)
    population_size: int = Field(ge=1)
    report_month: str
    regime: Literal["LEGACY", "MODERN"]
    model_id: str
    target: Literal["target_effective_schedule_ext_3m"]
    calibration_active: bool

    model_config = ConfigDict(from_attributes=True)


class ProjectIntelligenceModelGovernance(BaseModel):
    """Traceable model governance metadata sourced from the PR-02 model registry."""

    model_id: str
    target: str
    model_family: str
    status: str
    is_active: bool
    coverage_period: str
    calibration_policy: str | None = None
    explanation_method: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProjectRiskHistoryPoint(BaseModel):
    """Historical monthly risk observation point in chronological sequence."""

    report_month: str
    risk_probability: float = Field(ge=0.0, le=1.0)
    raw_probability: float = Field(ge=0.0, le=1.0)
    risk_rank: int = Field(ge=1)
    risk_percentile: float = Field(gt=0.0, le=1.0)
    population_size: int = Field(ge=1)
    regime: Literal["LEGACY", "MODERN"]
    model_id: str
    calibration_active: bool

    model_config = ConfigDict(from_attributes=True)


class ProjectRiskDrivers(BaseModel):
    """Signed risk drivers and strongest contributors for the current risk assessment."""

    top_positive: list[Contributor] = Field(default_factory=list)
    top_negative: list[Contributor] = Field(default_factory=list)
    strongest_drivers: list[Contributor] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ProjectSignals(BaseModel):
    """Factual signals derived strictly from historical project observations."""

    cost_revised: bool
    schedule_revised: bool
    cost_revision_ratio: float | None = None
    cost_revision_count: int = Field(ge=0)
    schedule_extension_count: int = Field(ge=0)
    reporting_months_count: int = Field(ge=1)
    first_reported_month: str
    latest_reported_month: str

    model_config = ConfigDict(from_attributes=True)


class ProjectRecentChanges(BaseModel):
    """Deterministic deltas between the latest observation and immediately preceding observation."""

    has_prior_observation: bool
    prior_report_month: str | None = None
    physical_progress_delta: float | None = None
    expenditure_delta: float | None = None
    revised_cost_delta: float | None = None
    completion_date_changed: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProjectDataAvailability(BaseModel):
    """Explicit presence indicators for each intelligence dimension; no synthetic scores."""

    has_project_data: bool = True
    has_risk_assessment: bool = False
    has_risk_history: bool = False
    has_drivers: bool = False
    snapshot_report_month: str | None = None
    risk_report_month: str | None = None
    cost_risk_ml_served: bool = False
    progress_stagnation_ml_served: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProjectRiskIntelligenceResponse(BaseModel):
    """Unified, typed Project Risk Intelligence response."""

    project: ProjectIntelligenceIdentity
    snapshot: ProjectIntelligenceSnapshot | None = None
    risk: ProjectIntelligenceRisk | None = None
    model: ProjectIntelligenceModelGovernance | None = None
    history: list[ProjectRiskHistoryPoint] = Field(default_factory=list)
    drivers: ProjectRiskDrivers = Field(default_factory=ProjectRiskDrivers)
    signals: ProjectSignals
    recent_changes: ProjectRecentChanges
    data_availability: ProjectDataAvailability

    model_config = ConfigDict(from_attributes=True)
