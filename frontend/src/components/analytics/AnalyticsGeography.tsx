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
import type { GeographyResponse, GlobalAnalyticsFilters, RiskAnalyticsFilters } from "@/types/analytics.ts";
import { IrisChartTooltip, type IrisTooltipItem } from "@/components/common/charts/IrisChartTooltip.tsx";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner.tsx";
import { AlertTriangle, MapPin, Table as TableIcon } from "lucide-react";
import { buildInvestigationPackage } from "@/utils/analyticsProjectNavigation.ts";
import { AnalyticsInvestigationAction } from "./AnalyticsInvestigationAction.tsx";

interface AnalyticsGeographyProps {
  data?: GeographyResponse;
  selectedState?: string | null;
  onToggleState: (state: string) => void;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  globalFilters?: GlobalAnalyticsFilters;
  riskFilters?: RiskAnalyticsFilters;
}

export const AnalyticsGeography: React.FC<AnalyticsGeographyProps> = ({
  data,
  selectedState,
  onToggleState,
  isLoading,
  isError,
  error,
  onRetry,
  globalFilters,
  riskFilters,
}) => {
  const [showTable, setShowTable] = useState(false);

  if (isLoading) {
    return (
      <div className="analytics-section-card" style={{ flex: 1 }}>
        <div style={{ padding: "50px 0", textAlign: "center" }}>
          <LoadingSpinner size="md" label="AGGREGATING GEOGRAPHY..." />
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
            <span className="analytics-section-error-title">Failed to load geography</span>
            <span className="analytics-section-error-desc">
              {error?.message || "An error occurred while fetching state aggregations."}
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
            <span className="analytics-eyebrow">STATE DISTRIBUTION</span>
            <h3 className="analytics-card-title">GEOGRAPHY</h3>
          </div>
        </div>
        <div className="analytics-empty-state">
          <span className="analytics-empty-text">No state records match active filters.</span>
        </div>
      </div>
    );
  }

  // Display top 10 states in chart for legibility
  const chartItems = items.slice(0, 10).map((g) => ({
    state: g.state,
    uniqueProjects: g.unique_project_count,
    observations: g.observation_count,
    expenditure: g.total_cumulative_expenditure,
    isSelected: selectedState?.toUpperCase() === g.state.toUpperCase(),
  }));

  const formatTooltip = (payload: unknown): IrisTooltipItem[] => {
    const list = payload as Array<{ payload?: { state?: string; uniqueProjects?: number; observations?: number; expenditure?: number | null } }>;
    const item = list?.[0]?.payload;
    if (!item) return [];
    return [
      { label: "STATE", value: item.state || "—" },
      { label: "UNIQUE PROJECTS", value: item.uniqueProjects?.toLocaleString() || "0" },
      { label: "OBSERVATIONS", value: item.observations?.toLocaleString() || "0" },
      {
        label: "CUMULATIVE EXP",
        value: item.expenditure != null ? `₹${Number(item.expenditure.toFixed(2)).toLocaleString()} Cr` : "—",
      },
      { label: "INTERACTION", value: "Click to toggle state filter" },
    ];
  };

  return (
    <div className="analytics-section-card" data-testid="analytics-geography-section" style={{ flex: 1 }}>
      <div className="analytics-card-header">
        <div className="analytics-card-title-lockup">
          <span className="analytics-eyebrow">STATE DISTRIBUTION & CROSS-FILTER</span>
          <h3 className="analytics-card-title">02. GEOGRAPHY</h3>
        </div>

        <div className="analytics-view-controls">
          {selectedState && (
            <>
              <span className="analytics-filter-active-pill">
                FILTER: {selectedState}
                <button
                  type="button"
                  className="analytics-filter-clear-pill-btn"
                  onClick={() => onToggleState(selectedState)}
                  aria-label={`Clear ${selectedState} filter`}
                >
                  ×
                </button>
              </span>
              <AnalyticsInvestigationAction
                url={buildInvestigationPackage({ globalFilters, riskFilters, overrideState: selectedState }).url}
                context={buildInvestigationPackage({ globalFilters, riskFilters, overrideState: selectedState }).context}
                label="INVESTIGATE STATE"
                variant="pill-btn"
                ariaLabel={`Investigate compatible projects in ${selectedState}`}
                dataTestId="investigate-selected-state"
              />
            </>
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
        <MapPin size={12} className="analytics-disclaimer-icon" />
        <span>
          {data?.district_dimension_reason || "District dimension is structurally omitted from source flash reports."}
        </span>
      </div>

      {showTable ? (
        <div className="analytics-accessible-table-wrapper" style={{ maxHeight: "320px", overflowY: "auto" }}>
          <table className="analytics-data-table" aria-label="Geographic State Distribution Table">
            <thead>
              <tr>
                <th scope="col">STATE</th>
                <th scope="col">PROJECTS</th>
                <th scope="col">OBSERVATIONS</th>
                <th scope="col">EXPENDITURE (₹ CR)</th>
                <th scope="col">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const isSelected = selectedState?.toUpperCase() === row.state.toUpperCase();
                const nav = buildInvestigationPackage({
                  globalFilters,
                  riskFilters,
                  overrideState: row.state,
                });
                return (
                  <tr key={row.state} className={isSelected ? "analytics-table-row-selected" : ""}>
                    <td className="monospace font-bold">{row.state}</td>
                    <td>{row.unique_project_count.toLocaleString()}</td>
                    <td>{row.observation_count.toLocaleString()}</td>
                    <td>{row.total_cumulative_expenditure != null ? row.total_cumulative_expenditure.toFixed(2) : "—"}</td>
                    <td>
                      <div className="analytics-table-actions-cell">
                        <button
                          type="button"
                          className="analytics-table-action-btn"
                          onClick={() => onToggleState(row.state)}
                          aria-pressed={isSelected}
                        >
                          {isSelected ? "REMOVE FILTER" : "FILTER BY STATE"}
                        </button>
                        <AnalyticsInvestigationAction
                          url={nav.url}
                          context={nav.context}
                          label="INVESTIGATE PROJECTS"
                          ariaLabel={`Investigate compatible projects in state ${row.state}`}
                          dataTestId={`investigate-state-${row.state}`}
                        />
                      </div>
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
              margin={{ top: 8, right: 24, left: 70, bottom: 8 }}
            >
              <XAxis
                type="number"
                stroke="#5f5e5c"
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              />
              <YAxis
                type="category"
                dataKey="state"
                stroke="#5f5e5c"
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                width={70}
              />
              <Tooltip
                content={<IrisChartTooltip titlePrefix="STATE" customFormatter={formatTooltip} />}
              />
              <Bar
                dataKey="uniqueProjects"
                name="Unique Projects"
                cursor="pointer"
                onClick={(entry: unknown) => {
                  const payload = (entry as { state?: string })?.state;
                  if (payload) onToggleState(payload);
                }}
              >
                {chartItems.map((entry) => (
                  <Cell
                    key={`state-cell-${entry.state}`}
                    fill={entry.isSelected ? "#ba1a1a" : "#1a3c2b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="analytics-cross-filter-hint">
        Click a state bar to filter the entire analytics workspace. Click again to clear.
      </div>
    </div>
  );
};
