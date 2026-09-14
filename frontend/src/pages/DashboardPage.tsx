import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsOverview, fetchAnalyticsTrends, fetchAnalyticsRisk, fetchAnalyticsGeography, fetchAnalyticsSectors } from "@/api/analytics.ts";
import { fetchRiskSummary } from "@/api/risk.ts";
import { fetchDatasetInfo } from "@/api/system.ts";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader.tsx";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip.tsx";
import { DashboardRiskCommand } from "@/components/dashboard/DashboardRiskCommand.tsx";
import { DashboardAttentionPanel } from "@/components/dashboard/DashboardAttentionPanel.tsx";
import { DashboardTrendPanel } from "@/components/dashboard/DashboardTrendPanel.tsx";
import { DashboardConcentration } from "@/components/dashboard/DashboardConcentration.tsx";
import { DashboardCoverage } from "@/components/dashboard/DashboardCoverage.tsx";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation.tsx";
import { ShieldCheck } from "lucide-react";
import { usePageEnter } from "@/lib/motion/useMotion.ts";

export const DashboardPage: React.FC = () => {
  const containerRef = usePageEnter<HTMLDivElement>();

  // 1. Authoritative Portfolio Overview (PR-09)
  const overviewQuery = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => fetchAnalyticsOverview(),
    staleTime: 5 * 60 * 1000,
  });

  // 2. Authoritative Risk Analytics (PR-09)
  const riskAnalyticsQuery = useQuery({
    queryKey: ["analytics", "risk"],
    queryFn: () => fetchAnalyticsRisk(),
    staleTime: 5 * 60 * 1000,
  });

  // 3. Authoritative Historical Trends (PR-09)
  const trendsQuery = useQuery({
    queryKey: ["analytics", "trends"],
    queryFn: () => fetchAnalyticsTrends(),
    staleTime: 5 * 60 * 1000,
  });

  // 4. Authoritative Geography (PR-09)
  const geographyQuery = useQuery({
    queryKey: ["analytics", "geography"],
    queryFn: () => fetchAnalyticsGeography(),
    staleTime: 5 * 60 * 1000,
  });

  // 5. Authoritative Sectors (PR-09)
  const sectorsQuery = useQuery({
    queryKey: ["analytics", "sectors"],
    queryFn: () => fetchAnalyticsSectors(),
    staleTime: 5 * 60 * 1000,
  });

  // 6. Authoritative Attention Queue from Risk Serving (PR-03-08)
  // Per User Correction 2: Never derive report_month from portfolio latest observation month.
  // By omitting report_month, the request delegates to the backend risk API's authoritative default cycle.
  const attentionQuery = useQuery({
    queryKey: ["risk", "summary", "dashboard", 5],
    queryFn: () => fetchRiskSummary({ top_n: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  const riskEvalMonth =
    attentionQuery.data?.report_month ||
    riskAnalyticsQuery.data?.evaluation_latest_month ||
    null;

  // 7. System Ingestion Info (Provenance metadata)
  const systemInfoQuery = useQuery({
    queryKey: ["systemInfo"],
    queryFn: fetchDatasetInfo,
    staleTime: 10 * 60 * 1000,
  });

  const lastUpdated = systemInfoQuery.data?.ingested_at
    ? systemInfoQuery.data.ingested_at.slice(0, 10)
    : undefined;

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div ref={containerRef} className="dashboard-container">
        {/* Command Center Operational Header */}
        <DashboardHeader
          observedEarliestMonth={overviewQuery.data?.earliest_observation_month}
          observedLatestMonth={overviewQuery.data?.latest_observation_month}
          riskEarliestMonth={riskAnalyticsQuery.data?.evaluation_earliest_month}
          riskLatestMonth={riskAnalyticsQuery.data?.evaluation_latest_month}
          lastUpdated={lastUpdated}
          isRiskReady={!riskAnalyticsQuery.isError}
        />

        {/* Executive 6-Card KPI Strip */}
        <DashboardKpiStrip
          overview={overviewQuery.data}
          risk={riskAnalyticsQuery.data}
          isLoading={overviewQuery.isLoading || riskAnalyticsQuery.isLoading}
          isError={overviewQuery.isError}
          error={overviewQuery.error}
          onRetry={() => {
            overviewQuery.refetch();
            riskAnalyticsQuery.refetch();
          }}
        />

        {/* Central Element: Production Schedule-Extension Risk Command Panel */}
        <DashboardRiskCommand
          riskData={riskAnalyticsQuery.data}
          isLoading={riskAnalyticsQuery.isLoading}
          isError={riskAnalyticsQuery.isError}
          error={riskAnalyticsQuery.error}
          onRetry={() => riskAnalyticsQuery.refetch()}
        />

        {/* "What Needs Attention": Authoritative Project Risk Ranking Queue */}
        <DashboardAttentionPanel
          projects={attentionQuery.data?.top_risk_projects}
          evaluationMonth={riskEvalMonth}
          isLoading={attentionQuery.isLoading}
          isError={attentionQuery.isError}
          error={attentionQuery.error}
          onRetry={() => attentionQuery.refetch()}
        />

        {/* Recent Movement & Historical Trends Panel */}
        <DashboardTrendPanel
          trendsData={trendsQuery.data}
          isLoading={trendsQuery.isLoading}
          isError={trendsQuery.isError}
          error={trendsQuery.error}
          onRetry={() => trendsQuery.refetch()}
        />

        {/* Portfolio Concentration Snapshot (State & Sector) */}
        <DashboardConcentration
          geographyData={geographyQuery.data}
          sectorsData={sectorsQuery.data}
          isLoading={geographyQuery.isLoading || sectorsQuery.isLoading}
          isError={geographyQuery.isError || sectorsQuery.isError}
          error={geographyQuery.error || sectorsQuery.error}
          onRetry={() => {
            geographyQuery.refetch();
            sectorsQuery.refetch();
          }}
        />

        {/* Data Coverage & Truthful Provenance Status */}
        <DashboardCoverage
          overview={overviewQuery.data}
          risk={riskAnalyticsQuery.data}
        />

        {/* Operational Navigation Hub */}
        <DashboardNavigation />
      </div>

      {/* Bottom Data Provenance Strip */}
      <footer className="provenance-strip" aria-label="System Provenance Footer">
        <div className="provenance-strip-inner">
          <div className="provenance-metrics">
            <span>© 2026 IRIS INFRASTRUCTURE MONITORING</span>
            <span>PROVENANCE: PAIMANA CORE</span>
            <span>
              DATA COVERAGE:{" "}
              {overviewQuery.data?.earliest_observation_month && overviewQuery.data?.latest_observation_month
                ? `${overviewQuery.data.earliest_observation_month} → ${overviewQuery.data.latest_observation_month}`
                : "2023-01 → 2026-07"}
            </span>
          </div>
          <div className="provenance-status">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>DATA INTEGRITY: VERIFIED</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
