import React from "react";
import type { CoverageMetadata } from "@/types/analytics.ts";

interface AnalyticsCoverageProps {
  coverage?: CoverageMetadata;
}

export const AnalyticsCoverage: React.FC<AnalyticsCoverageProps> = ({ coverage }) => {
  if (!coverage) return null;

  const totalObs = coverage.total_observations.toLocaleString();
  const uniqueProj = coverage.unique_projects.toLocaleString();
  const period = coverage.earliest_month && coverage.latest_month
    ? `${coverage.earliest_month} → ${coverage.latest_month}`
    : "—";

  const unavailable = Object.entries(coverage.unavailable_dimensions || {});

  return (
    <footer className="analytics-section-card analytics-coverage-section" data-testid="analytics-coverage-section">
      <div className="analytics-card-header">
        <div className="analytics-card-title-lockup">
          <span className="analytics-eyebrow">AUDITABLE DATA ARCHITECTURE</span>
          <h3 className="analytics-card-title">08. COVERAGE & OBSERVATIONAL PROVENANCE</h3>
        </div>
      </div>

      <div className="analytics-coverage-grid">
        {/* Coverage Scope Cell */}
        <div className="analytics-coverage-cell">
          <span className="analytics-coverage-cell-title">PORTFOLIO CADENCE</span>
          <div className="analytics-coverage-stat-row">
            <span className="analytics-coverage-stat-label">MONITORED WINDOW:</span>
            <span className="monospace font-bold">{period}</span>
          </div>
          <div className="analytics-coverage-stat-row">
            <span className="analytics-coverage-stat-label">TOTAL OBSERVATIONS:</span>
            <span className="monospace font-bold">{totalObs}</span>
          </div>
          <div className="analytics-coverage-stat-row">
            <span className="analytics-coverage-stat-label">UNIQUE PROJECTS:</span>
            <span className="monospace font-bold">{uniqueProj}</span>
          </div>
        </div>

        {/* Missingness Audits */}
        <div className="analytics-coverage-cell">
          <span className="analytics-coverage-cell-title">MISSING VALUE AUDIT</span>
          <div className="analytics-coverage-stat-row">
            <span className="analytics-coverage-stat-label">MISSING ORIGINAL COST:</span>
            <span className="monospace font-bold">{coverage.missing_original_cost_count.toLocaleString()}</span>
          </div>
          <div className="analytics-coverage-stat-row">
            <span className="analytics-coverage-stat-label">MISSING REVISED COST:</span>
            <span className="monospace font-bold">{coverage.missing_revised_cost_count.toLocaleString()}</span>
          </div>
          <div className="analytics-coverage-stat-row">
            <span className="analytics-coverage-stat-label">MISSING EXPENDITURE:</span>
            <span className="monospace font-bold">{coverage.missing_cumulative_expenditure_count.toLocaleString()}</span>
          </div>
          <div className="analytics-coverage-stat-row">
            <span className="analytics-coverage-stat-label">MISSING PHYSICAL PROGRESS:</span>
            <span className="monospace font-bold">{coverage.missing_physical_progress_count.toLocaleString()}</span>
          </div>
        </div>

        {/* Unavailable Dimensions */}
        <div className="analytics-coverage-cell">
          <span className="analytics-coverage-cell-title">UNAVAILABLE DIMENSIONS</span>
          {unavailable.map(([key, reason]) => (
            <div key={key} className="analytics-coverage-stat-row">
              <span className="analytics-coverage-stat-label">{key.toUpperCase()}:</span>
              <span className="analytics-coverage-stat-reason">{reason}</span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};
