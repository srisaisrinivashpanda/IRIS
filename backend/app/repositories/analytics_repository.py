"""Repository for analytics queries, deterministic aggregations, and risk metrics."""

from __future__ import annotations

import math
import sqlite3
from contextlib import closing
from typing import Any
from sqlalchemy import case, func, or_, select, and_
from sqlalchemy.orm import Session

from backend.app.models.project_month import ProjectMonthObservation
from src.serving.repository import ServingRepository, score_distribution


class AnalyticsRepository:
    """Encapsulates SQL aggregations for project observations and risk serving data."""

    def __init__(self, db: Session, risk_repo: ServingRepository) -> None:
        self.db = db
        self.risk_repo = risk_repo

    def _build_observation_filters(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> list[Any]:
        """Build SQLAlchemy filter clauses for project observation queries."""
        filters = []
        if from_month:
            filters.append(ProjectMonthObservation.report_month >= from_month)
        if to_month:
            filters.append(ProjectMonthObservation.report_month <= to_month)
        if state:
            filters.append(ProjectMonthObservation.state.ilike(f"%{state.strip()}%"))
        if sector:
            filters.append(ProjectMonthObservation.sector.ilike(f"%{sector.strip()}%"))
        if agency:
            filters.append(ProjectMonthObservation.agency.ilike(f"%{agency.strip()}%"))
        if project_code:
            filters.append(ProjectMonthObservation.project_code == project_code.strip())
        return filters

    def _build_latest_project_subquery(self, filters: list[Any]) -> Any:
        """Construct subquery for latest observation per project satisfying the ACTIVE filter scope.
        
        CRITICAL FINANCIAL LATEST-OBSERVATION RULE:
        The latest observation per project MUST satisfy the SAME active filter scope
        (from_month, to_month, state, sector, agency, project_code).
        It never selects globally latest observations outside the filter boundary.
        """
        stmt = (
            select(
                ProjectMonthObservation.project_code,
                func.max(ProjectMonthObservation.report_month).label("latest_month"),
            )
            .group_by(ProjectMonthObservation.project_code)
        )
        if filters:
            stmt = stmt.where(*filters)
        return stmt.subquery()

    def get_overview_aggregation(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> dict[str, Any]:
        """Aggregate high-level portfolio overview metrics."""
        filters = self._build_observation_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        # 1. Observation-level metrics
        obs_stmt = select(
            func.count(ProjectMonthObservation.id).label("obs_count"),
            func.count(func.distinct(ProjectMonthObservation.project_code)).label("proj_count"),
            func.min(ProjectMonthObservation.report_month).label("min_month"),
            func.max(ProjectMonthObservation.report_month).label("max_month"),
            func.count(func.distinct(case((ProjectMonthObservation.state.is_not(None) & (ProjectMonthObservation.state != ""), ProjectMonthObservation.state)))).label("states_count"),
            func.count(func.distinct(case((ProjectMonthObservation.agency.is_not(None) & (ProjectMonthObservation.agency != ""), ProjectMonthObservation.agency)))).label("agencies_count"),
            func.count(func.distinct(case((ProjectMonthObservation.sector.is_not(None) & (ProjectMonthObservation.sector != ""), ProjectMonthObservation.sector)))).label("sectors_count"),
            func.avg(ProjectMonthObservation.physical_progress).label("avg_progress"),
            func.count(ProjectMonthObservation.physical_progress).label("progress_count"),
            func.sum(case((ProjectMonthObservation.original_cost.is_(None), 1), else_=0)).label("missing_orig_cost"),
            func.sum(case((ProjectMonthObservation.revised_cost.is_(None), 1), else_=0)).label("missing_rev_cost"),
            func.sum(case((ProjectMonthObservation.cumulative_expenditure.is_(None), 1), else_=0)).label("missing_exp"),
            func.sum(case((ProjectMonthObservation.physical_progress.is_(None), 1), else_=0)).label("missing_progress"),
        )
        if filters:
            obs_stmt = obs_stmt.where(*filters)

        obs_row = self.db.execute(obs_stmt).one()
        obs_count = obs_row.obs_count or 0

        if obs_count == 0:
            return {
                "unique_project_count": 0,
                "observation_count": 0,
                "earliest_observation_month": None,
                "latest_observation_month": None,
                "states_count": 0,
                "agencies_count": 0,
                "sectors_count": 0,
                "total_sanctioned_cost": None,
                "total_revised_cost": None,
                "total_cumulative_expenditure": None,
                "average_physical_progress": None,
                "progress_reporting_observations": 0,
                "assessed_project_count": 0,
                "missing_orig_cost": 0,
                "missing_rev_cost": 0,
                "missing_exp": 0,
                "missing_progress": 0,
            }

        # 2. Latest-per-project financial snapshot metrics (within filtered scope)
        subq = self._build_latest_project_subquery(filters)
        fin_stmt = (
            select(
                func.sum(ProjectMonthObservation.original_cost).label("total_orig_cost"),
                func.sum(ProjectMonthObservation.revised_cost).label("total_rev_cost"),
                func.sum(ProjectMonthObservation.cumulative_expenditure).label("total_exp"),
            )
            .join(
                subq,
                and_(
                    ProjectMonthObservation.project_code == subq.c.project_code,
                    ProjectMonthObservation.report_month == subq.c.latest_month,
                ),
            )
        )
        if filters:
            fin_stmt = fin_stmt.where(*filters)

        fin_row = self.db.execute(fin_stmt).one()

        # 3. Risk-assessed unique projects within matching scope
        risk_assessed_count = self.count_risk_assessed_projects(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        return {
            "unique_project_count": obs_row.proj_count or 0,
            "observation_count": obs_count,
            "earliest_observation_month": obs_row.min_month,
            "latest_observation_month": obs_row.max_month,
            "states_count": obs_row.states_count or 0,
            "agencies_count": obs_row.agencies_count or 0,
            "sectors_count": obs_row.sectors_count or 0,
            "total_sanctioned_cost": float(fin_row.total_orig_cost) if fin_row.total_orig_cost is not None else None,
            "total_revised_cost": float(fin_row.total_rev_cost) if fin_row.total_rev_cost is not None else None,
            "total_cumulative_expenditure": float(fin_row.total_exp) if fin_row.total_exp is not None else None,
            "average_physical_progress": round(float(obs_row.avg_progress), 2) if obs_row.avg_progress is not None else None,
            "progress_reporting_observations": obs_row.progress_count or 0,
            "assessed_project_count": risk_assessed_count,
            "missing_orig_cost": int(obs_row.missing_orig_cost or 0),
            "missing_rev_cost": int(obs_row.missing_rev_cost or 0),
            "missing_exp": int(obs_row.missing_exp or 0),
            "missing_progress": int(obs_row.missing_progress or 0),
        }

    def get_trends(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> list[dict[str, Any]]:
        """Aggregate monthly observation metrics strictly for observed months."""
        filters = self._build_observation_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        stmt = (
            select(
                ProjectMonthObservation.report_month,
                func.count(ProjectMonthObservation.id).label("obs_count"),
                func.count(func.distinct(ProjectMonthObservation.project_code)).label("proj_count"),
                func.sum(ProjectMonthObservation.cumulative_expenditure).label("total_exp"),
                func.avg(ProjectMonthObservation.cumulative_expenditure).label("avg_exp"),
                func.sum(ProjectMonthObservation.original_cost).label("total_orig_cost"),
                func.sum(ProjectMonthObservation.revised_cost).label("total_rev_cost"),
                func.avg(ProjectMonthObservation.physical_progress).label("avg_progress"),
                func.count(ProjectMonthObservation.physical_progress).label("progress_count"),
            )
            .group_by(ProjectMonthObservation.report_month)
            .order_by(ProjectMonthObservation.report_month.asc())
        )
        if filters:
            stmt = stmt.where(*filters)

        rows = self.db.execute(stmt).all()
        if not rows:
            return []

        # Look up monthly risk statistics from serving repository for corresponding months
        risk_stats_by_month = self.get_risk_stats_by_month(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        results = []
        for r in rows:
            month = r.report_month
            risk_info = risk_stats_by_month.get(month, {})
            results.append(
                {
                    "report_month": month,
                    "observation_count": r.obs_count,
                    "unique_project_count": r.proj_count,
                    "total_cumulative_expenditure": float(r.total_exp) if r.total_exp is not None else None,
                    "average_cumulative_expenditure": round(float(r.avg_exp), 2) if r.avg_exp is not None else None,
                    "total_original_cost": float(r.total_orig_cost) if r.total_orig_cost is not None else None,
                    "total_revised_cost": float(r.total_rev_cost) if r.total_rev_cost is not None else None,
                    "average_physical_progress": round(float(r.avg_progress), 2) if r.avg_progress is not None else None,
                    "progress_reporting_count": r.progress_count or 0,
                    "risk_assessed_project_count": risk_info.get("assessed_count", 0),
                    "average_risk_probability": risk_info.get("avg_risk_probability"),
                    "average_raw_probability": risk_info.get("avg_raw_probability"),
                }
            )
        return results

    def get_geography(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> list[dict[str, Any]]:
        """Group observations by state with deterministic ordering."""
        filters = self._build_observation_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        # 1. Observation counts and progress grouped by state
        obs_stmt = (
            select(
                ProjectMonthObservation.state,
                func.count(ProjectMonthObservation.id).label("obs_count"),
                func.count(func.distinct(ProjectMonthObservation.project_code)).label("proj_count"),
                func.avg(ProjectMonthObservation.physical_progress).label("avg_progress"),
                func.count(ProjectMonthObservation.physical_progress).label("progress_count"),
            )
            .where(ProjectMonthObservation.state.is_not(None), ProjectMonthObservation.state != "")
            .group_by(ProjectMonthObservation.state)
        )
        if filters:
            obs_stmt = obs_stmt.where(*filters)

        obs_rows = {
            r.state: {
                "obs_count": r.obs_count,
                "proj_count": r.proj_count,
                "avg_progress": round(float(r.avg_progress), 2) if r.avg_progress is not None else None,
                "progress_count": r.progress_count or 0,
            }
            for r in self.db.execute(obs_stmt).all()
        }

        if not obs_rows:
            return []

        # 2. Latest project expenditure per state
        subq = self._build_latest_project_subquery(filters)
        exp_stmt = (
            select(
                ProjectMonthObservation.state,
                func.sum(ProjectMonthObservation.cumulative_expenditure).label("total_exp"),
            )
            .join(
                subq,
                and_(
                    ProjectMonthObservation.project_code == subq.c.project_code,
                    ProjectMonthObservation.report_month == subq.c.latest_month,
                ),
            )
            .where(ProjectMonthObservation.state.is_not(None), ProjectMonthObservation.state != "")
            .group_by(ProjectMonthObservation.state)
        )
        if filters:
            exp_stmt = exp_stmt.where(*filters)

        exp_by_state = {
            r.state: float(r.total_exp) if r.total_exp is not None else None
            for r in self.db.execute(exp_stmt).all()
        }

        # 3. Risk stats by state
        risk_by_state = self.get_risk_stats_by_state(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        results = []
        for st, metrics in obs_rows.items():
            r_info = risk_by_state.get(st, {})
            results.append(
                {
                    "state": st,
                    "unique_project_count": metrics["proj_count"],
                    "observation_count": metrics["obs_count"],
                    "total_cumulative_expenditure": exp_by_state.get(st),
                    "average_physical_progress": metrics["avg_progress"],
                    "progress_reporting_count": metrics["progress_count"],
                    "assessed_project_count": r_info.get("assessed_count", 0),
                    "average_risk_probability": r_info.get("avg_risk_probability"),
                }
            )

        # Deterministic sorting: unique_project_count DESC, state ASC
        results.sort(key=lambda x: (-x["unique_project_count"], x["state"]))
        return results

    def get_sectors(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> list[dict[str, Any]]:
        """Group observations by sector with deterministic ordering."""
        filters = self._build_observation_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        obs_stmt = (
            select(
                ProjectMonthObservation.sector,
                func.count(ProjectMonthObservation.id).label("obs_count"),
                func.count(func.distinct(ProjectMonthObservation.project_code)).label("proj_count"),
                func.avg(ProjectMonthObservation.physical_progress).label("avg_progress"),
                func.count(ProjectMonthObservation.physical_progress).label("progress_count"),
            )
            .where(ProjectMonthObservation.sector.is_not(None), ProjectMonthObservation.sector != "")
            .group_by(ProjectMonthObservation.sector)
        )
        if filters:
            obs_stmt = obs_stmt.where(*filters)

        obs_rows = {
            r.sector: {
                "obs_count": r.obs_count,
                "proj_count": r.proj_count,
                "avg_progress": round(float(r.avg_progress), 2) if r.avg_progress is not None else None,
                "progress_count": r.progress_count or 0,
            }
            for r in self.db.execute(obs_stmt).all()
        }

        if not obs_rows:
            return []

        # Latest project finances per sector
        subq = self._build_latest_project_subquery(filters)
        fin_stmt = (
            select(
                ProjectMonthObservation.sector,
                func.sum(ProjectMonthObservation.original_cost).label("total_orig_cost"),
                func.sum(ProjectMonthObservation.cumulative_expenditure).label("total_exp"),
            )
            .join(
                subq,
                and_(
                    ProjectMonthObservation.project_code == subq.c.project_code,
                    ProjectMonthObservation.report_month == subq.c.latest_month,
                ),
            )
            .where(ProjectMonthObservation.sector.is_not(None), ProjectMonthObservation.sector != "")
            .group_by(ProjectMonthObservation.sector)
        )
        if filters:
            fin_stmt = fin_stmt.where(*filters)

        fin_by_sector = {
            r.sector: {
                "total_orig_cost": float(r.total_orig_cost) if r.total_orig_cost is not None else None,
                "total_exp": float(r.total_exp) if r.total_exp is not None else None,
            }
            for r in self.db.execute(fin_stmt).all()
        }

        # Risk stats by sector
        risk_by_sector = self.get_risk_stats_by_sector(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        results = []
        for sec, metrics in obs_rows.items():
            fin = fin_by_sector.get(sec, {})
            r_info = risk_by_sector.get(sec, {})
            results.append(
                {
                    "sector": sec,
                    "unique_project_count": metrics["proj_count"],
                    "observation_count": metrics["obs_count"],
                    "total_original_cost": fin.get("total_orig_cost"),
                    "total_cumulative_expenditure": fin.get("total_exp"),
                    "average_physical_progress": metrics["avg_progress"],
                    "progress_reporting_count": metrics["progress_count"],
                    "assessed_project_count": r_info.get("assessed_count", 0),
                    "average_risk_probability": r_info.get("avg_risk_probability"),
                }
            )

        results.sort(key=lambda x: (-x["unique_project_count"], x["sector"]))
        return results

    def get_agencies(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> list[dict[str, Any]]:
        """Group observations by agency with deterministic ordering."""
        filters = self._build_observation_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        obs_stmt = (
            select(
                ProjectMonthObservation.agency,
                func.count(ProjectMonthObservation.id).label("obs_count"),
                func.count(func.distinct(ProjectMonthObservation.project_code)).label("proj_count"),
                func.avg(ProjectMonthObservation.physical_progress).label("avg_progress"),
                func.count(ProjectMonthObservation.physical_progress).label("progress_count"),
            )
            .where(ProjectMonthObservation.agency.is_not(None), ProjectMonthObservation.agency != "")
            .group_by(ProjectMonthObservation.agency)
        )
        if filters:
            obs_stmt = obs_stmt.where(*filters)

        obs_rows = {
            r.agency: {
                "obs_count": r.obs_count,
                "proj_count": r.proj_count,
                "avg_progress": round(float(r.avg_progress), 2) if r.avg_progress is not None else None,
                "progress_count": r.progress_count or 0,
            }
            for r in self.db.execute(obs_stmt).all()
        }

        if not obs_rows:
            return []

        subq = self._build_latest_project_subquery(filters)
        fin_stmt = (
            select(
                ProjectMonthObservation.agency,
                func.sum(ProjectMonthObservation.original_cost).label("total_orig_cost"),
                func.sum(ProjectMonthObservation.cumulative_expenditure).label("total_exp"),
            )
            .join(
                subq,
                and_(
                    ProjectMonthObservation.project_code == subq.c.project_code,
                    ProjectMonthObservation.report_month == subq.c.latest_month,
                ),
            )
            .where(ProjectMonthObservation.agency.is_not(None), ProjectMonthObservation.agency != "")
            .group_by(ProjectMonthObservation.agency)
        )
        if filters:
            fin_stmt = fin_stmt.where(*filters)

        fin_by_agency = {
            r.agency: {
                "total_orig_cost": float(r.total_orig_cost) if r.total_orig_cost is not None else None,
                "total_exp": float(r.total_exp) if r.total_exp is not None else None,
            }
            for r in self.db.execute(fin_stmt).all()
        }

        results = []
        for ag, metrics in obs_rows.items():
            fin = fin_by_agency.get(ag, {})
            results.append(
                {
                    "agency": ag,
                    "unique_project_count": metrics["proj_count"],
                    "observation_count": metrics["obs_count"],
                    "total_original_cost": fin.get("total_orig_cost"),
                    "total_cumulative_expenditure": fin.get("total_exp"),
                    "average_physical_progress": metrics["avg_progress"],
                    "progress_reporting_count": metrics["progress_count"],
                    "assessed_project_count": 0,
                    "average_risk_probability": None,
                }
            )

        results.sort(key=lambda x: (-x["unique_project_count"], x["agency"]))
        return results

    def get_financials(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> dict[str, Any]:
        """Aggregate project-level financial metrics using latest qualifying observation per project."""
        filters = self._build_observation_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        obs_count_stmt = select(func.count(ProjectMonthObservation.id))
        if filters:
            obs_count_stmt = obs_count_stmt.where(*filters)
        obs_count = self.db.execute(obs_count_stmt).scalar_one() or 0

        if obs_count == 0:
            return {
                "observation_count": 0,
                "unique_project_count": 0,
                "metrics": {
                    "projects_with_cost": 0,
                    "total_original_cost": None,
                    "mean_original_cost": None,
                    "projects_with_revised_cost": 0,
                    "total_revised_cost": None,
                    "mean_revised_cost": None,
                    "projects_with_expenditure": 0,
                    "total_cumulative_expenditure": None,
                    "mean_cumulative_expenditure": None,
                    "cost_revision_projects_count": 0,
                    "total_cost_escalation": None,
                    "overall_expenditure_to_revised_cost_ratio": None,
                    "overall_expenditure_to_original_cost_ratio": None,
                },
            }

        subq = self._build_latest_project_subquery(filters)
        fin_stmt = (
            select(
                func.count(ProjectMonthObservation.project_code).label("unique_projects"),
                func.count(ProjectMonthObservation.original_cost).label("count_orig_cost"),
                func.sum(ProjectMonthObservation.original_cost).label("sum_orig_cost"),
                func.avg(ProjectMonthObservation.original_cost).label("avg_orig_cost"),
                func.count(ProjectMonthObservation.revised_cost).label("count_rev_cost"),
                func.sum(ProjectMonthObservation.revised_cost).label("sum_rev_cost"),
                func.avg(ProjectMonthObservation.revised_cost).label("avg_rev_cost"),
                func.count(ProjectMonthObservation.cumulative_expenditure).label("count_exp"),
                func.sum(ProjectMonthObservation.cumulative_expenditure).label("sum_exp"),
                func.avg(ProjectMonthObservation.cumulative_expenditure).label("avg_exp"),
                func.sum(
                    case(
                        (
                            ProjectMonthObservation.revised_cost.is_not(None)
                            & (ProjectMonthObservation.revised_cost > ProjectMonthObservation.original_cost),
                            1,
                        ),
                        else_=0,
                    )
                ).label("count_overruns"),
                func.sum(
                    case(
                        (
                            ProjectMonthObservation.revised_cost.is_not(None)
                            & (ProjectMonthObservation.revised_cost > ProjectMonthObservation.original_cost),
                            ProjectMonthObservation.revised_cost - ProjectMonthObservation.original_cost,
                        ),
                        else_=0.0,
                    )
                ).label("sum_escalation"),
            )
            .join(
                subq,
                and_(
                    ProjectMonthObservation.project_code == subq.c.project_code,
                    ProjectMonthObservation.report_month == subq.c.latest_month,
                ),
            )
        )
        if filters:
            fin_stmt = fin_stmt.where(*filters)

        r = self.db.execute(fin_stmt).one()

        total_orig = float(r.sum_orig_cost) if r.sum_orig_cost is not None else None
        total_rev = float(r.sum_rev_cost) if r.sum_rev_cost is not None else None
        total_exp = float(r.sum_exp) if r.sum_exp is not None else None

        ratio_rev = round(total_exp / total_rev, 4) if total_exp is not None and total_rev and total_rev > 0 else None
        ratio_orig = round(total_exp / total_orig, 4) if total_exp is not None and total_orig and total_orig > 0 else None

        return {
            "observation_count": obs_count,
            "unique_project_count": r.unique_projects or 0,
            "metrics": {
                "projects_with_cost": r.count_orig_cost or 0,
                "total_original_cost": total_orig,
                "mean_original_cost": round(float(r.avg_orig_cost), 2) if r.avg_orig_cost is not None else None,
                "projects_with_revised_cost": r.count_rev_cost or 0,
                "total_revised_cost": total_rev,
                "mean_revised_cost": round(float(r.avg_rev_cost), 2) if r.avg_rev_cost is not None else None,
                "projects_with_expenditure": r.count_exp or 0,
                "total_cumulative_expenditure": total_exp,
                "mean_cumulative_expenditure": round(float(r.avg_exp), 2) if r.avg_exp is not None else None,
                "cost_revision_projects_count": int(r.count_overruns or 0),
                "total_cost_escalation": round(float(r.sum_escalation), 2) if r.sum_escalation is not None else None,
                "overall_expenditure_to_revised_cost_ratio": ratio_rev,
                "overall_expenditure_to_original_cost_ratio": ratio_orig,
            },
        }

    def get_progress(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> dict[str, Any]:
        """Aggregate physical progress statistics and sectoral breakdown."""
        filters = self._build_observation_filters(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )

        obs_stmt = select(
            func.count(ProjectMonthObservation.id).label("total_obs"),
            func.count(ProjectMonthObservation.physical_progress).label("rep_obs"),
            func.avg(ProjectMonthObservation.physical_progress).label("avg_prog"),
            func.min(ProjectMonthObservation.physical_progress).label("min_prog"),
            func.max(ProjectMonthObservation.physical_progress).label("max_prog"),
        )
        if filters:
            obs_stmt = obs_stmt.where(*filters)

        row = self.db.execute(obs_stmt).one()
        total_obs = row.total_obs or 0
        rep_obs = row.rep_obs or 0
        missing_obs = total_obs - rep_obs
        coverage_rate = round(rep_obs / total_obs, 4) if total_obs > 0 else 0.0

        quantiles = None
        median_val = None
        if rep_obs > 0:
            # Fetch all non-null values for statistical quantile distribution
            val_stmt = select(ProjectMonthObservation.physical_progress).where(
                ProjectMonthObservation.physical_progress.is_not(None)
            )
            if filters:
                val_stmt = val_stmt.where(*filters)
            val_stmt = val_stmt.order_by(ProjectMonthObservation.physical_progress.asc())
            progress_values = [float(v) for v in self.db.execute(val_stmt).scalars().all()]
            if progress_values:
                quantiles = score_distribution(progress_values)
                median_val = quantiles["median"]

        # Sectoral progress breakdown
        sec_stmt = (
            select(
                ProjectMonthObservation.sector,
                func.count(ProjectMonthObservation.physical_progress).label("rep_count"),
                func.sum(case((ProjectMonthObservation.physical_progress.is_(None), 1), else_=0)).label("miss_count"),
                func.avg(ProjectMonthObservation.physical_progress).label("avg_prog"),
            )
            .where(ProjectMonthObservation.sector.is_not(None), ProjectMonthObservation.sector != "")
            .group_by(ProjectMonthObservation.sector)
            .order_by(func.count(ProjectMonthObservation.physical_progress).desc(), ProjectMonthObservation.sector.asc())
        )
        if filters:
            sec_stmt = sec_stmt.where(*filters)

        sec_rows = self.db.execute(sec_stmt).all()
        by_sector = [
            {
                "sector": r.sector,
                "reporting_count": r.rep_count or 0,
                "missing_count": int(r.miss_count or 0),
                "mean_physical_progress": round(float(r.avg_prog), 2) if r.avg_prog is not None else None,
            }
            for r in sec_rows
        ]

        return {
            "metrics": {
                "total_observations": total_obs,
                "reporting_observations": rep_obs,
                "missing_observations": missing_obs,
                "coverage_rate": coverage_rate,
                "mean_physical_progress": round(float(row.avg_prog), 2) if row.avg_prog is not None else None,
                "median_physical_progress": median_val,
                "min_physical_progress": float(row.min_prog) if row.min_prog is not None else None,
                "max_physical_progress": float(row.max_prog) if row.max_prog is not None else None,
                "distribution_quantiles": quantiles,
            },
            "by_sector": by_sector,
        }

    # =========================================================================
    # RISK SERVING AGGREGATION METHODS (DIRECT SQLITE QUERIES ON SERVING DB)
    # =========================================================================

    def _build_risk_where(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        regime: str | None = None,
    ) -> tuple[str, list[Any]]:
        """Construct WHERE clause for SQLite risk_records queries."""
        clauses = ["target = 'target_effective_schedule_ext_3m'"]
        params: list[Any] = []

        if from_month:
            clauses.append("report_month >= ?")
            params.append(from_month.strip())
        if to_month:
            clauses.append("report_month <= ?")
            params.append(to_month.strip())
        if state:
            clauses.append("state LIKE ?")
            params.append(f"%{state.strip()}%")
        if sector:
            clauses.append("sector LIKE ?")
            params.append(f"%{sector.strip()}%")
        if agency:
            clauses.append("agency LIKE ?")
            params.append(f"%{agency.strip()}%")
        if project_code:
            clauses.append("project_code = ?")
            params.append(project_code.strip())
        if regime:
            clauses.append("regime = ?")
            params.append(regime.strip())

        return f" WHERE {' AND '.join(clauses)}", params

    def count_risk_assessed_projects(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        regime: str | None = None,
    ) -> int:
        """Count distinct assessed projects in serving DB matching filter."""
        where, params = self._build_risk_where(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
            regime=regime,
        )
        with closing(self.risk_repo._connect()) as conn:
            row = conn.execute(
                f"SELECT COUNT(DISTINCT project_code) FROM risk_records{where}", params
            ).fetchone()
            return int(row[0]) if row and row[0] is not None else 0

    def get_risk_stats_by_month(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> dict[str, dict[str, Any]]:
        """Compute monthly risk statistics from serving DB."""
        where, params = self._build_risk_where(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )
        with closing(self.risk_repo._connect()) as conn:
            rows = conn.execute(
                f"SELECT report_month, COUNT(DISTINCT project_code), AVG(risk_probability), AVG(raw_probability) "
                f"FROM risk_records{where} GROUP BY report_month ORDER BY report_month ASC",
                params,
            ).fetchall()
            return {
                r[0]: {
                    "assessed_count": int(r[1]),
                    "avg_risk_probability": round(float(r[2]), 4) if r[2] is not None else None,
                    "avg_raw_probability": round(float(r[3]), 4) if r[3] is not None else None,
                }
                for r in rows
            }

    def get_risk_stats_by_state(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> dict[str, dict[str, Any]]:
        """Compute state risk statistics from serving DB."""
        where, params = self._build_risk_where(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )
        with closing(self.risk_repo._connect()) as conn:
            rows = conn.execute(
                f"SELECT state, COUNT(DISTINCT project_code), AVG(risk_probability) "
                f"FROM risk_records{where} AND state IS NOT NULL AND state != '' "
                f"GROUP BY state",
                params,
            ).fetchall()
            return {
                r[0]: {
                    "assessed_count": int(r[1]),
                    "avg_risk_probability": round(float(r[2]), 4) if r[2] is not None else None,
                }
                for r in rows
            }

    def get_risk_stats_by_sector(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
    ) -> dict[str, dict[str, Any]]:
        """Compute sector risk statistics from serving DB."""
        where, params = self._build_risk_where(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
        )
        with closing(self.risk_repo._connect()) as conn:
            rows = conn.execute(
                f"SELECT sector, COUNT(DISTINCT project_code), AVG(risk_probability) "
                f"FROM risk_records{where} AND sector IS NOT NULL AND sector != '' "
                f"GROUP BY sector",
                params,
            ).fetchall()
            return {
                r[0]: {
                    "assessed_count": int(r[1]),
                    "avg_risk_probability": round(float(r[2]), 4) if r[2] is not None else None,
                }
                for r in rows
            }

    def get_risk_analytics(
        self,
        *,
        from_month: str | None = None,
        to_month: str | None = None,
        state: str | None = None,
        sector: str | None = None,
        agency: str | None = None,
        project_code: str | None = None,
        regime: str | None = None,
    ) -> dict[str, Any]:
        """Aggregate production schedule-extension risk analytics with exact distributions."""
        where, params = self._build_risk_where(
            from_month=from_month,
            to_month=to_month,
            state=state,
            sector=sector,
            agency=agency,
            project_code=project_code,
            regime=regime,
        )

        with closing(self.risk_repo._connect()) as conn:
            # 1. Basic counts and evaluation period
            summary_row = conn.execute(
                f"SELECT COUNT(*), COUNT(DISTINCT project_code), MIN(report_month), MAX(report_month) "
                f"FROM risk_records{where}",
                params,
            ).fetchone()

            total_obs = int(summary_row[0]) if summary_row and summary_row[0] else 0
            unique_proj = int(summary_row[1]) if summary_row and summary_row[1] else 0
            earliest_m = summary_row[2] if summary_row else None
            latest_m = summary_row[3] if summary_row else None

            if total_obs == 0:
                return {
                    "assessed_project_count": 0,
                    "assessed_observation_count": 0,
                    "evaluation_earliest_month": None,
                    "evaluation_latest_month": None,
                    "calibrated_risk_distribution": None,
                    "raw_probability_distribution": None,
                    "regime_breakdown": [],
                    "monthly_trend": [],
                }

            # 2. Probability distributions
            score_rows = conn.execute(
                f"SELECT risk_probability, raw_probability FROM risk_records{where} "
                f"ORDER BY risk_probability ASC",
                params,
            ).fetchall()
            calibrated_scores = [float(r[0]) for r in score_rows]
            raw_scores = [float(r[1]) for r in score_rows]

            calibrated_dist = score_distribution(calibrated_scores) if calibrated_scores else None
            raw_dist = score_distribution(raw_scores) if raw_scores else None

            # 3. Regime breakdown
            regime_rows = conn.execute(
                f"SELECT regime, model_id, COUNT(DISTINCT project_code), COUNT(*), "
                f"SUM(calibration_active) FROM risk_records{where} "
                f"GROUP BY regime, model_id ORDER BY regime, model_id",
                params,
            ).fetchall()
            regime_breakdown = [
                {
                    "regime": r[0],
                    "model_id": r[1],
                    "unique_project_count": int(r[2]),
                    "observation_count": int(r[3]),
                    "calibration_active_count": int(r[4] or 0),
                }
                for r in regime_rows
            ]

            # 4. Monthly trend
            month_rows = conn.execute(
                f"SELECT report_month, COUNT(DISTINCT project_code), COUNT(*), "
                f"AVG(risk_probability), AVG(raw_probability) "
                f"FROM risk_records{where} GROUP BY report_month ORDER BY report_month ASC",
                params,
            ).fetchall()
            monthly_trend = [
                {
                    "evaluation_month": r[0],
                    "assessed_project_count": int(r[1]),
                    "assessed_observation_count": int(r[2]),
                    "mean_risk_probability": round(float(r[3]), 4) if r[3] is not None else None,
                    "mean_raw_probability": round(float(r[4]), 4) if r[4] is not None else None,
                }
                for r in month_rows
            ]

            return {
                "assessed_project_count": unique_proj,
                "assessed_observation_count": total_obs,
                "evaluation_earliest_month": earliest_m,
                "evaluation_latest_month": latest_m,
                "calibrated_risk_distribution": calibrated_dist,
                "raw_probability_distribution": raw_dist,
                "regime_breakdown": regime_breakdown,
                "monthly_trend": monthly_trend,
            }
