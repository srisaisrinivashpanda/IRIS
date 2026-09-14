import React from "react";
import { Link } from "react-router-dom";
import type { RiskAnalyticsResponse } from "@/types/analytics.ts";
import { DashboardCardSkeleton } from "./DashboardSkeleton.tsx";
import { DashboardErrorState } from "./DashboardErrorState.tsx";
import { ArrowUpRight } from "lucide-react";

interface DashboardRiskCommandProps {
  riskData?: RiskAnalyticsResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const DashboardRiskCommand: React.FC<DashboardRiskCommandProps> = ({
  riskData,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return <DashboardCardSkeleton height="340px" label="Loading production schedule-extension risk..." />;
  }

  if (isError || !riskData) {
    return (
      <DashboardErrorState
        title="Failed to load production risk analytics"
        message={error?.message || "Production risk serving data could not be retrieved."}
        onRetry={onRetry}
      />
    );
  }

  const calDist = riskData.calibrated_risk_distribution;
  const rawDist = riskData.raw_probability_distribution;

  const calP25 = calDist?.p25 != null ? (calDist.p25 * 100).toFixed(1) : "—";
  const calMedian = calDist?.median != null ? (calDist.median * 100).toFixed(1) : "—";
  const calP75 = calDist?.p75 != null ? (calDist.p75 * 100).toFixed(1) : "—";
  const calP90 = calDist?.p90 != null ? (calDist.p90 * 100).toFixed(1) : "—";
  const calMean = calDist?.mean != null ? (calDist.mean * 100).toFixed(1) : "—";
  const calMin = calDist?.minimum != null ? (calDist.minimum * 100).toFixed(1) : "—";
  const calMax = calDist?.maximum != null ? (calDist.maximum * 100).toFixed(1) : "—";

  const rawMean = rawDist?.mean != null ? (rawDist.mean * 100).toFixed(1) : "—";
  const rawMedian = rawDist?.median != null ? (rawDist.median * 100).toFixed(1) : "—";

  const regimes = riskData.regime_breakdown || [];
  const evalRange =
    riskData.evaluation_earliest_month && riskData.evaluation_latest_month
      ? `${riskData.evaluation_earliest_month} → ${riskData.evaluation_latest_month}`
      : riskData.evaluation_latest_month || "CURRENT";

  return (
    <section className="dashboard-section" aria-label="Production Schedule-Extension Risk Panel">
      <div className="dashboard-section-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 className="dashboard-section-title">PRODUCTION SCHEDULE-EXTENSION RISK</h2>
            <span className="dashboard-section-subtitle">
              TARGET: {riskData.target} · HORIZON: 3 MONTHS · N={riskData.assessed_project_count.toLocaleString()} ASSESSED
            </span>
          </div>
          <Link
            to="/intelligence"
            className="dashboard-section-link"
            aria-label="Navigate to Risk Intelligence for full explainability"
          >
            <span>DEEP RISK ANALYSIS</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="dashboard-grid-1-2">
        {/* Left Card: Calibrated Risk Distribution & Quantiles */}
        <div className="dashboard-card-white">
          <div className="card-header-lockup">
            <div>
              <span className="card-label">CALIBRATED RISK DISTRIBUTION</span>
              <p className="card-sublabel">
                Operational probability scale calibrated against empirical schedule extension events.
              </p>
            </div>
            <span className="card-tag-active">CALIBRATED</span>
          </div>

          {calDist ? (
            <div className="dashboard-quantile-layout">
              {/* Primary Quantile Highlights */}
              <div className="quantile-stat-strip">
                <div className="quantile-stat-box">
                  <span className="quantile-stat-label">P25 (Q1)</span>
                  <span className="quantile-stat-val">{calP25}%</span>
                </div>
                <div className="quantile-stat-box primary">
                  <span className="quantile-stat-label">MEDIAN (P50)</span>
                  <span className="quantile-stat-val highlighted">{calMedian}%</span>
                </div>
                <div className="quantile-stat-box">
                  <span className="quantile-stat-label">MEAN</span>
                  <span className="quantile-stat-val">{calMean}%</span>
                </div>
                <div className="quantile-stat-box alert">
                  <span className="quantile-stat-label">P75 (Q3)</span>
                  <span className="quantile-stat-val alert-text">{calP75}%</span>
                </div>
                <div className="quantile-stat-box alert">
                  <span className="quantile-stat-label">P90</span>
                  <span className="quantile-stat-val alert-text">{calP90}%</span>
                </div>
              </div>

              {/* Exact Horizontal Quantile Visual Range Track */}
              <div className="quantile-visual-track-container" aria-label="Quantile Range Visual Display">
                <div className="quantile-track-header">
                  <span>MIN: {calMin}%</span>
                  <span className="track-iqr-label">IQR: [{calP25}% — {calP75}%]</span>
                  <span>MAX: {calMax}%</span>
                </div>
                <div className="quantile-track-rail">
                  {calDist.p25 != null && calDist.p75 != null && (
                    <div
                      className="quantile-track-iqr-fill"
                      style={{
                        left: `${Math.max(0, Math.min(100, calDist.p25 * 100))}%`,
                        width: `${Math.max(2, Math.min(100, (calDist.p75 - calDist.p25) * 100))}%`,
                      }}
                      title={`Interquartile Range: ${calP25}% to ${calP75}%`}
                    />
                  )}
                  {calDist.median != null && (
                    <div
                      className="quantile-track-median-marker"
                      style={{
                        left: `${Math.max(0, Math.min(100, calDist.median * 100))}%`,
                      }}
                      title={`Median (P50): ${calMedian}%`}
                    />
                  )}
                </div>
              </div>

              {/* Empirical Quantile Table (Accessible Data Alternative) */}
              <div className="dashboard-table-wrap">
                <table className="dashboard-mini-table" aria-label="Empirical Risk Quantiles">
                  <thead>
                    <tr>
                      <th scope="col">STATISTIC</th>
                      <th scope="col">PERCENTILE</th>
                      <th scope="col" style={{ textAlign: "right" }}>CALIBRATED PROBABILITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Minimum Observed</td>
                      <td>0%</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{calMin}%</td>
                    </tr>
                    <tr>
                      <td>Lower Quartile (P25)</td>
                      <td>25%</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{calP25}%</td>
                    </tr>
                    <tr style={{ backgroundColor: "rgba(26, 60, 43, 0.05)" }}>
                      <td><strong>Median (P50)</strong></td>
                      <td>50%</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{calMedian}%</td>
                    </tr>
                    <tr>
                      <td>Upper Quartile (P75)</td>
                      <td>75%</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{calP75}%</td>
                    </tr>
                    <tr>
                      <td>P90 Percentile</td>
                      <td>90%</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{calP90}%</td>
                    </tr>
                    <tr>
                      <td>Maximum Observed</td>
                      <td>100%</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{calMax}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="dashboard-empty-card-text">
              No calibrated distribution data available for current evaluation scope.
            </div>
          )}
        </div>

        {/* Right Card: Model Architecture, Regime Breakdown, & Raw vs Calibrated Separation */}
        <div className="dashboard-card-paper">
          <div className="card-header-lockup">
            <span className="card-label">MODEL & SERVING REGIMES</span>
            <span className="card-tag-neutral">EVAL: {evalRange}</span>
          </div>

          <div className="dashboard-regime-info-stack">
            {/* Probability Separation Notice */}
            <div className="probability-separation-card" data-testid="probability-separation-notice">
              <div className="sep-header">
                <span className="sep-title">PROBABILITY CONTEXT SEPARATION</span>
              </div>
              <div className="sep-grid">
                <div className="sep-item">
                  <span className="sep-label">CALIBRATED PROBABILITY</span>
                  <span className="sep-val primary">MEAN {calMean}% · MED {calMedian}%</span>
                  <span className="sep-sub">Isotonic calibrated operational probability</span>
                </div>
                <div className="sep-item">
                  <span className="sep-label">RAW MODEL PROBABILITY</span>
                  <span className="sep-val muted">MEAN {rawMean}% · MED {rawMedian}%</span>
                  <span className="sep-sub">Uncalibrated raw machine-learning output</span>
                </div>
              </div>
            </div>

            {/* Serving Regimes Breakdown */}
            <div className="regime-list">
              <span className="regime-list-title">ACTIVE SERVING REGIMES</span>
              {regimes.map((r) => (
                <div key={r.regime} className="regime-row">
                  <div className="regime-row-left">
                    <span className="regime-name">{r.regime} REGIME</span>
                    <span className="regime-model-id">{r.model_id}</span>
                  </div>
                  <div className="regime-row-right">
                    <span className="regime-count">{r.unique_project_count.toLocaleString()} projects</span>
                    <span className="regime-status">
                      {r.calibration_active_count > 0 ? "CALIBRATED" : "RAW"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Governance Disclaimer */}
            <div className="dashboard-card-footnote">
              <p>
                {riskData.governance_notice ||
                  "Risk probabilities represent model-derived likelihood of schedule extension (H=3). Continuous scores are preserved without arbitrary risk categorization."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
