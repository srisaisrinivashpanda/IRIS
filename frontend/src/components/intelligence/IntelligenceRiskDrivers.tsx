import React from "react";
import type { ProjectRiskDrivers } from "@/types/project.ts";

interface IntelligenceRiskDriversProps {
  drivers: ProjectRiskDrivers;
}

export const IntelligenceRiskDrivers: React.FC<IntelligenceRiskDriversProps> = ({ drivers }) => {
  const hasPositive = drivers.top_positive && drivers.top_positive.length > 0;
  const hasNegative = drivers.top_negative && drivers.top_negative.length > 0;
  const hasDrivers =
    hasPositive ||
    hasNegative ||
    (drivers.strongest_drivers && drivers.strongest_drivers.length > 0);

  if (!hasDrivers) {
    return (
      <div className="terminal-card">
        <div className="terminal-card-header">
          <div className="terminal-card-title-lockup">
            <span className="terminal-section-eyebrow">FEATURE CONTRIBUTIONS</span>
            <h3 className="terminal-card-title">SIGNED RISK DRIVERS</h3>
          </div>
          <span className="terminal-badge-muted monospace">RAW MARGIN SPACE</span>
        </div>
        <div className="terminal-empty-text monospace">
          NO EXPLANATION DRIVERS RECORDED FOR THIS ASSESSMENT
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-card">
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">SHAP / LINEAR CONTRIBUTION ANALYSIS</span>
          <h3 className="terminal-card-title">SIGNED RISK DRIVERS</h3>
        </div>
        <span className="terminal-badge-muted monospace">RAW MARGIN LOGIT SPACE</span>
      </div>

      <div className="terminal-drivers-dual-col">
        {/* Risk-Increasing Drivers */}
        <div className="terminal-drivers-column">
          <div className="terminal-drivers-col-header increasing">
            ▲ RISK-INCREASING CONTRIBUTORS ({drivers.top_positive?.length || 0})
          </div>
          {hasPositive ? (
            <div className="terminal-drivers-list">
              {drivers.top_positive.map((driver, idx) => (
                <div key={`pos-${driver.feature}-${idx}`} className="terminal-driver-row">
                  <div className="terminal-driver-info">
                    <span className="terminal-driver-name">
                      {driver.display_name || driver.feature}
                    </span>
                    {driver.value !== null && driver.value !== undefined && (
                      <span className="terminal-driver-value monospace">VALUE: {driver.value}</span>
                    )}
                  </div>
                  <div className="terminal-driver-contrib positive monospace">
                    +{driver.contribution.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="terminal-drivers-none monospace">None recorded</div>
          )}
        </div>

        {/* Risk-Decreasing Drivers */}
        <div className="terminal-drivers-column">
          <div className="terminal-drivers-col-header decreasing">
            ▼ RISK-DECREASING CONTRIBUTORS ({drivers.top_negative?.length || 0})
          </div>
          {hasNegative ? (
            <div className="terminal-drivers-list">
              {drivers.top_negative.map((driver, idx) => (
                <div key={`neg-${driver.feature}-${idx}`} className="terminal-driver-row">
                  <div className="terminal-driver-info">
                    <span className="terminal-driver-name">
                      {driver.display_name || driver.feature}
                    </span>
                    {driver.value !== null && driver.value !== undefined && (
                      <span className="terminal-driver-value monospace">VALUE: {driver.value}</span>
                    )}
                  </div>
                  <div className="terminal-driver-contrib negative monospace">
                    {driver.contribution.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="terminal-drivers-none monospace">None recorded</div>
          )}
        </div>
      </div>

      <div className="terminal-card-footnote">
        Values represent signed feature margin contributions in model logit space, not probabilities or verified causal mechanisms.
      </div>
    </div>
  );
};
