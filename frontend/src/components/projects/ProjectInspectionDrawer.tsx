/**
 * Project Inspection Drawer (PR-14)
 * Slide-out inspection console providing deep project factual inspection,
 * authoritative financial observations, schedule timelines, and risk intelligence evidence.
 * 
 * Strict Governance:
 * - NO N+1 risk requests: fetches risk intelligence ONLY for this single selected project (Correction 2).
 * - Financial observation semantics: renders backend values directly without browser recomputation (Correction 4).
 * - Single served ML target: target_effective_schedule_ext_3m.
 * - Dynamic regime & model ID rendering (no hardcoding).
 * - Truthful notice when unassessed: "Risk evaluation unavailable for this project." (Never 0% or fake score).
 * - Canonical navigation: /projects/{code} and /intelligence?project={code}. Strictly NO /intelligence/projects.
 */

import React, { useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProjectRiskIntelligence } from "@/api/projects.ts";
import type { ProjectSummaryItem } from "@/types/project.ts";
import { X, ArrowUpRight, ShieldCheck, ShieldAlert, Activity, AlertCircle } from "lucide-react";
import { animateDrawerEnter, animateDrawerExit } from "@/lib/motion/presets.ts";

interface ProjectInspectionDrawerProps {
  project: ProjectSummaryItem | null;
  onClose: () => void;
}

export const ProjectInspectionDrawer: React.FC<ProjectInspectionDrawerProps> = ({
  project,
  onClose,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const isClosing = useRef(false);

  // Fetch risk intelligence strictly for this explicitly selected project (no N+1 requests)
  const {
    data: riskData,
    isLoading: isRiskLoading,
    isError: isRiskError,
  } = useQuery({
    queryKey: ["projectRiskIntelligence", project?.project_code],
    queryFn: () => fetchProjectRiskIntelligence(project!.project_code),
    enabled: Boolean(project?.project_code),
    staleTime: 60_000,
  });

  const handleClose = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    animateDrawerExit(overlayRef.current, drawerRef.current, () => {
      onClose();
    });
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (project) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      // Animate entrance
      animateDrawerEnter(overlayRef.current, drawerRef.current);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [project, handleClose]);

  if (!project) return null;

  const encodedCode = encodeURIComponent(project.project_code);
  const progressVal = project.physical_progress != null ? Math.max(0, Math.min(100, project.physical_progress)) : null;

  const risk = riskData?.risk;
  const recentChanges = riskData?.recent_changes;

  return (
    <div
      ref={overlayRef}
      className="project-drawer-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-drawer-title"
      data-testid="project-inspection-drawer"
    >
      <div
        ref={drawerRef}
        className="project-drawer-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="project-drawer-header">
          <div className="project-drawer-header-left">
            <span className="project-drawer-tag">PROJECT INSPECTION CONSOLE</span>
            <span className="project-drawer-code font-mono">{project.project_code}</span>
          </div>
          <button
            type="button"
            className="project-drawer-close-btn"
            onClick={handleClose}
            aria-label="Close project inspection console"
          >
            <X size={16} />
          </button>
        </div>

        <div className="project-drawer-body">
          {/* Project Title Block */}
          <div className="project-drawer-title-block">
            <h2 id="project-drawer-title" className="project-drawer-title">
              {project.project_name || "—"}
            </h2>
            <div className="project-drawer-subtitle">
              <span>{project.agency || "—"}</span>
              {project.ministry && <span>• {project.ministry}</span>}
            </div>
          </div>

          {/* Key Facts Metric Grid */}
          <div className="project-drawer-facts-grid">
            <div className="drawer-fact-cell">
              <span className="drawer-fact-label">SECTOR</span>
              <span className="drawer-fact-value">{project.sector || "—"}</span>
            </div>
            <div className="drawer-fact-cell">
              <span className="drawer-fact-label">STATE / REGION</span>
              <span className="drawer-fact-value">{project.state || "—"}</span>
            </div>
            <div className="drawer-fact-cell">
              <span className="drawer-fact-label">LATEST REPORT</span>
              <span className="drawer-fact-value font-mono" style={{ color: "#1A3C2B", fontWeight: 700 }}>
                {project.report_month || "—"}
              </span>
            </div>
            <div className="drawer-fact-cell">
              <span className="drawer-fact-label">PHYSICAL PROGRESS</span>
              <span className="drawer-fact-value font-mono">
                {progressVal !== null ? `${progressVal}%` : "NOT REPORTED"}
              </span>
            </div>
          </div>

          {/* Progress Pacing Visual Bar */}
          {progressVal !== null && (
            <div className="drawer-section-block">
              <div className="drawer-section-header">
                <span className="drawer-section-title">PHYSICAL COMPLETION PACING</span>
                <span className="drawer-section-val font-mono">{progressVal}%</span>
              </div>
              <div className="drawer-progress-track">
                <div
                  className="drawer-progress-fill"
                  style={{ width: `${progressVal}%` }}
                />
              </div>
            </div>
          )}

          {/* Financial Metrics */}
          <div className="drawer-section-block">
            <div className="drawer-section-header">
              <span className="drawer-section-title">FINANCIAL METRICS (RS CRORE)</span>
            </div>
            <div className="project-drawer-facts-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="drawer-fact-cell">
                <span className="drawer-fact-label">ORIGINAL COST</span>
                <span className="drawer-fact-value font-mono">
                  {project.original_cost != null ? `₹${project.original_cost.toLocaleString()} Cr` : "—"}
                </span>
              </div>
              <div className="drawer-fact-cell">
                <span className="drawer-fact-label">REVISED COST</span>
                <span className="drawer-fact-value font-mono">
                  {project.revised_cost != null ? `₹${project.revised_cost.toLocaleString()} Cr` : "—"}
                </span>
              </div>
              <div className="drawer-fact-cell">
                <span className="drawer-fact-label">EXPENDITURE</span>
                <span className="drawer-fact-value font-mono">
                  {project.cumulative_expenditure != null ? `₹${project.cumulative_expenditure.toLocaleString()} Cr` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Timeline */}
          <div className="drawer-section-block">
            <div className="drawer-section-header">
              <span className="drawer-section-title">SCHEDULE TIMELINE</span>
            </div>
            <div className="project-drawer-facts-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div className="drawer-fact-cell">
                <span className="drawer-fact-label">APPROVAL DATE</span>
                <span className="drawer-fact-value font-mono">{project.approval_date || "—"}</span>
              </div>
              <div className="drawer-fact-cell">
                <span className="drawer-fact-label">ORIGINAL COMPLETION</span>
                <span className="drawer-fact-value font-mono">{project.original_completion_date || "—"}</span>
              </div>
              <div className="drawer-fact-cell">
                <span className="drawer-fact-label">REVISED COMPLETION</span>
                <span className="drawer-fact-value font-mono">{project.revised_completion_date || "—"}</span>
              </div>
            </div>
          </div>

          {/* Risk Intelligence Evidence Section */}
          <div className="drawer-section-block" data-testid="drawer-risk-evidence-block">
            <div className="drawer-section-header">
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Activity size={14} className="text-emerald" />
                <span className="drawer-section-title">RISK INTELLIGENCE EVIDENCE</span>
              </div>
              <span className="drawer-target-pill font-mono">
                TARGET: target_effective_schedule_ext_3m
              </span>
            </div>

            {isRiskLoading ? (
              <div className="drawer-risk-loading font-mono">
                <span>Retrieving risk evaluation parameters...</span>
              </div>
            ) : isRiskError || !risk ? (
              <div className="drawer-risk-unavailable-box" data-testid="drawer-risk-unavailable">
                <div className="drawer-risk-unavail-header">
                  <AlertCircle size={15} />
                  <span>Risk evaluation unavailable for this project.</span>
                </div>
                <p className="drawer-risk-unavail-desc">
                  This project record is faithfully preserved from historical Flash Reports, but does not have an active calibrated risk inference in the operational serving cohort. No synthetic score or default probability is fabricated.
                </p>
              </div>
            ) : (
              <div className="drawer-risk-content" data-testid="drawer-risk-evaluated">
                <div className="drawer-risk-metrics-grid">
                  <div className="drawer-fact-cell">
                    <span className="drawer-fact-label">CALIBRATED PROBABILITY</span>
                    <span className="drawer-fact-value font-mono font-bold" style={{ color: "#1A3C2B", fontSize: "16px" }}>
                      {(risk.risk_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="drawer-fact-cell">
                    <span className="drawer-fact-label">RAW MODEL PROBABILITY</span>
                    <span className="drawer-fact-value font-mono">
                      {(risk.raw_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="drawer-fact-cell">
                    <span className="drawer-fact-label">EVALUATION REGIME</span>
                    <span className="drawer-fact-value font-mono" data-testid="drawer-risk-regime">
                      {risk.regime}
                    </span>
                  </div>
                  <div className="drawer-fact-cell">
                    <span className="drawer-fact-label">ACTIVE MODEL ID</span>
                    <span className="drawer-fact-value font-mono" style={{ fontSize: "10px" }}>
                      {risk.model_id}
                    </span>
                  </div>
                </div>

                <div className="drawer-risk-meta-row font-mono">
                  <span>CYCLE: {risk.report_month}</span>
                  <span>POPULATION RANK: #{risk.risk_rank} OF {risk.population_size}</span>
                  <span>CALIBRATION: {risk.calibration_active ? "ISOTONIC ACTIVE" : "STANDARD"}</span>
                </div>

                {/* Recent Changes (if observed) */}
                {recentChanges && (
                  <div className="drawer-recent-changes-box">
                    <span className="drawer-changes-title font-mono">OBSERVED TRAJECTORY SHIFTS:</span>
                    <div className="drawer-changes-pills font-mono">
                      <span className="change-pill">
                        Progress Delta: {recentChanges.physical_progress_delta != null ? `${recentChanges.physical_progress_delta > 0 ? "+" : ""}${recentChanges.physical_progress_delta}%` : "—"}
                      </span>
                      <span className="change-pill">
                        Expenditure Delta: {recentChanges.expenditure_delta != null ? `₹${recentChanges.expenditure_delta > 0 ? "+" : ""}${recentChanges.expenditure_delta.toLocaleString()} Cr` : "—"}
                      </span>
                      <span className="change-pill">
                        Revised Cost Delta: {recentChanges.revised_cost_delta != null ? `₹${recentChanges.revised_cost_delta > 0 ? "+" : ""}${recentChanges.revised_cost_delta.toLocaleString()} Cr` : "—"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Specification-only unserved domains disclosure */}
                <div className="drawer-unserved-domains-notice font-mono">
                  <span>UNSERVED TARGETS (SPECIFICATION ONLY):</span>
                  <div className="unserved-tags">
                    <span className="unserved-tag">cost_overrun: NOT SERVED</span>
                    <span className="unserved-tag">progress_stagnation: NOT SERVED</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Source Provenance Info */}
          <div className="drawer-provenance-box">
            <div className="drawer-provenance-title">
              <ShieldCheck size={14} color="#1A3C2B" />
              <span>CANONICAL SOURCE PROVENANCE</span>
            </div>
            <div className="drawer-provenance-row font-mono">
              <span>REPORT MONTH:</span>
              <strong>{project.report_month || "PAIMANA_FLASH_REPORT"}</strong>
            </div>
            <div className="drawer-provenance-row font-mono">
              <span>CANONICAL ID:</span>
              <strong>{project.project_code}</strong>
            </div>
            <div className="drawer-provenance-row font-mono">
              <span>EXTRACTION PIPELINE:</span>
              <strong>TABLE6_CANONICAL_VERIFIED</strong>
            </div>
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div className="project-drawer-footer">
          <div className="drawer-actions-stack">
            <Link
              to={`/projects/${encodedCode}`}
              className="project-drawer-detail-link"
              onClick={onClose}
              title="Open full longitudinal project history"
            >
              <span>OPEN FULL LONGITUDINAL ANALYSIS</span>
              <ArrowUpRight size={16} />
            </Link>

            <Link
              to={`/intelligence?project=${encodedCode}`}
              className="project-drawer-intel-link font-mono"
              onClick={onClose}
              title="Inspect detailed risk drivers in Intelligence Terminal"
            >
              <ShieldAlert size={14} />
              <span>OPEN RISK INVESTIGATION →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
