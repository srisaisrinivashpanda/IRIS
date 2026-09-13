import React from "react";
import type { ProjectSignals, ProjectRecentChanges } from "@/types/project.ts";

interface IntelligenceSignalsProps {
  signals: ProjectSignals;
  recentChanges: ProjectRecentChanges;
}

export const IntelligenceSignals: React.FC<IntelligenceSignalsProps> = ({
  signals,
  recentChanges,
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
    <div className="terminal-card">
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">CANONICAL OBSERVATION DELTAS</span>
          <h3 className="terminal-card-title">FACTUAL SIGNALS & RECENT CHANGES</h3>
        </div>
        <span className="terminal-badge-muted monospace">DETERMINISTIC OBSERVATIONS</span>
      </div>

      {/* Observational Signals Grid */}
      <div className="terminal-signals-grid">
        <div className="terminal-signal-cell">
          <span className="signal-cell-label">Cost Revised</span>
          <div className="signal-cell-val monospace">
            {signals.cost_revised ? "YES" : "NO"}
            {signals.cost_revision_ratio !== null && (
              <span className="signal-ratio"> ({signals.cost_revision_ratio.toFixed(2)}x)</span>
            )}
          </div>
          <span className="signal-cell-sub">
            {signals.cost_revision_count} {signals.cost_revision_count === 1 ? "event" : "events"} recorded
          </span>
        </div>

        <div className="terminal-signal-cell">
          <span className="signal-cell-label">Schedule Revised</span>
          <div className="signal-cell-val monospace">{signals.schedule_revised ? "YES" : "NO"}</div>
          <span className="signal-cell-sub">
            {signals.schedule_extension_count} {signals.schedule_extension_count === 1 ? "extension" : "extensions"}
          </span>
        </div>

        <div className="terminal-signal-cell">
          <span className="signal-cell-label">Observation Span</span>
          <div className="signal-cell-val monospace">{signals.reporting_months_count} MONTHS</div>
          <span className="signal-cell-sub monospace">
            {signals.first_reported_month} → {signals.latest_reported_month}
          </span>
        </div>
      </div>

      {/* Month-over-Month Recent Changes */}
      <div className="terminal-recent-changes-box">
        <div className="recent-changes-header-bar">
          <span className="recent-changes-title">RECENT MONTH-OVER-MONTH CHANGES</span>
          {recentChanges.has_prior_observation && recentChanges.prior_report_month && (
            <span className="recent-changes-compare-tag monospace">
              COMPARED WITH {recentChanges.prior_report_month}
            </span>
          )}
        </div>

        {recentChanges.has_prior_observation ? (
          <div className="recent-changes-cells-grid">
            <div className="recent-change-cell">
              <span className="recent-change-label">Physical Progress Delta</span>
              <span className="recent-change-val monospace">
                {formatProgressDelta(recentChanges.physical_progress_delta)}
              </span>
            </div>

            <div className="recent-change-cell">
              <span className="recent-change-label">Expenditure Delta</span>
              <span className="recent-change-val monospace">
                {formatExpenditureDelta(recentChanges.expenditure_delta)}
              </span>
            </div>

            <div className="recent-change-cell">
              <span className="recent-change-label">Revised Cost Delta</span>
              <span className="recent-change-val monospace">
                {formatCostDelta(recentChanges.revised_cost_delta)}
              </span>
            </div>

            <div className="recent-change-cell">
              <span className="recent-change-label">Completion Date Status</span>
              <span
                className={`recent-change-val monospace ${
                  recentChanges.completion_date_changed ? "changed" : "unchanged"
                }`}
              >
                {recentChanges.completion_date_changed ? "CHANGED" : "UNCHANGED"}
              </span>
            </div>
          </div>
        ) : (
          <div className="recent-changes-initial-note monospace">
            INITIAL OBSERVATION IN SOURCE DATASET (NO PRIOR OBSERVATION AVAILABLE FOR DELTA CALCULATION)
          </div>
        )}
      </div>
    </div>
  );
};
