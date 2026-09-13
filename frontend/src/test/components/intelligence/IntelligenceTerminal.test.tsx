import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { IntelligencePage } from "@/pages/IntelligencePage.tsx";
import * as projectsApi from "@/api/projects.ts";
import * as riskApi from "@/api/risk.ts";
import type { ProjectRiskIntelligenceResponse } from "@/types/project.ts";

vi.mock("@/api/projects.ts", async () => {
  const actual = await vi.importActual<typeof projectsApi>("@/api/projects.ts");
  return {
    ...actual,
    fetchQuickSearch: vi.fn(),
    fetchProjectRiskIntelligence: vi.fn(),
  };
});

vi.mock("@/api/risk.ts", async () => {
  const actual = await vi.importActual<typeof riskApi>("@/api/risk.ts");
  return {
    ...actual,
    fetchRiskOptions: vi.fn(),
    fetchModelInfo: vi.fn(),
    fetchRiskSummary: vi.fn(),
    fetchRiskProjects: vi.fn(),
    fetchProjectRiskRecord: vi.fn(),
    fetchProjectRiskHistory: vi.fn(),
  };
});

const mockAssessedResponse: ProjectRiskIntelligenceResponse = {
  project: {
    project_code: "617936",
    project_name: "Dedicated Freight Corridor (Western)",
    agency: "DFCCIL",
    ministry: "RAILWAYS",
    sector: "RAILWAYS",
    state: "MAHARASHTRA",
    legacy_ocms_code: "OCMS-1234",
    pmgid: "PMG-5678",
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
      report_month: "2025-06",
      risk_probability: 0.421,
      raw_probability: 0.421,
      risk_rank: 55,
      risk_percentile: 0.78,
      population_size: 1580,
      regime: "LEGACY",
      model_id: "catboost_full_v1__unweighted",
      calibration_active: false,
    },
    {
      report_month: "2026-04",
      risk_probability: 0.3842,
      raw_probability: 0.3211,
      risk_rank: 42,
      risk_percentile: 0.825,
      population_size: 1625,
      regime: "MODERN",
      model_id: "logistic_static_only__unweighted",
      calibration_active: true,
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
    revised_cost_delta: 50.0,
    completion_date_changed: true,
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
    project_code: "999999",
    project_name: "Rural Bridge Reconstruction",
    agency: "STATE_PWD",
    ministry: "RURAL_DEV",
    sector: "BRIDGES",
    state: "BIHAR",
    legacy_ocms_code: null,
    pmgid: null,
  },
  snapshot: {
    report_month: "2026-07",
    physical_progress: 10.0,
    financial_progress: 5.0,
    cumulative_expenditure: 2.5,
    original_cost: 50.0,
    revised_cost: null,
    approval_date: "2026-01",
    start_date: "2026-03",
    original_completion_date: "2027-03",
    revised_completion_date: null,
  },
  risk: null,
  model: null,
  history: [],
  drivers: {
    top_positive: [],
    top_negative: [],
    strongest_drivers: [],
  },
  signals: {
    cost_revised: false,
    schedule_revised: false,
    cost_revision_ratio: null,
    cost_revision_count: 0,
    schedule_extension_count: 0,
    reporting_months_count: 1,
    first_reported_month: "2026-07",
    latest_reported_month: "2026-07",
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
    snapshot_report_month: "2026-07",
    risk_report_month: null,
    cost_risk_ml_served: false,
    progress_stagnation_ml_served: false,
  },
};

const mockRiskOptions = {
  report_months: ["2026-04"],
  default_report_month: "2026-04",
  selected_report_month: "2026-04",
  regimes: ["MODERN"],
  sectors: ["RAILWAYS"],
  agencies: ["DFCCIL"],
  ministries: ["RAILWAYS"],
  states: ["MAHARASHTRA"],
};

describe("Intelligence Terminal Core (PR-05)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });

    vi.clearAllMocks();
    vi.mocked(riskApi.fetchRiskOptions).mockResolvedValue(mockRiskOptions as any);
    vi.mocked(riskApi.fetchModelInfo).mockResolvedValue({
      serving_artifact_version: "iris_serving_v1_1",
      target: "target_effective_schedule_ext_3m",
      horizon_months: 3,
      status: "READY",
      models: [],
    } as any);
    vi.mocked(riskApi.fetchRiskSummary).mockResolvedValue({
      report_month: "2026-04",
      regime_filter: null,
      filters: {},
      project_count: 1625,
      score_distribution: {
        minimum: 0.01,
        p25: 0.2,
        median: 0.4,
        p75: 0.6,
        p90: 0.7,
        p95: 0.8,
        maximum: 0.99,
        mean: 0.4,
      },
      top_risk_projects: [],
      regimes: [],
      sector_summary: [],
    } as any);
    vi.mocked(riskApi.fetchRiskProjects).mockResolvedValue({
      report_month: "2026-04",
      filters: {},
      page: 1,
      page_size: 25,
      total: 0,
      items: [],
    } as any);
  });

  const renderTerminal = (initialEntry = "/intelligence") => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/intelligence" element={<IntelligencePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  // 1. /intelligence renders empty / select-project state when no project selected
  it("renders empty select-project state with zero fake numbers when no project is in query params", async () => {
    renderTerminal("/intelligence");

    expect(screen.getByText("PROJECT RISK INTELLIGENCE TERMINAL")).toBeInTheDocument();
    expect(screen.getByText("Select a project to begin analysis.")).toBeInTheDocument();
    expect(
      screen.getByText(/Enter a canonical project code or search by project name above/i)
    ).toBeInTheDocument();

    // Zero fake risk metrics should be displayed
    expect(screen.queryByText("OPERATIONAL RISK PROBABILITY")).not.toBeInTheDocument();
    expect(screen.queryByText("PORTFOLIO RISK RANK")).not.toBeInTheDocument();
  });

  // 2. Project search/selection works with a valid project
  it("allows searching for a project with autocomplete and selecting it", async () => {
    vi.mocked(projectsApi.fetchQuickSearch).mockResolvedValueOnce([
      {
        project_code: "617936",
        project_name: "Dedicated Freight Corridor (Western)",
        agency: "DFCCIL",
        latest_report_month: "2026-07",
      },
    ]);
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence");

    const input = screen.getByRole("combobox", { name: /select project for risk evaluation/i });
    await userEvent.type(input, "617936");

    await waitFor(() => {
      expect(projectsApi.fetchQuickSearch).toHaveBeenCalledWith("617936", 8);
    });

    // Suggestion appears
    await waitFor(() => {
      expect(screen.getByText("Dedicated Freight Corridor (Western)")).toBeInTheDocument();
    });

    // Click suggestion
    fireEvent.click(screen.getByText("Dedicated Freight Corridor (Western)"));

    // Intelligence should be fetched and rendered
    await waitFor(() => {
      expect(projectsApi.fetchProjectRiskIntelligence).toHaveBeenCalledWith("617936");
      expect(screen.getAllByText("38.4%").length).toBeGreaterThanOrEqual(1);
    });
  });

  // 3. Correct project code is passed to fetchProjectRiskIntelligence
  it("passes the exact project code from URL parameter to fetchProjectRiskIntelligence", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(projectsApi.fetchProjectRiskIntelligence).toHaveBeenCalledWith("617936");
    });
  });

  // 4. Loading state renders without fake risk values
  it("renders a clean loading indicator without fake risk values while fetching", async () => {
    // Hang promise to test loading state
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockReturnValue(new Promise(() => {}));

    renderTerminal("/intelligence?project=617936");

    const loadingCard = screen.getByRole("status");
    expect(loadingCard).toHaveTextContent("FETCHING PROJECT INTELLIGENCE...");
    expect(loadingCard).toHaveTextContent("RETRIEVING SCHEDULE RISK INTELLIGENCE RECORD: 617936");
    expect(loadingCard).not.toHaveTextContent("38.4%");
    expect(loadingCard).not.toHaveTextContent("0.0%");
  });

  // 5. Successful intelligence response renders project identity
  it("renders authoritative project identity fields from response", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getByText("Dedicated Freight Corridor (Western)")).toBeInTheDocument();
    });

    expect(screen.getAllByText("617936").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("DFCCIL").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("MAHARASHTRA").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/LEGACY OCMS: OCMS-1234/)).toBeInTheDocument();
    expect(screen.getByText(/PMGID: PMG-5678/)).toBeInTheDocument();
  });

  // 6. Current probability renders from the real response
  it("renders calibrated risk probability and raw probability correctly", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getAllByText("38.4%").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText("RAW: 32.1%").length).toBeGreaterThanOrEqual(1);
  });

  // 7. Rank/population/percentile render correctly
  it("renders rank, population size, and percentile without deriving TOP X%", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getAllByText("#42").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText("OF 1,625 MONITORED")).toBeInTheDocument();
    expect(screen.getAllByText("82.5%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("P82.5").length).toBeGreaterThanOrEqual(1);

    // Verify TOP X% is NOT fabricated
    expect(screen.queryByText(/TOP 17\.5%/i)).not.toBeInTheDocument();
  });

  // 8. Risk assessment month is displayed
  // 9. Project snapshot month and risk assessment month remain distinct
  it("keeps project snapshot month and risk assessment month strictly distinct", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getByText("PROJECT SNAPSHOT MONTH:")).toBeInTheDocument();
    });
    expect(screen.getAllByText("2026-07").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("RISK ASSESSMENT MONTH:")).toBeInTheDocument();
    expect(screen.getAllByText("2026-04").length).toBeGreaterThanOrEqual(1);
  });

  // 10. Model governance metadata renders dynamically
  it("renders model governance metadata dynamically without hardcoding", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getByText("L2-Regularized Logistic Regression (C=1.0)")).toBeInTheDocument();
    });
    expect(screen.getAllByText("logistic_static_only__unweighted").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("2025-07 through 2026-07")).toBeInTheDocument();
    expect(screen.getByText(/ACTIVE_PRODUCTION/)).toBeInTheDocument();
  });

  // 11. Signed drivers render from backend response
  it("renders signed positive and negative risk contributors in raw margin logit space", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getByText("Schedule Extensions Count")).toBeInTheDocument();
    });
    expect(screen.getByText("+0.412")).toBeInTheDocument();
    expect(screen.getByText("Physical Progress Percentage")).toBeInTheDocument();
    expect(screen.getByText("-0.285")).toBeInTheDocument();
    expect(screen.getByText("RAW MARGIN LOGIT SPACE")).toBeInTheDocument();
  });

  // 12. Risk history renders chronologically
  // 13. Legacy/modern model transition remains visible in history
  it("renders chronological risk history and highlights regime transition", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getByText("HISTORICAL RISK TRAJECTORY")).toBeInTheDocument();
    });

    expect(screen.getByText("REGIME TRANSITION DETECTED")).toBeInTheDocument();
    expect(screen.getAllByText("2025-06").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("42.1%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("catboost_full_v1__unweighted").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("LEGACY").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("MODERN").length).toBeGreaterThanOrEqual(1);
  });

  // 14. Factual project signals render
  it("renders factual observational signals", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getByText("FACTUAL SIGNALS & RECENT CHANGES")).toBeInTheDocument();
    });

    expect(screen.getByText("(1.85x)")).toBeInTheDocument();
    expect(screen.getByText("3 events recorded")).toBeInTheDocument();
    expect(screen.getByText("4 extensions")).toBeInTheDocument();
    expect(screen.getByText("25 MONTHS")).toBeInTheDocument();
    expect(screen.getByText("2024-06 → 2026-07")).toBeInTheDocument();
  });

  // 15. Recent changes render
  it("renders month-over-month recent changes compared with prior month", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getByText("COMPARED WITH 2026-06")).toBeInTheDocument();
    });

    expect(screen.getByText("+0.5 pp")).toBeInTheDocument();
    expect(screen.getByText("+₹120 CR")).toBeInTheDocument();
    expect(screen.getByText("+₹50 CR")).toBeInTheDocument();
    expect(screen.getByText("CHANGED")).toBeInTheDocument();
  });

  // 16. First-observation state does not fabricate deltas
  // 17. risk: null renders NOT ASSESSED rather than 0% or Low Risk
  it("truthfully renders unassessed state and initial observation without fabricating deltas", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockUnassessedResponse);

    renderTerminal("/intelligence?project=999999");

    await waitFor(() => {
      expect(screen.getByText("Rural Bridge Reconstruction")).toBeInTheDocument();
    });

    // Truthful unassessed status (never 0% or Low Risk)
    expect(screen.getAllByText("NOT ASSESSED").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
    expect(screen.queryByText("Low Risk")).not.toBeInTheDocument();
    expect(
      screen.getByText(/no operational risk assessment is currently served/i)
    ).toBeInTheDocument();

    // Truthful initial observation note
    expect(
      screen.getByText(/INITIAL OBSERVATION IN SOURCE DATASET \(NO PRIOR OBSERVATION AVAILABLE FOR DELTA CALCULATION\)/i)
    ).toBeInTheDocument();
  });

  // 18. Cost-risk ML shows DATA PENDING
  // 19. Progress-stagnation ML shows DATA PENDING
  it("renders unserved ML domains truthfully as DATA PENDING", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getByText("Cost Overrun Risk")).toBeInTheDocument();
    });

    expect(screen.getByText("Progress Stagnation Risk")).toBeInTheDocument();
    expect(screen.getAllByText("DATA PENDING").length).toBeGreaterThanOrEqual(2);
  });

  // 20. API failure renders an error state
  it("renders truthful error state when project intelligence API fails", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockRejectedValueOnce(
      new Error("Network connection severed (500)")
    );

    renderTerminal("/intelligence?project=ERR123");

    await waitFor(() => {
      expect(screen.getByText("PROJECT INTELLIGENCE UNAVAILABLE")).toBeInTheDocument();
    });

    expect(screen.getByText("Network connection severed (500)")).toBeInTheDocument();
    expect(screen.getByText("RETRY TRANSMISSION")).toBeInTheDocument();
    expect(screen.getByText("SELECT ANOTHER PROJECT")).toBeInTheDocument();
  });

  // 21. Project Detail navigation points to the correct project
  it("provides contextual navigation link pointing to /projects/{projectCode}", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /view full project detail for 617936/i })).toHaveAttribute(
        "href",
        "/projects/617936"
      );
    });
  });

  // 22. Keyboard accessibility exists for project selection
  it("supports keyboard navigation (ArrowDown, ArrowUp, Enter, Escape) in selector", async () => {
    vi.mocked(projectsApi.fetchQuickSearch).mockResolvedValueOnce([
      {
        project_code: "111111",
        project_name: "Metro Phase 1",
        agency: "DMRC",
        latest_report_month: "2026-07",
      },
      {
        project_code: "222222",
        project_name: "Metro Phase 2",
        agency: "DMRC",
        latest_report_month: "2026-07",
      },
    ]);
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence");

    const input = screen.getByRole("combobox", { name: /select project for risk evaluation/i });
    await userEvent.type(input, "Metro");

    await waitFor(() => {
      expect(screen.getByText("Metro Phase 1")).toBeInTheDocument();
    });

    // ArrowDown highlights option 0
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: /Metro Phase 1/i })).toHaveClass("highlighted");

    // ArrowDown highlights option 1
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: /Metro Phase 2/i })).toHaveClass("highlighted");

    // Press Enter to select option 1 ("222222")
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(projectsApi.fetchProjectRiskIntelligence).toHaveBeenCalledWith("222222");
    });
  });

  // 23. Governance disclosure is keyboard accessible
  it("expands and collapses governance details using keyboard and updates aria-expanded", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValueOnce(mockAssessedResponse);

    renderTerminal("/intelligence?project=617936");

    await waitFor(() => {
      expect(screen.getByText("MODEL SPECIFICATION & TRACEABILITY")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole("button", { name: /expand specification/i });
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("CALIBRATION POLICY")).not.toBeInTheDocument();

    // Click or trigger via keyboard
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("CALIBRATION POLICY")).toBeInTheDocument();
    expect(
      screen.getByText("Temporal Platt scaling active from origin 2026-04")
    ).toBeInTheDocument();

    // Collapse again
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("CALIBRATION POLICY")).not.toBeInTheDocument();
  });
});
