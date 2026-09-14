import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { AgenciesResponse } from "@/types/analytics.ts";
import { IrisChartTooltip, type IrisTooltipItem } from "@/components/common/charts/IrisChartTooltip.tsx";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner.tsx";
import { AlertTriangle, Building2, Table as TableIcon } from "lucide-react";

interface AnalyticsAgenciesProps {
  data?: AgenciesResponse;
  selectedAgency?: string | null;
  onToggleAgency: (agency: string) => void;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const AnalyticsAgencies: React.FC<AnalyticsAgenciesProps> = ({
  data,
  selectedAgency,
  onToggleAgency,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  const [showTable, setShowTable] = useState(false);

  if (isLoading) {
    return (
      <div className="analytics-section-card" style={{ flex: 1 }}>
        <div style={{ padding: "50px 0", textAlign: "center" }}>
          <LoadingSpinner size="md" label="AGGREGATING AGENCIES..." />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="analytics-section-card" style={{ flex: 1 }}>
        <div className="analytics-section-error" role="alert">
          <AlertTriangle size={18} className="analytics-filter-error-icon" />
          <div className="analytics-section-error-content">
            <span className="analytics-section-error-title">Failed to load agencies</span>
            <span className="analytics-section-error-desc">
              {error?.message || "An error occurred while fetching agency aggregations."}
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
      <div className="analytics-section-card" style={{ flex: 1 }}>
        <div className="analytics-card-header">
          <div className="analytics-card-title-lockup">
            <span className="analytics-eyebrow">IMPLEMENTING BODIES</span>
            <h3 className="analytics-card-title">AGENCY ANALYSIS</h3>
          </div>
        </div>
        <div className="analytics-empty-state">
          <span className="analytics-empty-text">No agency records match active filters.</span>
        </div>
      </div>
    );
  }

  // Top 10 agencies with label truncation for chart legibility
  const chartItems = items.slice(0, 10).map((a) => {
    const truncatedLabel = a.agency.length > 14 ? `${a.agency.slice(0, 12)}…` : a.agency;
    return {
      rawAgency: a.agency,
      agency: truncatedLabel,
      uniqueProjects: a.unique_project_count,
      observations: a.observation_count,
      expenditure: a.total_cumulative_expenditure,
      isSelected: selectedAgency?.toUpperCase() === a.agency.toUpperCase(),
    };
  });

  const formatTooltip = (payload: unknown): IrisTooltipItem[] => {
    const list = payload as Array<{ payload?: { rawAgency?: string; uniqueProjects?: number; observations?: number; expenditure?: number | null } }>;
    const item = list?.[0]?.payload;
    if (!item) return [];
    return [
      { label: "AGENCY", value: item.rawAgency || "—" },
      { label: "UNIQUE PROJECTS", value: item.uniqueProjects?.toLocaleString() || "0" },
      { label: "OBSERVATIONS", value: item.observations?.toLocaleString() || "0" },
      {
        label: "CUMULATIVE EXP",
        value: item.expenditure != null ? `₹${Number(item.expenditure.toFixed(2)).toLocaleString()} Cr` : "—",
      },
      { label: "INTERACTION", value: "Click to toggle agency filter" },
    ];
  };

  return (
    <div className="analytics-section-card" data-testid="analytics-agencies-section" style={{ flex: 1 }}>
      <div className="analytics-card-header">
        <div className="analytics-card-title-lockup">
          <span className="analytics-eyebrow">IMPLEMENTING BODIES & CROSS-FILTER</span>
          <h3 className="analytics-card-title">04. AGENCIES</h3>
        </div>

        <div className="analytics-view-controls">
          {selectedAgency && (
            <span className="analytics-filter-active-pill">
              FILTER: {selectedAgency}
              <button
                type="button"
                className="analytics-filter-clear-pill-btn"
                onClick={() => onToggleAgency(selectedAgency)}
                aria-label={`Clear ${selectedAgency} filter`}
              >
                ×
              </button>
            </span>
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
        <Building2 size={12} className="analytics-disclaimer-icon" />
        <span>Authoritative agency reporting. Names preserved without heuristic merging.</span>
      </div>

      {showTable ? (
        <div className="analytics-accessible-table-wrapper" style={{ maxHeight: "320px", overflowY: "auto" }}>
          <table className="analytics-data-table" aria-label="Agency Breakdown Table">
            <thead>
              <tr>
                <th scope="col">AGENCY</th>
                <th scope="col">PROJECTS</th>
                <th scope="col">OBSERVATIONS</th>
                <th scope="col">EXPENDITURE (₹ CR)</th>
                <th scope="col">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const isSelected = selectedAgency?.toUpperCase() === row.agency.toUpperCase();
                return (
                  <tr key={row.agency} className={isSelected ? "analytics-table-row-selected" : ""}>
                    <td className="monospace font-bold" title={row.agency}>{row.agency}</td>
                    <td>{row.unique_project_count.toLocaleString()}</td>
                    <td>{row.observation_count.toLocaleString()}</td>
                    <td>{row.total_cumulative_expenditure != null ? row.total_cumulative_expenditure.toFixed(2) : "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="analytics-table-action-btn"
                        onClick={() => onToggleAgency(row.agency)}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? "REMOVE FILTER" : "FILTER BY AGENCY"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="analytics-chart-container" style={{ minWidth: 0, height: 300, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={chartItems}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 90, bottom: 8 }}
            >
              <XAxis
                type="number"
                stroke="#5f5e5c"
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              />
              <YAxis
                type="category"
                dataKey="agency"
                stroke="#5f5e5c"
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                width={90}
              />
              <Tooltip
                content={<IrisChartTooltip titlePrefix="AGENCY" customFormatter={formatTooltip} />}
              />
              <Bar
                dataKey="uniqueProjects"
                name="Unique Projects"
                cursor="pointer"
                onClick={(entry: unknown) => {
                  const payload = (entry as { rawAgency?: string })?.rawAgency;
                  if (payload) onToggleAgency(payload);
                }}
              >
                {chartItems.map((entry) => (
                  <Cell
                    key={`agency-cell-${entry.rawAgency}`}
                    fill={entry.isSelected ? "#ba1a1a" : "#305448"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="analytics-cross-filter-hint">
        Click an agency bar to filter the entire analytics workspace. Click again to clear.
      </div>
    </div>
  );
};
