import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectDetailPage } from "../../../pages/ProjectDetailPage";
import { ProjectRiskIntelligenceSection } from "../../../components/project-detail/ProjectRiskIntelligenceSection";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import * as projectsApi from "@/api/projects.ts";
import type { ProjectRiskIntelligenceResponse } from "@/types/project.ts";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// Mock the projects API
vi.mock("@/api/projects.ts", () => ({
  fetchProjectDetail: vi.fn(),
  fetchLatestSnapshot: vi.fn(),
  fetchProjectTrajectory: vi.fn(),
  fetchCostRevisions: vi.fn(),
  fetchScheduleExtensions: vi.fn(),
  fetchProjectRiskIntelligence: vi.fn(),
}));

const mockAssessedResponse: ProjectRiskIntelligenceResponse = {
  project: {
    project_code: "617936",
    project_name: "Dedicated Freight Corridor (Western)",
    agency: "DFCCIL",
    ministry: "RAILWAYS",
    sector: "RAILWAYS",
    state: "MAHARASHTRA",
    legacy_ocms_code: null,
    pmgid: null,
  },
  snapshot: {
    report_month: "2026-07",
    physical_progress: 92.5,
    financial_progress: 88.4,
    cumulative_expenditure: 47500.0,
    original_cost: 28181.0,
    revised_cost: 52000.0,
    approval_date: "2008-02",
    start_date: "2008-10",
    original_completion_date: "2018-03",
    revised_completion_date: "2026-12",
  },
  risk: {
    risk_probability: 0.3842,
    raw_probability: 0.3211,
    risk_rank: 42,
    risk_percentile: 0.825,
    population_size: 1625,
    report_month: "2026-04",
    regime: "MODERN",
    model_id: "logistic_static_only__unweighted",
    target: "target_effective_schedule_ext_3m",
    calibration_active: true,
  },
  model: {
    model_id: "logistic_static_only__unweighted",
    target: "target_effective_schedule_ext_3m",
    model_family: "L2-Regularized Logistic Regression (C=1.0)",
    status: "ACTIVE_PRODUCTION",
    is_active: true,
    coverage_period: "2025-07 through 2026-07",
    calibration_policy: "Temporal Platt scaling active from origin 2026-04",
    explanation_method: "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE",
  },
  history: [
    {
      report_month: "2026-03",
      risk_probability: 0.3512,
      raw_probability: 0.3512,
      risk_rank: 48,
      risk_percentile: 0.81,
      population_size: 1620,
      regime: "MODERN",
      model_id: "logistic_static_only__unweighted",
      calibration_active: false,
    },
  ],
  drivers: {
    top_positive: [
      {
        feature: "schedule_extensions_count",
        display_name: "Schedule Extensions Count",
        value: "4",
        contribution: 0.412,
        direction: "POSITIVE",
        rank: 1,
      },
    ],
    top_negative: [
      {
        feature: "physical_progress",
        display_name: "Physical Progress Percentage",
        value: "92.5%",
        contribution: -0.285,
        direction: "NEGATIVE",
        rank: 1,
      },
    ],
    strongest_drivers: [],
  },
  signals: {
    cost_revised: true,
    schedule_revised: true,
    cost_revision_ratio: 1.8452,
    cost_revision_count: 3,
    schedule_extension_count: 4,
    reporting_months_count: 25,
    first_reported_month: "2024-06",
    latest_reported_month: "2026-07",
  },
  recent_changes: {
    has_prior_observation: true,
    prior_report_month: "2026-06",
    physical_progress_delta: 0.5,
    expenditure_delta: 120.0,
    revised_cost_delta: 500.0,
    completion_date_changed: false,
  },
  data_availability: {
    has_project_data: true,
    has_risk_assessment: true,
    has_risk_history: true,
    has_drivers: true,
    snapshot_report_month: "2026-07",
    risk_report_month: "2026-04",
    cost_risk_ml_served: false,
    progress_stagnation_ml_served: false,
  },
};

const mockUnassessedResponse: ProjectRiskIntelligenceResponse = {
  project: {
    project_code: "N10000001",
    project_name: "UNASSESSED HISTORICAL BRIDGE",
    agency: "RAILWAYS",
    ministry: "RAILWAYS",
    sector: "RAILWAYS",
    state: "BIHAR",
    legacy_ocms_code: null,
    pmgid: null,
  },
  snapshot: {
    report_month: "2024-05",
    physical_progress: 40.0,
    financial_progress: 35.0,
    cumulative_expenditure: 200.0,
    original_cost: 500.0,
    revised_cost: null,
    approval_date: "2019-01",
    start_date: null,
    original_completion_date: "2022-03",
    revised_completion_date: null,
  },
  risk: null,
  model: null,
  history: [],
  drivers: { top_positive: [], top_negative: [], strongest_drivers: [] },
  signals: {
    cost_revised: false,
    schedule_revised: false,
    cost_revision_ratio: null,
    cost_revision_count: 0,
    schedule_extension_count: 0,
    reporting_months_count: 1,
    first_reported_month: "2024-05",
    latest_reported_month: "2024-05",
  },
  recent_changes: {
    has_prior_observation: false,
    prior_report_month: null,
    physical_progress_delta: null,
    expenditure_delta: null,
    revised_cost_delta: null,
    completion_date_changed: false,
  },
  data_availability: {
    has_project_data: true,
    has_risk_assessment: false,
    has_risk_history: false,
    has_drivers: false,
    snapshot_report_month: "2024-05",
    risk_report_month: null,
    cost_risk_ml_served: false,
    progress_stagnation_ml_served: false,
  },
};

describe("ProjectRiskIntelligence Integration & Components", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("calls fetchProjectRiskIntelligence with the decoded project code on ProjectDetailPage", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue({
      project_code: "617936",
      project_name: "Dedicated Freight Corridor (Western)",
      agency: "DFCCIL",
      ministry: "RAILWAYS",
      sector: "RAILWAYS",
      state: "MAHARASHTRA",
      first_reported_month: "2024-06",
      latest_report_month: "2026-07",
      total_observations_count: 25,
      latest_observation: null as any,
    });
    vi.mocked(projectsApi.fetchLatestSnapshot).mockResolvedValue({
      report_month: "2026-07",
    } as any);
    vi.mocked(projectsApi.fetchProjectTrajectory).mockResolvedValue({
      trajectory: [],
    } as any);
    vi.mocked(projectsApi.fetchCostRevisions).mockResolvedValue({
      revisions: [],
    } as any);
    vi.mocked(projectsApi.fetchScheduleExtensions).mockResolvedValue({
      timeline: [],
    } as any);
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValue(mockAssessedResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/projects/617936"]}>
          <Routes>
            <Route path="/projects/:projectCode" element={<ProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(projectsApi.fetchProjectRiskIntelligence).toHaveBeenCalledTimes(1);
      expect(projectsApi.fetchProjectRiskIntelligence).toHaveBeenCalledWith("617936");
      expect(screen.getByText("CURRENT SCHEDULE RISK")).toBeInTheDocument();
    });
  });

  it("renders current risk probability, rank, percentile, and regime from assessed response", () => {
    render(
      <ProjectRiskIntelligenceSection
        riskIntelligence={mockAssessedResponse}
        isLoading={false}
        error={null}
        projectCode="617936"
        projectSnapshotMonth="2026-07"
      />
    );

    // Probability & Raw
    expect(screen.getByText("38.4%")).toBeInTheDocument();
    expect(screen.getByText("RAW: 32.1%")).toBeInTheDocument();

    // Portfolio Rank
    expect(screen.getByText("#42")).toBeInTheDocument();
    expect(screen.getByText(/1,625/)).toBeInTheDocument();

    // Percentile
    expect(screen.getByText("82.5%")).toBeInTheDocument();

    // Regime & Calibration
    expect(screen.getByText("MODERN REGIME")).toBeInTheDocument();
    expect(screen.getByText("CALIBRATION ACTIVE")).toBeInTheDocument();
  });

  it("displays project snapshot month and risk evaluation month distinctly when they differ", () => {
    render(
      <ProjectRiskIntelligenceSection
        riskIntelligence={mockAssessedResponse}
        isLoading={false}
        error={null}
        projectCode="617936"
        projectSnapshotMonth="2026-07"
      />
    );

    // Snapshot is 2026-07, Risk Assessment is 2026-04
    expect(screen.getByText("PROJECT SNAPSHOT:")).toBeInTheDocument();
    expect(screen.getAllByText("2026-07").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("RISK ASSESSMENT:")).toBeInTheDocument();
    expect(screen.getAllByText("2026-04").length).toBeGreaterThanOrEqual(1);
  });

  it("renders model governance metadata from the response without hardcoded IDs", () => {
    render(
      <ProjectRiskIntelligenceSection
        riskIntelligence={mockAssessedResponse}
        isLoading={false}
        error={null}
        projectCode="617936"
        projectSnapshotMonth="2026-07"
      />
    );

    // Model governance fields
    expect(screen.getByText("logistic_static_only__unweighted")).toBeInTheDocument();
    expect(screen.getByText("L2-Regularized Logistic Regression (C=1.0)")).toBeInTheDocument();
    expect(screen.getByText("2025-07 through 2026-07")).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE_PRODUCTION/)).toBeInTheDocument();
  });

  it("renders signed risk drivers and contributors accurately", () => {
    render(
      <ProjectRiskIntelligenceSection
        riskIntelligence={mockAssessedResponse}
        isLoading={false}
        error={null}
        projectCode="617936"
        projectSnapshotMonth="2026-07"
      />
    );

    expect(screen.getByText("KEY RISK DRIVERS")).toBeInTheDocument();
    expect(screen.getByText("Schedule Extensions Count")).toBeInTheDocument();
    expect(screen.getByText("+0.412")).toBeInTheDocument();
    expect(screen.getByText("Physical Progress Percentage")).toBeInTheDocument();
    expect(screen.getByText("-0.285")).toBeInTheDocument();
  });

  it("renders factual signals and recent changes when a prior observation exists", () => {
    render(
      <ProjectRiskIntelligenceSection
        riskIntelligence={mockAssessedResponse}
        isLoading={false}
        error={null}
        projectCode="617936"
        projectSnapshotMonth="2026-07"
      />
    );

    // Signals
    expect(screen.getByText(/1.85x/)).toBeInTheDocument();
    expect(screen.getByText(/3 events recorded/)).toBeInTheDocument();
    expect(screen.getByText(/4 extensions/)).toBeInTheDocument();
    expect(screen.getByText("25 MONTHS")).toBeInTheDocument();

    // Recent changes
    expect(screen.getByText("COMPARED WITH 2026-06")).toBeInTheDocument();
    expect(screen.getByText("+0.5 pp")).toBeInTheDocument();
    expect(screen.getByText("+₹120 CR")).toBeInTheDocument();
    expect(screen.getByText("+₹500 CR")).toBeInTheDocument();
    expect(screen.getByText("UNCHANGED")).toBeInTheDocument();
  });

  it("does not manufacture deltas when no prior observation exists", () => {
    render(
      <ProjectRiskIntelligenceSection
        riskIntelligence={mockUnassessedResponse}
        isLoading={false}
        error={null}
        projectCode="N10000001"
        projectSnapshotMonth="2024-05"
      />
    );

    expect(
      screen.getByText(/INITIAL OBSERVATION IN SOURCE DATASET \(NO PRIOR OBSERVATION AVAILABLE FOR DELTA CALCULATION\)/)
    ).toBeInTheDocument();
  });

  it("renders honest unassessed state when project has risk: null without fabricating 0% or Low Risk", () => {
    render(
      <ProjectRiskIntelligenceSection
        riskIntelligence={mockUnassessedResponse}
        isLoading={false}
        error={null}
        projectCode="N10000001"
        projectSnapshotMonth="2024-05"
      />
    );

    expect(screen.getByText("NOT ASSESSED FOR THIS PROJECT")).toBeInTheDocument();
    expect(screen.getByText(/no operational schedule-risk assessment is currently served/)).toBeInTheDocument();
    expect(screen.getByText("UNASSESSED")).toBeInTheDocument();

    // Must NOT fabricate 0% risk or Low Risk
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
    expect(screen.queryByText("Low Risk")).not.toBeInTheDocument();
    expect(screen.queryByText("Critical Risk")).not.toBeInTheDocument();
  });

  it("renders cost overrun risk and progress stagnation risk truthfully as DATA PENDING", () => {
    render(
      <ProjectRiskIntelligenceSection
        riskIntelligence={mockAssessedResponse}
        isLoading={false}
        error={null}
        projectCode="617936"
        projectSnapshotMonth="2026-07"
      />
    );

    const dataPendingBadges = screen.getAllByText("DATA PENDING");
    expect(dataPendingBadges.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Cost Overrun Risk")).toBeInTheDocument();
    expect(screen.getByText("Progress Stagnation Risk")).toBeInTheDocument();
    expect(screen.getByText(/Only schedule extension risk is served in production/)).toBeInTheDocument();
  });

  it("renders a localized error state when the risk request fails without breaking the page", () => {
    render(
      <ProjectRiskIntelligenceSection
        riskIntelligence={undefined}
        isLoading={false}
        error={new Error("Network connection reset")}
        projectCode="617936"
        projectSnapshotMonth="2026-07"
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("FAILED TO LOAD RISK INTELLIGENCE")).toBeInTheDocument();
    expect(screen.getByText("Network connection reset")).toBeInTheDocument();
    expect(screen.getByText(/Other project monitoring records remain fully accessible/)).toBeInTheDocument();
  });

  it("renders a localized loading state without showing placeholder risk values", () => {
    render(
      <ProjectRiskIntelligenceSection
        riskIntelligence={undefined}
        isLoading={true}
        error={null}
        projectCode="617936"
        projectSnapshotMonth="2026-07"
      />
    );

    expect(
      screen.getByText("RETRIEVING SCHEDULE RISK INTELLIGENCE RECORD: 617936...")
    ).toBeInTheDocument();
    expect(screen.queryByText("38.4%")).not.toBeInTheDocument();
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
  });
});
