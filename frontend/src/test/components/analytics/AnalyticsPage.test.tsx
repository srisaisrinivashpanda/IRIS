import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
  ],
  total_months: 1,
  earliest_month: "2024-01",
  latest_month: "2024-01",
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
  ],
  total_states: 1,
  district_dimension_status: "UNAVAILABLE",
  district_dimension_reason: "District is structurally omitted from source flash reports.",
};

const mockSectors = {
  items: [
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
  total_sectors: 1,
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
  ],
  total_agencies: 1,
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
      sector: "ROAD TRANSPORT AND HIGHWAYS",
      reporting_count: 15000,
      missing_count: 3500,
      mean_physical_progress: 64.2,
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
      regime: "LEGACY",
      model_id: "legacy_annexure_v1",
      unique_project_count: 1800,
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
  ],
  governance_notice: "Risk statistics represent model-estimated probability of 3-month schedule extension.",
  unserved_targets: ["cost_overrun", "progress_stagnation"],
};

describe("AnalyticsPage Real Data & Visual Fidelity", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();

    vi.mocked(projectsApi.fetchFilterOptions).mockResolvedValue({
      sectors: ["ROAD TRANSPORT AND HIGHWAYS", "POWER"],
      agencies: ["NHAI"],
      states: ["MAHARASHTRA", "DELHI"],
      ministries: ["MoRTH"],
      report_months: ["2026-07", "2026-06", "2024-06", "2024-01", "2023-01"],
    });

    vi.mocked(analyticsApi.fetchAnalyticsOverview).mockResolvedValue(mockOverview as any);
    vi.mocked(analyticsApi.fetchAnalyticsTrends).mockResolvedValue(mockTrends as any);
    vi.mocked(analyticsApi.fetchAnalyticsGeography).mockResolvedValue(mockGeography as any);
    vi.mocked(analyticsApi.fetchAnalyticsSectors).mockResolvedValue(mockSectors as any);
    vi.mocked(analyticsApi.fetchAnalyticsAgencies).mockResolvedValue(mockAgencies as any);
    vi.mocked(analyticsApi.fetchAnalyticsFinancials).mockResolvedValue(mockFinancials as any);
    vi.mocked(analyticsApi.fetchAnalyticsProgress).mockResolvedValue(mockProgress as any);
    vi.mocked(analyticsApi.fetchAnalyticsRisk).mockResolvedValue(mockRisk as any);
  });

  const renderComponent = (initialEntries = ["/analytics"]) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("renders page header and authentic dataset metadata", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/2023-01.*2026-07/).length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText("PORTFOLIO INTELLIGENCE & CROSS-FILTERING")).toBeInTheDocument();
    expect(screen.getByText("IRIS / ANALYTICS / PORTFOLIO WORKSPACE")).toBeInTheDocument();
    expect(screen.getAllByText("4,738").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("64,608").length).toBeGreaterThanOrEqual(1);
  });

  it("renders all workspace analytics sections with PR-09 authentic data", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("kpi-unique-projects")).toBeInTheDocument();
    });

    expect(screen.getByTestId("analytics-trends-section")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-geography-section")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-sectors-section")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-agencies-section")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-financials-section")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-progress-section")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-risk-section")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-coverage-section")).toBeInTheDocument();
  });

  it("populates filter options from backend and updates filter selection", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "ROAD TRANSPORT AND HIGHWAYS" })).toBeInTheDocument();
    });

    const sectorSelect = screen.getByLabelText("Filter by Sector");
    expect(sectorSelect).toBeInTheDocument();

    fireEvent.change(sectorSelect, { target: { value: "ROAD TRANSPORT AND HIGHWAYS" } });
    expect((sectorSelect as HTMLSelectElement).value).toBe("ROAD TRANSPORT AND HIGHWAYS");
  });

  it("handles loading and error states gracefully with retry button", async () => {
    vi.mocked(analyticsApi.fetchAnalyticsOverview).mockRejectedValue(new Error("Database connection lost"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText(/Database connection lost/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /RETRY/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty or null dataset responses without crashing", async () => {
    vi.mocked(analyticsApi.fetchAnalyticsOverview).mockResolvedValue({
      unique_project_count: 0,
      observation_count: 0,
      earliest_observation_month: null,
      latest_observation_month: null,
      states_count: 0,
      agencies_count: 0,
      sectors_count: 0,
      districts_count: null,
      total_sanctioned_cost: null,
      total_revised_cost: null,
      total_cumulative_expenditure: null,
      average_physical_progress: null,
      progress_reporting_observations: 0,
      assessed_project_count: 0,
      financial_basis: "",
      progress_basis: "",
      coverage: {
        total_observations: 0,
        unique_projects: 0,
        earliest_month: null,
        latest_month: null,
        missing_original_cost_count: 0,
        missing_revised_cost_count: 0,
        missing_cumulative_expenditure_count: 0,
        missing_physical_progress_count: 0,
        unavailable_dimensions: {},
      },
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("PORTFOLIO INTELLIGENCE & CROSS-FILTERING")).toBeInTheDocument();
    });

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});
