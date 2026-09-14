/**
 * Analytics Intelligence Summary (PR-13)
 * Truthful, evidence-backed summary distinguishing portfolio observation coverage
 * from risk evaluation coverage with zero denominator confusion.
 */

import React from "react";
import type { OverviewResponse, RiskAnalyticsResponse } from "@/types/analytics.ts";

interface AnalyticsIntelligenceSummaryProps {
  overview?: OverviewResponse;
  risk?: RiskAnalyticsResponse;
  isLoading?: boolean;
}

export const AnalyticsIntelligenceSummary: React.FC<AnalyticsIntelligenceSummaryProps> = ({
  overview,
  risk,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="analytics-intel-summary-skeleton" data-testid="intel-summary-loading">
        <div className="analytics-skeleton-line" />
        <div className="analytics-skeleton-line short" />
      </div>
    );
  }

  // Portfolio observation window
  const obsEarliest = overview?.earliest_observation_month || overview?.coverage?.earliest_month;
  const obsLatest = overview?.latest_observation_month || overview?.coverage?.latest_month;
  const obsWindow = obsEarliest && obsLatest ? `${obsEarliest} → ${obsLatest}` : "Unavailable";
  const uniqueProjects = overview?.unique_project_count ?? null;
  const totalObservations = overview?.observation_count ?? null;

  // Risk evaluation window (distinct population and timeframe)
  const riskEarliest = risk?.evaluation_earliest_month;
  const riskLatest = risk?.evaluation_latest_month;
  const riskWindow = riskEarliest && riskLatest ? `${riskEarliest} → ${riskLatest}` : "Unavailable";
  const assessedProjects = risk?.assessed_project_count ?? overview?.assessed_project_count ?? null;
  const assessedObservations = risk?.assessed_observation_count ?? null;

  // Active regime breakdown (dynamic, never hard-coded)
  const regimes = risk?.regime_breakdown ?? [];

  return (
    <div className="analytics-intel-summary-card" data-testid="analytics-intelligence-summary">
      <div className="analytics-intel-summary-header">
        <div className="analytics-intel-title-row">
          <span className="analytics-intel-badge">EVIDENCE & COVERAGE AUDIT</span>
          <h3 className="analytics-intel-title">Observation vs. Risk Evaluation Coverage</h3>
        </div>
        <p className="analytics-intel-subtitle">
          Portfolio observations and machine-learning risk evaluations represent distinct populations and cadences.
          Denominators are strictly segregated to avoid false proportions.
        </p>
      </div>

      <div className="analytics-intel-coverage-grid">
        {/* Column 1: Portfolio Observation Coverage */}
        <div className="analytics-intel-coverage-box" data-testid="portfolio-observation-coverage">
          <div className="analytics-intel-box-tag">PORTFOLIO OBSERVATION SCOPE</div>
          <div className="analytics-intel-box-metric">
            <span className="analytics-intel-box-label">Observed Coverage Window</span>
            <span className="analytics-intel-box-value font-mono">{obsWindow}</span>
          </div>
          <div className="analytics-intel-box-stats">
            <div className="analytics-intel-stat">
              <span className="stat-label">Unique Projects:</span>
              <span className="stat-value font-mono">
                {uniqueProjects !== null ? uniqueProjects.toLocaleString() : "—"}
              </span>
            </div>
            <div className="analytics-intel-stat">
              <span className="stat-label">Total Observations:</span>
              <span className="stat-value font-mono">
                {totalObservations !== null ? totalObservations.toLocaleString() : "—"}
              </span>
            </div>
          </div>
          <div className="analytics-intel-box-footer">
            Source: Ministry Flash Report historical records (active filter scope)
          </div>
        </div>

        {/* Column 2: Risk Evaluation Coverage */}
        <div className="analytics-intel-coverage-box" data-testid="risk-evaluation-coverage">
          <div className="analytics-intel-box-tag risk-tag">RISK EVALUATION SCOPE</div>
          <div className="analytics-intel-box-metric">
            <span className="analytics-intel-box-label">Evaluation Window</span>
            <span className="analytics-intel-box-value font-mono">{riskWindow}</span>
          </div>
          <div className="analytics-intel-box-stats">
            <div className="analytics-intel-stat">
              <span className="stat-label">Assessed Projects:</span>
              <span className="stat-value font-mono">
                {assessedProjects !== null ? assessedProjects.toLocaleString() : "—"}
              </span>
            </div>
            <div className="analytics-intel-stat">
              <span className="stat-label">Assessed Observations:</span>
              <span className="stat-value font-mono">
                {assessedObservations !== null ? assessedObservations.toLocaleString() : "—"}
              </span>
            </div>
          </div>
          <div className="analytics-intel-box-footer">
            Target: <span className="font-mono">Production Schedule Extension (3M Forward)</span>
          </div>
        </div>

        {/* Column 3: Active Serving Regimes (Dynamic) */}
        <div className="analytics-intel-coverage-box" data-testid="serving-regime-coverage">
          <div className="analytics-intel-box-tag regime-tag">SERVING REGIMES & MODELS</div>
          {regimes.length > 0 ? (
            <div className="analytics-intel-regime-list">
              {regimes.map((r, idx) => (
                <div key={`${r.regime}-${r.model_id}-${idx}`} className="analytics-intel-regime-row">
                  <div className="regime-badge-line">
                    <span className="regime-name font-mono">{r.regime}</span>
                    <span className="model-id font-mono text-muted">{r.model_id}</span>
                  </div>
                  <div className="regime-stats text-muted">
                    {r.unique_project_count.toLocaleString()} projects · {r.observation_count.toLocaleString()} obs · {r.calibration_active_count.toLocaleString()} calibrated
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="analytics-intel-empty-hint text-muted">
              No regime breakdown available for the active filter scope.
            </div>
          )}
          <div className="analytics-intel-box-footer">
            Governance: Unserved targets (cost overrun, progress stagnation) are excluded
          </div>
        </div>
      </div>
    </div>
  );
};
