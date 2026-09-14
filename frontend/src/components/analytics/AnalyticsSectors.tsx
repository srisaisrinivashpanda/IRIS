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
import type { SectorsResponse } from "@/types/analytics.ts";
import { IrisChartTooltip, type IrisTooltipItem } from "@/components/common/charts/IrisChartTooltip.tsx";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner.tsx";
import { AlertTriangle, Layers, Table as TableIcon } from "lucide-react";

interface AnalyticsSectorsProps {
  data?: SectorsResponse;
  selectedSector?: string | null;
  onToggleSector: (sector: string) => void;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const AnalyticsSectors: React.FC<AnalyticsSectorsProps> = ({
  data,
  selectedSector,
  onToggleSector,
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
          <LoadingSpinner size="md" label="AGGREGATING SECTORS..." />
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
            <span className="analytics-section-error-title">Failed to load sectors</span>
            <span className="analytics-section-error-desc">
              {error?.message || "An error occurred while fetching sector aggregations."}
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
            <span className="analytics-eyebrow">PORTFOLIO COMPOSITION</span>
            <h3 className="analytics-card-title">SECTOR ANALYSIS</h3>
          </div>
        </div>
        <div className="analytics-empty-state">
          <span className="analytics-empty-text">No sector records match active filters.</span>
        </div>
      </div>
    );
  }

  // Display top 10 sectors for legibility in chart
  const chartItems = items.slice(0, 10).map((s) => ({
    sector: s.sector,
    uniqueProjects: s.unique_project_count,
    observations: s.observation_count,
    expenditure: s.total_cumulative_expenditure,
    progress: s.average_physical_progress,
    isSelected: selectedSector?.toUpperCase() === s.sector.toUpperCase(),
  }));

  const formatTooltip = (payload: unknown): IrisTooltipItem[] => {
    const list = payload as Array<{ payload?: { sector?: string; uniqueProjects?: number; observations?: number; expenditure?: number | null; progress?: number | null } }>;
    const item = list?.[0]?.payload;
    if (!item) return [];
    return [
      { label: "SECTOR", value: item.sector || "—" },
      { label: "UNIQUE PROJECTS", value: item.uniqueProjects?.toLocaleString() || "0" },
      { label: "OBSERVATIONS", value: item.observations?.toLocaleString() || "0" },
      {
        label: "CUMULATIVE EXP",
        value: item.expenditure != null ? `₹${Number(item.expenditure.toFixed(2)).toLocaleString()} Cr` : "—",
      },
      {
        label: "MEAN PROGRESS",
        value: item.progress != null ? `${item.progress.toFixed(1)}%` : "Unavailable",
      },
      { label: "INTERACTION", value: "Click to toggle sector filter" },
    ];
  };

  return (
    <div className="analytics-section-card" data-testid="analytics-sectors-section" style={{ flex: 1 }}>
      <div className="analytics-card-header">
        <div className="analytics-card-title-lockup">
          <span className="analytics-eyebrow">PORTFOLIO COMPOSITION & CROSS-FILTER</span>
          <h3 className="analytics-card-title">03. SECTORS</h3>
        </div>

        <div className="analytics-view-controls">
          {selectedSector && (
            <span className="analytics-filter-active-pill">
              FILTER: {selectedSector}
              <button
                type="button"
                className="analytics-filter-clear-pill-btn"
                onClick={() => onToggleSector(selectedSector)}
                aria-label={`Clear ${selectedSector} filter`}
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
        <Layers size={12} className="analytics-disclaimer-icon" />
        <span>Categorical grouping by monitored infrastructure sector.</span>
      </div>

      {showTable ? (
        <div className="analytics-accessible-table-wrapper" style={{ maxHeight: "320px", overflowY: "auto" }}>
          <table className="analytics-data-table" aria-label="Sector Breakdown Table">
            <thead>
              <tr>
                <th scope="col">SECTOR</th>
                <th scope="col">PROJECTS</th>
                <th scope="col">OBSERVATIONS</th>
                <th scope="col">EXPENDITURE (₹ CR)</th>
                <th scope="col">MEAN PROGRESS</th>
                <th scope="col">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const isSelected = selectedSector?.toUpperCase() === row.sector.toUpperCase();
                return (
                  <tr key={row.sector} className={isSelected ? "analytics-table-row-selected" : ""}>
                    <td className="monospace font-bold">{row.sector}</td>
                    <td>{row.unique_project_count.toLocaleString()}</td>
                    <td>{row.observation_count.toLocaleString()}</td>
                    <td>{row.total_cumulative_expenditure != null ? row.total_cumulative_expenditure.toFixed(2) : "—"}</td>
                    <td>{row.average_physical_progress != null ? `${row.average_physical_progress.toFixed(1)}%` : "Unavailable"}</td>
                    <td>
                      <button
                        type="button"
                        className="analytics-table-action-btn"
                        onClick={() => onToggleSector(row.sector)}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? "REMOVE FILTER" : "FILTER BY SECTOR"}
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
                dataKey="sector"
                stroke="#5f5e5c"
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                width={90}
              />
              <Tooltip
                content={<IrisChartTooltip titlePrefix="SECTOR" customFormatter={formatTooltip} />}
              />
              <Bar
                dataKey="uniqueProjects"
                name="Unique Projects"
                cursor="pointer"
                onClick={(entry: unknown) => {
                  const payload = (entry as { sector?: string })?.sector;
                  if (payload) onToggleSector(payload);
                }}
              >
                {chartItems.map((entry) => (
                  <Cell
                    key={`sector-cell-${entry.sector}`}
                    fill={entry.isSelected ? "#ba1a1a" : "#28443b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="analytics-cross-filter-hint">
        Click a sector bar to filter the entire analytics workspace. Click again to clear.
      </div>
    </div>
  );
};
