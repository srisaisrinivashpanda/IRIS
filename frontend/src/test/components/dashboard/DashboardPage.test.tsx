import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardPage } from "../../../pages/DashboardPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import * as analyticsApi from "@/api/analytics.ts";
import * as riskApi from "@/api/risk.ts";
import * as systemApi from "@/api/system.ts";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

vi.mock("@/api/analytics.ts", () => ({
  fetchAnalyticsOverview: vi.fn(),
  fetchAnalyticsTrends: vi.fn(),
  fetchAnalyticsGeography: vi.fn(),
  fetchAnalyticsSectors: vi.fn(),
  fetchAnalyticsRisk: vi.fn(),
}));

vi.mock("@/api/risk.ts", () => ({
  fetchRiskSummary: vi.fn(),
}));

vi.mock("@/api/system.ts", () => ({
  fetchDatasetInfo: vi.fn(),
}));

describe("PR-11: Dashboard Command Center", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();

    vi.mocked(systemApi.fetchDatasetInfo).mockResolvedValue({
      status: "ACTIVE",
      covered_months: ["2023-01", "2026-07"],
      row_count: 45000,
      unique_projects_count: 2189,
      canonical_sha256: "fake-sha-256",
      ingested_at: "2026-08-30T10:00:00Z",
    });

    vi.mocked(analyticsApi.fetchAnalyticsOverview).mockResolvedValue({
      unique_project_count: 2189,
      observation_count: 45000,
      earliest_observation_month: "2023-01",
      latest_observation_month: "2026-07",
      states_count: 28,
      agencies_count: 50,
      sectors_count: 14,
      districts_count: null,
      total_sanctioned_cost: 100000,
      total_revised_cost: 120000,
      total_cumulative_expenditure: 80000,
      average_physical_progress: 68.5,
      progress_reporting_observations: 30000,
      assessed_project_count: 1200,
      financial_basis: "LATEST_OBSERVATION",
      progress_basis: "REPORTING_ONLY",
      coverage: {
        total_observations: 45000,
        unique_projects: 2189,
        earliest_month: "2023-01",
        latest_month: "2026-07",
        missing_original_cost_count: 0,
        missing_revised_cost_count: 0,
        missing_cumulative_expenditure_count: 0,
        missing_physical_progress_count: 0,
        unavailable_dimensions: { district: "STRUCTURALLY_UNAVAILABLE" },
      },
    });

    vi.mocked(analyticsApi.fetchAnalyticsRisk).mockResolvedValue({
      target: "target_effective_schedule_ext_3m",
      target_label: "Schedule Extension (H=3)",
      assessed_project_count: 1200,
      assessed_observation_count: 25000,
      evaluation_earliest_month: "2024-06",
      evaluation_latest_month: "2026-04",
      calibrated_risk_distribution: {
        minimum: 0.05,
        p25: 0.22,
        median: 0.38,
        p75: 0.58,
        p90: 0.72,
        p95: 0.85,
        maximum: 0.98,
        mean: 0.40,
      },
      raw_probability_distribution: {
        minimum: 0.04,
        p25: 0.20,
        median: 0.35,
        p75: 0.55,
        p90: 0.70,
        p95: 0.82,
        maximum: 0.96,
        mean: 0.38,
      },
      regime_breakdown: [
        {
          regime: "MODERN",
          model_id: "tree_regime_modern",
          unique_project_count: 1200,
          observation_count: 25000,
          calibration_active_count: 1,
        },
      ],
      monthly_trend: [],
      governance_notice: "Audited model serving without arbitrary thresholding.",
      unserved_targets: ["cost_overrun", "progress_stagnation"],
    });

    vi.mocked(analyticsApi.fetchAnalyticsTrends).mockResolvedValue({
      items: [
        {
          report_month: "2026-03",
          observation_count: 1480,
          unique_project_count: 1190,
          total_cumulative_expenditure: 79000,
          average_cumulative_expenditure: 66.3,
          total_original_cost: 99000,
          total_revised_cost: 119000,
          average_physical_progress: 68.0,
          progress_reporting_count: 1190,
          risk_assessed_project_count: 1190,
          average_risk_probability: 0.39,
          average_raw_probability: 0.37,
        },
        {
          report_month: "2026-04",
          observation_count: 1500,
          unique_project_count: 1200,
          total_cumulative_expenditure: 80000,
          average_cumulative_expenditure: 66.6,
          total_original_cost: 100000,
          total_revised_cost: 120000,
          average_physical_progress: 68.5,
          progress_reporting_count: 1200,
          risk_assessed_project_count: 1200,
          average_risk_probability: 0.40,
          average_raw_probability: 0.38,
        },
      ],
      total_months: 2,
      earliest_month: "2026-03",
      latest_month: "2026-04",
      disclaimer: "Strictly observed months only. No synthetic interpolations.",
    });

    vi.mocked(analyticsApi.fetchAnalyticsGeography).mockResolvedValue({
      items: [
        {
          state: "Maharashtra",
          unique_project_count: 350,
          observation_count: 4500,
          total_cumulative_expenditure: 25000,
          average_physical_progress: 72.0,
          progress_reporting_count: 300,
          assessed_project_count: 250,
          average_risk_probability: 0.35,
        },
      ],
      total_states: 1,
      district_dimension_status: "UNAVAILABLE",
      district_dimension_reason: "District omitted in Flash Reports",
    });

    vi.mocked(analyticsApi.fetchAnalyticsSectors).mockResolvedValue({
      items: [
        {
          sector: "Railways",
          unique_project_count: 280,
          observation_count: 3800,
          total_original_cost: 45000,
          total_cumulative_expenditure: 32000,
          average_physical_progress: 75.0,
          progress_reporting_count: 250,
          assessed_project_count: 200,
          average_risk_probability: 0.33,
        },
      ],
      total_sectors: 1,
    });

    vi.mocked(riskApi.fetchRiskSummary).mockResolvedValue({
      report_month: "2026-04",
      regime_filter: null,
      filters: {},
      project_count: 1200,
      score_distribution: {
        minimum: 0.05,
        p25: 0.22,
        median: 0.38,
        p75: 0.58,
        p90: 0.72,
        p95: 0.85,
        maximum: 0.98,
        mean: 0.40,
      },
      top_risk_projects: [
        {
          project_code: "976809",
          project_name: "Amended BharatNet Program - ARP, NGL, MNP",
          agency: "BBNL",
          ministry: "Ministry of Communications",
          sector: "Telecommunication",
          state: "Arunachal Pradesh",
          regime: "MODERN",
          model_id: "tree_regime_modern",
          raw_probability: 0.88,
          risk_probability: 0.894,
          calibration_active: true,
          risk_rank: 1,
          risk_percentile: 0.999,
          population_size: 1200,
        },
      ],
      regimes: [],
      sector_summary: [],
    });
  });

  const renderDashboard = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DashboardPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

  it("renders command center header with identity, quick actions, and status", async () => {
    renderDashboard();

    expect(screen.getByText("PORTFOLIO COMMAND CENTER")).toBeInTheDocument();
    expect(screen.getByText("COMMAND CENTER")).toBeInTheDocument();
    expect(
      screen.getByText("Production portfolio monitoring and schedule-extension risk intelligence.")
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /VIEW ANALYTICS/i })).toHaveAttribute(
      "href",
      "/analytics"
    );
    expect(screen.getByRole("link", { name: /EXPLORE PROJECTS/i })).toHaveAttribute(
      "href",
      "/projects"
    );
    expect(screen.getByRole("link", { name: /OPEN INTELLIGENCE/i })).toHaveAttribute(
      "href",
      "/intelligence"
    );

    await waitFor(() => {
      expect(screen.getByTestId("header-observed-coverage")).toHaveTextContent("2023-01 → 2026-07");
      expect(screen.getByTestId("header-risk-coverage")).toHaveTextContent("2024-06 → 2026-04");
      expect(screen.getByText("PRODUCTION SERVING")).toBeInTheDocument();
    });
  });

  it("renders the 6-card executive KPI strip with truthful values", async () => {
    renderDashboard();

    await waitFor(() => {
      // 01: Unique Projects
      expect(screen.getByTestId("kpi-unique-projects")).toHaveTextContent("2,189");
      // 02: Monthly Observations
      expect(screen.getByTestId("kpi-observations")).toHaveTextContent("45,000");
      // 03: Cumulative Expenditure
      expect(screen.getByTestId("kpi-expenditure")).toHaveTextContent("₹80,000 Cr");
      // 04: Average Physical Progress
      expect(screen.getByTestId("kpi-progress")).toHaveTextContent("68.5%");
      // 05: Risk-Assessed Projects
      expect(screen.getByTestId("kpi-risk-assessed")).toHaveTextContent("1,200");
      // 06: Risk Window Scope
      expect(screen.getByTestId("kpi-risk-coverage")).toHaveTextContent("2024-06 → 2026-04");
    });
  });

  it("formats null physical progress as 'Unavailable', never as 0%", async () => {
    vi.mocked(analyticsApi.fetchAnalyticsOverview).mockResolvedValueOnce({
      unique_project_count: 100,
      observation_count: 500,
      earliest_observation_month: "2024-01",
      latest_observation_month: "2024-05",
      states_count: 5,
      agencies_count: 10,
      sectors_count: 3,
      districts_count: null,
      total_sanctioned_cost: null,
      total_revised_cost: null,
      total_cumulative_expenditure: null,
      average_physical_progress: null,
      progress_reporting_observations: 0,
      assessed_project_count: 0,
      financial_basis: "LATEST_OBSERVATION",
      progress_basis: "REPORTING_ONLY",
      coverage: {
        total_observations: 500,
        unique_projects: 100,
        earliest_month: "2024-01",
        latest_month: "2024-05",
        missing_original_cost_count: 0,
        missing_revised_cost_count: 0,
        missing_cumulative_expenditure_count: 0,
        missing_physical_progress_count: 500,
        unavailable_dimensions: {},
      },
    });

    renderDashboard();

    await waitFor(() => {
      const progressCell = screen.getByTestId("kpi-progress");
      expect(progressCell).toHaveTextContent("Unavailable");
      expect(progressCell).not.toHaveTextContent("0.0%");
      expect(progressCell).not.toHaveTextContent("0%");
    });
  });

  // =========================================================================
  // REQUIRED CORRECTION 1: RISK COVERAGE SEMANTICS REGRESSION TEST
  // =========================================================================
  it("CORRECTION 1 REGRESSION: does not calculate an invented 'Risk Coverage %' across independent populations", async () => {
    renderDashboard();

    await waitFor(() => {
      // 1,200 assessed projects out of 2,189 unique projects would be 54.8%
      // Ensure that this misleading percentage is NOT rendered anywhere in the KPI strip or coverage disclosures
      expect(screen.queryByText("54.8%")).not.toBeInTheDocument();
      expect(screen.queryByText(/54\.8/)).not.toBeInTheDocument();

      // Ensure assessed project count and unique project count are displayed separately as authoritative counts
      const assessedCell = screen.getByTestId("kpi-risk-assessed");
      expect(assessedCell).toHaveTextContent("1,200");
      expect(assessedCell).toHaveTextContent("05 / RISK-ASSESSED");

      const uniqueCell = screen.getByTestId("kpi-unique-projects");
      expect(uniqueCell).toHaveTextContent("2,189");
      expect(uniqueCell).toHaveTextContent("01 / UNIQUE PROJECTS");

      // The 6th KPI card displays the authoritative evaluation window, NOT an invented ratio percentage
      const windowCell = screen.getByTestId("kpi-risk-coverage");
      expect(windowCell).toHaveTextContent("06 / RISK WINDOW");
      expect(windowCell).toHaveTextContent("2024-06 → 2026-04");
      expect(windowCell).not.toHaveTextContent("%");
    });
  });

  // =========================================================================
  // REQUIRED CORRECTION 2: ATTENTION QUEUE EVALUATION MONTH REGRESSION TEST
  // =========================================================================
  it("CORRECTION 2 REGRESSION: does not request an unsupported portfolio month merely because it is the latest observation month", async () => {
    renderDashboard();

    await waitFor(() => {
      // Portfolio latest observation month is 2026-07
      // Risk serving latest evaluation cycle is 2026-04
      // Proves that the attention queue does NOT blindly pass report_month: '2026-07'
      expect(riskApi.fetchRiskSummary).toHaveBeenCalledWith({ top_n: 5 });
      expect(riskApi.fetchRiskSummary).not.toHaveBeenCalledWith(
        expect.objectContaining({ report_month: "2026-07" })
      );

      // The attention panel correctly displays the cycle returned by the risk serving layer (2026-04)
      expect(screen.getByText(/Cycle: 2026-04/i)).toBeInTheDocument();
      expect(screen.queryByText(/Cycle: 2026-07/i)).not.toBeInTheDocument();
    });
  });

  it("renders Production Schedule-Extension Risk Panel with calibrated distribution, quantiles, and separation", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("PRODUCTION SCHEDULE-EXTENSION RISK")).toBeInTheDocument();
      expect(screen.getByText(/TARGET: target_effective_schedule_ext_3m/i)).toBeInTheDocument();

      // Quantiles
      expect(screen.getAllByText("22.0%").length).toBeGreaterThanOrEqual(1); // P25
      expect(screen.getAllByText("38.0%").length).toBeGreaterThanOrEqual(1); // Median (P50)
      expect(screen.getAllByText("40.0%").length).toBeGreaterThanOrEqual(1); // Mean
      expect(screen.getAllByText("58.0%").length).toBeGreaterThanOrEqual(1); // P75
      expect(screen.getAllByText("72.0%").length).toBeGreaterThanOrEqual(1); // P90

      // Calibrated vs Raw Model Separation Notice
      expect(screen.getByTestId("probability-separation-notice")).toBeInTheDocument();
      expect(screen.getAllByText(/CALIBRATED PROBABILITY/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/RAW MODEL PROBABILITY/i)).toBeInTheDocument();

      // Regimes
      expect(screen.getAllByText("MODERN REGIME").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("tree_regime_modern")).toBeInTheDocument();
    });
  });

  it("renders Projects to Investigate attention queue ordered by risk rank with inspect and intel links", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("PROJECTS TO INVESTIGATE")).toBeInTheDocument();
      expect(
        screen.getByText(/Ranked by production-served schedule-extension risk · target: H=3/i)
      ).toBeInTheDocument();

      // Project row
      expect(screen.getByText("Amended BharatNet Program - ARP, NGL, MNP")).toBeInTheDocument();
      expect(screen.getByText("976809")).toBeInTheDocument();
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("89.4%")).toBeInTheDocument(); // Calibrated
      expect(screen.getByText("88.0%")).toBeInTheDocument(); // Raw
      expect(screen.getByText("99.9%")).toBeInTheDocument(); // Percentile

      // Action links
      const inspectLink = screen.getByRole("link", { name: "INSPECT" });
      expect(inspectLink).toHaveAttribute("href", "/projects/976809");

      const intelLink = screen.getByRole("link", { name: /Open intelligence for project/i });
      expect(intelLink).toHaveAttribute("href", "/intelligence?project=976809");
    });
  });

  it("renders Concentration snapshot with navigation into cross-filtered Analytics", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("PORTFOLIO CONCENTRATION SNAPSHOT")).toBeInTheDocument();

      // State link into analytics
      const stateLink = screen.getByRole("listitem", { name: /Maharashtra/i });
      expect(stateLink).toHaveAttribute("href", "/analytics?state=Maharashtra");

      // Sector link into analytics
      const sectorLink = screen.getByRole("listitem", { name: /Railways/i });
      expect(sectorLink).toHaveAttribute("href", "/analytics?sector=Railways");

      // District omission notice
      expect(
        screen.getByText(/District dimension is structurally omitted in primary source Flash Reports/i)
      ).toBeInTheDocument();
    });
  });

  it("renders Data Coverage and Governance disclosures truthfully", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("DATA COVERAGE & SOURCE STATUS")).toBeInTheDocument();
      expect(
        screen.getByText("target_effective_schedule_ext_3m (SERVED)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("cost_overrun (UNSERVED), progress_stagnation (UNSERVED)")
      ).toBeInTheDocument();
      expect(screen.getByText("DISTRICT = UNAVAILABLE")).toBeInTheDocument();
    });
  });

  it("renders Operational Navigation Pathways cards", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("OPERATIONAL NAVIGATION PATHWAYS")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Navigate to Project Discovery/i })
      ).toHaveAttribute("href", "/projects");
      expect(
        screen.getByRole("link", { name: /Navigate to Portfolio Analytics/i })
      ).toHaveAttribute("href", "/analytics");
      expect(
        screen.getByRole("link", { name: /Navigate to Risk Intelligence Terminal/i })
      ).toHaveAttribute("href", "/intelligence");
    });
  });

  it("toggles trend view between activity/expenditure and risk without errors", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("PORTFOLIO MOVEMENT & RECENT TRENDS")).toBeInTheDocument();
    });

    const activityTab = screen.getByRole("tab", { name: "ACTIVITY & EXPENDITURE" });
    const riskTab = screen.getByRole("tab", { name: "SCHEDULE-EXTENSION RISK" });

    expect(activityTab).toHaveAttribute("aria-selected", "true");
    expect(riskTab).toHaveAttribute("aria-selected", "false");

    await user.click(riskTab);

    expect(riskTab).toHaveAttribute("aria-selected", "true");
    expect(activityTab).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Calibrated Risk Probability (Mean %)")).toBeInTheDocument();
  });

  it("handles empty attention queue gracefully without crashing or fabricating projects", async () => {
    vi.mocked(riskApi.fetchRiskSummary).mockResolvedValueOnce({
      report_month: "2026-04",
      regime_filter: null,
      filters: {},
      project_count: 0,
      score_distribution: {
        minimum: 0,
        p25: 0,
        median: 0,
        p75: 0,
        p90: 0,
        p95: 0,
        maximum: 0,
        mean: 0,
      },
      top_risk_projects: [],
      regimes: [],
      sector_summary: [],
    });

    renderDashboard();

    await waitFor(() => {
      expect(
        screen.getByText("No project-level investigation records are available.")
      ).toBeInTheDocument();
    });
  });
});
