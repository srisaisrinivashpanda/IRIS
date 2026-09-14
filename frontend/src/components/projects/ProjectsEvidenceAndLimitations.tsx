/**
 * Projects Evidence & Limitations Component (PR-14)
 * Explicit methodological boundaries and analytical limitations for portfolio investigation.
 */

import React from "react";
import { ShieldAlert, Info, Database, AlertCircle } from "lucide-react";

export const ProjectsEvidenceAndLimitations: React.FC = () => {
  return (
    <section className="portfolio-evidence-section" aria-label="Evidence and Methodological Limitations">
      <div className="portfolio-evidence-header">
        <div className="evidence-header-left">
          <ShieldAlert size={16} className="text-emerald" />
          <h3 className="evidence-title">PORTFOLIO INVESTIGATION METHODOLOGY & CONTRACT BOUNDARIES</h3>
        </div>
        <span className="evidence-tag font-mono">GOVERNANCE LEVEL 1</span>
      </div>

      <div className="evidence-grid">
        <div className="evidence-item">
          <div className="evidence-item-title">
            <Info size={14} />
            <span>1. Observational Non-Causal Telemetry</span>
          </div>
          <p className="evidence-item-text">
            All project observations, expenditures, and progress reports reflect self-reported submissions under MoSPI Flash Reports. Observed delays and cost revisions represent historical reporting events, not proven causal blame or vendor culpability.
          </p>
        </div>

        <div className="evidence-item">
          <div className="evidence-item-title">
            <Database size={14} />
            <span>2. Observation Scope vs. Risk Evaluation Coverage</span>
          </div>
          <p className="evidence-item-text">
            Portfolio discovery spans the full multi-year Flash Report database ({`64,000+`} monthly records). However, active operational risk assessment is evaluated strictly on the latest locked cohort meeting feature requirements ({`4,000+`} projects). Denominators are deliberately kept distinct.
          </p>
        </div>

        <div className="evidence-item">
          <div className="evidence-item-title">
            <AlertCircle size={14} />
            <span>3. Single Served Machine Learning Target</span>
          </div>
          <p className="evidence-item-text">
            Only <code>target_effective_schedule_ext_3m</code> (3-month schedule extension risk) is served by operational ML models. Probabilities represent calibrated likelihood of extension beyond 90 days.
          </p>
        </div>

        <div className="evidence-item">
          <div className="evidence-item-title">
            <AlertCircle size={14} />
            <span>4. Unserved Specification Domains</span>
          </div>
          <p className="evidence-item-text">
            Cost overrun and progress stagnation models exist only in technical specification and are NOT operationally served. No synthetic cost risk scores or composite health indexes are fabricated.
          </p>
        </div>

        <div className="evidence-item">
          <div className="evidence-item-title">
            <Info size={14} />
            <span>5. Non-Imputation of Missing Observations</span>
          </div>
          <p className="evidence-item-text">
            Missing values in source records are strictly preserved as unobserved (<code>—</code>). Unreported physical progress is never treated as 0%, and projects without active risk assessments are transparently noted as unavailable.
          </p>
        </div>

        <div className="evidence-item">
          <div className="evidence-item-title">
            <Info size={14} />
            <span>6. Structural District Omission</span>
          </div>
          <p className="evidence-item-text">
            Flash Reports report state-level jurisdiction only. No sub-state or district taxonomy is fabricated or inferred from project descriptions.
          </p>
        </div>

        <div className="evidence-item">
          <div className="evidence-item-title">
            <Database size={14} />
            <span>7. Deterministic Column Sorting</span>
          </div>
          <p className="evidence-item-text">
            Sorting across the project portfolio operates deterministically on authoritative database fields. Client-side ranking does not invent proprietary risk tiers or synthetic urgency scores.
          </p>
        </div>
      </div>
    </section>
  );
};
