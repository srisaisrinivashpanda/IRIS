import React from "react";
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
import type { ProjectRiskHistoryPoint } from "@/types/project.ts";
import { IrisChartTooltip } from "@/components/common/charts/IrisChartTooltip.tsx";

interface IntelligenceRiskHistoryProps {
  history: ProjectRiskHistoryPoint[];
}

export const IntelligenceRiskHistory: React.FC<IntelligenceRiskHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="terminal-card">
        <div className="terminal-card-header">
          <div className="terminal-card-title-lockup">
            <span className="terminal-section-eyebrow">LONGITUDINAL EVALUATION HISTORY</span>
            <h3 className="terminal-card-title">HISTORICAL RISK TRAJECTORY</h3>
          </div>
        </div>
        <div className="terminal-empty-text monospace">
          NO HISTORICAL EVALUATIONS RECORDED FOR THIS PROJECT
        </div>
      </div>
    );
  }

  // Sort chronologically ascending
  const sortedHistory = [...history].sort((a, b) =>
    a.report_month.localeCompare(b.report_month)
  );

  // Check for model / regime transition across history
  const regimesPresent = Array.from(new Set(sortedHistory.map((h) => h.regime)));
  const modelsPresent = Array.from(new Set(sortedHistory.map((h) => h.model_id)));
  const hasRegimeTransition = regimesPresent.length > 1;
  const hasModelTransition = modelsPresent.length > 1;

  const chartData = sortedHistory.map((h) => ({
    month: h.report_month,
    calibratedRisk: Number((h.risk_probability * 100).toFixed(1)),
    rawProbability: Number((h.raw_probability * 100).toFixed(1)),
    rank: h.risk_rank,
    percentile: Number((h.risk_percentile * 100).toFixed(1)),
    regime: h.regime,
    modelId: h.model_id,
    calibrationActive: h.calibration_active,
  }));

  return (
    <div className="terminal-card">
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">LONGITUDINAL EVALUATION HISTORY</span>
          <h3 className="terminal-card-title">HISTORICAL RISK TRAJECTORY</h3>
        </div>
        <div className="terminal-history-stats">
          <span className="terminal-history-count monospace">
            {sortedHistory.length} EVALUATED {sortedHistory.length === 1 ? "MONTH" : "MONTHS"}
          </span>
        </div>
      </div>

      {/* Model / Regime Transition Notice */}
      {(hasRegimeTransition || hasModelTransition) && (
        <div className="terminal-transition-banner" role="note">
          <span className="transition-tag">REGIME TRANSITION DETECTED</span>
          <span className="transition-desc">
            Historical evaluations span multiple regimes ({regimesPresent.join(" → ")}) and model
            architectures ({modelsPresent.join(" → ")}). Historical points reflect their original
            serving models and are not recomputed with subsequent model weights.
          </span>
        </div>
      )}

      {/* Recharts Composed Line Chart */}
      <div className="terminal-history-chart-wrapper">
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 16, left: -20, bottom: 4 }}
              syncId="iris-terminal-history"
            >
              <CartesianGrid stroke="#E2E3DF" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#606460", fontSize: 10, fontFamily: "var(--font-mono)" }}
                stroke="#E2E3DF"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#606460", fontSize: 10, fontFamily: "var(--font-mono)" }}
                stroke="#E2E3DF"
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={
                  <IrisChartTooltip
                    titlePrefix="ASSESSMENT MONTH"
                    customFormatter={(payload) => {
                      const entry = Array.isArray(payload) ? payload[0]?.payload : undefined;
                      if (!entry) return [];
                      return [
                        {
                          label: "CALIBRATED RISK",
                          value: `${entry.calibratedRisk}%`,
                          color: "#1A3C2B",
                        },
                        {
                          label: "RAW PROBABILITY",
                          value: `${entry.rawProbability}%`,
                          color: "#8A8E8A",
                        },
                        {
                          label: "PORTFOLIO RANK",
                          value: `#${entry.rank}`,
                          color: "#FFFFFF",
                        },
                        {
                          label: "REGIME",
                          value: entry.regime,
                          color: "#E2E3DF",
                        },
                        {
                          label: "MODEL ID",
                          value: entry.modelId,
                          color: "#E2E3DF",
                        },
                      ];
                    }}
                  />
                }
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  paddingBottom: "8px",
                }}
              />
              <Line
                type="linear"
                dataKey="calibratedRisk"
                name="Calibrated Risk"
                stroke="#1A3C2B"
                strokeWidth={2}
                dot={{ r: 3.5, fill: "#1A3C2B", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: "#1A3C2B", stroke: "#FFFFFF", strokeWidth: 2 }}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="rawProbability"
                name="Raw Probability"
                stroke="#8A8E8A"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={{ r: 2.5, fill: "#8A8E8A", stroke: "#FFFFFF", strokeWidth: 1 }}
                activeDot={{ r: 4, fill: "#1A3C2B", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chronological Table */}
      <div className="terminal-history-table-wrap">
        <table className="terminal-history-table" aria-label="Chronological risk history">
          <thead>
            <tr>
              <th scope="col">MONTH</th>
              <th scope="col">CALIBRATED RISK</th>
              <th scope="col">RAW PROB</th>
              <th scope="col">RANK</th>
              <th scope="col">PERCENTILE</th>
              <th scope="col">REGIME</th>
              <th scope="col">MODEL ID</th>
              <th scope="col">CALIBRATION</th>
            </tr>
          </thead>
          <tbody>
            {sortedHistory.map((item) => (
              <tr key={item.report_month}>
                <td className="monospace font-bold">{item.report_month}</td>
                <td className="monospace font-bold">
                  {(item.risk_probability * 100).toFixed(1)}%
                </td>
                <td className="monospace muted">
                  {(item.raw_probability * 100).toFixed(1)}%
                </td>
                <td className="monospace">#{item.risk_rank}</td>
                <td className="monospace">P{(item.risk_percentile * 100).toFixed(1)}</td>
                <td>
                  <span className={`terminal-mini-badge ${item.regime.toLowerCase()}`}>
                    {item.regime}
                  </span>
                </td>
                <td className="monospace muted" title={item.model_id}>
                  {item.model_id}
                </td>
                <td>
                  <span
                    className={`terminal-mini-status ${
                      item.calibration_active ? "active" : "inactive"
                    }`}
                  >
                    {item.calibration_active ? "ACTIVE" : "RAW"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
