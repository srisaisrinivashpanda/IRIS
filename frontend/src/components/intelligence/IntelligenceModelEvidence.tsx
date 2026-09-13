import React from "react";
import type {
  ProjectIntelligenceRisk,
  ProjectIntelligenceModelGovernance,
  ProjectRiskDrivers,
} from "@/types/project.ts";

interface IntelligenceModelEvidenceProps {
  risk: ProjectIntelligenceRisk | null;
  model: ProjectIntelligenceModelGovernance | null;
  drivers?: ProjectRiskDrivers;
}

/**
 * Maps the authoritative model explanation method string into a human-readable,
 * strictly truthful display label without guessing or hardcoding across regimes.
 */
function formatExplanationMethod(method?: string | null): string {
  if (!method) return "UNAVAILABLE";
  if (method === "CATBOOST_NATIVE_TREESHAP") {
    return "CatBoost-native TreeSHAP";
  }
  if (method === "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE") {
    return "Logistic coefficient times transformed value";
  }
  return method;
}

export const IntelligenceModelEvidence: React.FC<IntelligenceModelEvidenceProps> = ({
  risk,
  model,
  drivers,
}) => {
  // Case 1: Unassessed project
  if (!risk) {
    return (
      <div className="terminal-card" role="region" aria-label="Model Evidence Unassessed">
        <div className="terminal-card-header">
          <div className="terminal-card-title-lockup">
            <span className="terminal-section-eyebrow">EVALUATION CONTEXT</span>
            <h3 className="terminal-card-title">MODEL EVIDENCE</h3>
          </div>
          <span className="terminal-badge unassessed">NOT ASSESSED</span>
        </div>
        <div className="terminal-empty-text monospace">
          Model driver evidence is unavailable because no production risk assessment is recorded for this project.
        </div>
      </div>
    );
  }

  const topPos = drivers?.top_positive ?? [];
  const topNeg = drivers?.top_negative ?? [];
  const strongestDrivers = drivers?.strongest_drivers ?? [];
  const totalDrivers = topPos.length + topNeg.length || strongestDrivers.length;

  const strongestPos = topPos.length > 0
    ? [...topPos].sort((a, b) => b.contribution - a.contribution).slice(0, 2)
    : strongestDrivers.filter((d) => d.contribution > 0).slice(0, 2);

  const strongestNeg = topNeg.length > 0
    ? [...topNeg].sort((a, b) => a.contribution - b.contribution).slice(0, 2)
    : strongestDrivers.filter((d) => d.contribution < 0).slice(0, 2);

  const operationalProbabilityPct = (risk.risk_probability * 100).toFixed(1);
  const rawProbabilityPct = (risk.raw_probability * 100).toFixed(1);
  const explanationMethodDisplay = formatExplanationMethod(model?.explanation_method);

  return (
    <div className="terminal-card" role="region" aria-label="Model Evidence and Assessment Context">
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">DECISION SUPPORT CONTEXT</span>
          <h3 className="terminal-card-title">MODEL EVIDENCE & ASSESSMENT CONTEXT</h3>
        </div>
        <div className="terminal-badge-group">
          <span className="terminal-badge regime">{risk.regime} REGIME</span>
          <span className={`terminal-badge ${risk.calibration_active ? "calibrated" : "raw"}`}>
            {risk.calibration_active ? "CALIBRATED OPERATIONAL" : "RAW PROBABILITY"}
          </span>
        </div>
      </div>

      <div className="terminal-evidence-grid">
        {/* Section 1: Current Assessment Probability */}
        <div className="terminal-evidence-cell">
          <span className="evidence-label">CURRENT ASSESSMENT</span>
          <div className="evidence-primary-value monospace">
            {operationalProbabilityPct}%
          </div>
          <span className="evidence-subtext monospace">
            {risk.calibration_active ? (
              <>
                <span>OPERATIONAL PROBABILITY (CALIBRATED)</span>
                <span className="evidence-raw-distinct">RAW SCORE: {rawProbabilityPct}%</span>
              </>
            ) : (
              <span>RAW MODEL PROBABILITY (UNCALIBRATED)</span>
            )}
          </span>
        </div>

        {/* Section 2: Model Evidence Overview */}
        <div className="terminal-evidence-cell">
          <span className="evidence-label">MODEL EVIDENCE COUNT</span>
          <div className="evidence-primary-value monospace">
            {totalDrivers}
          </div>
          <span className="evidence-subtext monospace">
            SIGNED DRIVER CONTRIBUTIONS AVAILABLE IN LOGIT SPACE
          </span>
        </div>

        {/* Section 3: Risk-Increasing Evidence */}
        <div className="terminal-evidence-cell">
          <span className="evidence-label">RISK-INCREASING EVIDENCE</span>
          {strongestPos.length > 0 ? (
            <ul className="evidence-drivers-list">
              {strongestPos.map((d, i) => (
                <li key={`ev-pos-${d.feature}-${i}`} className="evidence-driver-item positive monospace">
                  <span className="driver-name">
                    {`▸ ${d.display_name || d.feature}`}
                  </span>
                  <span className="driver-shift">(+{d.contribution.toFixed(3)} logit)</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="evidence-empty monospace">No positive contributors recorded</div>
          )}
        </div>

        {/* Section 4: Risk-Reducing Evidence */}
        <div className="terminal-evidence-cell">
          <span className="evidence-label">RISK-REDUCING EVIDENCE</span>
          {strongestNeg.length > 0 ? (
            <ul className="evidence-drivers-list">
              {strongestNeg.map((d, i) => (
                <li key={`ev-neg-${d.feature}-${i}`} className="evidence-driver-item negative monospace">
                  <span className="driver-name">
                    {`▸ ${d.display_name || d.feature}`}
                  </span>
                  <span className="driver-shift">({d.contribution.toFixed(3)} logit)</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="evidence-empty monospace">No negative contributors recorded</div>
          )}
        </div>
      </div>

      {/* Evaluation Context Strip */}
      <div className="terminal-evaluation-context-strip">
        <div className="context-item">
          <span className="context-label">MODEL IDENTIFIER:</span>
          <span className="context-value monospace">{model?.model_id || risk.model_id}</span>
        </div>
        <div className="context-item">
          <span className="context-label">MODEL REGIME:</span>
          <span className="context-value monospace">{risk.regime}</span>
        </div>
        <div className="context-item">
          <span className="context-label">EVALUATION MONTH:</span>
          <span className="context-value monospace">{risk.report_month}</span>
        </div>
        <div className="context-item">
          <span className="context-label">CALIBRATION STATE:</span>
          <span className="context-value monospace">
            {risk.calibration_active ? "ACTIVE (Platt scaling)" : "UNCALIBRATED / RAW"}
          </span>
        </div>
        <div className="context-item">
          <span className="context-label">EXPLANATION METHOD:</span>
          <span className="context-value monospace">{explanationMethodDisplay}</span>
        </div>
        <div className="context-item">
          <span className="context-label">PRODUCTION TARGET:</span>
          <span className="context-value monospace">{risk.target}</span>
        </div>
      </div>

      <div className="terminal-card-footnote">
        Signed contributions describe model evidence in margin/logit space; they do not establish causal relationships.
      </div>
    </div>
  );
};
