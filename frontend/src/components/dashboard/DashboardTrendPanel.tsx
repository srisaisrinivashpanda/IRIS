import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { TrendsResponse } from "@/types/analytics.ts";
import { DashboardCardSkeleton } from "./DashboardSkeleton.tsx";
import { DashboardErrorState } from "./DashboardErrorState.tsx";
import { IrisChartTooltip } from "@/components/common/charts/IrisChartTooltip.tsx";
import { ArrowUpRight } from "lucide-react";

interface DashboardTrendPanelProps {
  trendsData?: TrendsResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const DashboardTrendPanel: React.FC<DashboardTrendPanelProps> = ({
  trendsData,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState<"activity" | "risk">("activity");

  if (isLoading) {
    return <DashboardCardSkeleton height="320px" label="Loading portfolio trends..." />;
  }

  if (isError || !trendsData) {
    return (
      <DashboardErrorState
        title="Failed to load portfolio movement trends"
        message={error?.message || "Temporal trend observations could not be retrieved."}
        onRetry={onRetry}
      />
    );
  }

  const items = trendsData.items || [];

  if (items.length === 0) {
    return (
      <section className="dashboard-section" aria-label="Portfolio Movement Panel">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">PORTFOLIO MOVEMENT & RECENT TRENDS</h2>
        </div>
        <div className="dashboard-card-white" style={{ textAlign: "center", padding: "36px" }}>
          <span className="dashboard-empty-card-text">No observed trend observations available.</span>
        </div>
      </section>
    );
  }

  // Format chart data: EXACT observed values only. No synthetic dates, no zero filling.
  const chartData = items.map((t) => ({
    month: t.report_month,
    observations: t.observation_count,
    uniqueProjects: t.unique_project_count,
    expenditureCr:
      t.total_cumulative_expenditure != null
        ? Number(t.total_cumulative_expenditure.toFixed(2))
        : null,
    calibratedRiskPct:
      t.average_risk_probability != null
        ? Number((t.average_risk_probability * 100).toFixed(1))
        : null,
    rawProbPct:
      t.average_raw_probability != null
        ? Number((t.average_raw_probability * 100).toFixed(1))
        : null,
    riskAssessedCount: t.risk_assessed_project_count,
  }));

  return (
    <section className="dashboard-section" aria-label="Portfolio Movement and Trend Panel">
      <div className="dashboard-section-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 className="dashboard-section-title">PORTFOLIO MOVEMENT & RECENT TRENDS</h2>
            <span className="dashboard-section-subtitle">
              Strictly observed report cycles ({trendsData.earliest_month} → {trendsData.latest_month}) · N={trendsData.total_months} months
            </span>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div className="dashboard-trend-toggle" role="tablist" aria-label="Select trend view">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "activity"}
                className={`trend-toggle-btn ${activeTab === "activity" ? "active" : ""}`}
                onClick={() => setActiveTab("activity")}
              >
                ACTIVITY & EXPENDITURE
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "risk"}
                className={`trend-toggle-btn ${activeTab === "risk" ? "active" : ""}`}
                onClick={() => setActiveTab("risk")}
              >
                SCHEDULE-EXTENSION RISK
              </button>
            </div>

            <Link
              to="/analytics"
              className="dashboard-section-link"
              aria-label="Explore detailed trends in Portfolio Analytics"
            >
              <span>EXPLORE IN ANALYTICS</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="dashboard-card-white">
        <div style={{ width: "100%", height: 260, position: "relative" }} aria-label="Historical Movement Chart">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "activity" ? (
              <ComposedChart data={chartData} margin={{ top: 12, right: 24, left: 16, bottom: 8 }}>
                <CartesianGrid stroke="#E2E3DF" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#606460"
                  tick={{ fill: "#606460", fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={{ stroke: "#D1D4D1" }}
                  axisLine={{ stroke: "#D1D4D1" }}
                />
                <YAxis
                  yAxisId="obs"
                  orientation="left"
                  stroke="#1A3C2B"
                  tick={{ fill: "#1A3C2B", fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={{ stroke: "#D1D4D1" }}
                  axisLine={{ stroke: "#D1D4D1" }}
                  tickFormatter={(v: number) => v.toLocaleString()}
                />
                <YAxis
                  yAxisId="exp"
                  orientation="right"
                  stroke="#BA1A1A"
                  tick={{ fill: "#BA1A1A", fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={{ stroke: "#D1D4D1" }}
                  axisLine={{ stroke: "#D1D4D1" }}
                  tickFormatter={(v: number) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} Cr`}
                />
                <Tooltip
                  content={
                    <IrisChartTooltip
                      titlePrefix="OBSERVED MONTH"
                      customFormatter={(payload) => {
                        const entry = Array.isArray(payload) ? payload[0]?.payload : undefined;
                        if (!entry) return [];
                        return [
                          {
                            label: "OBSERVATIONS",
                            value: entry.observations.toLocaleString(),
                            color: "#1A3C2B",
                            subtext: `Unique Projects: ${entry.uniqueProjects.toLocaleString()}`,
                          },
                          ...(entry.expenditureCr != null
                            ? [
                                {
                                  label: "CUMULATIVE EXPENDITURE",
                                  value: `₹${Number(entry.expenditureCr).toLocaleString()} Cr`,
                                  color: "#BA1A1A",
                                },
                              ]
                            : []),
                        ];
                      }}
                    />
                  }
                />
                <Bar
                  yAxisId="obs"
                  dataKey="observations"
                  name="Observations"
                  fill="#1A3C2B"
                  opacity={0.85}
                  barSize={16}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="exp"
                  type="monotone"
                  dataKey="expenditureCr"
                  name="Cumulative Expenditure (Cr)"
                  stroke="#BA1A1A"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#BA1A1A" }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            ) : (
              <ComposedChart data={chartData} margin={{ top: 12, right: 24, left: 16, bottom: 8 }}>
                <CartesianGrid stroke="#E2E3DF" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#606460"
                  tick={{ fill: "#606460", fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={{ stroke: "#D1D4D1" }}
                  axisLine={{ stroke: "#D1D4D1" }}
                />
                <YAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="#606460"
                  tick={{ fill: "#606460", fontSize: 10, fontFamily: "var(--font-mono)" }}
                  tickLine={{ stroke: "#D1D4D1" }}
                  axisLine={{ stroke: "#D1D4D1" }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  content={
                    <IrisChartTooltip
                      titlePrefix="EVALUATION MONTH"
                      customFormatter={(payload) => {
                        const entry = Array.isArray(payload) ? payload[0]?.payload : undefined;
                        if (!entry) return [];
                        return [
                          {
                            label: "CALIBRATED RISK (MEAN)",
                            value:
                              entry.calibratedRiskPct != null
                                ? `${entry.calibratedRiskPct}%`
                                : "Unassessed",
                            color: "#1A3C2B",
                            subtext: `Evaluated projects: ${entry.riskAssessedCount.toLocaleString()}`,
                          },
                          {
                            label: "RAW MODEL PROBABILITY",
                            value:
                              entry.rawProbPct != null ? `${entry.rawProbPct}%` : "Unassessed",
                            color: "#606460",
                          },
                        ];
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="calibratedRiskPct"
                  name="Calibrated Risk Mean %"
                  stroke="#1A3C2B"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#1A3C2B" }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="rawProbPct"
                  name="Raw Model Probability Mean %"
                  stroke="#808480"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 2.5, fill: "#808480" }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Accessible Data Summary / Legend */}
        <div className="dashboard-chart-legend">
          {activeTab === "activity" ? (
            <>
              <div className="legend-item">
                <span className="legend-box" style={{ backgroundColor: "#1A3C2B" }} />
                <span>Monthly Observations (Left Axis)</span>
              </div>
              <div className="legend-item">
                <span className="legend-line" style={{ backgroundColor: "#BA1A1A" }} />
                <span>Cumulative Expenditure ₹ Cr (Right Axis)</span>
              </div>
            </>
          ) : (
            <>
              <div className="legend-item">
                <span className="legend-line" style={{ backgroundColor: "#1A3C2B" }} />
                <span>Calibrated Risk Probability (Mean %)</span>
              </div>
              <div className="legend-item">
                <span className="legend-line dashed" style={{ backgroundColor: "#808480" }} />
                <span>Raw Model Probability (Mean %)</span>
              </div>
            </>
          )}
          <span className="legend-note">Exact observed months only · No synthetic months</span>
        </div>
      </div>
    </section>
  );
};
