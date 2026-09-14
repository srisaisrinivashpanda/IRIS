/**
 * Analytics Evidence & Limitations (PR-13)
 * Truthful, institutional disclosure of analytical boundaries, non-causality,
 * structural omissions, and evidence-backed next steps for decision support.
 */

import React from "react";
import { Link } from "react-router-dom";

interface AnalyticsEvidenceAndLimitationsProps {
  onExpandTimeWindow?: () => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export const AnalyticsEvidenceAndLimitations: React.FC<AnalyticsEvidenceAndLimitationsProps> = ({
  onExpandTimeWindow,
  hasActiveFilters = false,
  onClearFilters,
}) => {
  return (
    <div className="analytics-intel-card limitations-card" data-testid="analytics-evidence-and-limitations">
      <div className="analytics-intel-card-header">
        <span className="analytics-intel-badge warning">METHODOLOGICAL DISCLOSURES</span>
        <h4 className="analytics-intel-card-title">Evidence Boundaries & Analytical Limitations</h4>
      </div>

      <div className="limitations-grid">
        {/* Core Methodological Principles */}
        <div className="limitations-column">
          <div className="limitations-item" data-testid="limitation-observational">
            <span className="limitation-title">1. Observational Analytics & Non-Causality</span>
            <p className="limitation-body">
              All metrics and aggregates represent observational historical reporting from MoSPI Flash Report tables.
              Correlations or simultaneous movements do not establish causality, blame, or future project outcomes.
            </p>
          </div>

          <div className="limitations-item" data-testid="limitation-coverage-distinct">
            <span className="limitation-title">2. Observation vs. Risk Evaluation Scope</span>
            <p className="limitation-body">
              Portfolio observation coverage includes all reported project-months, whereas machine-learning risk evaluation
              is restricted to projects meeting rigorous feature qualification standards under locked serving models.
              Denominators must never be combined into artificial coverage rates.
            </p>
          </div>

          <div className="limitations-item" data-testid="limitation-unserved-domains">
            <span className="limitation-title">3. Single Served Machine Learning Target</span>
            <p className="limitation-body">
              The only operational ML target is 3-month forward schedule extension (under production model serving).
              Cost overrun and physical progress stagnation are unserved specification targets. No composite "AI risk score" exists.
            </p>
          </div>
        </div>

        {/* Structural Omissions & Data Integrity */}
        <div className="limitations-column">
          <div className="limitations-item" data-testid="limitation-district-omission">
            <span className="limitation-title">4. Structural District Omission</span>
            <p className="limitation-body">
              District-level geography is structurally omitted from source flash reports. Spatial distributions are reported
              strictly at the state level; no synthetic district attribution is manufactured.
            </p>
          </div>

          <div className="limitations-item" data-testid="limitation-non-imputation">
            <span className="limitation-title">5. Non-Imputation of Missing Observations</span>
            <p className="limitation-body">
              Missing values (such as unrecorded physical progress or revised cost) are excluded from mathematical denominators
              rather than coerced to zero. Missingness reflects source reporting reality.
            </p>
          </div>

          <div className="limitations-item" data-testid="limitation-decision-support">
            <span className="limitation-title">6. Evidence-Backed Decision Support Steps</span>
            <p className="limitation-body">
              Analytical decisions should be grounded in corroborated project records:
            </p>
            <ul className="decision-support-steps">
              <li>
                Inspect specific projects in the{" "}
                <Link to="/intelligence" className="text-link">
                  Intelligence Terminal
                </Link>{" "}
                to audit signed TreeSHAP/margin contributors.
              </li>
              <li>
                Cross-reference high cumulative expenditure executing agencies with physical progress delivery.
              </li>
              {hasActiveFilters && (
                <li>
                  <button type="button" className="btn-inline-link" onClick={onClearFilters}>
                    Reset active filters
                  </button>{" "}
                  to verify full portfolio-wide baseline distributions.
                </li>
              )}
              {onExpandTimeWindow && (
                <li>
                  <button type="button" className="btn-inline-link" onClick={onExpandTimeWindow}>
                    Expand observation window
                  </button>{" "}
                  if current temporal trend has sparse or single observations.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
