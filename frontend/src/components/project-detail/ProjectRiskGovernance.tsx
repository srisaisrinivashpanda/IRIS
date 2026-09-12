import React, { useState } from "react";
import type { ProjectIntelligenceModelGovernance } from "@/types/project.ts";

interface ProjectRiskGovernanceProps {
  model: ProjectIntelligenceModelGovernance | null;
}

export const ProjectRiskGovernance: React.FC<ProjectRiskGovernanceProps> = ({ model }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!model) {
    return (
      <div className="detail-card">
        <span className="overview-metric-label">GOVERNANCE & TRACEABILITY</span>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-dim)" }}>
          NO MODEL GOVERNANCE METADATA RECORDED
        </div>
      </div>
    );
  }

  return (
    <div className="detail-card">
      <div className="risk-card-header">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span className="overview-metric-label">MODEL REGISTRY GOVERNANCE</span>
          <h3 className="risk-card-title">MODEL METADATA & TRACEABILITY</h3>
        </div>
        <button
          type="button"
          className="risk-governance-toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "COLLAPSE SPECIFICATION ↑" : "VIEW DETAILS ↓"}
        </button>
      </div>

      <div className="risk-governance-summary-grid">
        <div className="gov-meta-cell">
          <span className="gov-meta-label">MODEL ID</span>
          <span className="gov-meta-val monospace">{model.model_id}</span>
        </div>

        <div className="gov-meta-cell">
          <span className="gov-meta-label">MODEL FAMILY</span>
          <span className="gov-meta-val">{model.model_family}</span>
        </div>

        <div className="gov-meta-cell">
          <span className="gov-meta-label">STATUS</span>
          <span className="gov-meta-val status-badge">
            <span className={`status-dot ${model.is_active ? "active" : "inactive"}`} />
            {model.status} {model.is_active ? "(ACTIVE)" : "(INACTIVE)"}
          </span>
        </div>

        <div className="gov-meta-cell">
          <span className="gov-meta-label">COVERAGE PERIOD</span>
          <span className="gov-meta-val monospace">{model.coverage_period}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="risk-governance-expanded-panel">
          <div className="gov-detail-row">
            <span className="gov-meta-label">TARGET FORMULATION</span>
            <span className="gov-meta-val monospace">{model.target}</span>
          </div>

          <div className="gov-detail-row">
            <span className="gov-meta-label">CALIBRATION POLICY</span>
            <span className="gov-meta-val">{model.calibration_policy || "None"}</span>
          </div>

          <div className="gov-detail-row">
            <span className="gov-meta-label">EXPLANATION METHOD</span>
            <span className="gov-meta-val monospace">{model.explanation_method || "N/A"}</span>
          </div>
        </div>
      )}
    </div>
  );
};
