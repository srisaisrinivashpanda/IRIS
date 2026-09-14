import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchProjectRiskHistory } from "@/api/risk.ts";
import { fetchProjectRiskIntelligence } from "@/api/projects.ts";
import type { RiskRecord } from "@/types/risk.ts";
import { DashboardCardSkeleton } from "./DashboardSkeleton.tsx";
import {
  AlertTriangle,
  ExternalLink,
  Search,
  Clock,
  Layers,
  BarChart2,
} from "lucide-react";

export interface DashboardRiskMovementProps {
  projectCode?: string | null;
  projectName?: string | null;
}

export const DashboardRiskMovement: React.FC<DashboardRiskMovementProps> = ({
  projectCode,
  projectName,
}) => {
  // 1. Authoritative Chronological Risk History from Risk Serving
  const historyQuery = useQuery({
    queryKey: ["risk", "project", projectCode, "history"],
    queryFn: async () => {
      if (!projectCode) return { project_code: "", regime_filter: null, count: 0, items: [] };
      const res = await fetchProjectRiskHistory(projectCode);
      return res ?? { project_code: projectCode, regime_filter: null, count: 0, items: [] };
    },
    enabled: !!projectCode,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // 2. Authoritative Project Intelligence (for exact recent_changes contract)
  const intelQuery = useQuery({
    queryKey: ["projects", projectCode, "risk-intelligence"],
    queryFn: async () => {
      if (!projectCode) return null;
      try {
        const res = await fetchProjectRiskIntelligence(projectCode);
        return res ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!projectCode,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!projectCode) {
    return (
      <div className="dashboard-risk-movement dashboard-card-white" aria-label="Recent Risk Movement Panel">
        <div className="dashboard-empty-panel" style={{ padding: "40px 20px", textAlign: "center" }}>
          <Clock size={28} className="text-dim" style={{ margin: "0 auto 12px" }} aria-hidden="true" />
          <span className="dashboard-empty-title">Select a project to inspect risk movement</span>
          <p className="dashboard-empty-desc">
            Choose a record from the investigation queue to view chronological risk evaluations, model transitions, and evidence.
          </p>
        </div>
      </div>
    );
  }

  if (historyQuery.isLoading || intelQuery.isLoading) {
    return <DashboardCardSkeleton height="320px" label={`Loading risk movement for project ${projectCode}...`} />;
  }

  if (historyQuery.isError) {
    return (
      <div className="dashboard-risk-movement dashboard-card-white" aria-label="Recent Risk Movement Panel">
        <div className="dashboard-empty-panel" style={{ padding: "36px 20px", textAlign: "center" }}>
          <AlertTriangle size={26} className="text-amber" style={{ margin: "0 auto 10px" }} aria-hidden="true" />
          <span className="dashboard-empty-title">Risk movement data unavailable</span>
          <p className="dashboard-empty-desc">
            {historyQuery.error instanceof Error
              ? historyQuery.error.message
              : "Could not retrieve historical risk evaluation records for this project."}
          </p>
          <button
            type="button"
            className="dashboard-action-link-btn"
            onClick={() => {
              historyQuery.refetch();
              intelQuery.refetch();
            }}
            style={{ marginTop: "12px" }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  const records: RiskRecord[] = [...(historyQuery.data?.items || [])].sort((a, b) =>
    a.report_month.localeCompare(b.report_month)
  );

  const encodedCode = encodeURIComponent(projectCode);
  const displayName = projectName || intelQuery.data?.project.project_name || projectCode;

  // Single observation state
  if (records.length <= 1) {
    const singleRecord = records[0];
    return (
      <div className="dashboard-risk-movement dashboard-card-white" aria-label="Recent Risk Movement Panel">
        <div className="movement-panel-header">
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="movement-panel-tag">RISK MOVEMENT</span>
              <span className="movement-code font-mono">{projectCode}</span>
            </div>
            <h4 className="movement-project-name">{displayName}</h4>
          </div>
          <div className="movement-actions">
            <Link
              to={`/projects/${encodedCode}`}
              className="dashboard-table-action-link"
              aria-label={`Inspect details for project ${projectCode}`}
              title={`Inspect project ${projectCode}`}
            >
              <span>DETAILS</span>
              <Search size={11} aria-hidden="true" />
            </Link>
            <Link
              to={`/intelligence?project=${encodedCode}`}
              className="dashboard-table-action-link"
              aria-label={`Open intelligence terminal for project ${projectCode}`}
              title={`Risk Intelligence for ${projectCode}`}
            >
              <span>INTEL</span>
              <ExternalLink size={11} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="single-observation-box">
          <div className="single-observation-header">
            <Clock size={16} className="text-blue" aria-hidden="true" />
            <strong>SINGLE OBSERVED EVALUATION</strong>
          </div>
          <p className="single-observation-desc">
            No prior comparable record available. Single observation evaluated for cycle{" "}
            <span className="font-mono">{singleRecord?.report_month || "None"}</span>.
          </p>
          {singleRecord && (
            <div className="single-obs-metrics">
              <div className="metric-cell">
                <span className="metric-label">CALIBRATED RISK PROBABILITY</span>
                <span className="metric-val font-mono">
                  {(singleRecord.risk_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">RAW MODEL PROBABILITY</span>
                <span className="metric-val font-mono">
                  {(singleRecord.raw_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">BACKEND RANK</span>
                <span className="metric-val font-mono">
                  #{singleRecord.risk_rank} of {singleRecord.population_size}
                </span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">SERVING REGIME</span>
                <span className="metric-val font-mono">{singleRecord.regime}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Two or more records available: analyze current vs previous adjacent observation
  const current = records[records.length - 1];
  const previous = records[records.length - 2];

  // Granular comparability checks (Correction 1)
  const isModelTransition = current.model_id !== previous.model_id || current.regime !== previous.regime;
  const isCalibrationStateChanged = current.calibration_active !== previous.calibration_active;

  // Calibrated probability comparability: requires compatible model, regime, and calibration semantics
  const canCompareCalibrated =
    !isModelTransition && current.calibration_active && previous.calibration_active;

  // Raw model probability comparability: requires compatible model and regime
  const canCompareRaw = !isModelTransition;

  // Rank and percentile comparability: requires both observations provide values
  const canCompareRank =
    typeof current.risk_rank === "number" && typeof previous.risk_rank === "number";
  const canComparePercentile =
    typeof current.risk_percentile === "number" && typeof previous.risk_percentile === "number";

  // Calibrated Probability Delta
  const calDelta = canCompareCalibrated
    ? (current.risk_probability - previous.risk_probability) * 100
    : null;

  // Raw Probability Delta
  const rawDelta = canCompareRaw
    ? (current.raw_probability - previous.raw_probability) * 100
    : null;

  // Rank Delta (positive indicates improvement / lower rank number, negative indicates worsening / higher rank number)
  const rankDelta = canCompareRank ? previous.risk_rank - current.risk_rank : null;

  // Percentile Delta
  const percentileDelta = canComparePercentile
    ? (current.risk_percentile - previous.risk_percentile) * 100
    : null;

  // Accessible narrative text for screen readers (Requirement 21, 27)
  let accessibleCalNarrative = "No comparable calibrated probability change.";
  if (calDelta !== null) {
    if (calDelta > 0.001) {
      accessibleCalNarrative = `Calibrated probability increased by ${calDelta.toFixed(1)} percentage points.`;
    } else if (calDelta < -0.001) {
      accessibleCalNarrative = `Calibrated probability decreased by ${Math.abs(calDelta).toFixed(1)} percentage points.`;
    } else {
      accessibleCalNarrative = "Calibrated probability remained unchanged.";
    }
  }

  // Strict recent changes contract (Correction 2)
  const recentChanges = intelQuery.data?.recent_changes;

  return (
    <div className="dashboard-risk-movement dashboard-card-white" aria-label="Recent Risk Movement Panel">
      <div className="movement-panel-header">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="movement-panel-tag">RISK MOVEMENT</span>
            <span className="movement-code font-mono">{projectCode}</span>
          </div>
          <h4 className="movement-project-name">{displayName}</h4>
        </div>
        <div className="movement-actions">
          <Link
            to={`/projects/${encodedCode}`}
            className="dashboard-table-action-link"
            aria-label={`Inspect details for project ${projectCode}`}
            title={`Inspect project ${projectCode}`}
          >
            <span>DETAILS</span>
            <Search size={11} aria-hidden="true" />
          </Link>
          <Link
            to={`/intelligence?project=${encodedCode}`}
            className="dashboard-table-action-link"
            aria-label={`Open intelligence terminal for project ${projectCode}`}
            title={`Risk Intelligence for ${projectCode}`}
          >
            <span>INTEL</span>
            <ExternalLink size={11} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Model or Regime Transition Notice */}
      {isModelTransition && (
        <div className="transition-alert-box" role="alert" aria-label="Model or Regime Transition Detected">
          <div className="transition-alert-header">
            <AlertTriangle size={15} className="text-amber" aria-hidden="true" />
            <strong>MODEL / REGIME TRANSITION DETECTED</strong>
          </div>
          <p className="transition-alert-text">
            Historical comparison is not treated as a like-for-like probability change. The serving model or regime transitioned between adjacent observations.
          </p>
          <div className="transition-detail-grid">
            <div className="transition-col">
              <span className="transition-col-label">PREVIOUS OBSERVED ({previous.report_month})</span>
              <span className="transition-val font-mono">{previous.model_id}</span>
              <span className="transition-subval font-mono">{previous.regime} REGIME</span>
            </div>
            <div className="transition-col">
              <span className="transition-col-label">CURRENT OBSERVED ({current.report_month})</span>
              <span className="transition-val font-mono">{current.model_id}</span>
              <span className="transition-subval font-mono">{current.regime} REGIME</span>
            </div>
          </div>
        </div>
      )}

      {/* Calibration State Changed Notice */}
      {isCalibrationStateChanged && (
        <div className="calibration-change-box" role="status">
          <Layers size={14} className="text-blue" aria-hidden="true" />
          <span>
            CALIBRATION STATE CHANGED: Previous was{" "}
            <strong>{previous.calibration_active ? "ACTIVE" : "UNCALIBRATED"}</strong>, current is{" "}
            <strong>{current.calibration_active ? "ACTIVE" : "UNCALIBRATED"}</strong>.
          </span>
        </div>
      )}

      {/* Observed Evaluation Comparison Cards */}
      <div className="movement-comparison-grid">
        {/* Previous Observation Card */}
        <div className="movement-card">
          <div className="movement-card-header">
            <span className="movement-card-label">PREVIOUS OBSERVED</span>
            <span className="movement-card-month font-mono">{previous.report_month}</span>
          </div>
          <div className="movement-field">
            <span className="field-label">CALIBRATED RISK PROBABILITY</span>
            <span className="field-val font-mono">
              {(previous.risk_probability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="movement-field">
            <span className="field-label">RAW MODEL PROBABILITY</span>
            <span className="field-val font-mono text-dim">
              {(previous.raw_probability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="movement-field">
            <span className="field-label">BACKEND RANK</span>
            <span className="field-val font-mono">
              #{previous.risk_rank} of {previous.population_size}
            </span>
          </div>
          <div className="movement-field">
            <span className="field-label">PERCENTILE</span>
            <span className="field-val font-mono">
              {(previous.risk_percentile * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Current Observation Card */}
        <div className="movement-card current">
          <div className="movement-card-header">
            <span className="movement-card-label">CURRENT EVALUATION</span>
            <span className="movement-card-month font-mono">{current.report_month}</span>
          </div>
          <div className="movement-field">
            <span className="field-label">CALIBRATED RISK PROBABILITY</span>
            <span className="field-val font-mono text-coral font-bold">
              {(current.risk_probability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="movement-field">
            <span className="field-label">RAW MODEL PROBABILITY</span>
            <span className="field-val font-mono text-dim">
              {(current.raw_probability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="movement-field">
            <span className="field-label">BACKEND RANK</span>
            <span className="field-val font-mono">
              #{current.risk_rank} of {current.population_size}
            </span>
          </div>
          <div className="movement-field">
            <span className="field-label">PERCENTILE</span>
            <span className="field-val font-mono">
              {(current.risk_percentile * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Movement Delta Card */}
        <div className="movement-card delta">
          <div className="movement-card-header">
            <span className="movement-card-label">OBSERVED MOVEMENT</span>
            <span className="movement-card-month font-mono">CHANGE</span>
          </div>

          {/* Calibrated Probability Movement */}
          <div className="movement-field">
            <span className="field-label">CALIBRATED RISK DELTA</span>
            {canCompareCalibrated && calDelta !== null ? (
              <div className="delta-val-wrap">
                <span
                  className={`field-val font-mono font-bold ${
                    calDelta > 0.001 ? "text-coral" : calDelta < -0.001 ? "text-emerald" : "text-main"
                  }`}
                >
                  {calDelta >= 0 ? `+${calDelta.toFixed(1)}` : calDelta.toFixed(1)} percentage points
                </span>
                <span className="sr-only">{accessibleCalNarrative}</span>
              </div>
            ) : (
              <span className="field-val font-mono text-dim" title="Incompatible model or regime transition">
                Incompatible for delta
              </span>
            )}
          </div>

          {/* Raw Probability Movement */}
          <div className="movement-field">
            <span className="field-label">RAW PROBABILITY DELTA</span>
            {canCompareRaw && rawDelta !== null ? (
              <span className="field-val font-mono text-dim">
                {rawDelta >= 0 ? `+${rawDelta.toFixed(1)}` : rawDelta.toFixed(1)} percentage points
              </span>
            ) : (
              <span className="field-val font-mono text-dim">Incompatible</span>
            )}
          </div>

          {/* Rank Movement */}
          <div className="movement-field">
            <span className="field-label">RANK MOVEMENT</span>
            {canCompareRank && rankDelta !== null ? (
              <span className="field-val font-mono">
                {rankDelta > 0
                  ? `+${rankDelta} positions (#${previous.risk_rank} → #${current.risk_rank})`
                  : rankDelta < 0
                  ? `${rankDelta} positions (#${previous.risk_rank} → #${current.risk_rank})`
                  : `Unchanged (#${current.risk_rank})`}
              </span>
            ) : (
              <span className="field-val font-mono text-dim">Unavailable</span>
            )}
          </div>

          {/* Percentile Movement */}
          <div className="movement-field">
            <span className="field-label">PERCENTILE MOVEMENT</span>
            {canComparePercentile && percentileDelta !== null ? (
              <span className="field-val font-mono">
                {percentileDelta >= 0 ? `+${percentileDelta.toFixed(1)}` : percentileDelta.toFixed(1)} percentage points
              </span>
            ) : (
              <span className="field-val font-mono text-dim">Unavailable</span>
            )}
          </div>
        </div>
      </div>

      {/* Accessible Narrative Announcement */}
      <div className="movement-narrative-box" aria-live="polite">
        <span className="narrative-tag">OBSERVED CHANGE SUMMARY:</span>
        <span className="narrative-text">
          {canCompareCalibrated && calDelta !== null
            ? accessibleCalNarrative
            : isModelTransition
            ? "Model or regime transition detected between observations; numerical probability delta is suppressed."
            : "Movement between observed evaluation cycles."}
        </span>
      </div>

      {/* Strict Recent Changes Section (Correction 2) */}
      <div className="movement-recent-changes" aria-label="Recent Project-Level Changes Evidence">
        <div className="recent-changes-header">
          <BarChart2 size={14} aria-hidden="true" />
          <span className="recent-changes-title">RECENT PROJECT-LEVEL CHANGE EVIDENCE</span>
        </div>

        {recentChanges && recentChanges.has_prior_observation ? (
          <div className="recent-changes-grid">
            <div className="change-chip">
              <span className="change-chip-label">PHYSICAL PROGRESS DELTA</span>
              <span className="change-chip-val font-mono">
                {recentChanges.physical_progress_delta !== null
                  ? `${recentChanges.physical_progress_delta >= 0 ? "+" : ""}${recentChanges.physical_progress_delta.toFixed(1)}%`
                  : "Unavailable"}
              </span>
            </div>
            <div className="change-chip">
              <span className="change-chip-label">EXPENDITURE DELTA</span>
              <span className="change-chip-val font-mono">
                {recentChanges.expenditure_delta !== null
                  ? `₹${recentChanges.expenditure_delta.toFixed(2)} Cr`
                  : "Unavailable"}
              </span>
            </div>
            <div className="change-chip">
              <span className="change-chip-label">REVISED COST DELTA</span>
              <span className="change-chip-val font-mono">
                {recentChanges.revised_cost_delta !== null
                  ? `₹${recentChanges.revised_cost_delta.toFixed(2)} Cr`
                  : "Unavailable"}
              </span>
            </div>
            <div className="change-chip">
              <span className="change-chip-label">COMPLETION DATE CHANGED</span>
              <span className="change-chip-val font-mono">
                {recentChanges.completion_date_changed ? "Yes" : "No"}
              </span>
            </div>
          </div>
        ) : (
          <div className="recent-changes-unavailable">
            <span>
              RECENT PROJECT-LEVEL CHANGE EVIDENCE: Not available from the current serving contract.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
