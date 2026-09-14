import React from "react";
import { Info, ShieldCheck, AlertTriangle, HelpCircle } from "lucide-react";

export const DashboardEarlyWarningEvidence: React.FC = () => {
  return (
    <div className="dashboard-early-warning-evidence" aria-label="Early Warning Methodological Evidence and Limitations">
      <div className="evidence-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Info size={15} className="evidence-header-icon" aria-hidden="true" />
          <h4 className="evidence-title">EARLY WARNING METHODOLOGY & EVIDENCE BOUNDARIES</h4>
        </div>
        <span className="evidence-tag">AUDITABLE CONTRACT</span>
      </div>

      <div className="evidence-grid">
        <div className="evidence-item">
          <div className="evidence-item-header">
            <ShieldCheck size={14} className="text-emerald" aria-hidden="true" />
            <span className="evidence-item-label">PRODUCTION SERVED TARGET</span>
          </div>
          <p className="evidence-item-text">
            <strong>PRODUCTION SCHEDULE-EXTENSION RISK (HORIZON: 3 MONTHS)</strong> via{" "}
            <code>target_effective_schedule_ext_3m</code>. Evaluates empirical probability of project completion schedule extension within 3 months.
          </p>
        </div>

        <div className="evidence-item">
          <div className="evidence-item-header">
            <AlertTriangle size={14} className="text-amber" aria-hidden="true" />
            <span className="evidence-item-label">UNSERVED ML TARGETS</span>
          </div>
          <p className="evidence-item-text">
            <code>cost_overrun</code> and <code>progress_stagnation</code> remain{" "}
            <strong>UNSERVED / SPECIFICATION ONLY</strong>. No risk scores or alerts are fabricated for unserved target domains.
          </p>
        </div>

        <div className="evidence-item">
          <div className="evidence-item-header">
            <HelpCircle size={14} className="text-blue" aria-hidden="true" />
            <span className="evidence-item-label">NO ARBITRARY THRESHOLDS</span>
          </div>
          <p className="evidence-item-text">
            Investigation records are strictly ordered by backend <strong>risk rank</strong>. No arbitrary probability cutoff (e.g. &gt; 0.70) or fabricated categorization (LOW/MEDIUM/HIGH/CRITICAL) is applied.
          </p>
        </div>

        <div className="evidence-item">
          <div className="evidence-item-header">
            <Info size={14} className="text-purple" aria-hidden="true" />
            <span className="evidence-item-label">DIMENSIONAL AVAILABILITY</span>
          </div>
          <p className="evidence-item-text">
            State and Sector dimensions are available. <strong>District</strong> is structurally omitted in primary source Flash Reports and is disclosed as unavailable.
          </p>
        </div>
      </div>

      <div className="evidence-disclaimer">
        <span>
          MODEL EVIDENCE PRINCIPLE: Surfaced signals represent empirical observations and statistical associations from production model artifacts. They are not causal explanations or guarantees of future project failure.
        </span>
      </div>
    </div>
  );
};
