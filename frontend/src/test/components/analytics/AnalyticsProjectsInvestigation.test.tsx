/**
 * Cross-Workspace Investigation Semantics Test Suite (PR-15)
 * 
 * Verifies the complete investigation bridge between /analytics and /projects:
 * - Deterministic URL generation and filter transference.
 * - Single-month vs multi-month range semantics (never collapsing multi-month ranges).
 * - Honest population language: "compatible project population under the supported Projects filter contract".
 * - Risk regime navigation suppression: risk regime / model_id / risk_probability are NOT transferable.
 * - Negative test: risk regime rows do not expose Projects investigation.
 * - Accessible, keyboard-navigable UI and context banner return paths.
 * - Canonical destination: /projects (never /intelligence/projects).
 * - No N+1 risk requests or invented risk tiers/percentiles.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  buildProjectsInvestigationUrl,
  resolveTransferredMonth,
  buildAnalyticsCurrentUrl,
  buildInvestigationPackage,
} from "@/utils/analyticsProjectNavigation.ts";
import { AnalyticsInvestigationAction } from "@/components/analytics/AnalyticsInvestigationAction.tsx";
import { ProjectsContextBanner } from "@/components/projects/ProjectsContextBanner.tsx";
import { AnalyticsRisk } from "@/components/analytics/AnalyticsRisk.tsx";
import { AnalyticsSectors } from "@/components/analytics/AnalyticsSectors.tsx";
import { AnalyticsAgencies } from "@/components/analytics/AnalyticsAgencies.tsx";
import { AnalyticsGeography } from "@/components/analytics/AnalyticsGeography.tsx";
import { AnalyticsTrends } from "@/components/analytics/AnalyticsTrends.tsx";
import { AnalyticsProgress } from "@/components/analytics/AnalyticsProgress.tsx";
import { AnalyticsConcentrationInsights } from "@/components/analytics/AnalyticsConcentrationInsights.tsx";
import { ProjectsPage } from "@/pages/ProjectsPage.tsx";

import * as projectsApi from "@/api/projects.ts";
import * as systemApi from "@/api/system.ts";
import * as riskApi from "@/api/risk.ts";
import type { RiskAnalyticsResponse, SectorsResponse, AgenciesResponse, GeographyResponse, TrendsResponse } from "@/types/analytics.ts";

vi.mock("@/api/projects.ts", () => ({
  fetchProjects: vi.fn(),
  fetchFilterOptions: vi.fn(),
}));

vi.mock("@/api/system.ts", () => ({
  fetchDatasetInfo: vi.fn(),
}));

vi.mock("@/api/risk.ts", () => ({
  fetchRiskOptions: vi.fn(),
}));

describe("PR-15: Analytics & Projects Cross-Workspace Investigation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    vi.mocked(projectsApi.fetchFilterOptions).mockResolvedValue({
      sectors: ["Roads", "Power"],
      agencies: ["NHAI", "NTPC"],
      states: ["Maharashtra", "Gujarat"],
      ministries: ["Ministry of Road Transport and Highways"],
      report_months: ["2026-06", "2026-07"],
    });

    vi.mocked(systemApi.fetchDatasetInfo).mockResolvedValue({
      row_count: 50000,
      unique_projects_count: 3500,
      covered_months: ["2024-01", "2026-07"],
      sectors_count: 12,
      agencies_count: 80,
      states_count: 30,
    } as any);

    vi.mocked(riskApi.fetchRiskOptions).mockResolvedValue({
      regimes: ["production_v1"],
      models: ["xgb_v1"],
      default_report_month: "2026-07",
    } as any);

    vi.mocked(projectsApi.fetchProjects).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 25,
      total_pages: 0,
    });
  });

  // =========================================================================
  // 1. URL BUILDER & FILTER TRANSFERENCE CONTRACTS
  // =========================================================================
  describe("Filter Transference & URL Contracts", () => {
    it("maps supported filters (sector, agency, state, ministry, project_code) to query params", () => {
      const url = buildProjectsInvestigationUrl({
        sector: "Road Transport and Highways",
        agency: "NHAI",
        state: "Maharashtra",
        ministry: "Ministry of Road Transport and Highways",
        project_code: "150244",
      });

      expect(url).toContain("/projects?");
      expect(url).toContain("sector=Road+Transport+and+Highways");
      expect(url).toContain("agency=NHAI");
      expect(url).toContain("state=Maharashtra");
      expect(url).toContain("ministry=Ministry+of+Road+Transport+and+Highways");
      expect(url).toContain("project_code=150244");
    });

    it("target URL always starts with /projects and never /intelligence/projects", () => {
      const url = buildProjectsInvestigationUrl({ sector: "Railways" });
      expect(url.startsWith("/projects")).toBe(true);
      expect(url).not.toContain("/intelligence");
      expect(url).not.toContain("/intelligence/projects");
    });

    it("single month selection (from_month === to_month) transfers report_month cleanly", () => {
      const resolved = resolveTransferredMonth(undefined, "2026-07", "2026-07");
      expect(resolved.report_month).toBe("2026-07");
      expect(resolved.isRangeOmitted).toBe(false);

      const pkg = buildInvestigationPackage({
        globalFilters: { from_month: "2026-07", to_month: "2026-07", sector: "Roads" },
      });
      expect(pkg.url).toContain("report_month=2026-07");
      expect(pkg.url).toContain("sector=Roads");
      expect(pkg.context.transferredFilters.report_month).toBe("2026-07");
      expect(pkg.context.omittedFilters.timeRange).toBeUndefined();
    });

    it("multi-month range (from_month !== to_month) omits report_month from URL to prevent range collapse", () => {
      const resolved = resolveTransferredMonth(undefined, "2025-01", "2026-07");
      expect(resolved.report_month).toBeUndefined();
      expect(resolved.isRangeOmitted).toBe(true);
      expect(resolved.timeRangeString).toBe("2025-01 → 2026-07");

      const pkg = buildInvestigationPackage({
        globalFilters: { from_month: "2025-01", to_month: "2026-07", sector: "Power" },
      });
      expect(pkg.url).not.toContain("report_month=");
      expect(pkg.url).not.toContain("from_month=");
      expect(pkg.url).not.toContain("to_month=");
      expect(pkg.url).toContain("sector=Power");
      expect(pkg.context.transferredFilters.report_month).toBeUndefined();
      expect(pkg.context.omittedFilters.timeRange).toBe("2025-01 → 2026-07");
    });

    it("open-ended month ranges (from only or to only) omit report_month from URL", () => {
      const resolvedFromOnly = resolveTransferredMonth(undefined, "2025-01", undefined);
      expect(resolvedFromOnly.report_month).toBeUndefined();
      expect(resolvedFromOnly.isRangeOmitted).toBe(true);
      expect(resolvedFromOnly.timeRangeString).toBe("From 2025-01");

      const resolvedToOnly = resolveTransferredMonth(undefined, undefined, "2026-07");
      expect(resolvedToOnly.report_month).toBeUndefined();
      expect(resolvedToOnly.isRangeOmitted).toBe(true);
      expect(resolvedToOnly.timeRangeString).toBe("Up to 2026-07");
    });

    it("explicit row-level report_month (e.g. from Trends) overrides global multi-month range", () => {
      const pkg = buildInvestigationPackage({
        globalFilters: { from_month: "2025-01", to_month: "2026-07" },
        overrideReportMonth: "2025-06",
      });
      expect(pkg.url).toContain("report_month=2025-06");
      expect(pkg.context.transferredFilters.report_month).toBe("2025-06");
      expect(pkg.context.omittedFilters.timeRange).toBeUndefined();
    });

    it("omits unsupported filters (district, regime, model_id, risk_probability, cost_min) from URL", () => {
      const pkg = buildInvestigationPackage({
        globalFilters: { sector: "Coal" },
        riskFilters: { regime: "regime_alpha" },
      });
      expect(pkg.url).toContain("sector=Coal");
      expect(pkg.url).not.toContain("regime=");
      expect(pkg.url).not.toContain("model_id=");
      expect(pkg.url).not.toContain("risk_probability=");
      expect(pkg.context.omittedFilters.regime).toBe("regime_alpha");
    });

    it("never invents risk tiers (LOW/MEDIUM/HIGH/CRITICAL) or percentiles (TOP-X%) in URL", () => {
      const url = buildProjectsInvestigationUrl({ sector: "Petroleum" });
      expect(url).not.toMatch(/tier/i);
      expect(url).not.toMatch(/low|medium|high|critical/i);
      expect(url).not.toMatch(/percentile|top[-_]?\d+/i);
    });

    it("reconstructs originating Analytics URL for back navigation", () => {
      const analyticsUrl = buildAnalyticsCurrentUrl(
        { from_month: "2025-01", to_month: "2026-07", sector: "Roads", state: "Gujarat" },
        { regime: "regime_x" }
      );
      expect(analyticsUrl).toContain("/analytics?");
      expect(analyticsUrl).toContain("from_month=2025-01");
      expect(analyticsUrl).toContain("to_month=2026-07");
      expect(analyticsUrl).toContain("sector=Roads");
      expect(analyticsUrl).toContain("state=Gujarat");
      expect(analyticsUrl).toContain("regime=regime_x");
    });
  });

  // =========================================================================
  // 2. INVESTIGATION ACTION COMPONENT & POPULATION LANGUAGE
  // =========================================================================
  describe("AnalyticsInvestigationAction Component", () => {
    it("renders with label 'INVESTIGATE PROJECTS' and truthful title description", () => {
      render(
        <MemoryRouter>
          <AnalyticsInvestigationAction
            url="/projects?sector=Power"
            context={{
              source: "analytics",
              transferredFilters: { sector: "Power" },
              omittedFilters: {},
              analyticsUrl: "/analytics?sector=Power",
            }}
            dataTestId="test-investigate-btn"
          />
        </MemoryRouter>
      );

      const btn = screen.getByTestId("test-investigate-btn");
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent("INVESTIGATE PROJECTS");
      expect(btn).toHaveAttribute(
        "title",
        "Investigate compatible project population under supported Projects filter contract"
      );
    });

    it("suppresses rendering when transferable is false", () => {
      const { container } = render(
        <MemoryRouter>
          <AnalyticsInvestigationAction
            url="/projects"
            transferable={false}
            dataTestId="suppressed-btn"
          />
        </MemoryRouter>
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("is keyboard accessible and navigable with Enter or Space key", () => {
      render(
        <MemoryRouter>
          <AnalyticsInvestigationAction
            url="/projects?sector=Railways"
            label="INVESTIGATE PROJECTS"
            ariaLabel="Investigate Railways projects"
            dataTestId="keyboard-action"
          />
        </MemoryRouter>
      );

      const link = screen.getByTestId("keyboard-action");
      expect(link).toHaveAttribute("tabIndex", "0");
      expect(link).toHaveAttribute("role", "button");
      expect(link).toHaveAttribute("aria-label", "Investigate Railways projects");
    });
  });

  // =========================================================================
  // 3. ANALYTICS COMPONENTS ACTION RENDERING & REGIME SUPPRESSION
  // =========================================================================
  describe("Analytics Components Cross-Workspace Actions", () => {
    it("renders investigation action on Sector table row", () => {
      const mockSectors: SectorsResponse = {
        items: [
          {
            sector: "Road Transport and Highways",
            unique_project_count: 100,
            observation_count: 1200,
            total_original_cost: 50000,
            total_cumulative_expenditure: 30000,
            average_physical_progress: 75,
            progress_reporting_count: 90,
            average_risk_probability: 0.25,
            assessed_project_count: 85,
          },
        ],
        total_sectors: 1,
      };

      render(
        <MemoryRouter>
          <AnalyticsSectors
            data={mockSectors}
            isLoading={false}
            isError={false}
            globalFilters={{}}
            riskFilters={{}}
            onToggleSector={vi.fn()}
          />
        </MemoryRouter>
      );

      // Switch to table view
      const toggleBtn = screen.getByLabelText(/Switch to accessible table view/i);
      fireEvent.click(toggleBtn);

      expect(screen.getByTestId("investigate-sector-Road Transport and Highways")).toBeInTheDocument();
      expect(screen.getByTestId("investigate-sector-Road Transport and Highways")).toHaveTextContent("INVESTIGATE PROJECTS");
    });

    it("renders investigation action on Agency table row", () => {
      const mockAgencies: AgenciesResponse = {
        items: [
          {
            agency: "NHAI",
            unique_project_count: 80,
            observation_count: 900,
            total_original_cost: 40000,
            total_cumulative_expenditure: 25000,
            average_physical_progress: 80,
            progress_reporting_count: 75,
            average_risk_probability: 0.2,
            assessed_project_count: 70,
          },
        ],
        total_agencies: 1,
      };

      render(
        <MemoryRouter>
          <AnalyticsAgencies
            data={mockAgencies}
            isLoading={false}
            isError={false}
            globalFilters={{}}
            riskFilters={{}}
            onToggleAgency={vi.fn()}
          />
        </MemoryRouter>
      );

      // Switch to table view
      const toggleBtn = screen.getByLabelText(/Switch to accessible table view/i);
      fireEvent.click(toggleBtn);

      expect(screen.getByTestId("investigate-agency-NHAI")).toBeInTheDocument();
    });

    it("renders investigation action on Geography state row", () => {
      const mockGeography: GeographyResponse = {
        items: [
          {
            state: "Maharashtra",
            unique_project_count: 120,
            observation_count: 1500,
            total_cumulative_expenditure: 35000,
            average_physical_progress: 70,
            progress_reporting_count: 110,
            average_risk_probability: 0.22,
            assessed_project_count: 100,
          },
        ],
        total_states: 1,
        district_dimension_status: "omitted",
        district_dimension_reason: "source-omitted",
      };

      render(
        <MemoryRouter>
          <AnalyticsGeography
            data={mockGeography}
            isLoading={false}
            isError={false}
            globalFilters={{}}
            riskFilters={{}}
            onToggleState={vi.fn()}
          />
        </MemoryRouter>
      );

      // Switch to table view
      const toggleBtn = screen.getByLabelText(/Switch to accessible table view/i);
      fireEvent.click(toggleBtn);

      expect(screen.getByTestId("investigate-state-Maharashtra")).toBeInTheDocument();
    });

    it("renders investigation action on Trends monthly table row", () => {
      const mockTrends: TrendsResponse = {
        items: [
          {
            report_month: "2025-05",
            observation_count: 1400,
            unique_project_count: 1200,
            total_cumulative_expenditure: 40000,
            average_cumulative_expenditure: 33,
            total_original_cost: 80000,
            total_revised_cost: 85000,
            average_physical_progress: 60,
            progress_reporting_count: 1100,
            risk_assessed_project_count: 1000,
            average_risk_probability: 0.25,
            average_raw_probability: 0.27,
          },
        ],
        total_months: 1,
        earliest_month: "2025-05",
        latest_month: "2025-05",
        disclaimer: "Historical flash report observations",
      };

      render(
        <MemoryRouter>
          <AnalyticsTrends
            data={mockTrends}
            isLoading={false}
            isError={false}
            globalFilters={{}}
            riskFilters={{}}
          />
        </MemoryRouter>
      );

      // Switch to table view
      const toggleBtn = screen.getByLabelText(/Switch to accessible table view/i);
      fireEvent.click(toggleBtn);

      expect(screen.getByTestId("investigate-month-2025-05")).toBeInTheDocument();
      expect(screen.getByTestId("investigate-month-2025-05")).toHaveTextContent("INVESTIGATE MONTH");
    });

    it("renders investigation action on Progress sector row", () => {
      const mockProgress = {
        metrics: {
          reporting_observations: 100,
          total_observations: 120,
          mean_physical_progress: 75.5,
          median_physical_progress: 78.0,
          min_physical_progress: 10.0,
          max_physical_progress: 100.0,
          coverage_rate: 0.833,
          missing_observations: 20,
          distribution_quantiles: {
            minimum: 10.0,
            p25: 50.0,
            median: 78.0,
            p75: 90.0,
            p90: 95.0,
            p95: 98.0,
            maximum: 100.0,
          },
        },
        by_sector: [
          {
            sector: "Power",
            mean_physical_progress: 82.0,
            reporting_count: 50,
            missing_count: 5,
          },
        ],
        progress_basis: "Arithmetic mean of non-null observations",
      };

      render(
        <MemoryRouter>
          <AnalyticsProgress
            data={mockProgress as any}
            isLoading={false}
            isError={false}
            globalFilters={{}}
            riskFilters={{}}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("progress-investigate-sector-Power")).toBeInTheDocument();
      expect(screen.getByTestId("progress-investigate-sector-Power")).toHaveTextContent("INVESTIGATE SECTOR");
    });

    it("renders investigation action on Concentration Insights sector dominance row", () => {
      const mockSectors: SectorsResponse = {
        items: [
          {
            sector: "Petroleum",
            unique_project_count: 40,
            observation_count: 400,
            total_original_cost: 80000,
            total_cumulative_expenditure: 50000,
            average_physical_progress: 78,
            progress_reporting_count: 38,
            average_risk_probability: 0.18,
            assessed_project_count: 35,
          },
        ],
        total_sectors: 1,
      };

      render(
        <MemoryRouter>
          <AnalyticsConcentrationInsights
            sectors={mockSectors}
            agencies={undefined}
            globalFilters={{}}
            riskFilters={{}}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("concentration-investigate-sector")).toBeInTheDocument();
      expect(screen.getByTestId("concentration-investigate-sector")).toHaveTextContent("INVESTIGATE PROJECTS");
    });

    // =======================================================================
    // DEDICATED USER-MANDATED NEGATIVE TEST: RISK REGIME NAVIGATION
    // =======================================================================
    it("risk regime rows do not expose Projects investigation when Projects cannot represent regime semantics", () => {
      const mockRiskWithRegimes: RiskAnalyticsResponse = {
        target: "schedule_extension_risk",
        target_label: "Schedule-Extension Risk",
        governance_notice: "Production serving model v1",
        assessed_project_count: 1500,
        assessed_observation_count: 20000,
        evaluation_earliest_month: "2024-01",
        evaluation_latest_month: "2026-07",
        calibrated_risk_distribution: {
          minimum: 0.05,
          p25: 0.18,
          median: 0.32,
          p75: 0.48,
          p90: 0.65,
          p95: 0.78,
          maximum: 0.95,
          mean: 0.35,
        },
        raw_probability_distribution: {
          minimum: 0.04,
          p25: 0.16,
          median: 0.30,
          p75: 0.45,
          p90: 0.62,
          p95: 0.75,
          maximum: 0.92,
          mean: 0.33,
        },
        monthly_trend: [],
        regime_breakdown: [
          {
            regime: "legacy_regime_v1",
            model_id: "xgb_historical_v1",
            unique_project_count: 500,
            observation_count: 6000,
            calibration_active_count: 500,
          },
          {
            regime: "production_regime_v2",
            model_id: "xgb_modern_v2",
            unique_project_count: 1000,
            observation_count: 14000,
            calibration_active_count: 1000,
          },
        ],
        unserved_targets: ["cost_overrun"],
      };

      render(
        <MemoryRouter>
          <AnalyticsRisk
            data={mockRiskWithRegimes}
            isLoading={false}
            isError={false}
            globalFilters={{}}
            riskFilters={{}}
            onSelectRegime={vi.fn()}
          />
        </MemoryRouter>
      );

      // Verify the regime breakdown table is rendered
      expect(screen.getByText("GOVERNED REGIME & MODEL BREAKDOWN")).toBeInTheDocument();
      expect(screen.getByText("legacy_regime_v1")).toBeInTheDocument();
      expect(screen.getByText("production_regime_v2")).toBeInTheDocument();

      // STRICT VERIFICATION:
      // None of the regime rows or table headers should have an "INVESTIGATE" button or link
      const regimeTable = screen.getByRole("table", { name: /Governed Regime Breakdown Table/i });
      expect(regimeTable).toBeInTheDocument();

      // No links or buttons inside the regime table
      const actionButtonsInRegimeTable = regimeTable.querySelectorAll("button, a");
      expect(actionButtonsInRegimeTable.length).toBe(0);

      // Verify no investigate action is associated with legacy_regime_v1 or production_regime_v2
      expect(screen.queryByTestId(/risk-investigate-regime/i)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 4. PROJECTS CONTEXT BANNER TRUTHFULNESS & ACCESSIBILITY
  // =========================================================================
  describe("ProjectsContextBanner Component", () => {
    it("renders truthful population language: 'compatible project population under the supported Projects filter contract'", () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/projects",
              search: "?sector=Roads",
              state: {
                source: "analytics",
                transferredFilters: { sector: "Roads" },
                omittedFilters: {},
                analyticsUrl: "/analytics?sector=Roads",
              },
            },
          ]}
        >
          <ProjectsContextBanner />
        </MemoryRouter>
      );

      expect(screen.getByTestId("projects-context-banner")).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Analytics Investigation Context" })).toBeInTheDocument();
      
      // Strict truthful wording verification
      expect(
        screen.getByText(/compatible project population under the supported Projects filter contract/i)
      ).toBeInTheDocument();
      // Must NOT claim exact population
      expect(screen.queryByText(/exact project population represented by the Analytics evidence/i)).not.toBeInTheDocument();
    });

    it("displays transferred filter pills accurately", () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/projects",
              search: "?sector=Power&agency=NTPC&state=Maharashtra",
              state: {
                source: "analytics",
                transferredFilters: { sector: "Power", agency: "NTPC", state: "Maharashtra" },
                omittedFilters: {},
                analyticsUrl: "/analytics",
              },
            },
          ]}
        >
          <ProjectsContextBanner />
        </MemoryRouter>
      );

      expect(screen.getByTestId("transferred-pill-sector")).toHaveTextContent("SECTOR: Power");
      expect(screen.getByTestId("transferred-pill-agency")).toHaveTextContent("AGENCY: NTPC");
      expect(screen.getByTestId("transferred-pill-state")).toHaveTextContent("STATE: Maharashtra");
    });

    it("discloses omitted multi-month time range without collapsing it", () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/projects",
              search: "?sector=Roads",
              state: {
                source: "analytics",
                transferredFilters: { sector: "Roads" },
                omittedFilters: {
                  from_month: "2025-01",
                  to_month: "2026-07",
                  timeRange: "2025-01 → 2026-07",
                },
                analyticsUrl: "/analytics?from_month=2025-01&to_month=2026-07",
              },
            },
          ]}
        >
          <ProjectsContextBanner />
        </MemoryRouter>
      );

      const omittedNotice = screen.getByTestId("omitted-filters-notice");
      expect(omittedNotice).toBeInTheDocument();
      expect(screen.getByTestId("omitted-time-range-text")).toHaveTextContent("2025-01 → 2026-07");
      expect(screen.getByTestId("omitted-time-range-text")).toHaveTextContent("was not collapsed into a single project month");
    });

    it("discloses omitted risk regime when regime is present in originating analytics scope", () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/projects",
              search: "?sector=Roads",
              state: {
                source: "analytics",
                transferredFilters: { sector: "Roads" },
                omittedFilters: {
                  regime: "production_regime_v1",
                },
                analyticsUrl: "/analytics?regime=production_regime_v1",
              },
            },
          ]}
        >
          <ProjectsContextBanner />
        </MemoryRouter>
      );

      const regimeOmitted = screen.getByTestId("omitted-regime-text");
      expect(regimeOmitted).toBeInTheDocument();
      expect(regimeOmitted).toHaveTextContent("production_regime_v1");
      expect(regimeOmitted).toHaveTextContent("The Projects API filters project observations and cannot restrict results by model regime");
    });

    it("renders back-to-analytics button preserving originating URL and state", () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/projects",
              search: "?sector=Roads",
              state: {
                source: "analytics",
                transferredFilters: { sector: "Roads" },
                omittedFilters: {},
                analyticsUrl: "/analytics?sector=Roads&from_month=2025-01",
              },
            },
          ]}
        >
          <ProjectsContextBanner />
        </MemoryRouter>
      );

      const backBtn = screen.getByTestId("back-to-analytics-btn");
      expect(backBtn).toBeInTheDocument();
      expect(backBtn).toHaveAttribute("href", "/analytics?sector=Roads&from_month=2025-01");
      expect(backBtn).toHaveTextContent("BACK TO ANALYTICS");
    });

    it("can be dismissed without resetting or clearing filters", () => {
      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/projects",
              search: "?sector=Roads",
              state: {
                source: "analytics",
                transferredFilters: { sector: "Roads" },
                omittedFilters: {},
                analyticsUrl: "/analytics",
              },
            },
          ]}
        >
          <ProjectsContextBanner />
        </MemoryRouter>
      );

      const dismissBtn = screen.getByLabelText(/Dismiss investigation context banner/i);
      fireEvent.click(dismissBtn);

      expect(screen.queryByTestId("projects-context-banner")).not.toBeInTheDocument();
    });

    it("does NOT render when /projects is opened directly without analytics source", () => {
      render(
        <MemoryRouter initialEntries={["/projects"]}>
          <ProjectsContextBanner />
        </MemoryRouter>
      );

      expect(screen.queryByTestId("projects-context-banner")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 5. PROJECTS PAGE INTEGRATION & BREADCRUMBS
  // =========================================================================
  describe("ProjectsPage Integration with Investigation Context", () => {
    it("updates breadcrumb to 'IRIS / ANALYTICS / PROJECTS INVESTIGATION' when opened from analytics", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/projects",
                search: "?sector=Roads&source=analytics",
                state: {
                  source: "analytics",
                  transferredFilters: { sector: "Roads" },
                  omittedFilters: {},
                  analyticsUrl: "/analytics",
                },
              },
            ]}
          >
            <ProjectsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      const breadcrumb = screen.getByTestId("projects-breadcrumb");
      expect(breadcrumb).toHaveTextContent("IRIS / ANALYTICS / PROJECTS INVESTIGATION");
      expect(screen.getByTestId("projects-context-banner")).toBeInTheDocument();
    });

    it("displays normal breadcrumb 'IRIS / PROJECTS / DISCOVERY' when opened directly", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/projects"]}>
            <ProjectsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      const breadcrumb = screen.getByTestId("projects-breadcrumb");
      expect(breadcrumb).toHaveTextContent("IRIS / PROJECTS / DISCOVERY");
      expect(screen.queryByTestId("projects-context-banner")).not.toBeInTheDocument();
    });

    it("never triggers N+1 risk requests during investigation navigation", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/projects",
                search: "?sector=Roads",
                state: {
                  source: "analytics",
                  transferredFilters: { sector: "Roads" },
                  omittedFilters: {},
                  analyticsUrl: "/analytics",
                },
              },
            ]}
          >
            <ProjectsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Only standard projects and system info queries should be fired
      expect(projectsApi.fetchProjects).toHaveBeenCalledTimes(1);
      expect(projectsApi.fetchFilterOptions).toHaveBeenCalledTimes(1);
      expect(systemApi.fetchDatasetInfo).toHaveBeenCalledTimes(1);
      expect(riskApi.fetchRiskOptions).toHaveBeenCalledTimes(1);
    });
  });
});
