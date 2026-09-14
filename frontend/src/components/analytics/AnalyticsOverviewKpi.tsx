import React from "react";
import type { OverviewResponse } from "@/types/analytics.ts";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner.tsx";
import { AlertTriangle, Layers, MapPin, DollarSign, Activity, ShieldCheck } from "lucide-react";

interface AnalyticsOverviewKpiProps {
  data?: OverviewResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const AnalyticsOverviewKpi: React.FC<AnalyticsOverviewKpiProps> = ({
  data,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="analytics-kpi-loading" style={{ padding: "40px 0", textAlign: "center" }}>
        <LoadingSpinner size="md" label="AGGREGATING PORTFOLIO OVERVIEW..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="analytics-section-error" role="alert">
        <AlertTriangle size={18} className="analytics-filter-error-icon" />
        <div className="analytics-section-error-content">
          <span className="analytics-section-error-title">Failed to load portfolio overview</span>
          <span className="analytics-section-error-desc">
            {error?.message || "An error occurred while fetching overview aggregations."}
          </span>
        </div>
        {onRetry && (
          <button type="button" className="analytics-retry-button" onClick={onRetry}>
            RETRY
          </button>
        )}
      </div>
    );
  }

  if (!data) return null;

  const uniqueProjects = data.unique_project_count.toLocaleString();
  const observations = data.observation_count.toLocaleString();

  const sanctionedCost = data.total_sanctioned_cost != null
    ? `₹${Number(data.total_sanctioned_cost.toFixed(2)).toLocaleString()} Cr`
    : "—";

  const revisedCost = data.total_revised_cost != null
    ? `₹${Number(data.total_revised_cost.toFixed(2)).toLocaleString()} Cr`
    : "—";

  const cumulativeExpenditure = data.total_cumulative_expenditure != null
    ? `₹${Number(data.total_cumulative_expenditure.toFixed(2)).toLocaleString()} Cr`
    : "—";

  const progressDisplay = data.average_physical_progress != null
    ? `${data.average_physical_progress.toFixed(1)}%`
    : "Unavailable";

  const assessedProjects = data.assessed_project_count != null
    ? data.assessed_project_count.toLocaleString()
    : "0";

  return (
    <section className="analytics-kpi-strip" aria-label="Portfolio Overview Key Performance Indicators">
      <div className="analytics-kpi-grid">
        {/* Metric 1: Unique Projects */}
        <div className="analytics-kpi-card" data-testid="kpi-unique-projects">
          <div className="analytics-kpi-header">
            <Layers size={14} className="analytics-kpi-icon" />
            <span className="analytics-kpi-label">UNIQUE PROJECTS</span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-value">{uniqueProjects}</span>
          </div>
          <div className="analytics-kpi-footer">
            <span className="analytics-kpi-context">DISTINCT INFRASTRUCTURE ENTITIES</span>
          </div>
        </div>

        {/* Metric 2: Monthly Observations */}
        <div className="analytics-kpi-card" data-testid="kpi-observations">
          <div className="analytics-kpi-header">
            <Activity size={14} className="analytics-kpi-icon" />
            <span className="analytics-kpi-label">OBSERVATIONS</span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-value">{observations}</span>
          </div>
          <div className="analytics-kpi-footer">
            <span className="analytics-kpi-context">PROJECT-MONTH MONITORING RECORDS</span>
          </div>
        </div>

        {/* Metric 3: Total Sanctioned Cost */}
        <div className="analytics-kpi-card" data-testid="kpi-sanctioned-cost">
          <div className="analytics-kpi-header">
            <DollarSign size={14} className="analytics-kpi-icon" />
            <span className="analytics-kpi-label">ORIGINAL COST</span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-value">{sanctionedCost}</span>
          </div>
          <div className="analytics-kpi-footer" title="Latest qualifying observation per unique project within filter scope.">
            <span className="analytics-kpi-context">LATEST QUALIFYING SNAPSHOT</span>
          </div>
        </div>

        {/* Metric 4: Total Revised Cost */}
        <div className="analytics-kpi-card" data-testid="kpi-revised-cost">
          <div className="analytics-kpi-header">
            <DollarSign size={14} className="analytics-kpi-icon" />
            <span className="analytics-kpi-label">REVISED COST</span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-value">{revisedCost}</span>
          </div>
          <div className="analytics-kpi-footer" title="Latest qualifying observation per unique project within filter scope.">
            <span className="analytics-kpi-context">LATEST QUALIFYING SNAPSHOT</span>
          </div>
        </div>

        {/* Metric 5: Cumulative Expenditure */}
        <div className="analytics-kpi-card" data-testid="kpi-cumulative-expenditure">
          <div className="analytics-kpi-header">
            <DollarSign size={14} className="analytics-kpi-icon" />
            <span className="analytics-kpi-label">CUMULATIVE EXPENDITURE</span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-value">{cumulativeExpenditure}</span>
          </div>
          <div className="analytics-kpi-footer" title="Latest qualifying observation per unique project within filter scope.">
            <span className="analytics-kpi-context">REPORTED TO ACTIVE SCOPE</span>
          </div>
        </div>

        {/* Metric 6: Physical Progress */}
        <div className="analytics-kpi-card" data-testid="kpi-physical-progress">
          <div className="analytics-kpi-header">
            <Activity size={14} className="analytics-kpi-icon" />
            <span className="analytics-kpi-label">ARITHMETIC MEAN PROGRESS</span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-value">{progressDisplay}</span>
          </div>
          <div className="analytics-kpi-footer" title={data.progress_basis}>
            <span className="analytics-kpi-context">
              {data.progress_reporting_observations > 0
                ? `${data.progress_reporting_observations.toLocaleString()} REPORTING ROWS`
                : "NO PROGRESS REPORTED"}
            </span>
          </div>
        </div>

        {/* Metric 7: Risk Assessed Projects */}
        <div className="analytics-kpi-card" data-testid="kpi-risk-assessed">
          <div className="analytics-kpi-header">
            <ShieldCheck size={14} className="analytics-kpi-icon" />
            <span className="analytics-kpi-label">SCHEDULE RISK ASSESSED</span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-value">{assessedProjects}</span>
          </div>
          <div className="analytics-kpi-footer" title="Assessed for target_effective_schedule_ext_3m under production regime.">
            <span className="analytics-kpi-context">UNIQUE ASSESSED PROJECTS</span>
          </div>
        </div>

        {/* Metric 8: Taxonomies & Geographies */}
        <div className="analytics-kpi-card" data-testid="kpi-taxonomies">
          <div className="analytics-kpi-header">
            <MapPin size={14} className="analytics-kpi-icon" />
            <span className="analytics-kpi-label">TAXONOMY COVERAGE</span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-value" style={{ fontSize: "16px", letterSpacing: "normal" }}>
              {data.states_count} STATES / {data.sectors_count} SECTORS / {data.agencies_count} AGENCIES
            </span>
          </div>
          <div className="analytics-kpi-footer">
            <span className="analytics-kpi-context">DISTRICT: STRUCTURALLY OMITTED</span>
          </div>
        </div>
      </div>
    </section>
  );
};
