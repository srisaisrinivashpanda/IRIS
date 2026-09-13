import React from "react";
import type {
  ProjectIntelligenceRisk,
  ProjectIntelligenceModelGovernance,
  ProjectRiskDrivers,
  ProjectDataAvailability,
} from "@/types/project.ts";
import { IntelligenceDriverSummary } from "./IntelligenceDriverSummary.tsx";
import { IntelligenceDriverDetail } from "./IntelligenceDriverDetail.tsx";
import { IntelligenceModelEvidence } from "./IntelligenceModelEvidence.tsx";
import { ShieldCheck, Info } from "lucide-react";

interface IntelligenceExplainabilityProps {
  risk: ProjectIntelligenceRisk | null;
  model: ProjectIntelligenceModelGovernance | null;
  drivers: ProjectRiskDrivers;
  dataAvailability?: ProjectDataAvailability;
}

export const IntelligenceExplainability: React.FC<IntelligenceExplainabilityProps> = ({
  risk,
  model,
  drivers,
  dataAvailability,
}) => {
  const hasRisk = Boolean(risk);
  const topPos = drivers?.top_positive ?? [];
  const topNeg = drivers?.top_negative ?? [];
  const strongest = drivers?.strongest_drivers ?? [];
  const hasDrivers = topPos.length > 0 || topNeg.length > 0 || strongest.length > 0;

  return (
    <section
      className="terminal-explainability-section"
      aria-labelledby="explainability-heading"
    >
      {/* Section Header */}
      <div className="terminal-section-banner">
        <div className="banner-title-wrap">
          <div className="terminal-badge-eyebrow">
            <ShieldCheck size={13} aria-hidden="true" />
            <span>MODEL INTERPRETABILITY & MARGIN DECOMPOSITION</span>
          </div>
          <h3 id="explainability-heading" className="terminal-section-heading">
            RISK EXPLAINABILITY & DRIVER ANALYSIS
          </h3>
          <p className="terminal-section-sub">
            Operational evidence breakdown for production schedule-extension risk in raw model margin space.
            Signed contributions describe model decision shifts, not causal real-world mechanisms.
          </p>
        </div>

        <div className="banner-badges">
          <span className="terminal-badge regime">
            TARGET: target_effective_schedule_ext_3m
          </span>
          <span className="terminal-badge-muted monospace">
            LOGIT MARGIN SPACE
          </span>
        </div>
      </div>

      {/* Area A: Driver Summary */}
      <IntelligenceDriverSummary drivers={drivers} risk={risk} />

      {/* Area B: Driver Detail & Decomposition */}
      {hasRisk && hasDrivers ? (
        <IntelligenceDriverDetail drivers={drivers} />
      ) : hasRisk ? (
        <div className="terminal-card" role="region" aria-label="Driver Detail Unavailable">
          <div className="terminal-card-header">
            <div className="terminal-card-title-lockup">
              <span className="terminal-section-eyebrow">FEATURE CONTRIBUTIONS</span>
              <h3 className="terminal-card-title">DRIVER DETAIL & DECOMPOSITION</h3>
            </div>
            <span className="terminal-badge-muted monospace">0 DRIVERS</span>
          </div>
          <div className="terminal-empty-text monospace">
            NO MODEL DRIVER EVIDENCE AVAILABLE
          </div>
        </div>
      ) : null}

      {/* Area C: Model Evidence & Assessment Context */}
      <IntelligenceModelEvidence risk={risk} model={model} drivers={drivers} />

      {/* Area D: Explainability Limitations & Data Provenance */}
      <div className="terminal-card explainability-limitations" role="region" aria-label="Explainability Limitations and Governance">
        <div className="terminal-card-header">
          <div className="terminal-card-title-lockup">
            <span className="terminal-section-eyebrow">GOVERNANCE BOUNDARIES</span>
            <h4 className="terminal-card-title">EXPLAINABILITY LIMITATIONS & DATA PROVENANCE</h4>
          </div>
          <div className="limitations-badge monospace">
            <Info size={12} aria-hidden="true" />
            <span>AUTHENTIC ML CONSTRAINTS</span>
          </div>
        </div>

        <div className="limitations-grid">
          <div className="limitations-item">
            <span className="limitations-label">NON-CAUSAL INTERPRETATION</span>
            <p className="limitations-text">
              Signed model contributions represent linear or TreeSHAP margin shifts to the model logit.
              They indicate statistical association with the prediction, not real-world causality or intervention advice.
            </p>
          </div>

          <div className="limitations-item">
            <span className="limitations-label">TEMPORAL PROVENANCE</span>
            <p className="limitations-text">
              Explanations reflect data visible at evaluation month{" "}
              <strong className="monospace">{risk?.report_month ?? dataAvailability?.risk_report_month ?? "N/A"}</strong>.
              Contributions are never backfilled, forward-projected, or mixed across historical months.
            </p>
          </div>

          <div className="limitations-item">
            <span className="limitations-label">UNSERVED MODEL DOMAINS</span>
            <p className="limitations-text">
              Only schedule extension risk is served by production machine learning.
              Cost overrun and progress stagnation models are unserved; no driver evidence exists for those domains.
            </p>
          </div>

          <div className="limitations-item">
            <span className="limitations-label">CALIBRATION DISCIPLINE</span>
            <p className="limitations-text">
              {risk?.calibration_active
                ? "Platt calibration is active for this assessment. Operational ranking probability is calibrated while raw model decision score remains distinct."
                : "This assessment is uncalibrated. Raw model probability is displayed without manufactured calibration transformations."}
            </p>
          </div>
        </div>

        <div className="terminal-card-footnote">
          Signed contributions describe model evidence in margin/logit space; they do not establish causal relationships.
        </div>
      </div>
    </section>
  );
};
