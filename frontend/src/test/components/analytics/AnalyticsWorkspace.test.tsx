import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsPage } from "@/pages/AnalyticsPage.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import * as analyticsApi from "@/api/analytics.ts";
import * as projectsApi from "@/api/projects.ts";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

vi.mock("@/api/analytics.ts", () => ({
  fetchAnalyticsOverview: vi.fn(),
  fetchAnalyticsTrends: vi.fn(),
  fetchAnalyticsGeography: vi.fn(),
  fetchAnalyticsSectors: vi.fn(),
  fetchAnalyticsAgencies: vi.fn(),
  fetchAnalyticsFinancials: vi.fn(),
  fetchAnalyticsProgress: vi.fn(),
  fetchAnalyticsRisk: vi.fn(),
}));

vi.mock("@/api/projects.ts", () => ({
  fetchFilterOptions: vi.fn(),
}));

const mockOverview = {
  unique_project_count: 4738,
  observation_count: 64608,
  earliest_observation_month: "2023-01",
  latest_observation_month: "2026-07",
  states_count: 34,
  agencies_count: 98,
  sectors_count: 14,
  districts_count: null,
  total_sanctioned_cost: 2818100.5,
  total_revised_cost: 3450000.0,
  total_cumulative_expenditure: 1980000.25,
  average_physical_progress: 68.4,
  progress_reporting_observations: 51200,
  assessed_project_count: 4120,
  financial_basis: "Latest qualifying observation per unique project within active filter scope",
  progress_basis: "Arithmetic mean of non-null physical_progress observations within active filter scope",
  coverage: {
    total_observations: 64608,
    unique_projects: 4738,
    earliest_month: "2023-01",
    latest_month: "2026-07",
    missing_original_cost_count: 120,
    missing_revised_cost_count: 15400,
    missing_cumulative_expenditure_count: 450,
    missing_physical_progress_count: 13408,
    unavailable_dimensions: {
      district: "Structurally omitted from source flash reports",
      project_status: "All flash report records represent ongoing projects",
    },
  },
};

const mockTrends = {
  items: [
    {
      report_month: "2024-01",
      observation_count: 1400,
      unique_project_count: 1250,
      total_cumulative_expenditure: 45000.0,
      average_cumulative_expenditure: 32.1,
      total_original_cost: 89000.0,
      total_revised_cost: 95000.0,
      average_physical_progress: 54.2,
      progress_reporting_count: 1200,
      risk_assessed_project_count: 1100,
      average_risk_probability: 0.284,
      average_raw_probability: 0.312,
    },
    {
      report_month: "2024-06",
      observation_count: 1550,
      unique_project_count: 1320,
      total_cumulative_expenditure: 52000.0,
      average_cumulative_expenditure: 33.5,
      total_original_cost: 92000.0,
      total_revised_cost: 99000.0,
      average_physical_progress: 58.7,
      progress_reporting_count: 1300,
      risk_assessed_project_count: 1200,
      average_risk_probability: 0.291,
      average_raw_probability: 0.320,
    },
  ],
  total_months: 2,
  earliest_month: "2024-01",
  latest_month: "2024-06",
  disclaimer: "Only observed months are included. No synthetic continuous periods or zero-months are manufactured.",
};

const mockGeography = {
  items: [
    {
      state: "MAHARASHTRA",
      unique_project_count: 480,
      observation_count: 6500,
      total_cumulative_expenditure: 120000.0,
      average_physical_progress: 72.1,
      progress_reporting_count: 5200,
      assessed_project_count: 420,
      average_risk_probability: 0.24,
    },
    {
      state: "GUJARAT",
      unique_project_count: 390,
      observation_count: 5100,
      total_cumulative_expenditure: 98000.0,
      average_physical_progress: 75.3,
      progress_reporting_count: 4300,
      assessed_project_count: 350,
      average_risk_probability: 0.21,
    },
  ],
  total_states: 2,
  district_dimension_status: "UNAVAILABLE",
  district_dimension_reason: "District is structurally omitted from source flash reports.",
};

const mockSectors = {
  items: [
    {
      sector: "RAILWAYS",
      unique_project_count: 850,
      observation_count: 14200,
      total_original_cost: 450000.0,
      total_cumulative_expenditure: 320000.0,
      average_physical_progress: 69.5,
      progress_reporting_count: 12000,
      assessed_project_count: 780,
      average_risk_probability: 0.31,
    },
    {
      sector: "ROAD TRANSPORT AND HIGHWAYS",
      unique_project_count: 1200,
      observation_count: 18500,
      total_original_cost: 650000.0,
      total_cumulative_expenditure: 410000.0,
      average_physical_progress: 64.2,
      progress_reporting_count: 15000,
      assessed_project_count: 1050,
      average_risk_probability: 0.27,
    },
  ],
  total_sectors: 2,
};

const mockAgencies = {
  items: [
    {
      agency: "NHAI",
      unique_project_count: 920,
      observation_count: 14500,
      total_original_cost: 520000.0,
      total_cumulative_expenditure: 340000.0,
      average_physical_progress: 65.1,
      progress_reporting_count: 12000,
      assessed_project_count: 810,
      average_risk_probability: 0.26,
    },
    {
      agency: "DFCCIL",
      unique_project_count: 24,
      observation_count: 480,
      total_original_cost: 85000.0,
      total_cumulative_expenditure: 72000.0,
      average_physical_progress: 88.4,
      progress_reporting_count: 480,
      assessed_project_count: 24,
      average_risk_probability: 0.19,
    },
  ],
  total_agencies: 2,
};

const mockFinancials = {
  metrics: {
    projects_with_cost: 4618,
    total_original_cost: 2818100.5,
    mean_original_cost: 610.24,
    projects_with_revised_cost: 1420,
    total_revised_cost: 3450000.0,
    mean_revised_cost: 2429.58,
    projects_with_expenditure: 4288,
    total_cumulative_expenditure: 1980000.25,
    mean_cumulative_expenditure: 461.75,
    cost_revision_projects_count: 1420,
    total_cost_escalation: 631899.5,
    overall_expenditure_to_revised_cost_ratio: 57.39,
    overall_expenditure_to_original_cost_ratio: 70.26,
  },
  aggregation_basis: "Project-level financial metrics are calculated using the latest qualifying observation per distinct project within the active filter scope to avoid multi-month row inflation.",
  observation_count: 64608,
  unique_project_count: 4738,
};

const mockProgress = {
  metrics: {
    total_observations: 64608,
    reporting_observations: 51200,
    missing_observations: 13408,
    coverage_rate: 0.7925,
    mean_physical_progress: 68.4,
    median_physical_progress: 72.0,
    min_physical_progress: 0.0,
    max_physical_progress: 100.0,
    distribution_quantiles: {
      minimum: 0.0,
      p25: 45.0,
      median: 72.0,
      p75: 91.0,
      p90: 98.0,
      p95: 100.0,
      maximum: 100.0,
      mean: 68.4,
    },
  },
  by_sector: [
    {
      sector: "RAILWAYS",
      reporting_count: 12000,
      missing_count: 2200,
      mean_physical_progress: 69.5,
    },
  ],
  progress_basis: "Missing progress values are excluded from the arithmetic mean denominator and are never imputed as 0%.",
};

const mockRisk = {
  target: "target_effective_schedule_ext_3m",
  target_label: "PRODUCTION SCHEDULE-EXTENSION RISK",
  assessed_project_count: 4120,
  assessed_observation_count: 25189,
  evaluation_earliest_month: "2023-07",
  evaluation_latest_month: "2026-04",
  calibrated_risk_distribution: {
    minimum: 0.012,
    p25: 0.145,
    median: 0.286,
    p75: 0.452,
    p90: 0.621,
    p95: 0.742,
    maximum: 0.941,
    mean: 0.315,
  },
  raw_probability_distribution: {
    minimum: 0.018,
    p25: 0.162,
    median: 0.310,
    p75: 0.491,
    p90: 0.665,
    p95: 0.781,
    maximum: 0.962,
    mean: 0.342,
  },
  regime_breakdown: [
    {
      regime: "MODERN",
      model_id: "logistic_static_only__unweighted",
      unique_project_count: 3200,
      observation_count: 18400,
      calibration_active_count: 18400,
    },
    {
      regime: "LEGACY",
      model_id: "catboost_full_v1__unweighted",
      unique_project_count: 2800,
      observation_count: 6789,
      calibration_active_count: 6789,
    },
  ],
  monthly_trend: [
    {
      evaluation_month: "2025-01",
      assessed_project_count: 1540,
      assessed_observation_count: 1540,
      mean_risk_probability: 0.285,
      mean_raw_probability: 0.312,
    },
    {
      evaluation_month: "2026-01",
      assessed_project_count: 1680,
      assessed_observation_count: 1680,
      mean_risk_probability: 0.312,
      mean_raw_probability: 0.338,
    },
  ],
  governance_notice: "Risk statistics represent model-estimated probability of 3-month schedule extension for active projects under production regime models. Unserved targets (cost overrun, progress stagnation) are unavailable. Denominator represents authentic risk-serving records.",
  unserved_targets: ["cost_overrun", "progress_stagnation"],
};

describe("Analytics Workspace & Cross-Filtering (PR-10)", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();

    vi.mocked(projectsApi.fetchFilterOptions).mockResolvedValue({
      sectors: ["RAILWAYS", "ROAD TRANSPORT AND HIGHWAYS"],
      agencies: ["NHAI", "DFCCIL"],
      states: ["MAHARASHTRA", "GUJARAT"],
      ministries: ["RAILWAYS", "ROAD TRANSPORT AND HIGHWAYS"],
      report_months: ["2026-07", "2026-06", "2024-06", "2024-01", "2023-01"],
    });

    vi.mocked(analyticsApi.fetchAnalyticsOverview).mockResolvedValue(mockOverview);
    vi.mocked(analyticsApi.fetchAnalyticsTrends).mockResolvedValue(mockTrends);
    vi.mocked(analyticsApi.fetchAnalyticsGeography).mockResolvedValue(mockGeography);
    vi.mocked(analyticsApi.fetchAnalyticsSectors).mockResolvedValue(mockSectors);
    vi.mocked(analyticsApi.fetchAnalyticsAgencies).mockResolvedValue(mockAgencies);
    vi.mocked(analyticsApi.fetchAnalyticsFinancials).mockResolvedValue(mockFinancials);
    vi.mocked(analyticsApi.fetchAnalyticsProgress).mockResolvedValue(mockProgress);
    vi.mocked(analyticsApi.fetchAnalyticsRisk).mockResolvedValue(mockRisk);
  });

  const renderWorkspace = (initialEntries = ["/analytics"]) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("1. Analytics page renders with truthful header", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getAllByText(/2023-01.*2026-07/).length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText("PORTFOLIO INTELLIGENCE & CROSS-FILTERING")).toBeInTheDocument();
    expect(screen.getByText("IRIS / ANALYTICS / PORTFOLIO WORKSPACE")).toBeInTheDocument();
  });



  it("2. Default filter state is valid and empty", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByLabelText("Filter from Month")).toBeInTheDocument();
    });
    expect((screen.getByLabelText("Filter from Month") as HTMLSelectElement).value).toBe("");
    expect((screen.getByLabelText("Filter to Month") as HTMLSelectElement).value).toBe("");
    expect((screen.getByLabelText("Filter by State") as HTMLSelectElement).value).toBe("");
    expect((screen.getByLabelText("Filter by Sector") as HTMLSelectElement).value).toBe("");
    expect((screen.getByLabelText("Filter by Agency") as HTMLSelectElement).value).toBe("");
  });

  it("3. URL filters are parsed correctly into filter inputs", async () => {
    renderWorkspace(["/analytics?state=MAHARASHTRA&sector=RAILWAYS&from_month=2024-01&to_month=2026-07"]);
    await waitFor(() => {
      expect((screen.getByLabelText("Filter by State") as HTMLSelectElement).value).toBe("MAHARASHTRA");
    });
    expect((screen.getByLabelText("Filter by Sector") as HTMLSelectElement).value).toBe("RAILWAYS");
    expect((screen.getByLabelText("Filter from Month") as HTMLSelectElement).value).toBe("2024-01");
    expect((screen.getByLabelText("Filter to Month") as HTMLSelectElement).value).toBe("2026-07");
  });

  it("4. URL state is updated when filters change", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "GUJARAT" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Filter by State"), { target: { value: "GUJARAT" } });
    await waitFor(() => {
      expect(analyticsApi.fetchAnalyticsOverview).toHaveBeenCalledWith(
        expect.objectContaining({ state: "GUJARAT" })
      );
    });
  });


  it("5. Reset/clear filters works", async () => {
    renderWorkspace(["/analytics?state=MAHARASHTRA&sector=RAILWAYS"]);
    await waitFor(() => {
      expect(screen.getByText("RESET FILTERS")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("RESET FILTERS"));
    await waitFor(() => {
      expect(screen.queryByText("RESET FILTERS")).not.toBeInTheDocument();
    });
    expect((screen.getByLabelText("Filter by State") as HTMLSelectElement).value).toBe("");
    expect((screen.getByLabelText("Filter by Sector") as HTMLSelectElement).value).toBe("");
  });

  it("6. Overview renders unique project count distinctly from observations", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("kpi-unique-projects")).toBeInTheDocument();
    });

    const uniqueProjectsCard = screen.getByTestId("kpi-unique-projects");
    expect(uniqueProjectsCard).toHaveTextContent("4,738");
    expect(uniqueProjectsCard).toHaveTextContent("DISTINCT INFRASTRUCTURE ENTITIES");

    const observationsCard = screen.getByTestId("kpi-observations");
    expect(observationsCard).toHaveTextContent("64,608");
    expect(observationsCard).toHaveTextContent("PROJECT-MONTH MONITORING RECORDS");
  });

  it("7. Trends render only supplied observed months", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("analytics-trends-section")).toBeInTheDocument();
    });

    // Toggle table view specifically within trends section
    const trendsSection = screen.getByTestId("analytics-trends-section");
    const toggleBtn = within(trendsSection).getByLabelText("Switch to accessible table view");
    fireEvent.click(toggleBtn);

    expect(within(trendsSection).getByText("2024-01")).toBeInTheDocument();
    expect(within(trendsSection).getByText("2024-06")).toBeInTheDocument();
    // No unobserved intermediate months manufactured
    expect(within(trendsSection).queryByText("2024-02")).not.toBeInTheDocument();
    expect(within(trendsSection).queryByText("2024-03")).not.toBeInTheDocument();
  });

  it("8. Geography renders state data", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("analytics-geography-section")).toBeInTheDocument();
    });

    const geoSection = screen.getByTestId("analytics-geography-section");
    const tableBtn = within(geoSection).getByLabelText("Switch to accessible table view");
    fireEvent.click(tableBtn);

    const tbody = geoSection.querySelector("tbody")!;
    expect(within(tbody).getByText("MAHARASHTRA")).toBeInTheDocument();
    expect(within(tbody).getByText("GUJARAT")).toBeInTheDocument();
  });

  it("9. Clicking a state updates the shared state (cross-filtering)", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("analytics-geography-section")).toBeInTheDocument();
    });

    const geoSection = screen.getByTestId("analytics-geography-section");
    const tableBtn = within(geoSection).getByLabelText("Switch to accessible table view");
    fireEvent.click(tableBtn);

    const filterBtn = within(geoSection).getAllByRole("button", { name: "FILTER BY STATE" })[0];
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(analyticsApi.fetchAnalyticsOverview).toHaveBeenCalledWith(
        expect.objectContaining({ state: "MAHARASHTRA" })
      );
    });
  });

  it("10. Sector cross-filtering works", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("analytics-sectors-section")).toBeInTheDocument();
    });

    const secSection = screen.getByTestId("analytics-sectors-section");
    const tableBtn = within(secSection).getByLabelText("Switch to accessible table view");
    fireEvent.click(tableBtn);

    const filterBtn = within(secSection).getAllByRole("button", { name: "FILTER BY SECTOR" })[0];
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(analyticsApi.fetchAnalyticsOverview).toHaveBeenCalledWith(
        expect.objectContaining({ sector: "RAILWAYS" })
      );
    });
  });

  it("11. Agency cross-filtering works", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("analytics-agencies-section")).toBeInTheDocument();
    });

    const agSection = screen.getByTestId("analytics-agencies-section");
    const tableBtn = within(agSection).getByLabelText("Switch to accessible table view");
    fireEvent.click(tableBtn);

    const filterBtn = within(agSection).getAllByRole("button", { name: "FILTER BY AGENCY" })[0];
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(analyticsApi.fetchAnalyticsOverview).toHaveBeenCalledWith(
        expect.objectContaining({ agency: "NHAI" })
      );
    });
  });

  it("12. Financial values preserve explicit semantics and units (Rs. crore)", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("analytics-financials-section")).toBeInTheDocument();
    });

    expect(screen.getByTestId("fin-original-cost")).toHaveTextContent("₹2,818,100.5 Cr");
    expect(screen.getByTestId("fin-revised-cost")).toHaveTextContent("₹3,450,000 Cr");
    expect(screen.getByTestId("fin-expenditure")).toHaveTextContent("₹1,980,000.25 Cr");
    expect(screen.getByTestId("fin-escalation")).toHaveTextContent("₹631,899.5 Cr");
    expect(screen.getByText(/Project-level financial metrics are calculated using the latest qualifying observation/i)).toBeInTheDocument();
  });

  it("13. Null financial values are not rendered as zero", async () => {
    vi.mocked(analyticsApi.fetchAnalyticsFinancials).mockResolvedValueOnce({
      metrics: {
        projects_with_cost: 0,
        total_original_cost: null,
        mean_original_cost: null,
        projects_with_revised_cost: 0,
        total_revised_cost: null,
        mean_revised_cost: null,
        projects_with_expenditure: 0,
        total_cumulative_expenditure: null,
        mean_cumulative_expenditure: null,
        cost_revision_projects_count: 0,
        total_cost_escalation: null,
        overall_expenditure_to_revised_cost_ratio: null,
        overall_expenditure_to_original_cost_ratio: null,
      },
      aggregation_basis: "Test basis",
      observation_count: 10,
      unique_project_count: 5,
    });

    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("fin-original-cost")).toHaveTextContent("Unavailable");
    });
    expect(screen.getByTestId("fin-original-cost")).not.toHaveTextContent("₹0");
  });

  it("14. Null progress is not rendered as 0%", async () => {
    vi.mocked(analyticsApi.fetchAnalyticsProgress).mockResolvedValueOnce({
      metrics: {
        total_observations: 100,
        reporting_observations: 0,
        missing_observations: 100,
        coverage_rate: 0.0,
        mean_physical_progress: null,
        median_physical_progress: null,
        min_physical_progress: null,
        max_physical_progress: null,
        distribution_quantiles: null,
      },
      by_sector: [],
      progress_basis: "Missing progress values are excluded from arithmetic mean denominator.",
    });

    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("progress-unavailable-state")).toBeInTheDocument();
    });
    expect(screen.getByText("Progress data unavailable for selected scope")).toBeInTheDocument();
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
  });

  it("15. Progress empty state is truthful", async () => {
    vi.mocked(analyticsApi.fetchAnalyticsProgress).mockResolvedValueOnce({
      metrics: {
        total_observations: 0,
        reporting_observations: 0,
        missing_observations: 0,
        coverage_rate: 0.0,
        mean_physical_progress: null,
        median_physical_progress: null,
        min_physical_progress: null,
        max_physical_progress: null,
        distribution_quantiles: null,
      },
      by_sector: [],
      progress_basis: "Missing progress values are excluded.",
    });

    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText("Progress data unavailable for selected scope")).toBeInTheDocument();
    });
  });

  it("16. Risk uses calibrated probability under the correct label", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("risk-calibrated-quantiles")).toBeInTheDocument();
    });

    const calibratedBox = screen.getByTestId("risk-calibrated-quantiles");
    expect(calibratedBox).toHaveTextContent("CALIBRATED RISK PROBABILITY DISTRIBUTION");
    expect(calibratedBox).toHaveTextContent("OPERATIONAL CALIBRATED PROBABILITY");
    expect(calibratedBox).toHaveTextContent("28.6%"); // Median
  });

  it("17. Raw and calibrated risk remain distinct", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("risk-raw-quantiles")).toBeInTheDocument();
    });

    const rawBox = screen.getByTestId("risk-raw-quantiles");
    expect(rawBox).toHaveTextContent("RAW MODEL PROBABILITY DISTRIBUTION");
    expect(rawBox).toHaveTextContent("UNCALIBRATED RAW MARGIN");
    expect(rawBox).toHaveTextContent("31.0%"); // Raw median ≠ calibrated median 28.6%
  });

  it("18. Risk target is schedule-extension risk", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText(/target_effective_schedule_ext_3m/i)).toBeInTheDocument();
    });
    const riskSection = screen.getByTestId("analytics-risk-section");
    expect(within(riskSection).getByText(/07\. PRODUCTION SCHEDULE-EXTENSION RISK/i)).toBeInTheDocument();
    expect(within(riskSection).getByText(/UNSERVED ML PREDICTIVE TARGETS/i)).toBeInTheDocument();
  });



  it("19. No LOW/MEDIUM/HIGH or TOP-X% classification is introduced", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("analytics-risk-section")).toBeInTheDocument();
    });

    const riskSection = screen.getByTestId("analytics-risk-section");
    expect(riskSection).not.toHaveTextContent("LOW RISK");
    expect(riskSection).not.toHaveTextContent("HIGH RISK");
    expect(riskSection).not.toHaveTextContent("CRITICAL RISK");
    expect(riskSection).not.toHaveTextContent("TOP 5%");
    expect(riskSection).not.toHaveTextContent("TOP 10%");
  });

  it("20. Risk empty state works when assessed count is zero", async () => {
    vi.mocked(analyticsApi.fetchAnalyticsRisk).mockResolvedValueOnce({
      target: "target_effective_schedule_ext_3m",
      target_label: "PRODUCTION SCHEDULE-EXTENSION RISK",
      assessed_project_count: 0,
      assessed_observation_count: 0,
      evaluation_earliest_month: null,
      evaluation_latest_month: null,
      calibrated_risk_distribution: null,
      raw_probability_distribution: null,
      regime_breakdown: [],
      monthly_trend: [],
      governance_notice: "Notice",
      unserved_targets: ["cost_overrun", "progress_stagnation"],
    });

    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByTestId("risk-empty-state")).toBeInTheDocument();
    });
    expect(screen.getByText("No served risk assessments for this selection.")).toBeInTheDocument();
  });

  it("21. API error state works and displays retry button", async () => {
    vi.mocked(analyticsApi.fetchAnalyticsOverview).mockRejectedValueOnce(
      new Error("Failed to connect to analytics repository.")
    );

    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText("Failed to load portfolio overview")).toBeInTheDocument();
    });
    expect(screen.getByText("Failed to connect to analytics repository.")).toBeInTheDocument();
    expect(screen.getByText("RETRY")).toBeInTheDocument();
  });

  it("22. Loading state works without crashing", async () => {
    vi.mocked(analyticsApi.fetchAnalyticsOverview).mockReturnValue(new Promise(() => {}));

    renderWorkspace();
    expect(screen.getByText("AGGREGATING PORTFOLIO OVERVIEW...")).toBeInTheDocument();
  });

  it("23. District is not presented as an available filter", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByLabelText("Filter by State")).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/district/i)).not.toBeInTheDocument();
    expect(screen.getByText("DISTRICT: UNAVAILABLE")).toBeInTheDocument();
  });

  it("24. Accessibility labels exist for filters and important controls", async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByRole("toolbar", { name: "Analytics Filters Toolbar" })).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Filter from Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter to Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by State")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by Sector")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by Agency")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by Project Code")).toBeInTheDocument();
  });

  it("25. Regime is passed only to risk endpoint and not to non-risk queries", async () => {
    renderWorkspace(["/analytics?regime=MODERN&state=MAHARASHTRA"]);
    await waitFor(() => {
      expect(analyticsApi.fetchAnalyticsRisk).toHaveBeenCalledWith(
        expect.objectContaining({ regime: "MODERN", state: "MAHARASHTRA" })
      );
    });

    expect(analyticsApi.fetchAnalyticsOverview).toHaveBeenCalledWith(
      expect.not.objectContaining({ regime: "MODERN" })
    );
    expect(analyticsApi.fetchAnalyticsTrends).toHaveBeenCalledWith(
      expect.not.objectContaining({ regime: "MODERN" })
    );
    expect(analyticsApi.fetchAnalyticsGeography).toHaveBeenCalledWith(
      expect.not.objectContaining({ regime: "MODERN" })
    );
  });
});
