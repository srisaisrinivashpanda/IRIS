import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { TopRiskProject } from "@/types/risk.ts";
import { DashboardEarlyWarningSummary } from "./DashboardEarlyWarningSummary.tsx";
import { DashboardInvestigationQueue } from "./DashboardInvestigationQueue.tsx";
import { DashboardRiskMovement } from "./DashboardRiskMovement.tsx";
import { DashboardEarlyWarningEvidence } from "./DashboardEarlyWarningEvidence.tsx";
import { DashboardCardSkeleton } from "./DashboardSkeleton.tsx";
import { DashboardErrorState } from "./DashboardErrorState.tsx";
import { ShieldAlert, ArrowUpRight } from "lucide-react";

export interface DashboardEarlyWarningProps {
  projects?: TopRiskProject[];
  evaluationMonth?: string | null;
  activeRegimes?: string[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const DashboardEarlyWarning: React.FC<DashboardEarlyWarningProps> = ({
  projects = [],
  evaluationMonth,
  activeRegimes = [],
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  const [selectedProjectCode, setSelectedProjectCode] = useState<string | null>(null);

  // Initialize selected project to the first project in the queue when data arrives
  useEffect(() => {
    if (projects.length > 0 && (!selectedProjectCode || !projects.some((p) => p.project_code === selectedProjectCode))) {
      setSelectedProjectCode(projects[0].project_code);
    }
  }, [projects, selectedProjectCode]);

  const selectedProject = projects.find((p) => p.project_code === selectedProjectCode) || projects[0] || null;

  if (isLoading) {
    return <DashboardCardSkeleton height="420px" label="Loading early warning investigation signals..." />;
  }

  if (isError) {
    return (
      <section className="dashboard-section" aria-label="Early Warning and Investigation Signals Panel">
        <DashboardErrorState
          title="EARLY WARNING DATA UNAVAILABLE"
          message={error?.message || "Early warning and investigation signal data could not be retrieved from the serving repository."}
          onRetry={onRetry}
        />
      </section>
    );
  }

  return (
    <section className="dashboard-section early-warning-section" aria-label="Early Warning and Investigation Signals Panel">
      <div className="dashboard-section-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={18} className="text-coral" aria-hidden="true" />
              <h2 className="dashboard-section-title">EARLY WARNING / INVESTIGATION SIGNALS</h2>
            </div>
            <span className="dashboard-section-subtitle">
              Authoritative evidence-backed project investigation signals · PRODUCTION SCHEDULE-EXTENSION RISK · HORIZON: 3 MONTHS
            </span>
          </div>
          <div>
            <Link to="/intelligence" className="dashboard-section-link" title="Deep Risk Analysis in Intelligence Terminal">
              <span>DEEP RISK ANALYSIS</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Stat Strip */}
      <DashboardEarlyWarningSummary
        projectCount={projects.length}
        evaluationCycle={evaluationMonth}
        activeRegimes={activeRegimes}
      />

      {/* Split Workspace: Left = Queue, Right = Risk Movement */}
      <div className="early-warning-split-layout">
        <div className="early-warning-queue-col">
          <DashboardInvestigationQueue
            projects={projects}
            evaluationMonth={evaluationMonth}
            selectedProjectCode={selectedProject?.project_code || null}
            onSelectProject={(code) => setSelectedProjectCode(code)}
            isLoading={false}
            isError={false}
          />
        </div>

        <div className="early-warning-movement-col">
          <DashboardRiskMovement
            projectCode={selectedProject?.project_code || null}
            projectName={selectedProject?.project_name || null}
          />
        </div>
      </div>

      {/* Evidence & Limitations Disclosures */}
      <DashboardEarlyWarningEvidence />
    </section>
  );
};
