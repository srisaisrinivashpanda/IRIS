import React from "react";
import type { ProjectRiskIntelligenceResponse } from "@/types/project.ts";
import { ProjectRiskAssessmentCard } from "./ProjectRiskAssessmentCard.tsx";
import { ProjectRiskGovernance } from "./ProjectRiskGovernance.tsx";
import { ProjectRiskDriversCard } from "./ProjectRiskDriversCard.tsx";
import { ProjectRiskSignals } from "./ProjectRiskSignals.tsx";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner.tsx";

interface ProjectRiskIntelligenceSectionProps {
  riskIntelligence?: ProjectRiskIntelligenceResponse;
  isLoading: boolean;
  error: Error | null;
  projectCode: string;
  projectSnapshotMonth?: string | null;
}

export const ProjectRiskIntelligenceSection: React.FC<ProjectRiskIntelligenceSectionProps> = ({
  riskIntelligence,
  isLoading,
  error,
  projectCode,
  projectSnapshotMonth,
}) => {
  const risk = riskIntelligence?.risk;
  const hasAssessment = Boolean(risk && riskIntelligence?.data_availability?.has_risk_assessment !== false);
  const riskAssessmentMonth = risk?.report_month || riskIntelligence?.data_availability?.risk_report_month || null;

  return (
    <section className="project-detail-section" aria-labelledby="risk-intelligence-title">
      <div className="project-section-header-wrap">
        <div>
          <span className="project-section-eyebrow">MACHINE LEARNING RISK INTELLIGENCE</span>
          <h2 id="risk-intelligence-title" className="project-section-title">
            SCHEDULE RISK INTELLIGENCE.
          </h2>
        </div>

        {/* Temporal Distinction: Explicitly renders snapshot month and risk assessment month separately */}
        <div className="risk-temporal-strip">
          <div className="temporal-indicator">
            <span className="temporal-label">PROJECT SNAPSHOT:</span>
            <span className="temporal-value">{projectSnapshotMonth || "—"}</span>
          </div>
          <span className="temporal-divider">/</span>
          <div className="temporal-indicator">
            <span className="temporal-label">RISK ASSESSMENT:</span>
            <span className="temporal-value">{riskAssessmentMonth || "NOT ASSESSED"}</span>
          </div>
        </div>
      </div>

      {/* 1. Loading State */}
      {isLoading && (
        <div className="risk-loading-card" aria-busy="true">
          <LoadingSpinner size="md" />
          <span className="risk-loading-text">
            RETRIEVING SCHEDULE RISK INTELLIGENCE RECORD: {projectCode}...
          </span>
        </div>
      )}

      {/* 2. Error State */}
      {!isLoading && error && (
        <div className="risk-error-card" role="alert">
          <span className="overview-metric-label" style={{ color: "var(--color-coral)" }}>
            TRANSMISSION FAILURE
          </span>
          <h3 className="risk-card-title" style={{ color: "var(--color-coral)" }}>
            FAILED TO LOAD RISK INTELLIGENCE
          </h3>
          <p className="risk-card-desc">
            An error occurred while retrieving schedule-risk intelligence from the serving layer for project code{" "}
            <strong>{projectCode}</strong>. Other project monitoring records remain fully accessible.
          </p>
          <span className="risk-error-details monospace">
            {error.message || "Unknown error encountered"}
          </span>
        </div>
      )}

      {/* 3. Honest Unassessed State */}
      {!isLoading && !error && !hasAssessment && (
        <div className="detail-grid-2col">
          <div className="detail-card">
            <div className="risk-card-header">
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span className="overview-metric-label">SCHEDULE RISK</span>
                <h3 className="risk-card-title">NOT ASSESSED FOR THIS PROJECT</h3>
              </div>
              <span className="risk-badge raw">UNASSESSED</span>
            </div>

            <p className="risk-card-desc">
              This project is recorded in canonical PAIMANA monitoring data, but no operational schedule-risk
              assessment is currently served in the production model serving layer.
            </p>

            <div className="unserved-ml-domains-strip" style={{ marginTop: "16px" }}>
              <div className="unserved-domain-pill">
                <span className="unserved-domain-name">Cost Overrun Risk</span>
                <span className="unserved-domain-tag">DATA PENDING</span>
              </div>
              <div className="unserved-domain-pill">
                <span className="unserved-domain-name">Progress Stagnation Risk</span>
                <span className="unserved-domain-tag">DATA PENDING</span>
              </div>
            </div>
          </div>

          {/* Factual Signals and Recent Changes if available from backend */}
          {riskIntelligence?.signals && riskIntelligence?.recent_changes && (
            <ProjectRiskSignals
              signals={riskIntelligence.signals}
              recentChanges={riskIntelligence.recent_changes}
              availability={riskIntelligence.data_availability}
            />
          )}
        </div>
      )}

      {/* 4. Complete Assessed State */}
      {!isLoading && !error && hasAssessment && risk && (
        <div className="risk-section-content">
          {/* Top Row: Current Assessment & Model Governance */}
          <div className="detail-grid-2col">
            <ProjectRiskAssessmentCard risk={risk} />
            <ProjectRiskGovernance model={riskIntelligence?.model || null} />
          </div>

          {/* Bottom Row: Risk Drivers & Factual Signals / Recent Changes */}
          <div className="detail-grid-2col" style={{ marginTop: "24px" }}>
            <ProjectRiskDriversCard drivers={riskIntelligence?.drivers || { top_positive: [], top_negative: [], strongest_drivers: [] }} />
            {riskIntelligence?.signals && riskIntelligence?.recent_changes && (
              <ProjectRiskSignals
                signals={riskIntelligence.signals}
                recentChanges={riskIntelligence.recent_changes}
                availability={riskIntelligence.data_availability}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
};
