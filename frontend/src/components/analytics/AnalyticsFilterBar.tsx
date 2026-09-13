import React, { useState } from "react";
import type { FilterOptionsResponse } from "@/types/project.ts";
import type { GlobalAnalyticsFilters } from "@/types/analytics.ts";
import type { ActiveFilterBadge, FilterKey } from "@/hooks/useAnalyticsFilters.ts";
import { X, RotateCcw, AlertTriangle, Search } from "lucide-react";

interface AnalyticsFilterBarProps {
  filters: GlobalAnalyticsFilters;
  filterOptions?: FilterOptionsResponse;
  activeBadges: ActiveFilterBadge[];
  validationError?: string | null;
  onFilterChange: (key: FilterKey, value: string | null) => void;
  onClearFilter: (key: FilterKey) => void;
  onClearAll: () => void;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  filterOptions,
  activeBadges,
  validationError,
  onFilterChange,
  onClearFilter,
  onClearAll,
}) => {
  const [projectInput, setProjectInput] = useState(filters.project_code || "");

  const sectors = filterOptions?.sectors || [];
  const agencies = filterOptions?.agencies || [];
  const states = filterOptions?.states || [];
  const reportMonths = filterOptions?.report_months || [];

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange("project_code", projectInput.trim() || null);
  };

  return (
    <div className="analytics-filter-container">
      {/* Primary Toolbar */}
      <div className="analytics-filters-bar" role="toolbar" aria-label="Analytics Filters Toolbar">
        {/* From Month Filter */}
        <div className="analytics-filter-select-wrapper">
          <label htmlFor="analytics-from-month-filter" className="sr-only">
            Filter from Month
          </label>
          <select
            id="analytics-from-month-filter"
            name="from_month"
            aria-label="Filter from Month"
            className="analytics-filter-select"
            value={filters.from_month || ""}
            onChange={(e) => onFilterChange("from_month", e.target.value || null)}
          >
            <option value="">FROM MONTH (ALL)</option>
            {reportMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span className="analytics-filter-icon" aria-hidden="true">▼</span>
        </div>

        {/* To Month Filter */}
        <div className="analytics-filter-select-wrapper">
          <label htmlFor="analytics-to-month-filter" className="sr-only">
            Filter to Month
          </label>
          <select
            id="analytics-to-month-filter"
            name="to_month"
            aria-label="Filter to Month"
            className="analytics-filter-select"
            value={filters.to_month || ""}
            onChange={(e) => onFilterChange("to_month", e.target.value || null)}
          >
            <option value="">TO MONTH (ALL)</option>
            {reportMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span className="analytics-filter-icon" aria-hidden="true">▼</span>
        </div>

        {/* State Filter */}
        <div className="analytics-filter-select-wrapper">
          <label htmlFor="analytics-state-filter" className="sr-only">
            Filter by State
          </label>
          <select
            id="analytics-state-filter"
            name="state"
            aria-label="Filter by State"
            className="analytics-filter-select"
            value={filters.state || ""}
            onChange={(e) => onFilterChange("state", e.target.value || null)}
          >
            <option value="">STATE (ALL)</option>
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <span className="analytics-filter-icon" aria-hidden="true">▼</span>
        </div>

        {/* Sector Filter */}
        <div className="analytics-filter-select-wrapper">
          <label htmlFor="analytics-sector-filter" className="sr-only">
            Filter by Sector
          </label>
          <select
            id="analytics-sector-filter"
            name="sector"
            aria-label="Filter by Sector"
            className="analytics-filter-select"
            value={filters.sector || ""}
            onChange={(e) => onFilterChange("sector", e.target.value || null)}
          >
            <option value="">SECTOR (ALL)</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="analytics-filter-icon" aria-hidden="true">▼</span>
        </div>

        {/* Agency Filter */}
        <div className="analytics-filter-select-wrapper">
          <label htmlFor="analytics-agency-filter" className="sr-only">
            Filter by Agency
          </label>
          <select
            id="analytics-agency-filter"
            name="agency"
            aria-label="Filter by Agency"
            className="analytics-filter-select"
            value={filters.agency || ""}
            onChange={(e) => onFilterChange("agency", e.target.value || null)}
          >
            <option value="">AGENCY (ALL)</option>
            {agencies.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <span className="analytics-filter-icon" aria-hidden="true">▼</span>
        </div>

        {/* Project Code Search */}
        <form onSubmit={handleProjectSubmit} className="analytics-filter-search-form">
          <label htmlFor="analytics-project-code-input" className="sr-only">
            Filter by Project Code
          </label>
          <div className="analytics-filter-input-wrapper">
            <input
              id="analytics-project-code-input"
              name="project_code"
              type="text"
              placeholder="PROJECT CODE..."
              value={projectInput}
              onChange={(e) => setProjectInput(e.target.value)}
              className="analytics-filter-input"
              aria-label="Filter by Project Code"
            />
            <button
              type="submit"
              className="analytics-filter-search-btn"
              aria-label="Apply project code filter"
            >
              <Search size={12} />
            </button>
          </div>
        </form>

        {/* Clear All Action */}
        {activeBadges.length > 0 && (
          <button
            type="button"
            className="analytics-filter-clear-all"
            onClick={onClearAll}
            aria-label="Reset all analytics filters"
          >
            <RotateCcw size={12} />
            <span>RESET FILTERS</span>
          </button>
        )}

        {/* District Structural Absence Disclosure */}
        <div className="analytics-filter-disclaimer" title="District is structurally omitted from source flash reports.">
          <span className="analytics-meta-label">DISTRICT: UNAVAILABLE</span>
        </div>
      </div>

      {/* Client Validation Error Banner */}
      {validationError && (
        <div className="analytics-filter-error-banner" role="alert">
          <AlertTriangle size={14} className="analytics-filter-error-icon" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Active Filter Chips / Badges */}
      {activeBadges.length > 0 && (
        <div className="analytics-active-chips-strip" role="region" aria-label="Active Filters">
          <span className="analytics-active-chips-label">ACTIVE FILTERS:</span>
          {activeBadges.map((b) => (
            <span key={b.key} className="analytics-filter-chip">
              <span className="analytics-filter-chip-label">{b.label}:</span>
              <span className="analytics-filter-chip-value">{b.value}</span>
              <button
                type="button"
                className="analytics-filter-chip-remove"
                onClick={() => onClearFilter(b.key)}
                aria-label={`Remove ${b.label} filter`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
