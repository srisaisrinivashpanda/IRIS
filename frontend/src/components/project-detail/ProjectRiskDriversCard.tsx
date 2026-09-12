import React from "react";
import type { ProjectRiskDrivers } from "@/types/project.ts";

interface ProjectRiskDriversCardProps {
  drivers: ProjectRiskDrivers;
}

export const ProjectRiskDriversCard: React.FC<ProjectRiskDriversCardProps> = ({ drivers }) => {
  const hasPositive = drivers.top_positive && drivers.top_positive.length > 0;
  const hasNegative = drivers.top_negative && drivers.top_negative.length > 0;
  const hasDrivers = hasPositive || hasNegative || (drivers.strongest_drivers && drivers.strongest_drivers.length > 0);

  if (!hasDrivers) {
    return (
      <div className="detail-card">
        <div className="risk-card-header">
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span className="overview-metric-label">FEATURE CONTRIBUTIONS</span>
            <h3 className="risk-card-title">RISK DRIVERS</h3>
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-dim)", padding: "12px 0" }}>
          NO EXPLANATION DRIVERS RECORDED FOR THIS ASSESSMENT
        </div>
      </div>
    );
  }

  return (
    <div className="detail-card">
      <div className="risk-card-header">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span className="overview-metric-label">SHAP / LINEAR CONTRIBUTION ANALYSIS</span>
          <h3 className="risk-card-title">KEY RISK DRIVERS</h3>
        </div>
        <span className="overview-metric-label">RAW MARGIN SPACE</span>
      </div>

      <div className="risk-drivers-dual-col">
        {/* Risk-Increasing Drivers */}
        <div className="risk-drivers-column">
          <span className="risk-driver-col-header increasing">
            ▲ RISK-INCREASING CONTRIBUTORS ({drivers.top_positive?.length || 0})
          </span>
          {hasPositive ? (
            <div className="risk-drivers-list">
              {drivers.top_positive.map((driver, idx) => (
                <div key={`pos-${driver.feature}-${idx}`} className="risk-driver-row">
                  <div className="risk-driver-info">
                    <span className="risk-driver-name">{driver.display_name || driver.feature}</span>
                    {driver.value !== null && driver.value !== undefined && (
                      <span className="risk-driver-val">VALUE: {driver.value}</span>
                    )}
                  </div>
                  <div className="risk-driver-contrib positive">
                    +{driver.contribution > 0 ? driver.contribution.toFixed(3) : driver.contribution.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="risk-driver-empty">None recorded</span>
          )}
        </div>

        {/* Risk-Decreasing Drivers */}
        <div className="risk-drivers-column">
          <span className="risk-driver-col-header decreasing">
            ▼ RISK-DECREASING CONTRIBUTORS ({drivers.top_negative?.length || 0})
          </span>
          {hasNegative ? (
            <div className="risk-drivers-list">
              {drivers.top_negative.map((driver, idx) => (
                <div key={`neg-${driver.feature}-${idx}`} className="risk-driver-row">
                  <div className="risk-driver-info">
                    <span className="risk-driver-name">{driver.display_name || driver.feature}</span>
                    {driver.value !== null && driver.value !== undefined && (
                      <span className="risk-driver-val">VALUE: {driver.value}</span>
                    )}
                  </div>
                  <div className="risk-driver-contrib negative">
                    {driver.contribution.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="risk-driver-empty">None recorded</span>
          )}
        </div>
      </div>
    </div>
  );
};
