import React from "react";
import type { ProjectSignals, ProjectRecentChanges, ProjectDataAvailability } from "@/types/project.ts";

interface ProjectRiskSignalsProps {
  signals: ProjectSignals;
  recentChanges: ProjectRecentChanges;
  availability?: ProjectDataAvailability;
}

export const ProjectRiskSignals: React.FC<ProjectRiskSignalsProps> = ({
  signals,
  recentChanges,
  availability,
}) => {
  const formatExpenditureDelta = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return "—";
    if (val > 0) return `+₹${val.toLocaleString()} CR`;
    if (val < 0) return `-₹${Math.abs(val).toLocaleString()} CR`;
    return "₹0 CR";
  };

  const formatProgressDelta = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return "—";
    if (val > 0) return `+${val.toFixed(1)} pp`;
    if (val < 0) return `${val.toFixed(1)} pp`;
    return "0.0 pp";
  };

  const formatCostDelta = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return "—";
    if (val > 0) return `+₹${val.toLocaleString()} CR`;
    if (val < 0) return `-₹${Math.abs(val).toLocaleString()} CR`;
    return "₹0 CR";
  };

  return (
    <div className="detail-card">
      <div className="risk-card-header">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span className="overview-metric-label">CANONICAL OBSERVATION DELTAS</span>
          <h3 className="risk-card-title">FACTUAL SIGNALS & RECENT CHANGES</h3>
        </div>
        <span className="overview-metric-label">DETERMINISTIC OBSERVATIONS</span>
      </div>

      {/* Factual Trajectory Signals Grid */}
      <div className="risk-signals-grid">
        <div className="risk-signal-item">
          <span className="risk-signal-label">Cost Revised</span>
          <span className="risk-signal-value">
            {signals.cost_revised ? "YES" : "NO"}
            {signals.cost_revision_ratio !== null && (
              <span className="risk-signal-ratio"> ({signals.cost_revision_ratio.toFixed(2)}x)</span>
            )}
          </span>
          <span className="risk-signal-count">
            {signals.cost_revision_count} {signals.cost_revision_count === 1 ? "event" : "events"} recorded
          </span>
        </div>

        <div className="risk-signal-item">
          <span className="risk-signal-label">Schedule Revised</span>
          <span className="risk-signal-value">{signals.schedule_revised ? "YES" : "NO"}</span>
          <span className="risk-signal-count">
            {signals.schedule_extension_count} {signals.schedule_extension_count === 1 ? "extension" : "extensions"}
          </span>
        </div>

        <div className="risk-signal-item">
          <span className="risk-signal-label">Observation Span</span>
          <span className="risk-signal-value">{signals.reporting_months_count} MONTHS</span>
          <span className="risk-signal-count">
            {signals.first_reported_month} → {signals.latest_reported_month}
          </span>
        </div>
      </div>

      {/* Recent Observation Changes */}
      <div className="recent-changes-container">
        <div className="recent-changes-header">
          <span className="recent-changes-title">RECENT MONTH-OVER-MONTH CHANGES</span>
          {recentChanges.has_prior_observation && recentChanges.prior_report_month && (
            <span className="recent-changes-compare-tag">
              COMPARED WITH {recentChanges.prior_report_month}
            </span>
          )}
        </div>

        {recentChanges.has_prior_observation ? (
          <div className="recent-changes-cells">
            <div className="recent-cell">
              <span className="recent-cell-label">Physical Progress Delta</span>
              <span className="recent-cell-val">
                {formatProgressDelta(recentChanges.physical_progress_delta)}
              </span>
            </div>

            <div className="recent-cell">
              <span className="recent-cell-label">Expenditure Delta</span>
              <span className="recent-cell-val">
                {formatExpenditureDelta(recentChanges.expenditure_delta)}
              </span>
            </div>

            <div className="recent-cell">
              <span className="recent-cell-label">Revised Cost Delta</span>
              <span className="recent-cell-val">
                {formatCostDelta(recentChanges.revised_cost_delta)}
              </span>
            </div>

            <div className="recent-cell">
              <span className="recent-cell-label">Completion Date Status</span>
              <span className={`recent-cell-val ${recentChanges.completion_date_changed ? "changed" : "unchanged"}`}>
                {recentChanges.completion_date_changed ? "CHANGED" : "UNCHANGED"}
              </span>
            </div>
          </div>
        ) : (
          <div className="recent-changes-initial-note">
            INITIAL OBSERVATION IN SOURCE DATASET (NO PRIOR OBSERVATION AVAILABLE FOR DELTA CALCULATION)
          </div>
        )}
      </div>

      {/* Unserved ML Domains — Compact strip keeping domains clearly distinct from served schedule risk */}
      <div className="unserved-ml-domains-strip">
        <div className="unserved-domain-pill">
          <span className="unserved-domain-name">Cost Overrun Risk</span>
          <span className="unserved-domain-tag">
            {availability?.cost_risk_ml_served ? "SERVED" : "DATA PENDING"}
          </span>
        </div>

        <div className="unserved-domain-pill">
          <span className="unserved-domain-name">Progress Stagnation Risk</span>
          <span className="unserved-domain-tag">
            {availability?.progress_stagnation_ml_served ? "SERVED" : "DATA PENDING"}
          </span>
        </div>

        <span className="unserved-domain-legend">
          Only schedule extension risk is served in production. Cost and progress stagnation ML models are not deployed.
        </span>
      </div>
    </div>
  );
};
