import React from "react";
import type { OverviewResponse, RiskAnalyticsResponse } from "@/types/analytics.ts";
import { DashboardKpiSkeleton } from "./DashboardSkeleton.tsx";
import { DashboardErrorState } from "./DashboardErrorState.tsx";
import { Layers, Activity, DollarSign, Gauge, ShieldAlert, Calendar } from "lucide-react";

interface DashboardKpiStripProps {
  overview?: OverviewResponse;
  risk?: RiskAnalyticsResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const DashboardKpiStrip: React.FC<DashboardKpiStripProps> = ({
  overview,
  risk,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return <DashboardKpiSkeleton />;
  }

  if (isError || !overview) {
    return (
      <DashboardErrorState
        title="Failed to load executive KPI metrics"
        message={error?.message || "Portfolio overview data could not be retrieved."}
        onRetry={onRetry}
      />
    );
  }

  // 1. Unique Projects
  const uniqueProjects = overview.unique_project_count != null
    ? overview.unique_project_count.toLocaleString()
    : "—";

  // 2. Monthly Observations
  const observations = overview.observation_count != null
    ? overview.observation_count.toLocaleString()
    : "—";

  // 3. Portfolio Expenditure (Rs. Cr) - Latest qualifying observation semantics
  const expenditureFormatted = overview.total_cumulative_expenditure != null
    ? `₹${Number(overview.total_cumulative_expenditure.toFixed(2)).toLocaleString()} Cr`
    : "—";

  // 4. Average Physical Progress - Truthful null representation, NEVER 0%
  const progressFormatted = overview.average_physical_progress != null
    ? `${overview.average_physical_progress.toFixed(1)}%`
    : "Unavailable";

  // 5. Risk-Assessed Projects - Production-served schedule-extension assessments
  const assessedCount = risk?.assessed_project_count != null
    ? risk.assessed_project_count.toLocaleString()
    : overview.assessed_project_count != null
    ? overview.assessed_project_count.toLocaleString()
    : "—";

  // 6. Risk Evaluation Window / Scope Metadata
  // Per User Correction: Never invent an unestablished ratio percentage across independent populations.
  const evaluationSpan = risk?.evaluation_earliest_month && risk?.evaluation_latest_month
    ? `${risk.evaluation_earliest_month} → ${risk.evaluation_latest_month}`
    : risk?.evaluation_latest_month
    ? risk.evaluation_latest_month
    : "SERVING ACTIVE";

  return (
    <section className="dashboard-metrics-grid" aria-label="Portfolio Key Metrics">
      {/* 01: Unique Projects */}
      <div className="metric-cell" data-testid="kpi-unique-projects">
        <div className="metric-cell-header">
          <Layers size={12} className="metric-cell-icon" aria-hidden="true" />
          <span className="metric-cell-label">01 / UNIQUE PROJECTS</span>
        </div>
        <span className="metric-cell-value">{uniqueProjects}</span>
        <p className="metric-cell-subtext">
          Distinct infrastructure entities across monitored sectors.
        </p>
      </div>

      {/* 02: Observations */}
      <div className="metric-cell" data-testid="kpi-observations">
        <div className="metric-cell-header">
          <Activity size={12} className="metric-cell-icon" aria-hidden="true" />
          <span className="metric-cell-label">02 / MONTHLY OBSERVATIONS</span>
        </div>
        <span className="metric-cell-value">{observations}</span>
        <p className="metric-cell-subtext">
          Canonical project-month flash report records.
        </p>
      </div>

      {/* 03: Cumulative Expenditure */}
      <div className="metric-cell" data-testid="kpi-expenditure">
        <div className="metric-cell-header">
          <DollarSign size={12} className="metric-cell-icon" aria-hidden="true" />
          <span className="metric-cell-label">03 / PORTFOLIO EXPENDITURE</span>
        </div>
        <span className="metric-cell-value">{expenditureFormatted}</span>
        <p className="metric-cell-subtext">
          Latest qualifying observation per unique project.
        </p>
      </div>

      {/* 04: Average Physical Progress */}
      <div className="metric-cell" data-testid="kpi-progress">
        <div className="metric-cell-header">
          <Gauge size={12} className="metric-cell-icon" aria-hidden="true" />
          <span className="metric-cell-label">04 / AVERAGE PROGRESS</span>
        </div>
        <span className="metric-cell-value">{progressFormatted}</span>
        <p className="metric-cell-subtext">
          Arithmetic mean of reporting ongoing projects.
        </p>
      </div>

      {/* 05: Risk-Assessed Projects */}
      <div className="metric-cell" data-testid="kpi-risk-assessed">
        <div className="metric-cell-header">
          <ShieldAlert size={12} className="metric-cell-icon" aria-hidden="true" />
          <span className="metric-cell-label">05 / RISK-ASSESSED</span>
        </div>
        <span className="metric-cell-value">{assessedCount}</span>
        <p className="metric-cell-subtext">
          Production schedule-extension risk assessments (H=3).
        </p>
      </div>

      {/* 06: Risk Evaluation Window */}
      <div className="metric-cell" data-testid="kpi-risk-coverage">
        <div className="metric-cell-header">
          <Calendar size={12} className="metric-cell-icon" aria-hidden="true" />
          <span className="metric-cell-label">06 / RISK WINDOW</span>
        </div>
        <span className="metric-cell-value" style={{ fontSize: "16px", letterSpacing: "0.02em" }}>
          {evaluationSpan}
        </span>
        <p className="metric-cell-subtext">
          Evaluated monthly cycles with calibrated risk serving.
        </p>
      </div>
    </section>
  );
};
