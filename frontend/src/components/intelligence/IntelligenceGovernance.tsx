import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ProjectIntelligenceModelGovernance } from "@/types/project.ts";

interface IntelligenceGovernanceProps {
  model: ProjectIntelligenceModelGovernance | null;
}

export const IntelligenceGovernance: React.FC<IntelligenceGovernanceProps> = ({ model }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!model) {
    return (
      <div className="terminal-card">
        <div className="terminal-card-header">
          <div className="terminal-card-title-lockup">
            <span className="terminal-section-eyebrow">GOVERNANCE & TRACEABILITY</span>
            <h3 className="terminal-card-title">MODEL GOVERNANCE METADATA</h3>
          </div>
        </div>
        <div className="terminal-empty-text monospace">
          NO MODEL GOVERNANCE METADATA RECORDED FOR THIS PROJECT
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-card">
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">MODEL REGISTRY GOVERNANCE</span>
          <h3 className="terminal-card-title">MODEL SPECIFICATION & TRACEABILITY</h3>
        </div>

        <button
          type="button"
          className="terminal-governance-toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="governance-specification-panel"
        >
          <span>{isExpanded ? "COLLAPSE SPECIFICATION" : "EXPAND SPECIFICATION"}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Summary Row */}
      <div className="terminal-gov-summary-grid">
        <div className="terminal-gov-cell">
          <span className="gov-cell-label">MODEL IDENTIFIER</span>
          <span className="gov-cell-val monospace">{model.model_id}</span>
        </div>

        <div className="terminal-gov-cell">
          <span className="gov-cell-label">MODEL FAMILY</span>
          <span className="gov-cell-val">{model.model_family}</span>
        </div>

        <div className="terminal-gov-cell">
          <span className="gov-cell-label">DEPLOYMENT STATUS</span>
          <span className="gov-cell-val status-badge">
            <span className={`status-dot ${model.is_active ? "active" : "inactive"}`} />
            {model.status} {model.is_active ? "(ACTIVE)" : "(INACTIVE)"}
          </span>
        </div>

        <div className="terminal-gov-cell">
          <span className="gov-cell-label">COVERAGE PERIOD</span>
          <span className="gov-cell-val monospace">{model.coverage_period}</span>
        </div>
      </div>

      {/* Expanded Specification Panel */}
      {isExpanded && (
        <div id="governance-specification-panel" className="terminal-gov-expanded-panel">
          <div className="gov-detail-grid">
            <div className="gov-detail-item">
              <span className="gov-detail-label">TARGET FORMULATION</span>
              <span className="gov-detail-val monospace">{model.target}</span>
            </div>

            <div className="gov-detail-item">
              <span className="gov-detail-label">CALIBRATION POLICY</span>
              <span className="gov-detail-val">{model.calibration_policy || "None"}</span>
            </div>

            <div className="gov-detail-item">
              <span className="gov-detail-label">EXPLANATION METHOD</span>
              <span className="gov-detail-val monospace">{model.explanation_method || "N/A"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
