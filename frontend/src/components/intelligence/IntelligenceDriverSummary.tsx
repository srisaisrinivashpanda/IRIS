import React from "react";
import type { ProjectRiskDrivers, ProjectIntelligenceRisk } from "@/types/project.ts";

interface IntelligenceDriverSummaryProps {
  drivers?: ProjectRiskDrivers;
  risk?: ProjectIntelligenceRisk | null;
}

export const IntelligenceDriverSummary: React.FC<IntelligenceDriverSummaryProps> = ({
  drivers,
  risk,
}) => {
  // Case 1: Unassessed project
  if (!risk) {
    return (
      <div className="terminal-card" role="region" aria-label="Driver Summary Unassessed">
        <div className="terminal-card-header">
          <div className="terminal-card-title-lockup">
            <span className="terminal-section-eyebrow">CONTRIBUTION TELEMETRY</span>
            <h3 className="terminal-card-title">DRIVER SUMMARY</h3>
          </div>
          <span className="terminal-badge unassessed">NOT ASSESSED</span>
        </div>
        <div className="terminal-empty-text monospace">
          Model driver evidence is unavailable because no production risk assessment is recorded for this project.
        </div>
      </div>
    );
  }

  const topPositive = drivers?.top_positive ?? [];
  const topNegative = drivers?.top_negative ?? [];
  const strongestDrivers = drivers?.strongest_drivers ?? [];
  const totalDriversCount = topPositive.length + topNegative.length || strongestDrivers.length;

  // Case 2: Risk assessed but zero drivers recorded
  if (totalDriversCount === 0) {
    return (
      <div className="terminal-card" role="region" aria-label="Driver Summary Empty">
        <div className="terminal-card-header">
          <div className="terminal-card-title-lockup">
            <span className="terminal-section-eyebrow">CONTRIBUTION TELEMETRY</span>
            <h3 className="terminal-card-title">DRIVER SUMMARY</h3>
          </div>
          <span className="terminal-badge-muted monospace">0 RECORDED</span>
        </div>
        <div className="terminal-empty-text monospace">
          NO MODEL DRIVER EVIDENCE AVAILABLE
        </div>
      </div>
    );
  }

  // Strongest risk-increasing contributor (largest positive margin contribution)
  const strongestPositive = topPositive.length > 0
    ? [...topPositive].sort((a, b) => b.contribution - a.contribution)[0]
    : strongestDrivers.filter((d) => d.contribution > 0).sort((a, b) => b.contribution - a.contribution)[0];

  // Strongest risk-reducing contributor (most negative margin contribution)
  const strongestNegative = topNegative.length > 0
    ? [...topNegative].sort((a, b) => a.contribution - b.contribution)[0]
    : strongestDrivers.filter((d) => d.contribution < 0).sort((a, b) => a.contribution - b.contribution)[0];

  // Displayed contribution sums strictly in logit/margin space (top-N displayed subset, not full 36 vector)
  const displayedPositiveSum = topPositive.reduce((acc, c) => acc + c.contribution, 0);
  const displayedNegativeSum = topNegative.reduce((acc, c) => acc + c.contribution, 0);

  return (
    <div className="terminal-card" role="region" aria-label="Signed Driver Evidence Summary">
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">RAW MARGIN LOGIT DECOMPOSITION</span>
          <h3 className="terminal-card-title">DRIVER SUMMARY</h3>
        </div>
        <div className="terminal-badge-group">
          <span className="terminal-badge regime">{totalDriversCount} DISPLAYED DRIVERS</span>
          <span className="terminal-badge-muted monospace">TOP-N SUBSET</span>
        </div>
      </div>

      {/* Driver Summary Metrics Grid */}
      <div className="terminal-driver-summary-grid">
        {/* Metric 1: Available Drivers Count */}
        <div className="terminal-summary-tile">
          <span className="summary-tile-label">AVAILABLE DRIVERS</span>
          <div className="summary-tile-value monospace">{totalDriversCount}</div>
          <span className="summary-tile-sub monospace">
            {topPositive.length} INCREASING / {topNegative.length} REDUCING
          </span>
        </div>

        {/* Metric 2: Strongest Risk-Increasing Driver */}
        <div className="terminal-summary-tile positive-lead">
          <span className="summary-tile-label">STRONGEST RISK-INCREASING CONTRIBUTION</span>
          {strongestPositive ? (
            <>
              <div className="summary-tile-value positive monospace">
                +{strongestPositive.contribution.toFixed(3)} logit
              </div>
              <div className="summary-tile-name" title={strongestPositive.feature}>
                {`LEAD: ${strongestPositive.display_name || strongestPositive.feature}`}
              </div>
              {strongestPositive.value !== null && strongestPositive.value !== undefined && (
                <span className="summary-tile-sub monospace">VALUE: {strongestPositive.value}</span>
              )}
            </>
          ) : (
            <div className="summary-tile-empty monospace">None recorded</div>
          )}
        </div>

        {/* Metric 3: Strongest Risk-Reducing Driver */}
        <div className="terminal-summary-tile negative-lead">
          <span className="summary-tile-label">STRONGEST RISK-REDUCING CONTRIBUTION</span>
          {strongestNegative ? (
            <>
              <div className="summary-tile-value negative monospace">
                {strongestNegative.contribution.toFixed(3)} logit
              </div>
              <div className="summary-tile-name" title={strongestNegative.feature}>
                {`LEAD: ${strongestNegative.display_name || strongestNegative.feature}`}
              </div>
              {strongestNegative.value !== null && strongestNegative.value !== undefined && (
                <span className="summary-tile-sub monospace">VALUE: {strongestNegative.value}</span>
              )}
            </>
          ) : (
            <div className="summary-tile-empty monospace">None recorded</div>
          )}
        </div>

        {/* Metric 4: Displayed Positive Margin Sum */}
        <div className="terminal-summary-tile">
          <span className="summary-tile-label">DISPLAYED POSITIVE CONTRIBUTION SUM</span>
          <div className="summary-tile-value positive monospace">
            +{displayedPositiveSum.toFixed(3)} logit
          </div>
          <span className="summary-tile-sub monospace">
            SUM OF TOP {topPositive.length} IN MARGIN LOGIT SPACE
          </span>
        </div>

        {/* Metric 5: Displayed Negative Margin Sum */}
        <div className="terminal-summary-tile">
          <span className="summary-tile-label">DISPLAYED NEGATIVE CONTRIBUTION SUM</span>
          <div className="summary-tile-value negative monospace">
            {displayedNegativeSum.toFixed(3)} logit
          </div>
          <span className="summary-tile-sub monospace">
            SUM OF TOP {topNegative.length} IN MARGIN LOGIT SPACE
          </span>
        </div>
      </div>

      <div className="terminal-card-footnote">
        Displayed sums reflect top-N served contributors in additive margin/logit space, not the complete 36-feature vector or a probability percentage.
      </div>
    </div>
  );
};
