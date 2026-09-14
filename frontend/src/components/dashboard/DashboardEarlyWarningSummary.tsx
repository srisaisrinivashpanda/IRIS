import React from "react";
import { AlertCircle, Target, Calendar, Database, ShieldAlert, Cpu } from "lucide-react";

export interface DashboardEarlyWarningSummaryProps {
  projectCount: number;
  evaluationCycle?: string | null;
  activeRegimes?: string[];
  observedChangesCount?: number | null;
  modelTransitionsCount?: number | null;
  calibrationChangesCount?: number | null;
}

export const DashboardEarlyWarningSummary: React.FC<DashboardEarlyWarningSummaryProps> = ({
  projectCount,
  evaluationCycle,
  activeRegimes = [],
  observedChangesCount = null,
  modelTransitionsCount = null,
  calibrationChangesCount = null,
}) => {
  return (
    <div className="dashboard-early-warning-summary" aria-label="Early Warning Executive Summary Strip">
      <div className="summary-stat-chip">
        <div className="stat-chip-icon">
          <AlertCircle size={15} aria-hidden="true" />
        </div>
        <div className="stat-chip-content">
          <span className="stat-chip-label">INVESTIGATION QUEUE</span>
          <span className="stat-chip-val">
            {projectCount > 0 ? `${projectCount} Ranked Records` : "0 Records"}
          </span>
        </div>
      </div>

      <div className="summary-stat-chip">
        <div className="stat-chip-icon">
          <Calendar size={15} aria-hidden="true" />
        </div>
        <div className="stat-chip-content">
          <span className="stat-chip-label">EVALUATION CYCLE</span>
          <span className="stat-chip-val font-mono">
            {evaluationCycle || "None"}
          </span>
        </div>
      </div>

      <div className="summary-stat-chip">
        <div className="stat-chip-icon">
          <Target size={15} aria-hidden="true" />
        </div>
        <div className="stat-chip-content">
          <span className="stat-chip-label">PRODUCTION RISK TARGET</span>
          <span className="stat-chip-val font-mono" title="target_effective_schedule_ext_3m">
            target_effective_schedule_ext_3m
          </span>
        </div>
      </div>

      <div className="summary-stat-chip">
        <div className="stat-chip-icon">
          <Cpu size={15} aria-hidden="true" />
        </div>
        <div className="stat-chip-content">
          <span className="stat-chip-label">ACTIVE SERVING REGIMES</span>
          <span className="stat-chip-val">
            {activeRegimes.length > 0 ? activeRegimes.join(" / ") : "MODERN"}
          </span>
        </div>
      </div>

      {modelTransitionsCount !== null && (
        <div className="summary-stat-chip">
          <div className="stat-chip-icon">
            <Database size={15} aria-hidden="true" />
          </div>
          <div className="stat-chip-content">
            <span className="stat-chip-label">MODEL TRANSITIONS</span>
            <span className="stat-chip-val font-mono">
              {modelTransitionsCount}
            </span>
          </div>
        </div>
      )}

      {calibrationChangesCount !== null && (
        <div className="summary-stat-chip">
          <div className="stat-chip-icon">
            <Cpu size={15} aria-hidden="true" />
          </div>
          <div className="stat-chip-content">
            <span className="stat-chip-label">CALIBRATION CHANGES</span>
            <span className="stat-chip-val font-mono">
              {calibrationChangesCount}
            </span>
          </div>
        </div>
      )}

      {observedChangesCount !== null && (
        <div className="summary-stat-chip">
          <div className="stat-chip-icon">
            <ShieldAlert size={15} aria-hidden="true" />
          </div>
          <div className="stat-chip-content">
            <span className="stat-chip-label">OBSERVED CHANGES</span>
            <span className="stat-chip-val font-mono">
              {observedChangesCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
