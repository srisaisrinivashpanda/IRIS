/**
 * Analytics Financial & Progress Insights (PR-13)
 * Truthful, contract-faithful analysis of financial metrics and physical progress.
 * Enforces filter-scoped latest observation semantics and non-imputed progress quantiles.
 */

import React from "react";
import type { FinancialsResponse, ProgressResponse } from "@/types/analytics.ts";

interface AnalyticsFinancialProgressInsightsProps {
  financials?: FinancialsResponse;
  progress?: ProgressResponse;
  isLoading?: boolean;
}

export const AnalyticsFinancialProgressInsights: React.FC<AnalyticsFinancialProgressInsightsProps> = ({
  financials,
  progress,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="analytics-intel-card" data-testid="financial-progress-loading">
        <div className="analytics-skeleton-line" />
        <div className="analytics-skeleton-line short" />
      </div>
    );
  }

  const fMetrics = financials?.metrics;
  const pMetrics = progress?.metrics;

  const fBasis = "Latest qualifying observation per unique project within active filter scope.";

  const pBasis =
    progress?.progress_basis ??
    "Missing progress values are excluded from the arithmetic mean denominator and are never imputed as 0%.";

  const escalationCr =
    fMetrics?.total_cost_escalation !== null && fMetrics?.total_cost_escalation !== undefined
      ? `₹${fMetrics.total_cost_escalation.toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr`
      : "—";

  const expToRevisedRatio =
    fMetrics?.overall_expenditure_to_revised_cost_ratio !== null &&
    fMetrics?.overall_expenditure_to_revised_cost_ratio !== undefined
      ? `${fMetrics.overall_expenditure_to_revised_cost_ratio.toFixed(1)}%`
      : "—";

  const expToOrigRatio =
    fMetrics?.overall_expenditure_to_original_cost_ratio !== null &&
    fMetrics?.overall_expenditure_to_original_cost_ratio !== undefined
      ? `${fMetrics.overall_expenditure_to_original_cost_ratio.toFixed(1)}%`
      : "—";

  return (
    <div className="analytics-intel-card" data-testid="analytics-financial-progress-insights">
      <div className="analytics-intel-card-header">
        <span className="analytics-intel-badge">FINANCIAL & PROGRESS REALITY</span>
        <h4 className="analytics-intel-card-title">Fiscal Commitments & Physical Delivery</h4>
      </div>

      <div className="analytics-intel-split-grid">
        {/* Left: Financial Commitments & Revision */}
        <div className="intel-subcard" data-testid="financial-insights-subcard">
          <div className="intel-subcard-header">
            <span className="subcard-tag">FINANCIAL BASIS & ESCALATION</span>
            <span className="subcard-stat font-mono">
              {financials?.unique_project_count.toLocaleString() ?? "—"} Unique Projects
            </span>
          </div>

          <div className="intel-kv-list">
            <div className="intel-kv-row">
              <span className="kv-key">Original Sanctioned Cost:</span>
              <span className="kv-val font-mono">
                {fMetrics?.total_original_cost !== null && fMetrics?.total_original_cost !== undefined
                  ? `₹${fMetrics.total_original_cost.toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr`
                  : "—"}
              </span>
            </div>

            <div className="intel-kv-row">
              <span className="kv-key">Revised Sanctioned Cost:</span>
              <span className="kv-val font-mono">
                {fMetrics?.total_revised_cost !== null && fMetrics?.total_revised_cost !== undefined
                  ? `₹${fMetrics.total_revised_cost.toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr`
                  : "—"}
              </span>
            </div>

            <div className="intel-kv-row">
              <span className="kv-key">Cumulative Expenditure:</span>
              <span className="kv-val font-mono">
                {fMetrics?.total_cumulative_expenditure !== null && fMetrics?.total_cumulative_expenditure !== undefined
                  ? `₹${fMetrics.total_cumulative_expenditure.toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr`
                  : "—"}
              </span>
            </div>

            <div className="intel-kv-row highlight-row">
              <span className="kv-key">Total Cost Escalation:</span>
              <span className="kv-val font-mono" data-testid="cost-escalation-val">
                {escalationCr}
              </span>
            </div>

            <div className="intel-kv-row">
              <span className="kv-key">Projects with Recorded Revisions:</span>
              <span className="kv-val font-mono">
                {fMetrics?.cost_revision_projects_count?.toLocaleString() ?? "—"}
              </span>
            </div>

            <div className="intel-kv-row">
              <span className="kv-key">Expenditure / Revised Cost Ratio:</span>
              <span className="kv-val font-mono">{expToRevisedRatio}</span>
            </div>

            <div className="intel-kv-row">
              <span className="kv-key">Expenditure / Original Cost Ratio:</span>
              <span className="kv-val font-mono">{expToOrigRatio}</span>
            </div>
          </div>

          <p className="intel-basis-notice text-muted text-xs" data-testid="financial-basis-notice">
            <strong>Aggregation Basis:</strong> {fBasis}
          </p>
        </div>

        {/* Right: Physical Progress & Quantiles */}
        <div className="intel-subcard" data-testid="progress-insights-subcard">
          <div className="intel-subcard-header">
            <span className="subcard-tag">PHYSICAL PROGRESS QUANTILE PROFILE</span>
            <span className="subcard-stat font-mono">
              {pMetrics?.coverage_rate !== undefined ? `${pMetrics.coverage_rate.toFixed(1)}% Coverage` : "—"}
            </span>
          </div>

          <div className="intel-kv-list">
            <div className="intel-kv-row">
              <span className="kv-key">Reporting Observations:</span>
              <span className="kv-val font-mono" data-testid="progress-reporting-obs">
                {pMetrics?.reporting_observations?.toLocaleString() ?? "—"} of{" "}
                {pMetrics?.total_observations?.toLocaleString() ?? "—"}
              </span>
            </div>

            <div className="intel-kv-row">
              <span className="kv-key">Missing / Non-Reporting Observations:</span>
              <span className="kv-val font-mono" data-testid="progress-missing-obs">
                {pMetrics?.missing_observations?.toLocaleString() ?? "—"}
              </span>
            </div>

            <div className="intel-kv-row highlight-row">
              <span className="kv-key">Arithmetic Mean Progress:</span>
              <span className="kv-val font-mono" data-testid="progress-mean-val">
                {pMetrics?.mean_physical_progress !== null && pMetrics?.mean_physical_progress !== undefined
                  ? `${pMetrics.mean_physical_progress.toFixed(1)}%`
                  : "—"}
              </span>
            </div>

            <div className="intel-kv-row">
              <span className="kv-key">Median Progress (P50):</span>
              <span className="kv-val font-mono" data-testid="progress-median-val">
                {pMetrics?.median_physical_progress !== null && pMetrics?.median_physical_progress !== undefined
                  ? `${pMetrics.median_physical_progress.toFixed(1)}%`
                  : "—"}
              </span>
            </div>

            <div className="intel-kv-row">
              <span className="kv-key">Interquartile Range (P25 → P75):</span>
              <span className="kv-val font-mono">
                {pMetrics?.distribution_quantiles
                  ? `${pMetrics.distribution_quantiles.p25.toFixed(1)}% → ${pMetrics.distribution_quantiles.p75.toFixed(1)}%`
                  : "—"}
              </span>
            </div>

            <div className="intel-kv-row">
              <span className="kv-key">Observed Span (Min → Max):</span>
              <span className="kv-val font-mono">
                {pMetrics?.min_physical_progress !== null && pMetrics?.max_physical_progress !== null &&
                pMetrics?.min_physical_progress !== undefined && pMetrics?.max_physical_progress !== undefined
                  ? `${pMetrics.min_physical_progress.toFixed(1)}% → ${pMetrics.max_physical_progress.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
          </div>

          <p className="intel-basis-notice text-muted text-xs" data-testid="progress-basis-notice">
            <strong>Non-Imputation Rule:</strong> {pBasis}
          </p>
        </div>
      </div>
    </div>
  );
};
