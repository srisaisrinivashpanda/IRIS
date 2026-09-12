import React from "react";
import type { ProjectIntelligenceRisk } from "@/types/project.ts";

interface ProjectRiskAssessmentCardProps {
  risk: ProjectIntelligenceRisk;
}

export const ProjectRiskAssessmentCard: React.FC<ProjectRiskAssessmentCardProps> = ({ risk }) => {
  const probabilityPercent = (risk.risk_probability * 100).toFixed(1);
  const rawProbabilityPercent = (risk.raw_probability * 100).toFixed(1);
  const percentileDisplay = `${(risk.risk_percentile * 100).toFixed(1)}%`;

  return (
    <div className="detail-card">
      <div className="risk-card-header">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span className="overview-metric-label">PRODUCTION ASSESSMENT</span>
          <h3 className="risk-card-title">CURRENT SCHEDULE RISK</h3>
        </div>
        <div className="risk-badge-group">
          <span className="risk-badge regime">{risk.regime} REGIME</span>
          <span className={`risk-badge ${risk.calibration_active ? "calibrated" : "raw"}`}>
            {risk.calibration_active ? "CALIBRATION ACTIVE" : "RAW PROBABILITY"}
          </span>
        </div>
      </div>

      <div className="risk-metrics-grid">
        {/* Risk Probability */}
        <div className="risk-metric-cell primary-stat">
          <span className="overview-metric-label">Operational Risk Probability</span>
          <div className="risk-stat-value">{probabilityPercent}%</div>
          {risk.calibration_active && (
            <span className="risk-stat-sub">RAW: {rawProbabilityPercent}%</span>
          )}
        </div>

        {/* Portfolio Rank */}
        <div className="risk-metric-cell">
          <span className="overview-metric-label">Portfolio Risk Rank</span>
          <div className="risk-stat-value">#{risk.risk_rank}</div>
          <span className="risk-stat-sub">OF {risk.population_size.toLocaleString()} MONITORED</span>
        </div>

        {/* Percentile */}
        <div className="risk-metric-cell">
          <span className="overview-metric-label">Risk Percentile</span>
          <div className="risk-stat-value">{percentileDisplay}</div>
          <span className="risk-stat-sub">P{(risk.risk_percentile * 100).toFixed(1)}</span>
        </div>

        {/* Assessment Month */}
        <div className="risk-metric-cell">
          <span className="overview-metric-label">Assessment Month</span>
          <div className="risk-stat-value" style={{ fontSize: "16px", paddingTop: "4px" }}>
            {risk.report_month}
          </div>
          <span className="risk-stat-sub">TARGET: {risk.target}</span>
        </div>
      </div>
    </div>
  );
};
