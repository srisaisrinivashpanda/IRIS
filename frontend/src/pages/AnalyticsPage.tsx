import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAnalyticsAgencies,
  fetchAnalyticsFinancials,
  fetchAnalyticsGeography,
  fetchAnalyticsOverview,
  fetchAnalyticsProgress,
  fetchAnalyticsRisk,
  fetchAnalyticsSectors,
  fetchAnalyticsTrends,
} from "@/api/analytics.ts";
import { fetchFilterOptions } from "@/api/projects.ts";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters.ts";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader.tsx";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar.tsx";
import { AnalyticsOverviewKpi } from "@/components/analytics/AnalyticsOverviewKpi.tsx";
import { AnalyticsTrends } from "@/components/analytics/AnalyticsTrends.tsx";
import { AnalyticsGeography } from "@/components/analytics/AnalyticsGeography.tsx";
import { AnalyticsSectors } from "@/components/analytics/AnalyticsSectors.tsx";
import { AnalyticsAgencies } from "@/components/analytics/AnalyticsAgencies.tsx";
import { AnalyticsFinancials } from "@/components/analytics/AnalyticsFinancials.tsx";
import { AnalyticsProgress } from "@/components/analytics/AnalyticsProgress.tsx";
import { AnalyticsRisk } from "@/components/analytics/AnalyticsRisk.tsx";
import { AnalyticsCoverage } from "@/components/analytics/AnalyticsCoverage.tsx";
import { AnalyticsIntelligence } from "@/components/analytics/AnalyticsIntelligence.tsx";
import { usePageEnter } from "@/lib/motion/useMotion.ts";

export const AnalyticsPage: React.FC = () => {
  const containerRef = usePageEnter<HTMLDivElement>();

  // Authoritative URL-synchronized filter state
  const {
    globalFilters,
    riskFilters,
    validationError,
    setFilter,
    clearFilter,
    clearAllFilters,
    toggleFilter,
    activeFilters,
  } = useAnalyticsFilters();

  // Authoritative filter options catalog
  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions,
    staleTime: 10 * 60 * 1000,
  });

  // Section 1: Overview
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["analytics", "overview", globalFilters],
    queryFn: () => fetchAnalyticsOverview(globalFilters),
  });

  // Section 2: Temporal Trends
  const {
    data: trendsData,
    isLoading: isTrendsLoading,
    isError: isTrendsError,
    error: trendsError,
    refetch: refetchTrends,
  } = useQuery({
    queryKey: ["analytics", "trends", globalFilters],
    queryFn: () => fetchAnalyticsTrends(globalFilters),
  });

  // Section 3: Geography (State-level)
  const {
    data: geographyData,
    isLoading: isGeographyLoading,
    isError: isGeographyError,
    error: geographyError,
    refetch: refetchGeography,
  } = useQuery({
    queryKey: ["analytics", "geography", globalFilters],
    queryFn: () => fetchAnalyticsGeography(globalFilters),
  });

  // Section 4: Sectors
  const {
    data: sectorsData,
    isLoading: isSectorsLoading,
    isError: isSectorsError,
    error: sectorsError,
    refetch: refetchSectors,
  } = useQuery({
    queryKey: ["analytics", "sectors", globalFilters],
    queryFn: () => fetchAnalyticsSectors(globalFilters),
  });

  // Section 5: Agencies
  const {
    data: agenciesData,
    isLoading: isAgenciesLoading,
    isError: isAgenciesError,
    error: agenciesError,
    refetch: refetchAgencies,
  } = useQuery({
    queryKey: ["analytics", "agencies", globalFilters],
    queryFn: () => fetchAnalyticsAgencies(globalFilters),
  });

  // Section 6: Financials
  const {
    data: financialsData,
    isLoading: isFinancialsLoading,
    isError: isFinancialsError,
    error: financialsError,
    refetch: refetchFinancials,
  } = useQuery({
    queryKey: ["analytics", "financials", globalFilters],
    queryFn: () => fetchAnalyticsFinancials(globalFilters),
  });

  // Section 7: Physical Progress
  const {
    data: progressData,
    isLoading: isProgressLoading,
    isError: isProgressError,
    error: progressError,
    refetch: refetchProgress,
  } = useQuery({
    queryKey: ["analytics", "progress", globalFilters],
    queryFn: () => fetchAnalyticsProgress(globalFilters),
  });

  // Section 8: Production Schedule Risk (incorporates risk-specific regime filter)
  const {
    data: riskData,
    isLoading: isRiskLoading,
    isError: isRiskError,
    error: riskError,
    refetch: refetchRisk,
  } = useQuery({
    queryKey: ["analytics", "risk", riskFilters],
    queryFn: () => fetchAnalyticsRisk(riskFilters),
  });

  return (
    <div ref={containerRef} className="analytics-container" data-testid="analytics-page">
      {/* Workspace Header with truthful coverage metadata */}
      <AnalyticsHeader overview={overviewData} />

      {/* Global Shared Filter Bar with Active Badges and URL Synchronization */}
      <AnalyticsFilterBar
        filters={globalFilters}
        filterOptions={filterOptions}
        activeBadges={activeFilters}
        validationError={validationError}
        onFilterChange={setFilter}
        onClearFilter={clearFilter}
        onClearAll={clearAllFilters}
      />

      {/* Portfolio Overview KPI Strip */}
      <AnalyticsOverviewKpi
        data={overviewData}
        isLoading={isOverviewLoading}
        isError={isOverviewError}
        error={overviewError}
        onRetry={() => refetchOverview()}
      />

      {/* Analytics Intelligence & Decision Support Layer (PR-13) */}
      <AnalyticsIntelligence
        overview={overviewData}
        trends={trendsData}
        geography={geographyData}
        sectors={sectorsData}
        agencies={agenciesData}
        financials={financialsData}
        progress={progressData}
        risk={riskData}
        globalFilters={globalFilters}
        riskFilters={riskFilters}
        setFilter={setFilter}
        clearFilter={clearFilter}
        clearAllFilters={clearAllFilters}
        toggleFilter={toggleFilter}
        isLoading={isOverviewLoading && isTrendsLoading && isRiskLoading}
        isError={isOverviewError && isTrendsError}
        error={overviewError || trendsError}
        onRetry={() => {
          refetchOverview();
          refetchTrends();
          refetchGeography();
          refetchSectors();
          refetchAgencies();
          refetchFinancials();
          refetchProgress();
          refetchRisk();
        }}
      />

      {/* Temporal Trends */}
      <AnalyticsTrends
        data={trendsData}
        isLoading={isTrendsLoading}
        isError={isTrendsError}
        error={trendsError}
        onRetry={() => refetchTrends()}
      />

      {/* 3-Column Categorical & Geographic Cross-Filtering Row */}
      <div className="analytics-crossfilter-row">
        <AnalyticsGeography
          data={geographyData}
          selectedState={globalFilters.state}
          onToggleState={(st) => toggleFilter("state", st)}
          isLoading={isGeographyLoading}
          isError={isGeographyError}
          error={geographyError}
          onRetry={() => refetchGeography()}
        />

        <AnalyticsSectors
          data={sectorsData}
          selectedSector={globalFilters.sector}
          onToggleSector={(sec) => toggleFilter("sector", sec)}
          isLoading={isSectorsLoading}
          isError={isSectorsError}
          error={sectorsError}
          onRetry={() => refetchSectors()}
        />

        <AnalyticsAgencies
          data={agenciesData}
          selectedAgency={globalFilters.agency}
          onToggleAgency={(ag) => toggleFilter("agency", ag)}
          isLoading={isAgenciesLoading}
          isError={isAgenciesError}
          error={agenciesError}
          onRetry={() => refetchAgencies()}
        />
      </div>

      {/* Financial Analysis (Latest Qualifying Observation per Unique Project) */}
      <AnalyticsFinancials
        data={financialsData}
        isLoading={isFinancialsLoading}
        isError={isFinancialsError}
        error={financialsError}
        onRetry={() => refetchFinancials()}
      />

      {/* Physical Progress Analysis (Excluded Missingness & Quantiles) */}
      <AnalyticsProgress
        data={progressData}
        isLoading={isProgressLoading}
        isError={isProgressError}
        error={progressError}
        onRetry={() => refetchProgress()}
      />

      {/* Production Schedule-Extension Risk Analysis */}
      <AnalyticsRisk
        data={riskData}
        selectedRegime={riskFilters.regime}
        onSelectRegime={(reg) => setFilter("regime", reg)}
        isLoading={isRiskLoading}
        isError={isRiskError}
        error={riskError}
        onRetry={() => refetchRisk()}
      />

      {/* Observational Coverage & Missingness Audit Footer */}
      <AnalyticsCoverage coverage={overviewData?.coverage} />
    </div>
  );
};
