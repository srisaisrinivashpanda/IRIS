/**
 * Analytics Risk Intelligence (PR-13)
 * Truthful, governance-faithful decision support for production schedule-extension risk.
 * Strictly adheres to Correction 3: Dynamic regime/model display, separation of
 * calibrated vs raw probability, explicit unserved domains, and deep navigation.
 */

import React from "react";
import { Link } from "react-router-dom";
import type { RiskAnalyticsResponse, ScoreDistribution } from "@/types/analytics.ts";

interface AnalyticsRiskIntelligenceProps {
  risk?: RiskAnalyticsResponse;
  selectedRegime?: string | null;
  activeProjectCode?: string | null;
  onSelectRegime?: (regime: string | null) => void;
  isLoading?: boolean;
}

const renderQuantiles = (dist: ScoreDistribution | null | undefined, label: string, testId: string) => {
  if (!dist) {
    return (
      <div className="risk-dist-box" data-testid={testId}>
        <div className="dist-label font-mono">{label}</div>
        <div className="dist-unavailable text-muted text-xs">Distribution data unavailable.</div>
      </div>
    );
  }

  return (
    <div className="risk-dist-box" data-testid={testId}>
      <div className="dist-label font-mono">{label}</div>
      <div className="dist-grid">
        <div className="dist-cell">
          <span className="cell-name">Median (P50)</span>
          <span className="cell-val font-mono">{(dist.median * 100).toFixed(1)}%</span>
        </div>
        <div className="dist-cell">
          <span className="cell-name">Mean</span>
          <span className="cell-val font-mono">{(dist.mean * 100).toFixed(1)}%</span>
        </div>
        <div className="dist-cell">
          <span className="cell-name">P25 → P75</span>
          <span className="cell-val font-mono">
            {(dist.p25 * 100).toFixed(1)}% → {(dist.p75 * 100).toFixed(1)}%
          </span>
        </div>
        <div className="dist-cell">
          <span className="cell-name">P90</span>
          <span className="cell-val font-mono">{(dist.p90 * 100).toFixed(1)}%</span>
        </div>
        <div className="dist-cell">
          <span className="cell-name">Min → Max</span>
          <span className="cell-val font-mono">
            {(dist.minimum * 100).toFixed(1)}% → {(dist.maximum * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsRiskIntelligence: React.FC<AnalyticsRiskIntelligenceProps> = ({
  risk,
  selectedRegime,
  activeProjectCode,
  onSelectRegime,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="analytics-intel-card" data-testid="risk-intelligence-loading">
        <div className="analytics-skeleton-line" />
        <div className="analytics-skeleton-line short" />
      </div>
    );
  }

  const targetLabel = risk?.target_label ?? "PRODUCTION SCHEDULE-EXTENSION RISK";
  const targetId = risk?.target ?? "target_effective_schedule_ext_3m";
  const regimes = risk?.regime_breakdown ?? [];
  const unservedTargets = risk?.unserved_targets ?? ["cost_overrun", "progress_stagnation"];
  const governanceNotice =
    risk?.governance_notice ??
    "Risk statistics represent model-estimated probability of 3-month schedule extension for active projects under production regime models. Unserved targets (cost overrun, progress stagnation) are unavailable. Denominator represents authentic risk-serving records.";

  return (
    <div className="analytics-intel-card" data-testid="analytics-risk-intelligence">
      <div className="analytics-intel-card-header">
        <div className="analytics-intel-title-row">
          <span className="analytics-intel-badge risk">DECISION SUPPORT & RISK SERVING</span>
          <h4 className="analytics-intel-card-title">{targetLabel}</h4>
        </div>
        <div className="analytics-intel-target-chip font-mono" data-testid="served-target-chip">
          Operational Horizon: 3-Month Schedule Extension
        </div>
      </div>

      <div className="analytics-intel-risk-grid">
        {/* Left: Continuous Probability Distributions (Calibrated vs Raw) */}
        <div className="risk-intel-column" data-testid="risk-distributions-column">
          <div className="column-header">
            <span className="column-title">CONTINUOUS PROBABILITY DISTRIBUTIONS</span>
            <span className="column-subtitle text-muted text-xs">
              Calibrated and raw model outputs are segregated; no arbitrary risk tiers or TOP-X% labels.
            </span>
          </div>

          <div className="risk-distributions-wrapper">
            {renderQuantiles(
              risk?.calibrated_risk_distribution,
              "CALIBRATED RISK PROBABILITY (POPULATION QUANTILES)",
              "calibrated-probability-distribution"
            )}
            {renderQuantiles(
              risk?.raw_probability_distribution,
              "RAW MODEL PROBABILITY (PRE-CALIBRATION QUANTILES)",
              "raw-probability-distribution"
            )}
          </div>
        </div>

        {/* Right: Dynamic Serving Regimes & Investigation Links */}
        <div className="risk-intel-column" data-testid="risk-regimes-column">
          <div className="column-header">
            <span className="column-title">ACTIVE SERVING REGIMES & NAVIGATION</span>
            <span className="column-subtitle text-muted text-xs">
              Governance metadata derived dynamically from serving contracts.
            </span>
          </div>

          {/* Dynamic Regimes List (Correction 3: never hard-coded) */}
          <div className="dynamic-regimes-card" data-testid="dynamic-regimes-card">
            <span className="regimes-title">SERVING REGIMES IN CURRENT SCOPE:</span>
            {regimes.length > 0 ? (
              <div className="regimes-pill-list" data-testid="dynamic-regimes-list">
                {regimes.map((r) => {
                  const isSelected = selectedRegime === r.regime;
                  return (
                    <button
                      key={`${r.regime}-${r.model_id}`}
                      type="button"
                      className={`regime-interactive-pill ${isSelected ? "selected" : ""}`}
                      onClick={() => onSelectRegime?.(isSelected ? null : r.regime)}
                      title={`Filter by regime ${r.regime}`}
                      data-testid={`regime-pill-${r.regime}`}
                    >
                      <span className="regime-name font-mono">{r.regime}</span>
                      <span className="regime-count font-mono">{r.unique_project_count.toLocaleString()} projects</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="analytics-intel-empty-hint text-muted" data-testid="regimes-unavailable">
                No active regime records returned for this scope.
              </div>
            )}
          </div>

          {/* Unserved ML Domains Disclosure */}
          <div className="unserved-targets-card" data-testid="unserved-targets-card">
            <span className="unserved-title">UNSERVED ML TARGET DOMAINS:</span>
            <div className="unserved-chips">
              {unservedTargets.map((ut) => (
                <span key={ut} className="unserved-chip font-mono" data-testid={`unserved-target-${ut}`}>
                  {ut}: UNSERVED / SPECIFICATION ONLY
                </span>
              ))}
            </div>
            <p className="unserved-desc text-muted text-xs">
              Cost overrun and physical progress stagnation are not served by production ML models.
              No artificial scores or warning classifications are manufactured.
            </p>
          </div>

          {/* Deep Navigation Action Panel */}
          <div className="risk-navigation-actions" data-testid="risk-navigation-actions">
            <span className="actions-title">DECISION SUPPORT & INVESTIGATION:</span>
            <div className="actions-button-row">
              <Link
                to="/intelligence"
                className="intel-action-btn primary"
                data-testid="link-intelligence-terminal"
              >
                OPEN INTELLIGENCE TERMINAL →
              </Link>
              {activeProjectCode && (
                <>
                  <Link
                    to={`/projects/${encodeURIComponent(activeProjectCode)}`}
                    className="intel-action-btn secondary"
                    data-testid="link-project-detail"
                  >
                    INSPECT PROJECT {activeProjectCode} →
                  </Link>
                  <Link
                    to={`/intelligence?project=${encodeURIComponent(activeProjectCode)}`}
                    className="intel-action-btn tertiary"
                    data-testid="link-project-intel"
                  >
                    PROJECT RISK INTEL →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-intel-governance-footer text-muted text-xs" data-testid="risk-governance-notice">
        <strong>Governance Notice:</strong> {governanceNotice}
      </div>
    </div>
  );
};
