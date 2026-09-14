/**
 * Analytics Trend Interpretation (PR-13)
 * Truthful, non-causal interpretation of observed monthly aggregations.
 * Strictly adheres to PR-09 trends contract with single-observation safeguards.
 */

import React from "react";
import type { TrendsResponse } from "@/types/analytics.ts";

interface AnalyticsTrendInterpretationProps {
  trends?: TrendsResponse;
  isLoading?: boolean;
}

export const AnalyticsTrendInterpretation: React.FC<AnalyticsTrendInterpretationProps> = ({
  trends,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="analytics-intel-card" data-testid="trend-interpretation-loading">
        <div className="analytics-skeleton-line" />
        <div className="analytics-skeleton-line short" />
      </div>
    );
  }

  const items = trends?.items ?? [];

  // Edge case: Empty items
  if (items.length === 0) {
    return (
      <div className="analytics-intel-card" data-testid="analytics-trend-interpretation">
        <div className="analytics-intel-card-header">
          <span className="analytics-intel-badge">TEMPORAL INTERPRETATION</span>
          <h4 className="analytics-intel-card-title">Observed Temporal Trajectory</h4>
        </div>
        <div className="analytics-intel-notice" data-testid="trend-empty-state">
          No monthly observation points are available within the active filter scope.
        </div>
      </div>
    );
  }

  // Edge case: Single observation point (Strict PR-13 Requirement)
  if (items.length === 1) {
    const single = items[0];
    return (
      <div className="analytics-intel-card" data-testid="analytics-trend-interpretation">
        <div className="analytics-intel-card-header">
          <span className="analytics-intel-badge">TEMPORAL INTERPRETATION</span>
          <h4 className="analytics-intel-card-title">Observed Temporal Trajectory</h4>
        </div>
        <div className="analytics-intel-single-notice" data-testid="trend-single-point-notice">
          <div className="analytics-intel-status-pill warning">SINGLE OBSERVATION ONLY</div>
          <p className="analytics-intel-prose" data-testid="trend-single-point-text">
            Single observation available for report month <strong>{single.report_month}</strong>.
            Insufficient observations to establish a trend.
          </p>
          <div className="analytics-intel-metric-row">
            <span className="metric-chip font-mono">Observations: {single.observation_count.toLocaleString()}</span>
            <span className="metric-chip font-mono">Projects: {single.unique_project_count.toLocaleString()}</span>
            {single.total_cumulative_expenditure !== null && (
              <span className="metric-chip font-mono">
                Expenditure: ₹{single.total_cumulative_expenditure.toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr
              </span>
            )}
          </div>
          <div className="analytics-intel-subtext text-muted">
            Expand the date filter or select an earlier starting month to observe longitudinal changes.
          </div>
        </div>
      </div>
    );
  }

  // Multi-point trend: Safe chronological boundary comparison
  const first = items[0];
  const last = items[items.length - 1];
  const observedCount = items.length;

  // 1. Expenditure movement
  let expenditureText: string | null = null;
  if (first.total_cumulative_expenditure !== null && last.total_cumulative_expenditure !== null) {
    const delta = last.total_cumulative_expenditure - first.total_cumulative_expenditure;
    const absDelta = Math.abs(delta).toLocaleString(undefined, { maximumFractionDigits: 1 });
    const firstStr = first.total_cumulative_expenditure.toLocaleString(undefined, { maximumFractionDigits: 1 });
    const lastStr = last.total_cumulative_expenditure.toLocaleString(undefined, { maximumFractionDigits: 1 });

    if (delta > 0) {
      expenditureText = `Observed cumulative expenditure increased by ₹${absDelta} Cr across the selected period (from ₹${firstStr} Cr in ${first.report_month} to ₹${lastStr} Cr in ${last.report_month}).`;
    } else if (delta < 0) {
      expenditureText = `Observed cumulative expenditure decreased by ₹${absDelta} Cr across the selected period (from ₹${firstStr} Cr in ${first.report_month} to ₹${lastStr} Cr in ${last.report_month}).`;
    } else {
      expenditureText = `Observed cumulative expenditure remained unchanged at ₹${firstStr} Cr between ${first.report_month} and ${last.report_month}.`;
    }
  } else {
    expenditureText = "Cumulative expenditure is not uniformly reported across boundary observation months.";
  }

  // 2. Physical progress movement
  let progressText: string | null = null;
  if (first.average_physical_progress !== null && last.average_physical_progress !== null) {
    const pDelta = last.average_physical_progress - first.average_physical_progress;
    const sign = pDelta > 0 ? "+" : "";
    progressText = `Average physical progress among reporting projects moved by ${sign}${pDelta.toFixed(1)} percentage points (from ${first.average_physical_progress.toFixed(1)}% to ${last.average_physical_progress.toFixed(1)}%). In ${last.report_month}, ${last.progress_reporting_count.toLocaleString()} of ${last.observation_count.toLocaleString()} observations reported physical progress.`;
  } else {
    progressText = "Physical progress is omitted or partially reported for one or more boundary months.";
  }

  // 3. Observation volume movement
  const volumeDelta = last.observation_count - first.observation_count;
  const volSign = volumeDelta > 0 ? "+" : "";
  const volumeText = `Reported monthly project observations moved from ${first.observation_count.toLocaleString()} in ${first.report_month} to ${last.observation_count.toLocaleString()} in ${last.report_month} (${volSign}${volumeDelta.toLocaleString()} observations).`;

  // 4. Risk evaluation trajectory (if available)
  let riskText: string | null = null;
  if (first.average_risk_probability !== null && last.average_risk_probability !== null) {
    const rDelta = (last.average_risk_probability - first.average_risk_probability) * 100;
    const rSign = rDelta > 0 ? "+" : "";
    riskText = `Average calibrated schedule-extension probability across assessed projects moved from ${(first.average_risk_probability * 100).toFixed(1)}% (${first.risk_assessed_project_count} assessed) to ${(last.average_risk_probability * 100).toFixed(1)}% (${last.risk_assessed_project_count} assessed), a change of ${rSign}${rDelta.toFixed(1)} percentage points.`;
  }

  return (
    <div className="analytics-intel-card" data-testid="analytics-trend-interpretation">
      <div className="analytics-intel-card-header">
        <span className="analytics-intel-badge">TEMPORAL INTERPRETATION</span>
        <h4 className="analytics-intel-card-title">Observed Temporal Trajectory</h4>
      </div>

      <div className="analytics-intel-meta-strip">
        <span className="meta-item">
          <strong>Boundary Cadence:</strong> {first.report_month} → {last.report_month}
        </span>
        <span className="meta-item">
          <strong>Observed Months:</strong> {observedCount}
        </span>
      </div>

      <div className="analytics-intel-narrative-list">
        <div className="analytics-intel-narrative-item" data-testid="trend-narrative-expenditure">
          <div className="narrative-dot" />
          <p className="narrative-text">{expenditureText}</p>
        </div>

        <div className="analytics-intel-narrative-item" data-testid="trend-narrative-progress">
          <div className="narrative-dot" />
          <p className="narrative-text">{progressText}</p>
        </div>

        <div className="analytics-intel-narrative-item" data-testid="trend-narrative-volume">
          <div className="narrative-dot" />
          <p className="narrative-text">{volumeText}</p>
        </div>

        {riskText && (
          <div className="analytics-intel-narrative-item" data-testid="trend-narrative-risk">
            <div className="narrative-dot" />
            <p className="narrative-text">{riskText}</p>
          </div>
        )}
      </div>

      <div className="analytics-intel-disclaimer text-muted">
        <strong>Non-Causal Notice:</strong> Temporal shifts reflect reporting records and project population movements. They do not establish causality, future completion certainty, or model-projected outcomes.
      </div>
    </div>
  );
};
