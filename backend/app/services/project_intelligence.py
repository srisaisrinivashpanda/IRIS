"""Project Risk Intelligence Service orchestrating project observations and ML risk serving."""

from __future__ import annotations

from typing import Any
from sqlalchemy.orm import Session

from backend.app.core.errors import NotFoundError
from backend.app.models.project_month import ProjectMonthObservation
from backend.app.repositories.project_repository import ProjectRepository
from backend.app.schemas.project_intelligence import (
    ProjectDataAvailability,
    ProjectIntelligenceIdentity,
    ProjectIntelligenceModelGovernance,
    ProjectIntelligenceRisk,
    ProjectIntelligenceSnapshot,
    ProjectRecentChanges,
    ProjectRiskDrivers,
    ProjectRiskHistoryPoint,
    ProjectRiskIntelligenceResponse,
    ProjectSignals,
)
from backend.app.services.risk_service import get_serving_repository
from src.serving.registry import get_model_by_id
from src.serving.schemas import Contributor


class ProjectIntelligenceService:
    """Orchestrates project observations, production risk records, and model governance."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.project_repo = ProjectRepository(db)

    def get_project_risk_intelligence(self, project_code: str) -> ProjectRiskIntelligenceResponse:
        """Assembles a unified, typed project risk intelligence record."""
        clean_code = project_code.strip()
        if not clean_code:
            raise ValueError("Project code cannot be blank")

        # 1. Authoritative Project Identity & Existence
        stats = self.project_repo.get_project_stats(clean_code)
        latest_obs = self.project_repo.get_latest_observation(clean_code)
        if not stats or latest_obs is None:
            raise NotFoundError(f"Project with code '{clean_code}' was not found in the serving layer.")

        identity = ProjectIntelligenceIdentity(
            project_code=latest_obs.project_code,
            project_name=latest_obs.project_name,
            agency=latest_obs.agency,
            ministry=latest_obs.ministry,
            sector=latest_obs.sector,
            state=latest_obs.state,
            legacy_ocms_code=latest_obs.legacy_ocms_code,
            pmgid=latest_obs.pmgid,
        )

        # 2. Latest Snapshot
        orig_cost = float(latest_obs.original_cost) if latest_obs.original_cost is not None else None
        rev_cost = float(latest_obs.revised_cost) if latest_obs.revised_cost is not None else None
        cum_exp = float(latest_obs.cumulative_expenditure) if latest_obs.cumulative_expenditure is not None else None
        phys_prog = float(latest_obs.physical_progress) if latest_obs.physical_progress is not None else None

        effective_cost = rev_cost if (rev_cost is not None and rev_cost > 0) else (
            orig_cost if (orig_cost is not None and orig_cost > 0) else None
        )
        fin_prog = round((cum_exp / effective_cost) * 100.0, 2) if (
            cum_exp is not None and effective_cost is not None and effective_cost > 0
        ) else None

        snapshot = ProjectIntelligenceSnapshot(
            report_month=latest_obs.report_month,
            physical_progress=phys_prog,
            financial_progress=fin_prog,
            cumulative_expenditure=cum_exp,
            original_cost=orig_cost,
            revised_cost=rev_cost,
            approval_date=latest_obs.approval_date,
            start_date=latest_obs.start_date,
            original_completion_date=latest_obs.original_completion_date,
            revised_completion_date=latest_obs.revised_completion_date,
        )

        # 3. Observation Timeline, Factual Signals, and Recent Changes
        trajectory: list[ProjectMonthObservation] = self.project_repo.get_trajectory(clean_code)
        signals, recent_changes = self._derive_signals_and_changes(trajectory)

        # 4. Production Schedule-Risk Assessment, History, Drivers, and Model Governance
        risk, model_gov, history_points, drivers = self._resolve_risk_and_governance(clean_code)

        # 5. Data Availability
        data_availability = ProjectDataAvailability(
            has_project_data=True,
            has_risk_assessment=risk is not None,
            has_risk_history=len(history_points) > 0,
            has_drivers=len(drivers.strongest_drivers) > 0,
            snapshot_report_month=snapshot.report_month if snapshot else None,
            risk_report_month=risk.report_month if risk else None,
            cost_risk_ml_served=False,
            progress_stagnation_ml_served=False,
        )

        return ProjectRiskIntelligenceResponse(
            project=identity,
            snapshot=snapshot,
            risk=risk,
            model=model_gov,
            history=history_points,
            drivers=drivers,
            signals=signals,
            recent_changes=recent_changes,
            data_availability=data_availability,
        )

    @staticmethod
    def _derive_signals_and_changes(
        trajectory: list[ProjectMonthObservation],
    ) -> tuple[ProjectSignals, ProjectRecentChanges]:
        """Derive factual timeline signals and adjacent-observation deltas from stored observations."""
        latest = trajectory[-1]
        orig_cost = float(latest.original_cost) if latest.original_cost is not None else None
        rev_cost = float(latest.revised_cost) if latest.revised_cost is not None else None

        # Cost revision signals
        cost_revised = bool(
            rev_cost is not None and orig_cost is not None and rev_cost != orig_cost
        )
        cost_revision_ratio = round(rev_cost / orig_cost, 4) if (
            orig_cost is not None and rev_cost is not None and orig_cost > 0
        ) else None

        # Count distinct cost revision events in timeline
        cost_revision_count = 0
        prev_rev: float | None = None
        for obs in trajectory:
            c_rev = float(obs.revised_cost) if obs.revised_cost is not None else None
            c_orig = float(obs.original_cost) if obs.original_cost is not None else None
            if c_rev is not None and (c_orig is None or c_rev != c_orig):
                if c_rev != prev_rev:
                    cost_revision_count += 1
                    prev_rev = c_rev

        # Schedule revision signals
        schedule_revised = bool(
            latest.revised_completion_date is not None
            and latest.original_completion_date is not None
            and latest.revised_completion_date != latest.original_completion_date
        )

        # Count distinct schedule revision events in timeline
        schedule_extension_count = 0
        prev_rev_date: str | None = None
        for obs in trajectory:
            c_rev_date = obs.revised_completion_date
            c_orig_date = obs.original_completion_date
            if c_rev_date is not None and (c_orig_date is None or c_rev_date != c_orig_date):
                if c_rev_date != prev_rev_date:
                    schedule_extension_count += 1
                    prev_rev_date = c_rev_date

        signals = ProjectSignals(
            cost_revised=cost_revised,
            schedule_revised=schedule_revised,
            cost_revision_ratio=cost_revision_ratio,
            cost_revision_count=cost_revision_count,
            schedule_extension_count=schedule_extension_count,
            reporting_months_count=len(trajectory),
            first_reported_month=trajectory[0].report_month,
            latest_reported_month=latest.report_month,
        )

        # Recent Changes: strictly compare adjacent observations
        if len(trajectory) >= 2:
            prev = trajectory[-2]
            p_curr = float(latest.physical_progress) if latest.physical_progress is not None else None
            p_prev = float(prev.physical_progress) if prev.physical_progress is not None else None
            phys_delta = round(p_curr - p_prev, 2) if (p_curr is not None and p_prev is not None) else None

            e_curr = float(latest.cumulative_expenditure) if latest.cumulative_expenditure is not None else None
            e_prev = float(prev.cumulative_expenditure) if prev.cumulative_expenditure is not None else None
            exp_delta = round(e_curr - e_prev, 2) if (e_curr is not None and e_prev is not None) else None

            rc_curr = float(latest.revised_cost) if latest.revised_cost is not None else None
            rc_prev = float(prev.revised_cost) if prev.revised_cost is not None else None
            rev_cost_delta = round(rc_curr - rc_prev, 2) if (rc_curr is not None and rc_prev is not None) else None

            completion_date_changed = bool(
                latest.revised_completion_date != prev.revised_completion_date
                or latest.original_completion_date != prev.original_completion_date
            )

            recent_changes = ProjectRecentChanges(
                has_prior_observation=True,
                prior_report_month=prev.report_month,
                physical_progress_delta=phys_delta,
                expenditure_delta=exp_delta,
                revised_cost_delta=rev_cost_delta,
                completion_date_changed=completion_date_changed,
            )
        else:
            recent_changes = ProjectRecentChanges(
                has_prior_observation=False,
                prior_report_month=None,
                physical_progress_delta=None,
                expenditure_delta=None,
                revised_cost_delta=None,
                completion_date_changed=False,
            )

        return signals, recent_changes

    @staticmethod
    def _resolve_risk_and_governance(
        clean_code: str,
    ) -> tuple[
        ProjectIntelligenceRisk | None,
        ProjectIntelligenceModelGovernance | None,
        list[ProjectRiskHistoryPoint],
        ProjectRiskDrivers,
    ]:
        """Resolve production schedule-risk assessment, history, drivers, and model governance."""
        try:
            risk_repo = get_serving_repository()
            risk_records = risk_repo.history(clean_code)
        except Exception:
            # If serving artifact is unavailable or unconfigured, gracefully report risk as unavailable
            risk_records = []

        if not risk_records:
            return None, None, [], ProjectRiskDrivers()

        # Risk records are ordered by report_month ASC in history()
        latest_risk = risk_records[-1]

        risk = ProjectIntelligenceRisk(
            risk_probability=latest_risk["risk_probability"],
            raw_probability=latest_risk["raw_probability"],
            risk_rank=latest_risk["risk_rank"],
            risk_percentile=latest_risk["risk_percentile"],
            population_size=latest_risk["population_size"],
            report_month=latest_risk["report_month"],
            regime=latest_risk["regime"],
            model_id=latest_risk["model_id"],
            target=latest_risk["target"],
            calibration_active=latest_risk["calibration_active"],
        )

        # Model governance from PR-02 registry
        model_entry = get_model_by_id(latest_risk["model_id"])
        if model_entry:
            calib = model_entry.get("calibration", {})
            calib_policy = calib.get("policy") if isinstance(calib, dict) else None
            model_gov = ProjectIntelligenceModelGovernance(
                model_id=model_entry["model_id"],
                target=model_entry["target"],
                model_family=model_entry["model_family"],
                status=model_entry["status"],
                is_active=model_entry["is_active"],
                coverage_period=model_entry["coverage_period"],
                calibration_policy=calib_policy,
                explanation_method=model_entry.get("explanation_method"),
            )
        else:
            model_gov = None

        # Chronological history points
        history_points = [
            ProjectRiskHistoryPoint(
                report_month=r["report_month"],
                risk_probability=r["risk_probability"],
                raw_probability=r["raw_probability"],
                risk_rank=r["risk_rank"],
                risk_percentile=r["risk_percentile"],
                population_size=r["population_size"],
                regime=r["regime"],
                model_id=r["model_id"],
                calibration_active=r["calibration_active"],
            )
            for r in risk_records
        ]

        # Drivers from latest risk record
        raw_pos = latest_risk.get("top_positive_contributors") or []
        raw_neg = latest_risk.get("top_negative_contributors") or []

        pos_contributors = [
            Contributor(**c) if isinstance(c, dict) else c for c in raw_pos
        ]
        neg_contributors = [
            Contributor(**c) if isinstance(c, dict) else c for c in raw_neg
        ]

        # Combine and order strongest drivers deterministically by absolute contribution DESC, rank ASC, feature ASC
        all_contributors = list(pos_contributors) + list(neg_contributors)
        strongest = sorted(
            all_contributors,
            key=lambda c: (-abs(c.contribution), c.rank, c.feature),
        )

        drivers = ProjectRiskDrivers(
            top_positive=pos_contributors,
            top_negative=neg_contributors,
            strongest_drivers=strongest,
        )

        return risk, model_gov, history_points, drivers
