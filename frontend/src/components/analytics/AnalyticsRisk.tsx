import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { RiskAnalyticsResponse, ScoreDistribution } from "@/types/analytics.ts";
import { IrisChartTooltip, type IrisTooltipItem } from "@/components/common/charts/IrisChartTooltip.tsx";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner.tsx";
import { AlertTriangle, ShieldCheck, Info, Table as TableIcon } from "lucide-react";

interface AnalyticsRiskProps {
  data?: RiskAnalyticsResponse;
  selectedRegime?: string | null;
  onSelectRegime: (regime: string | null) => void;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const AnalyticsRisk: React.FC<AnalyticsRiskProps> = ({
  data,
  selectedRegime,
  onSelectRegime,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  const [showTable, setShowTable] = useState(false);

  if (isLoading) {
    return (
      <div className="analytics-section-card">
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <LoadingSpinner size="md" label="AGGREGATING PRODUCTION SCHEDULE RISK..." />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="analytics-section-card">
        <div className="analytics-section-error" role="alert">
          <AlertTriangle size={18} className="analytics-filter-error-icon" />
          <div className="analytics-section-error-content">
            <span className="analytics-section-error-title">Failed to load risk analytics</span>
            <span className="analytics-section-error-desc">
              {error?.message || "An error occurred while fetching risk serving metrics."}
            </span>
          </div>
          {onRetry && (
            <button type="button" className="analytics-retry-button" onClick={onRetry}>
              RETRY
            </button>
          )}
        </div>
      </div>
    );
  }

  const assessedCount = data?.assessed_project_count ?? 0;
  const isRiskUnavailable = !data || assessedCount === 0;

  if (isRiskUnavailable) {
    return (
      <div className="analytics-section-card" data-testid="analytics-risk-section">
        <div className="analytics-card-header">
          <div className="analytics-card-title-lockup">
            <span className="analytics-eyebrow">PRODUCTION RISK SERVING</span>
            <h2 className="analytics-card-title">07. PRODUCTION SCHEDULE-EXTENSION RISK</h2>
          </div>
        </div>
        <div className="analytics-empty-state" role="status" data-testid="risk-empty-state">
          <span className="analytics-empty-text">
            No served risk assessments for this selection.
          </span>
          <span className="analytics-empty-subtext">
            No projects in the active scope have model-evaluated risk scores for target_effective_schedule_ext_3m.
          </span>
        </div>
      </div>
    );
  }

  const calDist = data.calibrated_risk_distribution;
  const rawDist = data.raw_probability_distribution;
  const monthlyTrends = data.monthly_trend || [];
  const regimeBreakdown = data.regime_breakdown || [];

  // Derive unique regime options dynamically from response
  const dynamicRegimes = Array.from(new Set(regimeBreakdown.map((r) => r.regime)));

  const chartData = monthlyTrends.map((t) => ({
    month: t.evaluation_month,
    projects: t.assessed_project_count,
    calibratedRisk: t.mean_risk_probability != null ? Number((t.mean_risk_probability * 100).toFixed(1)) : null,
    rawRisk: t.mean_raw_probability != null ? Number((t.mean_raw_probability * 100).toFixed(1)) : null,
  }));

  const formatTooltip = (payload: unknown): IrisTooltipItem[] => {
    const list = payload as Array<{ dataKey?: string; value: number | null; name?: string; color?: string }>;
    if (!list) return [];
    return list
      .filter((entry) => entry.value != null)
      .map((entry) => {
        let labelName = entry.name || entry.dataKey || "Metric";
        let formattedValue = `${entry.value}`;
        if (entry.dataKey === "calibratedRisk") {
          labelName = "CALIBRATED RISK PROBABILITY";
          formattedValue = `${entry.value}%`;
        } else if (entry.dataKey === "rawRisk") {
          labelName = "RAW MODEL PROBABILITY";
          formattedValue = `${entry.value}%`;
        } else if (entry.dataKey === "projects") {
          labelName = "ASSESSED PROJECTS";
          formattedValue = `${Number(entry.value).toLocaleString()}`;
        }
        return {
          label: labelName.toUpperCase(),
          value: formattedValue,
          color: entry.color,
        };
      });
  };

  const renderQuantileStrip = (title: string, dist: ScoreDistribution | null, isCalibrated: boolean) => {
    if (!dist) return null;
    return (
      <div className="analytics-quantiles-box" data-testid={isCalibrated ? "risk-calibrated-quantiles" : "risk-raw-quantiles"}>
        <div className="analytics-quantiles-header">
          <span className="analytics-quantiles-title">{title}</span>
          <span className="analytics-quantiles-tag">
            {isCalibrated ? "OPERATIONAL CALIBRATED PROBABILITY" : "UNCALIBRATED RAW MARGIN"}
          </span>
        </div>
        <div className="analytics-quantiles-strip">
          <div className="analytics-quantile-item">
            <span className="analytics-quantile-label">MIN</span>
            <span className="analytics-quantile-val">{(dist.minimum * 100).toFixed(1)}%</span>
          </div>
          <div className="analytics-quantile-item">
            <span className="analytics-quantile-label">P25</span>
            <span className="analytics-quantile-val">{(dist.p25 * 100).toFixed(1)}%</span>
          </div>
          <div className="analytics-quantile-item highlight">
            <span className="analytics-quantile-label">MEDIAN (P50)</span>
            <span className="analytics-quantile-val">{(dist.median * 100).toFixed(1)}%</span>
          </div>
          <div className="analytics-quantile-item">
            <span className="analytics-quantile-label">P75</span>
            <span className="analytics-quantile-val">{(dist.p75 * 100).toFixed(1)}%</span>
          </div>
          <div className="analytics-quantile-item">
            <span className="analytics-quantile-label">P90</span>
            <span className="analytics-quantile-val">{(dist.p90 * 100).toFixed(1)}%</span>
          </div>
          <div className="analytics-quantile-item">
            <span className="analytics-quantile-label">P95</span>
            <span className="analytics-quantile-val">{(dist.p95 * 100).toFixed(1)}%</span>
          </div>
          <div className="analytics-quantile-item">
            <span className="analytics-quantile-label">MAX</span>
            <span className="analytics-quantile-val">{(dist.maximum * 100).toFixed(1)}%</span>
          </div>
          <div className="analytics-quantile-item">
            <span className="analytics-quantile-label">MEAN</span>
            <span className="analytics-quantile-val">{(dist.mean * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-section-card" data-testid="analytics-risk-section">
      <div className="analytics-card-header">
        <div className="analytics-card-title-lockup">
          <span className="analytics-eyebrow">PRODUCTION RISK SERVING</span>
          <h2 className="analytics-card-title">07. PRODUCTION SCHEDULE-EXTENSION RISK</h2>
        </div>

        <div className="analytics-view-controls">
          {/* Risk-Specific Regime Filter */}
          {dynamicRegimes.length > 0 && (
            <div className="analytics-filter-select-wrapper" style={{ minWidth: "160px" }}>
              <label htmlFor="risk-regime-filter" className="sr-only">
                Filter by Model Regime
              </label>
              <select
                id="risk-regime-filter"
                aria-label="Filter by Model Regime"
                className="analytics-filter-select"
                value={selectedRegime || ""}
                onChange={(e) => onSelectRegime(e.target.value || null)}
              >
                <option value="">ALL REGIMES</option>
                {dynamicRegimes.map((r) => (
                  <option key={r} value={r}>
                    REGIME: {r}
                  </option>
                ))}
              </select>
              <span className="analytics-filter-icon" aria-hidden="true">▼</span>
            </div>
          )}

          <button
            type="button"
            className="analytics-btn-icon"
            onClick={() => setShowTable(!showTable)}
            aria-label={showTable ? "Switch to chart view" : "Switch to accessible table view"}
            title={showTable ? "View Chart" : "View Data Table"}
          >
            <TableIcon size={14} />
          </button>
        </div>
      </div>

      <div className="analytics-disclaimer-strip">
        <ShieldCheck size={12} className="analytics-disclaimer-icon" />
        <span>
          TARGET: <strong>{data.target}</strong> ({data.target_label}). {data.governance_notice}
        </span>
      </div>

      {/* Scope Telemetry Cards */}
      <div className="analytics-risk-scope-strip">
        <div className="analytics-risk-scope-item">
          <span className="analytics-risk-scope-label">ASSESSED PROJECTS</span>
          <span className="analytics-risk-scope-val">{assessedCount.toLocaleString()}</span>
        </div>
        <div className="analytics-risk-scope-item">
          <span className="analytics-risk-scope-label">ASSESSED OBSERVATIONS</span>
          <span className="analytics-risk-scope-val">
            {data.assessed_observation_count != null ? data.assessed_observation_count.toLocaleString() : "—"}
          </span>
        </div>
        <div className="analytics-risk-scope-item">
          <span className="analytics-risk-scope-label">EVALUATION WINDOW</span>
          <span className="analytics-risk-scope-val">
            {data.evaluation_earliest_month && data.evaluation_latest_month
              ? `${data.evaluation_earliest_month} → ${data.evaluation_latest_month}`
              : "—"}
          </span>
        </div>
        <div className="analytics-risk-scope-item">
          <span className="analytics-risk-scope-label">ACTIVE FILTERED REGIME</span>
          <span className="analytics-risk-scope-val">{selectedRegime || "ALL REGIMES"}</span>
        </div>
      </div>

      {/* Quantiles for Calibrated and Raw Distributions */}
      {renderQuantileStrip("CALIBRATED RISK PROBABILITY DISTRIBUTION", calDist, true)}
      {renderQuantileStrip("RAW MODEL PROBABILITY DISTRIBUTION", rawDist, false)}

      {/* Monthly Trend Visualization */}
      <div className="analytics-sub-block">
        <h4 className="analytics-subheading">EVALUATION MONTH TRAJECTORY</h4>
        <div className="analytics-subheading-note">
          Chronological progression across authentic evaluation months. Calibrated and raw probability are shown distinctly.
        </div>

        {showTable ? (
          <div className="analytics-accessible-table-wrapper">
            <table className="analytics-data-table" aria-label="Risk Monthly Trend Table">
              <thead>
                <tr>
                  <th scope="col">EVALUATION MONTH</th>
                  <th scope="col">ASSESSED PROJECTS</th>
                  <th scope="col">CALIBRATED RISK MEAN (%)</th>
                  <th scope="col">RAW PROBABILITY MEAN (%)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrends.map((row) => (
                  <tr key={row.evaluation_month}>
                    <td className="monospace font-bold">{row.evaluation_month}</td>
                    <td>{row.assessed_project_count.toLocaleString()}</td>
                    <td>{row.mean_risk_probability != null ? `${(row.mean_risk_probability * 100).toFixed(1)}%` : "—"}</td>
                    <td>{row.mean_raw_probability != null ? `${(row.mean_raw_probability * 100).toFixed(1)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="analytics-chart-container" style={{ minWidth: 0, height: 280, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={chartData} margin={{ top: 12, right: 24, left: 16, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e3df" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#5f5e5c"
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#5f5e5c"
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<IrisChartTooltip titlePrefix="EVAL MONTH" customFormatter={formatTooltip} />} />
                <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "11px", fontFamily: "var(--font-mono)" }} />
                <Line
                  type="monotone"
                  dataKey="calibratedRisk"
                  name="Calibrated Risk Probability (%)"
                  stroke="#ba1a1a"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#ba1a1a" }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="rawRisk"
                  name="Raw Model Probability (%)"
                  stroke="#b45309"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: "#b45309" }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Model & Regime Breakdown */}
      {regimeBreakdown.length > 0 && (
        <div className="analytics-sub-block">
          <h4 className="analytics-subheading">GOVERNED REGIME & MODEL BREAKDOWN</h4>
          <div className="analytics-accessible-table-wrapper">
            <table className="analytics-data-table" aria-label="Governed Regime Breakdown Table">
              <thead>
                <tr>
                  <th scope="col">REGIME</th>
                  <th scope="col">MODEL ID</th>
                  <th scope="col">UNIQUE PROJECTS</th>
                  <th scope="col">OBSERVATIONS</th>
                  <th scope="col">CALIBRATION ACTIVE</th>
                </tr>
              </thead>
              <tbody>
                {regimeBreakdown.map((r) => (
                  <tr key={`${r.regime}-${r.model_id}`}>
                    <td className="monospace font-bold">{r.regime}</td>
                    <td className="monospace">{r.model_id}</td>
                    <td>{r.unique_project_count.toLocaleString()}</td>
                    <td>{r.observation_count.toLocaleString()}</td>
                    <td>{r.calibration_active_count > 0 ? "ACTIVE" : "NO"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unserved ML Domains Disclosure */}
      {data.unserved_targets && data.unserved_targets.length > 0 && (
        <div className="analytics-unserved-banner">
          <Info size={14} className="analytics-unserved-icon" />
          <div className="analytics-unserved-content">
            <span className="analytics-unserved-title">UNSERVED ML PREDICTIVE TARGETS</span>
            <span className="analytics-unserved-desc">
              The following targets are not deployed or served:{" "}
              {data.unserved_targets.map((t) => t.toUpperCase()).join(", ")}.
              IRIS strictly serves authentic schedule-extension risk and does not fabricate cost-overrun or progress-stagnation predictions.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
