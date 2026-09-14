/**
 * Analytics Intelligence Coordinator (PR-13)
 * Master container orchestrating truthful decision support, trend interpretation,
 * concentration insights, financial/progress realities, risk intelligence, and limitations.
 */

import React from "react";
import type {
  AgenciesResponse,
  FinancialsResponse,
  GeographyResponse,
  GlobalAnalyticsFilters,
  OverviewResponse,
  ProgressResponse,
  RiskAnalyticsFilters,
  RiskAnalyticsResponse,
  SectorsResponse,
  TrendsResponse,
} from "@/types/analytics.ts";
import { AnalyticsIntelligenceSummary } from "./AnalyticsIntelligenceSummary.tsx";
import { AnalyticsTrendInterpretation } from "./AnalyticsTrendInterpretation.tsx";
import { AnalyticsConcentrationInsights } from "./AnalyticsConcentrationInsights.tsx";
import { AnalyticsFinancialProgressInsights } from "./AnalyticsFinancialProgressInsights.tsx";
import { AnalyticsRiskIntelligence } from "./AnalyticsRiskIntelligence.tsx";
import { AnalyticsEvidenceAndLimitations } from "./AnalyticsEvidenceAndLimitations.tsx";

export interface AnalyticsIntelligenceProps {
  overview?: OverviewResponse;
  trends?: TrendsResponse;
  geography?: GeographyResponse;
  sectors?: SectorsResponse;
  agencies?: AgenciesResponse;
  financials?: FinancialsResponse;
  progress?: ProgressResponse;
  risk?: RiskAnalyticsResponse;
  globalFilters?: GlobalAnalyticsFilters;
  riskFilters?: RiskAnalyticsFilters;
  setFilter?: (key: any, value: string | null | undefined) => void;
  clearFilter?: (key: any) => void;
  clearAllFilters?: () => void;
  toggleFilter?: (key: any, value: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export const AnalyticsIntelligence: React.FC<AnalyticsIntelligenceProps> = ({
  overview,
  trends,
  geography,
  sectors,
  agencies,
  financials,
  progress,
  risk,
  globalFilters = {},
  riskFilters = {},
  setFilter,
  clearFilter: _clearFilter,
  clearAllFilters,
  toggleFilter,
  isLoading = false,
  isError = false,
  error,
  onRetry,
}) => {
  // Error state
  if (isError) {
    return (
      <section className="analytics-intelligence-section" data-testid="analytics-intelligence-error">
        <div className="analytics-intel-error-card">
          <div className="analytics-intel-badge danger">DATA UNAVAILABLE</div>
          <h3 className="analytics-intel-title">Analytics Intelligence Unavailable</h3>
          <p className="analytics-intel-subtitle">
            Failed to aggregate authoritative portfolio analytics for decision support.
            {error instanceof Error ? ` (${error.message})` : ""}
          </p>
          {onRetry && (
            <button type="button" className="analytics-intel-retry-btn" onClick={onRetry}>
              Retry Loading Analytics
            </button>
          )}
        </div>
      </section>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="analytics-intelligence-section" data-testid="analytics-intelligence-loading">
        <div className="analytics-intel-loading-card">
          <div className="analytics-intel-badge">SYNCHRONIZING</div>
          <h3 className="analytics-intel-title">Loading Analytics Intelligence...</h3>
          <p className="analytics-intel-subtitle">
            Evaluating portfolio coverage, concentration metrics, and production risk serving records.
          </p>
          <div className="analytics-intel-skeleton-grid">
            <div className="analytics-skeleton-line" />
            <div className="analytics-skeleton-line short" />
            <div className="analytics-skeleton-line" />
          </div>
        </div>
      </section>
    );
  }

  // Check if anything is loaded
  const hasData = !!(overview || trends || geography || sectors || agencies || financials || progress || risk);
  if (!hasData) {
    return (
      <section className="analytics-intelligence-section" data-testid="analytics-intelligence-empty">
        <div className="analytics-intel-empty-card">
          <div className="analytics-intel-badge">NO RECORDS</div>
          <h3 className="analytics-intel-title">No Analytics Observations Found</h3>
          <p className="analytics-intel-subtitle">
            No portfolio observation records match the currently selected filter criteria.
          </p>
          {clearAllFilters && (
            <button type="button" className="analytics-intel-retry-btn" onClick={clearAllFilters}>
              Reset All Filters
            </button>
          )}
        </div>
      </section>
    );
  }

  const hasActiveFilters = !!(
    globalFilters.from_month ||
    globalFilters.to_month ||
    globalFilters.state ||
    globalFilters.sector ||
    globalFilters.agency ||
    globalFilters.project_code ||
    riskFilters.regime
  );

  const handleExpandTimeWindow = () => {
    if (setFilter) {
      setFilter("from_month", null);
      setFilter("to_month", null);
    }
  };

  return (
    <section className="analytics-intelligence-section" data-testid="analytics-intelligence">
      {/* Section Header */}
      <div className="analytics-intelligence-header">
        <div className="header-left">
          <div className="intel-pill-row">
            <span className="intel-section-num font-mono">01.5</span>
            <span className="analytics-intel-badge primary">DECISION SUPPORT & SYNTHESIS</span>
          </div>
          <h2 className="analytics-section-title">Analytics Intelligence</h2>
          <p className="analytics-section-desc">
            Deterministic, contract-traceable interpretation of authoritative portfolio aggregations and production
            schedule-extension risk. Strict non-causality, zero invented classifications, and distinct population scopes.
          </p>
        </div>
      </div>

      {/* 1. Truthful Coverage & Denominator Summary */}
      <AnalyticsIntelligenceSummary
        overview={overview}
        risk={risk}
        isLoading={isLoading}
      />

      {/* 2. Main Intelligence Grid */}
      <div className="analytics-intel-main-grid">
        {/* Temporal Trends Interpretation */}
        <AnalyticsTrendInterpretation
          trends={trends}
          isLoading={isLoading}
        />

        {/* Categorical & Geographic Concentration */}
        <AnalyticsConcentrationInsights
          geography={geography}
          sectors={sectors}
          agencies={agencies}
          overview={overview}
          selectedState={globalFilters.state}
          selectedSector={globalFilters.sector}
          selectedAgency={globalFilters.agency}
          onToggleState={(st) => toggleFilter?.("state", st)}
          onToggleSector={(sec) => toggleFilter?.("sector", sec)}
          onToggleAgency={(ag) => toggleFilter?.("agency", ag)}
          isLoading={isLoading}
        />

        {/* Financial Commitments & Physical Progress */}
        <AnalyticsFinancialProgressInsights
          financials={financials}
          progress={progress}
          isLoading={isLoading}
        />

        {/* Production Risk Intelligence & Decision Support */}
        <AnalyticsRiskIntelligence
          risk={risk}
          selectedRegime={riskFilters.regime}
          activeProjectCode={globalFilters.project_code}
          onSelectRegime={(reg) => setFilter?.("regime", reg)}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Methodological Evidence Boundaries & Limitations */}
      <AnalyticsEvidenceAndLimitations
        onExpandTimeWindow={handleExpandTimeWindow}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearAllFilters}
      />
    </section>
  );
};
