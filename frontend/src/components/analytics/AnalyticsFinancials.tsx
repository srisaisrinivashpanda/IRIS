import React from "react";
import type { FinancialsResponse } from "@/types/analytics.ts";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner.tsx";
import { AlertTriangle, DollarSign, ArrowUpRight } from "lucide-react";

interface AnalyticsFinancialsProps {
  data?: FinancialsResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const AnalyticsFinancials: React.FC<AnalyticsFinancialsProps> = ({
  data,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="analytics-section-card">
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <LoadingSpinner size="md" label="AGGREGATING FINANCIAL METRICS..." />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="analytics-section-card">
        <div className="analytics-section-error" role="alert">
          <AlertTriangle size={18} className="analytics-filter-error-icon" />
          <div className="analytics-section-error-content">
            <span className="analytics-section-error-title">Failed to load financial metrics</span>
            <span className="analytics-section-error-desc">
              {error?.message || "An error occurred while fetching financial metrics."}
            </span>
          </div>
          {onRetry && (
            <button type="button" className="analytics-retry-button" onClick={onRetry}>
              RETRY
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data || !data.metrics || data.unique_project_count === 0) {
    return (
      <div className="analytics-section-card">
        <div className="analytics-card-header">
          <div className="analytics-card-title-lockup">
            <span className="analytics-eyebrow">PORTFOLIO EXPOSURE</span>
            <h2 className="analytics-card-title">05. FINANCIAL ANALYSIS</h2>
          </div>
        </div>
        <div className="analytics-empty-state">
          <span className="analytics-empty-text">No financial data available for selected scope.</span>
        </div>
      </div>
    );
  }

  const m = data.metrics;

  const fmtCurrency = (val: number | null | undefined): string => {
    if (val == null) return "Unavailable";
    return `₹${Number(val.toFixed(2)).toLocaleString()} Cr`;
  };

  const fmtPercent = (val: number | null | undefined): string => {
    if (val == null) return "Unavailable";
    return `${val.toFixed(1)}%`;
  };

  return (
    <div className="analytics-section-card" data-testid="analytics-financials-section">
      <div className="analytics-card-header">
        <div className="analytics-card-title-lockup">
          <span className="analytics-eyebrow">CAPITAL EXPOSURE & ESCALATION</span>
          <h2 className="analytics-card-title">05. FINANCIAL ANALYSIS</h2>
        </div>
      </div>

      <div className="analytics-disclaimer-strip">
        <DollarSign size={12} className="analytics-disclaimer-icon" />
        <span>{data.aggregation_basis}</span>
      </div>

      <div className="analytics-financial-grid">
        {/* Metric Cell 1: Total Original Sanctioned Cost */}
        <div className="analytics-fin-card" data-testid="fin-original-cost">
          <span className="analytics-fin-label">TOTAL ORIGINAL SANCTIONED COST</span>
          <span className="analytics-fin-val">{fmtCurrency(m.total_original_cost)}</span>
          <span className="analytics-fin-meta">
            {m.projects_with_cost.toLocaleString()} PROJECTS REPORTING ORIGINAL COST
          </span>
          <span className="analytics-fin-sub">
            MEAN: {fmtCurrency(m.mean_original_cost)} PER PROJECT
          </span>
        </div>

        {/* Metric Cell 2: Total Revised Cost */}
        <div className="analytics-fin-card" data-testid="fin-revised-cost">
          <span className="analytics-fin-label">TOTAL REVISED SANCTIONED COST</span>
          <span className="analytics-fin-val">{fmtCurrency(m.total_revised_cost)}</span>
          <span className="analytics-fin-meta">
            {m.projects_with_revised_cost.toLocaleString()} PROJECTS REPORTING REVISED COST
          </span>
          <span className="analytics-fin-sub">
            MEAN: {fmtCurrency(m.mean_revised_cost)} PER PROJECT
          </span>
        </div>

        {/* Metric Cell 3: Total Cumulative Expenditure */}
        <div className="analytics-fin-card" data-testid="fin-expenditure">
          <span className="analytics-fin-label">TOTAL CUMULATIVE EXPENDITURE</span>
          <span className="analytics-fin-val">{fmtCurrency(m.total_cumulative_expenditure)}</span>
          <span className="analytics-fin-meta">
            {m.projects_with_expenditure.toLocaleString()} PROJECTS REPORTING EXPENDITURE
          </span>
          <span className="analytics-fin-sub">
            MEAN: {fmtCurrency(m.mean_cumulative_expenditure)} PER PROJECT
          </span>
        </div>

        {/* Metric Cell 4: Cost Escalation / Overrun */}
        <div className="analytics-fin-card" data-testid="fin-escalation">
          <span className="analytics-fin-label">NET COST ESCALATION (REVISIONS)</span>
          <div className="analytics-fin-escalation-row">
            <span className="analytics-fin-val" style={{ color: (m.total_cost_escalation ?? 0) > 0 ? "var(--color-coral)" : "inherit" }}>
              {fmtCurrency(m.total_cost_escalation)}
            </span>
            {(m.total_cost_escalation ?? 0) > 0 && (
              <ArrowUpRight size={18} className="analytics-fin-escalation-icon" />
            )}
          </div>
          <span className="analytics-fin-meta">
            {m.cost_revision_projects_count.toLocaleString()} PROJECTS WITH COST REVISIONS
          </span>
          <span className="analytics-fin-sub">
            SUM(REVISED_COST - ORIGINAL_COST) WHERE REVISED IS RECORDED
          </span>
        </div>
      </div>

      {/* Financial Ratios Row */}
      <div className="analytics-financial-ratios-strip">
        <div className="analytics-ratio-item">
          <span className="analytics-ratio-label">EXPENDITURE / REVISED COST RATIO</span>
          <span className="analytics-ratio-val">
            {fmtPercent(m.overall_expenditure_to_revised_cost_ratio)}
          </span>
          <span className="analytics-ratio-sub">AGGREGATE EXPOSURE AGAINST REVISED SANCTION</span>
        </div>

        <div className="analytics-ratio-item">
          <span className="analytics-ratio-label">EXPENDITURE / ORIGINAL COST RATIO</span>
          <span className="analytics-ratio-val">
            {fmtPercent(m.overall_expenditure_to_original_cost_ratio)}
          </span>
          <span className="analytics-ratio-sub">AGGREGATE EXPOSURE AGAINST ORIGINAL SANCTION</span>
        </div>

        <div className="analytics-ratio-item">
          <span className="analytics-ratio-label">PROJECT POPULATION IN FINANCIAL SCOPE</span>
          <span className="analytics-ratio-val">
            {data.unique_project_count.toLocaleString()}
          </span>
          <span className="analytics-ratio-sub">DISTINCT MONITORED PROJECTS</span>
        </div>
      </div>
    </div>
  );
};
