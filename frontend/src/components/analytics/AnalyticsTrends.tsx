import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { TrendsResponse } from "@/types/analytics.ts";
import { IrisChartTooltip, type IrisTooltipItem } from "@/components/common/charts/IrisChartTooltip.tsx";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner.tsx";
import { AlertTriangle, TrendingUp, Table as TableIcon } from "lucide-react";

interface AnalyticsTrendsProps {
  data?: TrendsResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

type TrendViewMode = "financial" | "volume" | "progress_risk";

export const AnalyticsTrends: React.FC<AnalyticsTrendsProps> = ({
  data,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  const [viewMode, setViewMode] = useState<TrendViewMode>("financial");
  const [showTable, setShowTable] = useState(false);

  if (isLoading) {
    return (
      <div className="analytics-section-card">
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <LoadingSpinner size="md" label="AGGREGATING TEMPORAL TRENDS..." />
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
            <span className="analytics-section-error-title">Failed to load temporal trends</span>
            <span className="analytics-section-error-desc">
              {error?.message || "An error occurred while fetching time-series observations."}
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

  const items = data?.items || [];

  if (items.length === 0) {
    return (
      <div className="analytics-section-card">
        <div className="analytics-card-header">
          <div className="analytics-card-title-lockup">
            <span className="analytics-eyebrow">LONGITUDINAL TRAJECTORY</span>
            <h2 className="analytics-card-title">TEMPORAL OBSERVATION TRENDS</h2>
          </div>
        </div>
        <div className="analytics-empty-state" role="status">
          <span className="analytics-empty-text">
            No temporal observations match the selected filter scope.
          </span>
        </div>
      </div>
    );
  }

  // Strictly preserve observed months without interpolation or zero-filling
  const chartData = items.map((p) => ({
    month: p.report_month,
    observations: p.observation_count,
    uniqueProjects: p.unique_project_count,
    expenditure: p.total_cumulative_expenditure != null ? Number(p.total_cumulative_expenditure.toFixed(2)) : null,
    originalCost: p.total_original_cost != null ? Number(p.total_original_cost.toFixed(2)) : null,
    revisedCost: p.total_revised_cost != null ? Number(p.total_revised_cost.toFixed(2)) : null,
    progress: p.average_physical_progress != null ? Number(p.average_physical_progress.toFixed(1)) : null,
    risk: p.average_risk_probability != null ? Number((p.average_risk_probability * 100).toFixed(1)) : null,
    rawRisk: p.average_raw_probability != null ? Number((p.average_raw_probability * 100).toFixed(1)) : null,
  }));

  const formatTooltip = (payload: unknown): IrisTooltipItem[] => {
    const list = payload as Array<{ dataKey?: string; value: number | null; name?: string; color?: string }>;
    if (!list) return [];
    return list
      .filter((entry) => entry.value != null)
      .map((entry) => {
        let labelName = entry.name || entry.dataKey || "Metric";
        let formattedValue = `${entry.value}`;
        if (entry.dataKey === "expenditure" || entry.dataKey === "originalCost" || entry.dataKey === "revisedCost") {
          formattedValue = `₹${Number(entry.value).toLocaleString()} Cr`;
        } else if (entry.dataKey === "progress") {
          formattedValue = `${entry.value}%`;
          labelName = "MEAN PROGRESS";
        } else if (entry.dataKey === "risk") {
          formattedValue = `${entry.value}%`;
          labelName = "CALIBRATED RISK PROBABILITY";
        } else if (entry.dataKey === "rawRisk") {
          formattedValue = `${entry.value}%`;
          labelName = "RAW RISK PROBABILITY";
        } else if (entry.dataKey === "observations") {
          formattedValue = `${Number(entry.value).toLocaleString()} obs`;
          labelName = "OBSERVATIONS";
        } else if (entry.dataKey === "uniqueProjects") {
          formattedValue = `${Number(entry.value).toLocaleString()} projects`;
          labelName = "UNIQUE PROJECTS";
        }
        return {
          label: labelName.toUpperCase(),
          value: formattedValue,
          color: entry.color,
        };
      });
  };

  return (
    <div className="analytics-section-card" data-testid="analytics-trends-section">
      <div className="analytics-card-header">
        <div className="analytics-card-title-lockup">
          <span className="analytics-eyebrow">CHRONOLOGICAL AGGREGATIONS</span>
          <h2 className="analytics-card-title">01. TEMPORAL OBSERVATION TRENDS</h2>
        </div>

        {/* View Mode Toggle */}
        <div className="analytics-view-controls">
          <div className="analytics-button-group" role="group" aria-label="Trend Metric View">
            <button
              type="button"
              className={`analytics-btn-pill ${viewMode === "financial" ? "active" : ""}`}
              onClick={() => setViewMode("financial")}
              aria-pressed={viewMode === "financial"}
            >
              FINANCIALS (₹ CR)
            </button>
            <button
              type="button"
              className={`analytics-btn-pill ${viewMode === "volume" ? "active" : ""}`}
              onClick={() => setViewMode("volume")}
              aria-pressed={viewMode === "volume"}
            >
              OBSERVATION VOLUME
            </button>
            <button
              type="button"
              className={`analytics-btn-pill ${viewMode === "progress_risk" ? "active" : ""}`}
              onClick={() => setViewMode("progress_risk")}
              aria-pressed={viewMode === "progress_risk"}
            >
              PROGRESS & RISK (%)
            </button>
          </div>

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
        <TrendingUp size={12} className="analytics-disclaimer-icon" />
        <span>{data?.disclaimer || "Only observed months are included. No synthetic zero-months are manufactured."}</span>
      </div>

      {showTable ? (
        <div className="analytics-accessible-table-wrapper">
          <table className="analytics-data-table" aria-label="Chronological Trends Data Table">
            <thead>
              <tr>
                <th scope="col">REPORT MONTH</th>
                <th scope="col">OBSERVATIONS</th>
                <th scope="col">UNIQUE PROJECTS</th>
                <th scope="col">CUMULATIVE EXP (₹ CR)</th>
                <th scope="col">ORIGINAL COST (₹ CR)</th>
                <th scope="col">REVISED COST (₹ CR)</th>
                <th scope="col">MEAN PROGRESS (%)</th>
                <th scope="col">CALIBRATED RISK (%)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.report_month}>
                  <td className="monospace font-bold">{row.report_month}</td>
                  <td>{row.observation_count.toLocaleString()}</td>
                  <td>{row.unique_project_count.toLocaleString()}</td>
                  <td>{row.total_cumulative_expenditure != null ? row.total_cumulative_expenditure.toFixed(2) : "—"}</td>
                  <td>{row.total_original_cost != null ? row.total_original_cost.toFixed(2) : "—"}</td>
                  <td>{row.total_revised_cost != null ? row.total_revised_cost.toFixed(2) : "—"}</td>
                  <td>{row.average_physical_progress != null ? `${row.average_physical_progress.toFixed(1)}%` : "—"}</td>
                  <td>{row.average_risk_probability != null ? `${(row.average_risk_probability * 100).toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="analytics-chart-container" style={{ minWidth: 0, height: 340, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {viewMode === "financial" ? (
              <ComposedChart data={chartData} margin={{ top: 12, right: 24, left: 16, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e3df" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#5f5e5c"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                />
                <YAxis
                  stroke="#5f5e5c"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k Cr`}
                />
                <Tooltip
                  content={
                    <IrisChartTooltip
                      titlePrefix="MONTH"
                      customFormatter={formatTooltip}
                    />
                  }
                />
                <Legend
                  wrapperStyle={{ paddingTop: "12px", fontSize: "11px", fontFamily: "var(--font-mono)" }}
                />
                <Line
                  type="monotone"
                  dataKey="expenditure"
                  name="Cumulative Expenditure"
                  stroke="#1a3c2b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#1a3c2b" }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="revisedCost"
                  name="Revised Cost"
                  stroke="#ba1a1a"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: "#ba1a1a" }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="originalCost"
                  name="Original Cost"
                  stroke="#727973"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={{ r: 2, fill: "#727973" }}
                  connectNulls={false}
                />
              </ComposedChart>
            ) : viewMode === "volume" ? (
              <ComposedChart data={chartData} margin={{ top: 12, right: 24, left: 16, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e3df" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#5f5e5c"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                />
                <YAxis
                  stroke="#5f5e5c"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickFormatter={(val) => Number(val).toLocaleString()}
                />
                <Tooltip
                  content={
                    <IrisChartTooltip
                      titlePrefix="MONTH"
                      customFormatter={formatTooltip}
                    />
                  }
                />
                <Legend
                  wrapperStyle={{ paddingTop: "12px", fontSize: "11px", fontFamily: "var(--font-mono)" }}
                />
                <Bar
                  dataKey="observations"
                  name="Observations"
                  fill="#bbdacb"
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="uniqueProjects"
                  name="Unique Projects"
                  stroke="#022617"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#022617" }}
                  connectNulls={false}
                />
              </ComposedChart>
            ) : (
              <ComposedChart data={chartData} margin={{ top: 12, right: 24, left: 16, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e3df" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#5f5e5c"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#5f5e5c"
                  tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  content={
                    <IrisChartTooltip
                      titlePrefix="MONTH"
                      customFormatter={formatTooltip}
                    />
                  }
                />
                <Legend
                  wrapperStyle={{ paddingTop: "12px", fontSize: "11px", fontFamily: "var(--font-mono)" }}
                />
                <Line
                  type="monotone"
                  dataKey="progress"
                  name="Mean Physical Progress (%)"
                  stroke="#3a6958"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#3a6958" }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="risk"
                  name="Calibrated Schedule Risk (%)"
                  stroke="#ba1a1a"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#ba1a1a" }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="rawRisk"
                  name="Raw Risk Probability (%)"
                  stroke="#b45309"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: "#b45309" }}
                  connectNulls={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
