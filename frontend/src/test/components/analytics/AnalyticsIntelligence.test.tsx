import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AnalyticsIntelligence } from "@/components/analytics/AnalyticsIntelligence.tsx";
import type {
  AgenciesResponse,
  FinancialsResponse,
  GeographyResponse,
  OverviewResponse,
  ProgressResponse,
  RiskAnalyticsResponse,
  SectorsResponse,
  TrendsResponse,
} from "@/types/analytics.ts";

// Fixture A: Distinct observation and risk windows
const mockOverview: OverviewResponse = {
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

const mockTrends: TrendsResponse = {
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
      report_month: "2026-07",
      observation_count: 1650,
      unique_project_count: 1420,
      total_cumulative_expenditure: 78000.0,
      average_cumulative_expenditure: 47.3,
      total_original_cost: 110000.0,
      total_revised_cost: 125000.0,
      average_physical_progress: 62.8,
      progress_reporting_count: 1380,
      risk_assessed_project_count: 1300,
      average_risk_probability: 0.342,
      average_raw_probability: 0.365,
    },
  ],
  total_months: 2,
  earliest_month: "2024-01",
  latest_month: "2026-07",
  disclaimer: "Only observed months are included. No synthetic continuous periods or zero-months are manufactured.",
};

const mockGeography: GeographyResponse = {
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
  total_states: 34,
  district_dimension_status: "UNAVAILABLE",
  district_dimension_reason: "District is structurally omitted from source flash reports.",
};

const mockSectors: SectorsResponse = {
  items: [
    {
      sector: "RAILWAYS",
      unique_project_count: 4738, // equals overview unique_project_count for compatible test
      observation_count: 22000,
      total_original_cost: 850000.0,
      total_cumulative_expenditure: 620000.0,
      average_physical_progress: 71.4,
      progress_reporting_count: 19500,
      assessed_project_count: 1600,
      average_risk_probability: 0.31,
    },
  ],
  total_sectors: 14,
};

const mockAgencies: AgenciesResponse = {
  items: [
    {
      agency: "NHAI",
      unique_project_count: 920,
      observation_count: 14000,
      total_original_cost: 650000.0,
      total_cumulative_expenditure: 490000.0,
      average_physical_progress: 74.2,
      progress_reporting_count: 12800,
      assessed_project_count: 880,
      average_risk_probability: 0.29,
    },
  ],
  total_agencies: 98,
};

const mockFinancials: FinancialsResponse = {
  metrics: {
    projects_with_cost: 4618,
    total_original_cost: 2818100.5,
    mean_original_cost: 610.2,
    projects_with_revised_cost: 1420,
    total_revised_cost: 3450000.0,
    mean_revised_cost: 840.5,
    projects_with_expenditure: 4288,
    total_cumulative_expenditure: 1980000.25,
    mean_cumulative_expenditure: 461.8,
    cost_revision_projects_count: 1420,
    total_cost_escalation: 631899.5,
    overall_expenditure_to_revised_cost_ratio: 57.4,
    overall_expenditure_to_original_cost_ratio: 70.3,
  },
  aggregation_basis: "Project-level financial metrics are calculated using the latest qualifying observation per distinct project within the active filter scope to avoid multi-month row inflation.",
  observation_count: 64608,
  unique_project_count: 4738,
};

const mockProgress: ProgressResponse = {
  metrics: {
    total_observations: 64608,
    reporting_observations: 51200,
    missing_observations: 13408,
    coverage_rate: 79.2,
    mean_physical_progress: 68.4,
    median_physical_progress: 72.0,
    min_physical_progress: 0.5,
    max_physical_progress: 100.0,
    distribution_quantiles: {
      minimum: 0.5,
      p25: 42.0,
      median: 72.0,
      p75: 91.5,
      p90: 98.0,
      p95: 99.5,
      maximum: 100.0,
      mean: 68.4,
    },
  },
  by_sector: [
    {
      sector: "RAILWAYS",
      reporting_count: 19500,
      missing_count: 2500,
      mean_physical_progress: 71.4,
    },
  ],
  progress_basis: "Missing progress values are excluded from the arithmetic mean denominator and are never imputed as 0%.",
};

// Fixture A: Distinct risk evaluation window (2023-07 to 2026-04) vs portfolio (2023-01 to 2026-07)
const mockRisk: RiskAnalyticsResponse = {
  target: "target_effective_schedule_ext_3m",
  target_label: "PRODUCTION SCHEDULE-EXTENSION RISK",
  assessed_project_count: 4120,
  assessed_observation_count: 48500,
  evaluation_earliest_month: "2023-07",
  evaluation_latest_month: "2026-04",
  calibrated_risk_distribution: {
    minimum: 0.02,
    p25: 0.18,
    median: 0.35,
    p75: 0.62,
    p90: 0.81,
    p95: 0.89,
    maximum: 0.96,
    mean: 0.39,
  },
  raw_probability_distribution: {
    minimum: 0.04,
    p25: 0.22,
    median: 0.38,
    p75: 0.65,
    p90: 0.83,
    p95: 0.91,
    maximum: 0.97,
    mean: 0.42,
  },
  regime_breakdown: [
    {
      regime: "MODERN",
      model_id: "logistic_static_only__unweighted",
      unique_project_count: 2450,
      observation_count: 26000,
      calibration_active_count: 2450,
    },
    {
      regime: "LEGACY",
      model_id: "catboost_full_v1__unweighted",
      unique_project_count: 1670,
      observation_count: 22500,
      calibration_active_count: 1670,
    },
  ],
  monthly_trend: [
    {
      evaluation_month: "2026-04",
      assessed_project_count: 1620,
      assessed_observation_count: 1620,
      mean_risk_probability: 0.385,
      mean_raw_probability: 0.412,
    },
  ],
  governance_notice: "Risk statistics represent model-estimated probability of 3-month schedule extension for active projects under production regime models. Unserved targets (cost overrun, progress stagnation) are unavailable. Denominator represents authentic risk-serving records.",
  unserved_targets: ["cost_overrun", "progress_stagnation"],
};

describe("PR-13: Analytics Intelligence & Decision Support Layer", () => {
  it("renders the full Analytics Intelligence workspace with valid data", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          trends={mockTrends}
          geography={mockGeography}
          sectors={mockSectors}
          agencies={mockAgencies}
          financials={mockFinancials}
          progress={mockProgress}
          risk={mockRisk}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("analytics-intelligence")).toBeInTheDocument();
    expect(screen.getByText("Analytics Intelligence")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-intelligence-summary")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-trend-interpretation")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-concentration-insights")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-financial-progress-insights")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-risk-intelligence")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-evidence-and-limitations")).toBeInTheDocument();
  });

  it("renders loading state cleanly when isLoading is true", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence isLoading={true} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("analytics-intelligence-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading Analytics Intelligence...")).toBeInTheDocument();
  });

  it("renders error state with retry button when isError is true", () => {
    const handleRetry = vi.fn();
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          isError={true}
          error={new Error("Failed to fetch analytics")}
          onRetry={handleRetry}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("analytics-intelligence-error")).toBeInTheDocument();
    expect(screen.getByText("Analytics Intelligence Unavailable")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /retry loading analytics/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when no data is provided", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence />
      </MemoryRouter>
    );

    expect(screen.getByTestId("analytics-intelligence-empty")).toBeInTheDocument();
    expect(screen.getByText("No Analytics Observations Found")).toBeInTheDocument();
  });

  it("FIXTURE A: distinguishes portfolio observation coverage from risk evaluation coverage", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          risk={mockRisk}
        />
      </MemoryRouter>
    );

    const obsCoverage = screen.getByTestId("portfolio-observation-coverage");
    expect(within(obsCoverage).getByText("2023-01 → 2026-07")).toBeInTheDocument();
    expect(within(obsCoverage).getByText("4,738")).toBeInTheDocument();
    expect(within(obsCoverage).getByText("64,608")).toBeInTheDocument();

    const riskCoverage = screen.getByTestId("risk-evaluation-coverage");
    expect(within(riskCoverage).getByText("2023-07 → 2026-04")).toBeInTheDocument();
    expect(within(riskCoverage).getByText("4,120")).toBeInTheDocument();
    expect(within(riskCoverage).getByText("48,500")).toBeInTheDocument();

    // Verify they do not invent a combined "Risk Coverage %"
    expect(screen.queryByText(/86.9% risk coverage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/coverage percentage/i)).not.toBeInTheDocument();
  });

  it("FIXTURE B: handles single-observation trend without claiming a trend", () => {
    const singlePointTrends: TrendsResponse = {
      items: [
        {
          report_month: "2025-06",
          observation_count: 1450,
          unique_project_count: 1300,
          total_cumulative_expenditure: 55000.0,
          average_cumulative_expenditure: 37.9,
          total_original_cost: 95000.0,
          total_revised_cost: 102000.0,
          average_physical_progress: 59.5,
          progress_reporting_count: 1250,
          risk_assessed_project_count: 1150,
          average_risk_probability: 0.31,
          average_raw_probability: 0.34,
        },
      ],
      total_months: 1,
      earliest_month: "2025-06",
      latest_month: "2025-06",
      disclaimer: "Only observed months are included.",
    };

    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          trends={singlePointTrends}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("trend-single-point-notice")).toBeInTheDocument();
    expect(screen.getByTestId("trend-single-point-text")).toHaveTextContent(
      "Single observation available for report month 2025-06. Insufficient observations to establish a trend."
    );
    expect(screen.queryByTestId("trend-narrative-expenditure")).not.toBeInTheDocument();
  });

  it("FIXTURE C: preserves null physical progress and does not convert to 0%", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          progress={mockProgress}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("progress-basis-notice")).toHaveTextContent(
      "Missing progress values are excluded from the arithmetic mean denominator and are never imputed as 0%."
    );
    expect(screen.getByTestId("progress-missing-obs")).toHaveTextContent("13,408");
    expect(screen.getByTestId("progress-mean-val")).toHaveTextContent("68.4%");
  });

  it("FIXTURE D: preserves filter-scoped latest observation financial basis", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          financials={mockFinancials}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("financial-basis-notice")).toHaveTextContent(
      "Latest qualifying observation per unique project within active filter scope."
    );
    expect(screen.getByTestId("cost-escalation-val")).toHaveTextContent("₹631,899.5 Cr");
  });

  it("FIXTURE E: renders structurally omitted district dimension as UNAVAILABLE", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          geography={mockGeography}
        />
      </MemoryRouter>
    );

    const disclosure = screen.getByTestId("district-dimension-disclosure");
    expect(disclosure).toHaveTextContent("DISTRICT DIMENSION: UNAVAILABLE");
    expect(disclosure).toHaveTextContent("District is structurally omitted from source flash reports.");
  });

  it("CORRECTION 2 & DENOMINATOR MISMATCH: renders exact count and suppresses share percentage when denominators are incompatible", () => {
    // Incompatible sectors: sum of project counts (200) does NOT equal overview unique_project_count (4738)
    const incompatibleSectors: SectorsResponse = {
      items: [
        {
          sector: "ROAD TRANSPORT",
          unique_project_count: 200,
          observation_count: 1200,
          total_original_cost: 40000.0,
          total_cumulative_expenditure: 25000.0,
          average_physical_progress: 65.0,
          progress_reporting_count: 1100,
          assessed_project_count: 180,
          average_risk_probability: 0.22,
        },
      ],
      total_sectors: 1,
    };

    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          sectors={incompatibleSectors}
        />
      </MemoryRouter>
    );

    // Exact count is rendered
    expect(screen.getByTestId("sector-lead-projects")).toHaveTextContent("200");
    // Incompatible notice is rendered; NO fabricated % share appears
    expect(screen.getByTestId("sector-share-incompatible")).toBeInTheDocument();
    expect(screen.queryByTestId("sector-lead-share")).not.toBeInTheDocument();
  });

  it("CORRECTION 2: renders compatible sector share when denominator provably matches overview count", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          sectors={mockSectors} // unique_project_count = 4738, matching overview
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("sector-lead-share")).toHaveTextContent("100.0% of portfolio projects");
  });

  it("CORRECTION 3: renders risk regimes dynamically without hardcoded constants", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          risk={mockRisk}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("regime-pill-MODERN")).toBeInTheDocument();
    expect(screen.getByTestId("regime-pill-LEGACY")).toBeInTheDocument();
    expect(screen.getByText("logistic_static_only__unweighted")).toBeInTheDocument();
    expect(screen.getByText("catboost_full_v1__unweighted")).toBeInTheDocument();
  });

  it("PROHIBITED LABELS: ensures no arbitrary risk tiers, TOP-X%, or AI scores exist", () => {
    const { container } = render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          trends={mockTrends}
          risk={mockRisk}
        />
      </MemoryRouter>
    );

    const fullText = container.textContent ?? "";
    expect(fullText).not.toMatch(/HIGH RISK/i);
    expect(fullText).not.toMatch(/MEDIUM RISK/i);
    expect(fullText).not.toMatch(/LOW RISK/i);
    expect(fullText).not.toMatch(/CRITICAL RISK/i);
    expect(fullText).not.toMatch(/TOP 5%/i);
    expect(fullText).not.toMatch(/TOP 10%/i);
    expect(fullText).not.toMatch(/AI Score/i);
    expect(fullText).not.toMatch(/Warning Score/i);
    expect(fullText).not.toMatch(/Composite Score/i);
  });

  it("PROBABILITY SEPARATION: keeps calibrated probability and raw model probability distinct", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          risk={mockRisk}
        />
      </MemoryRouter>
    );

    const calibratedDist = screen.getByTestId("calibrated-probability-distribution");
    expect(within(calibratedDist).getByText(/CALIBRATED RISK PROBABILITY/i)).toBeInTheDocument();
    expect(within(calibratedDist).getByText("35.0%")).toBeInTheDocument(); // median

    const rawDist = screen.getByTestId("raw-probability-distribution");
    expect(within(rawDist).getByText(/RAW MODEL PROBABILITY/i)).toBeInTheDocument();
    expect(within(rawDist).getByText("38.0%")).toBeInTheDocument(); // median
  });

  it("TARGET INTEGRITY: identifies only target_effective_schedule_ext_3m and discloses unserved targets", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          risk={mockRisk}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("served-target-chip")).toHaveTextContent(
      "Operational Horizon: 3-Month Schedule Extension"
    );
    expect(screen.getByTestId("unserved-target-cost_overrun")).toHaveTextContent(
      "cost_overrun: UNSERVED / SPECIFICATION ONLY"
    );
    expect(screen.getByTestId("unserved-target-progress_stagnation")).toHaveTextContent(
      "progress_stagnation: UNSERVED / SPECIFICATION ONLY"
    );
  });

  it("NAVIGATION: provides deep links to Intelligence Terminal and Project Detail", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          risk={mockRisk}
          globalFilters={{ project_code: "100001" }}
        />
      </MemoryRouter>
    );

    const intelLink = screen.getByTestId("link-intelligence-terminal");
    expect(intelLink).toHaveAttribute("href", "/intelligence");

    const projLink = screen.getByTestId("link-project-detail");
    expect(projLink).toHaveAttribute("href", "/projects/100001");

    const projIntelLink = screen.getByTestId("link-project-intel");
    expect(projIntelLink).toHaveAttribute("href", "/intelligence?project=100001");
  });

  it("CROSS-FILTERING: triggers toggleFilter on sector button click", () => {
    const handleToggleSector = vi.fn();
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          sectors={mockSectors}
          toggleFilter={handleToggleSector}
        />
      </MemoryRouter>
    );

    const sectorBtn = screen.getByRole("button", { name: "RAILWAYS" });
    fireEvent.click(sectorBtn);
    expect(handleToggleSector).toHaveBeenCalledWith("sector", "RAILWAYS");
  });

  it("CORRECTION 1: evaluates multi-point trends with non-causal delta interpretation", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          trends={mockTrends}
        />
      </MemoryRouter>
    );

    // Delta between 2024-01 (45,000) and 2026-07 (78,000) = 33,000
    const expItem = screen.getByTestId("trend-narrative-expenditure");
    expect(expItem).toHaveTextContent(
      "Observed cumulative expenditure increased by ₹33,000 Cr across the selected period"
    );

    // Physical progress delta between 54.2% and 62.8% = +8.6 pp
    const progItem = screen.getByTestId("trend-narrative-progress");
    expect(progItem).toHaveTextContent(
      "Average physical progress among reporting projects moved by +8.6 percentage points"
    );

    // Observation volume delta between 1,400 and 1,650 = +250
    const volItem = screen.getByTestId("trend-narrative-volume");
    expect(volItem).toHaveTextContent(
      "Reported monthly project observations moved from 1,400 in 2024-01 to 1,650 in 2026-07 (+250 observations)."
    );
  });

  it("DISCLOSURES: renders all 6 methodological evidence limitations", () => {
    render(
      <MemoryRouter>
        <AnalyticsIntelligence
          overview={mockOverview}
          risk={mockRisk}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("limitation-observational")).toBeInTheDocument();
    expect(screen.getByTestId("limitation-coverage-distinct")).toBeInTheDocument();
    expect(screen.getByTestId("limitation-unserved-domains")).toBeInTheDocument();
    expect(screen.getByTestId("limitation-district-omission")).toBeInTheDocument();
    expect(screen.getByTestId("limitation-non-imputation")).toBeInTheDocument();
    expect(screen.getByTestId("limitation-decision-support")).toBeInTheDocument();
  });
});
