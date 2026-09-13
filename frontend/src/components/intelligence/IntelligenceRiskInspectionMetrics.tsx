import React from "react";
import type { ProjectRiskHistoryPoint } from "@/types/project.ts";

interface IntelligenceRiskInspectionMetricsProps {
  record: ProjectRiskHistoryPoint;
}

export const IntelligenceRiskInspectionMetrics: React.FC<IntelligenceRiskInspectionMetricsProps> = ({
  record,
}) => {
  const hasCalibrated = record.calibration_active && typeof record.risk_probability === "number";
  const hasRaw = typeof record.raw_probability === "number";
  const hasRank = typeof record.risk_rank === "number" && record.risk_rank > 0;
  const hasPercentile = typeof record.risk_percentile === "number";
  const hasPopulation = typeof record.population_size === "number" && record.population_size > 0;

  return (
    <div className="terminal-card inspection-metrics-card">
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">OBSERVED EVALUATION METRICS</span>
          <h4 className="terminal-card-title">HISTORICAL RISK & PORTFOLIO POSITION</h4>
        </div>
        <span className="terminal-badge-muted monospace">
          TARGET: target_effective_schedule_ext_3m
        </span>
      </div>

      <div className="terminal-inspection-metrics-grid">
        {/* Metric 1: Calibrated Risk Probability */}
        <div className="inspection-metric-box primary">
          <span className="inspection-metric-label">CALIBRATED OPERATIONAL RISK</span>
          <div className="inspection-metric-value monospace">
            {hasCalibrated ? (
              `${(record.risk_probability * 100).toFixed(1)}%`
            ) : record.calibration_active ? (
              <span className="muted">UNAVAILABLE</span>
            ) : (
              <span className="muted font-normal text-xs">RAW / UNCALIBRATED</span>
            )}
          </div>
          <span className="inspection-metric-subtext monospace">
            {record.calibration_active ? (
              hasCalibrated ? (
                "Operational probability (Platt-calibrated)"
              ) : (
                "Calibrated score unavailable"
              )
            ) : (
              "Evaluation origin was served uncalibrated"
            )}
          </span>
        </div>

        {/* Metric 2: Raw Model Probability */}
        <div className="inspection-metric-box">
          <span className="inspection-metric-label">RAW MODEL PROBABILITY</span>
          <div className="inspection-metric-value monospace muted">
            {hasRaw ? `${(record.raw_probability * 100).toFixed(1)}%` : "UNAVAILABLE"}
          </div>
          <span className="inspection-metric-subtext monospace">
            Pre-calibration unweighted model probability
          </span>
        </div>

        {/* Metric 3: Portfolio Rank */}
        <div className="inspection-metric-box">
          <span className="inspection-metric-label">PORTFOLIO RANK</span>
          <div className="inspection-metric-value monospace">
            {hasRank ? (
              <>
                #{record.risk_rank}
                {hasPopulation && (
                  <span className="inspection-metric-population">
                    {" "}/ {record.population_size.toLocaleString()}
                  </span>
                )}
              </>
            ) : (
              <span className="muted">UNAVAILABLE</span>
            )}
          </div>
          <span className="inspection-metric-subtext monospace">
            {hasRank && hasPopulation
              ? `Ranked within ${record.population_size.toLocaleString()} evaluated projects`
              : "Cross-sectional portfolio rank"}
          </span>
        </div>

        {/* Metric 4: Risk Percentile */}
        <div className="inspection-metric-box">
          <span className="inspection-metric-label">PERCENTILE</span>
          <div className="inspection-metric-value monospace">
            {hasPercentile ? `P${(record.risk_percentile * 100).toFixed(1)}` : "UNAVAILABLE"}
          </div>
          <span className="inspection-metric-subtext monospace">
            {hasPercentile
              ? `Exceeds ${(record.risk_percentile * 100).toFixed(1)}% of evaluated cohort`
              : "Normalized portfolio risk percentile"}
          </span>
        </div>
      </div>

      <div className="inspection-metrics-notice monospace text-xs">
        <span>* Operational risk probability and raw decision score are distinct serving fields; raw probabilities are never presented as calibrated.</span>
      </div>
    </div>
  );
};
