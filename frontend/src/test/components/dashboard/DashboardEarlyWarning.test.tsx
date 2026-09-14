import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardEarlyWarning } from "@/components/dashboard/DashboardEarlyWarning.tsx";
import { DashboardRiskMovement } from "@/components/dashboard/DashboardRiskMovement.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import * as riskApi from "@/api/risk.ts";
import * as projectsApi from "@/api/projects.ts";
import type { TopRiskProject, RiskRecord } from "@/types/risk.ts";
import type { ProjectRiskIntelligenceResponse } from "@/types/project.ts";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

vi.mock("@/api/risk.ts", () => ({
  fetchRiskSummary: vi.fn(),
  fetchProjectRiskHistory: vi.fn(),
}));

vi.mock("@/api/projects.ts", () => ({
  fetchProjectRiskIntelligence: vi.fn(),
}));

const mockProjects: TopRiskProject[] = [
  {
    project_code: "976809",
    project_name: "Amended BharatNet Program - ARP, NGL, MNP",
    agency: "BBNL",
    ministry: "Ministry of Communications",
    sector: "Telecommunications",
    state: "Multiple",
    regime: "MODERN",
    model_id: "logistic_static_only__unweighted",
    raw_probability: 0.88,
    risk_probability: 0.894,
    calibration_active: true,
    risk_rank: 1,
    risk_percentile: 0.999,
    population_size: 1625,
  },
  {
    project_code: "617936",
    project_name: "Eastern Dedicated Freight Corridor",
    agency: "DFCCIL",
    ministry: "Ministry of Railways",
    sector: "Railways",
    state: "Uttar Pradesh",
    regime: "MODERN",
    model_id: "logistic_static_only__unweighted",
    raw_probability: 0.72,
    risk_probability: 0.756,
    calibration_active: true,
    risk_rank: 2,
    risk_percentile: 0.995,
    population_size: 1625,
  },
  {
    project_code: "331002",
    project_name: "Solar Park Phase II",
    agency: "SECI",
    ministry: "Ministry of New and Renewable Energy",
    sector: "Power",
    state: "Rajasthan",
    regime: "MODERN",
    model_id: "logistic_static_only__unweighted",
    raw_probability: 0.32,
    risk_probability: 0.345, // Test case 4: probability < 0.50 without thresholding
    calibration_active: true,
    risk_rank: 3,
    risk_percentile: 0.85,
    population_size: 1625,
  },
];

const mockComparableHistory: RiskRecord[] = [
  {
    project_code: "976809",
    report_month: "2026-03",
    project_name: "Amended BharatNet Program - ARP, NGL, MNP",
    agency: "BBNL",
    ministry: "Ministry of Communications",
    sector: "Telecommunications",
    state: "Multiple",
    regime: "MODERN",
    target: "target_effective_schedule_ext_3m",
    model_id: "logistic_static_only__unweighted",
    raw_probability: 0.80,
    risk_probability: 0.812,
    calibration_active: true,
    risk_percentile: 0.985,
    risk_rank: 5,
    population_size: 1620,
    top_positive_contributors: [],
    top_negative_contributors: [],
    source_feature_values: {},
    version_metadata: {
      serving_contract_version: "1.0",
      serving_artifact_version: "1.0",
      explanation_version: "1.0",
      explanation_manifest_sha256: "fake",
      model_id: "logistic_static_only__unweighted",
      explanation_method: "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE",
      contribution_space: "RAW_MARGIN_LOGIT",
      ranking_score_type: "OPERATIONAL_PROBABILITY",
    },
  },
  {
    project_code: "976809",
    report_month: "2026-04",
    project_name: "Amended BharatNet Program - ARP, NGL, MNP",
    agency: "BBNL",
    ministry: "Ministry of Communications",
    sector: "Telecommunications",
    state: "Multiple",
    regime: "MODERN",
    target: "target_effective_schedule_ext_3m",
    model_id: "logistic_static_only__unweighted",
    raw_probability: 0.88,
    risk_probability: 0.894,
    calibration_active: true,
    risk_percentile: 0.999,
    risk_rank: 1,
    population_size: 1625,
    top_positive_contributors: [],
    top_negative_contributors: [],
    source_feature_values: {},
    version_metadata: {
      serving_contract_version: "1.0",
      serving_artifact_version: "1.0",
      explanation_version: "1.0",
      explanation_manifest_sha256: "fake",
      model_id: "logistic_static_only__unweighted",
      explanation_method: "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE",
      contribution_space: "RAW_MARGIN_LOGIT",
      ranking_score_type: "OPERATIONAL_PROBABILITY",
    },
  },
];

const mockSingleObservationHistory: RiskRecord[] = [
  {
    project_code: "617936",
    report_month: "2026-04",
    project_name: "Eastern Dedicated Freight Corridor",
    agency: "DFCCIL",
    ministry: "Ministry of Railways",
    sector: "Railways",
    state: "Uttar Pradesh",
    regime: "MODERN",
    target: "target_effective_schedule_ext_3m",
    model_id: "logistic_static_only__unweighted",
    raw_probability: 0.72,
    risk_probability: 0.756,
    calibration_active: true,
    risk_percentile: 0.995,
    risk_rank: 2,
    population_size: 1625,
    top_positive_contributors: [],
    top_negative_contributors: [],
    source_feature_values: {},
    version_metadata: {
      serving_contract_version: "1.0",
      serving_artifact_version: "1.0",
      explanation_version: "1.0",
      explanation_manifest_sha256: "fake",
      model_id: "logistic_static_only__unweighted",
      explanation_method: "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE",
      contribution_space: "RAW_MARGIN_LOGIT",
      ranking_score_type: "OPERATIONAL_PROBABILITY",
    },
  },
];

const mockTransitionHistory: RiskRecord[] = [
  {
    project_code: "976809",
    report_month: "2025-06",
    project_name: "Amended BharatNet Program",
    agency: "BBNL",
    ministry: "Ministry of Communications",
    sector: "Telecommunications",
    state: "Multiple",
    regime: "LEGACY",
    target: "target_effective_schedule_ext_3m",
    model_id: "catboost_full_v1__unweighted",
    raw_probability: 0.65,
    risk_probability: 0.67,
    calibration_active: true,
    risk_percentile: 0.92,
    risk_rank: 12,
    population_size: 1500,
    top_positive_contributors: [],
    top_negative_contributors: [],
    source_feature_values: {},
    version_metadata: {
      serving_contract_version: "1.0",
      serving_artifact_version: "1.0",
      explanation_version: "1.0",
      explanation_manifest_sha256: "fake",
      model_id: "catboost_full_v1__unweighted",
      explanation_method: "CATBOOST_NATIVE_TREESHAP",
      contribution_space: "RAW_MARGIN_LOGIT",
      ranking_score_type: "OPERATIONAL_PROBABILITY",
    },
  },
  {
    project_code: "976809",
    report_month: "2025-07",
    project_name: "Amended BharatNet Program",
    agency: "BBNL",
    ministry: "Ministry of Communications",
    sector: "Telecommunications",
    state: "Multiple",
    regime: "MODERN",
    target: "target_effective_schedule_ext_3m",
    model_id: "logistic_static_only__unweighted",
    raw_probability: 0.78,
    risk_probability: 0.795,
    calibration_active: true,
    risk_percentile: 0.97,
    risk_rank: 4,
    population_size: 1600,
    top_positive_contributors: [],
    top_negative_contributors: [],
    source_feature_values: {},
    version_metadata: {
      serving_contract_version: "1.0",
      serving_artifact_version: "1.0",
      explanation_version: "1.0",
      explanation_manifest_sha256: "fake",
      model_id: "logistic_static_only__unweighted",
      explanation_method: "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE",
      contribution_space: "RAW_MARGIN_LOGIT",
      ranking_score_type: "OPERATIONAL_PROBABILITY",
    },
  },
];

const mockRecentChangesData: Partial<ProjectRiskIntelligenceResponse> = {
  project: {
    project_code: "976809",
    project_name: "Amended BharatNet Program - ARP, NGL, MNP",
    agency: "BBNL",
    ministry: "Ministry of Communications",
    sector: "Telecommunications",
    state: "Multiple",
    legacy_ocms_code: null,
    pmgid: null,
  },
  recent_changes: {
    has_prior_observation: true,
    prior_report_month: "2026-03",
    physical_progress_delta: 2.5,
    expenditure_delta: 450.25,
    revised_cost_delta: 0,
    completion_date_changed: false,
  },
};

describe("PR-12: Dashboard Early Warning Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();

    vi.mocked(riskApi.fetchProjectRiskHistory).mockResolvedValue({
      project_code: "976809",
      regime_filter: null,
      count: mockComparableHistory.length,
      items: mockComparableHistory,
    });

    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValue(
      mockRecentChangesData as ProjectRiskIntelligenceResponse
    );
  });

  const renderEarlyWarning = (props?: Partial<React.ComponentProps<typeof DashboardEarlyWarning>>) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DashboardEarlyWarning
            projects={mockProjects}
            evaluationMonth="2026-04"
            activeRegimes={["MODERN"]}
            isLoading={false}
            isError={false}
            error={null}
            onRetry={vi.fn()}
            {...props}
          />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  // 1 & 2: Section renders with correct heading & production target
  it("01-02: renders Early Warning section and displays authoritative production target", async () => {
    renderEarlyWarning();

    expect(screen.getByText("EARLY WARNING / INVESTIGATION SIGNALS")).toBeInTheDocument();
    expect(
      screen.getAllByText(/PRODUCTION SCHEDULE-EXTENSION RISK/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/HORIZON: 3 MONTHS/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("target_effective_schedule_ext_3m").length).toBeGreaterThanOrEqual(1);
  });

  // 3 & 4: Uses backend-ranked records without client-side probability threshold
  it("03-04: uses backend-ranked records and applies no client-side probability threshold", () => {
    renderEarlyWarning();

    // Verify all 3 backend-ranked projects are rendered in order
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Amended BharatNet Program - ARP, NGL, MNP")).toBeInTheDocument();

    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("Eastern Dedicated Freight Corridor")).toBeInTheDocument();

    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText("Solar Park Phase II")).toBeInTheDocument();
    // 331002 has probability 34.5%, verifying NO threshold (> 0.50 or > 0.70) filtered it out
    expect(screen.getByText("34.5%")).toBeInTheDocument();
  });

  // 5 & 6: No LOW/MEDIUM/HIGH/CRITICAL categories or TOP-X% labels
  it("05-06: strictly avoids LOW/MEDIUM/HIGH/CRITICAL and TOP-X% tier labels", () => {
    renderEarlyWarning();

    expect(screen.queryByText(/HIGH RISK/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/MEDIUM RISK/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/LOW RISK/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CRITICAL RISK/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TOP 5%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TOP 10%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TOP 20%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Top Risk Tier/i)).not.toBeInTheDocument();
  });

  // 7, 8, 9: Calibrated and raw probability separation and accurate values
  it("07-09: labels and separates calibrated vs raw probabilities without substitution", () => {
    renderEarlyWarning();

    // Table headers
    expect(screen.getByRole("columnheader", { name: "CALIBRATED RISK" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "RAW PROBABILITY" })).toBeInTheDocument();

    // Project 1 distinct values
    expect(screen.getByText("89.4%")).toBeInTheDocument(); // Calibrated
    expect(screen.getByText("88.0%")).toBeInTheDocument(); // Raw
  });

  // 10 & 11: Backend rank and percentile preserved
  it("10-11: preserves exact backend rank and percentile", () => {
    renderEarlyWarning();

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("Showing 3 backend-ranked records")).toBeInTheDocument();
  });

  // 12 & 13: Authoritative risk evaluation month used, not portfolio month
  it("12-13: displays authoritative evaluation cycle without deriving from portfolio month", () => {
    renderEarlyWarning({ evaluationMonth: "2026-04" });

    expect(screen.getAllByText("2026-04").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Cycle: 2026-07")).not.toBeInTheDocument();
  });

  // 16: Single observed evaluation does not produce fake change
  it("16: handles single historical observation truthfully without fabricated change", async () => {
    vi.mocked(riskApi.fetchProjectRiskHistory).mockResolvedValue({
      project_code: "617936",
      regime_filter: null,
      count: 1,
      items: mockSingleObservationHistory,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DashboardRiskMovement projectCode="617936" projectName="Eastern Dedicated Freight Corridor" />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("SINGLE OBSERVED EVALUATION")).toBeInTheDocument();
      expect(screen.getByText(/No prior comparable record available/i)).toBeInTheDocument();
      expect(screen.queryByText(/OBSERVED MOVEMENT/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/percentage points/i)).not.toBeInTheDocument();
    });
  });

  // 17 & 27: Comparable probability change and accessible narrative text (Correction 1)
  it("17 & 27: calculates comparable probability change and provides accessible narrative text", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DashboardRiskMovement projectCode="976809" projectName="Amended BharatNet Program" />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      // 89.4% - 81.2% = +8.2 percentage points
      expect(screen.getByText("+8.2 percentage points")).toBeInTheDocument();
      // Accessible text for screen readers (Requirement 27)
      expect(
        screen.getAllByText("Calibrated probability increased by 8.2 percentage points.").length
      ).toBeGreaterThanOrEqual(1);
      // Rank movement: was #5, now #1 -> +4 positions
      expect(screen.getByText(/\+4 positions \(#5 → #1\)/i)).toBeInTheDocument();
    });
  });

  // 18: Model/Regime transition suppresses like-for-like probability delta (Correction 1)
  it("18: detects model/regime transition and suppresses misleading probability delta", async () => {
    vi.mocked(riskApi.fetchProjectRiskHistory).mockResolvedValue({
      project_code: "976809",
      regime_filter: null,
      count: 2,
      items: mockTransitionHistory,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DashboardRiskMovement projectCode="976809" projectName="Amended BharatNet Program" />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("MODEL / REGIME TRANSITION DETECTED")).toBeInTheDocument();
      expect(
        screen.getByText(/Historical comparison is not treated as a like-for-like probability change/i)
      ).toBeInTheDocument();
      // Verifies probability delta is suppressed
      expect(screen.getByText("Incompatible for delta")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Model or regime transition detected between observations; numerical probability delta is suppressed."
        )
      ).toBeInTheDocument();
      // Shows transition models
      expect(screen.getByText("catboost_full_v1__unweighted")).toBeInTheDocument();
      expect(screen.getByText("logistic_static_only__unweighted")).toBeInTheDocument();
    });
  });

  // 31: USER RECOMMENDED MIXED HISTORY FIXTURE (Correction 1)
  it("31: handles mixed history fixture verifying comparable, transition, and comparable segments", async () => {
    const mixedHistory: RiskRecord[] = [
      {
        ...mockComparableHistory[0],
        report_month: "2025-12",
        model_id: "catboost_full_v1__unweighted",
        regime: "LEGACY",
        risk_probability: 0.60,
      },
      {
        ...mockComparableHistory[0],
        report_month: "2026-01",
        model_id: "catboost_full_v1__unweighted",
        regime: "LEGACY",
        risk_probability: 0.64,
      },
      {
        ...mockComparableHistory[0],
        report_month: "2026-02",
        model_id: "logistic_static_only__unweighted",
        regime: "MODERN",
        risk_probability: 0.70,
      },
      {
        ...mockComparableHistory[0],
        report_month: "2026-03",
        model_id: "logistic_static_only__unweighted",
        regime: "MODERN",
        risk_probability: 0.75,
      },
    ];

    // Segment A: 2025-12 -> 2026-01 (Comparable Legacy)
    vi.mocked(riskApi.fetchProjectRiskHistory).mockResolvedValueOnce({
      project_code: "976809",
      regime_filter: null,
      count: 2,
      items: [mixedHistory[0], mixedHistory[1]],
    });

    const { unmount } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <DashboardRiskMovement projectCode="976809" projectName="Mixed Project A" />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("+4.0 percentage points")).toBeInTheDocument();
      expect(screen.queryByText("MODEL / REGIME TRANSITION DETECTED")).not.toBeInTheDocument();
    });
    unmount();

    // Segment B: 2026-01 -> 2026-02 (Transition Legacy -> Modern)
    vi.mocked(riskApi.fetchProjectRiskHistory).mockResolvedValueOnce({
      project_code: "976809",
      regime_filter: null,
      count: 2,
      items: [mixedHistory[1], mixedHistory[2]],
    });

    const { unmount: unmount2 } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <DashboardRiskMovement projectCode="976809" projectName="Mixed Project B" />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("MODEL / REGIME TRANSITION DETECTED")).toBeInTheDocument();
      expect(screen.getByText("Incompatible for delta")).toBeInTheDocument();
    });
    unmount2();

    // Segment C: 2026-02 -> 2026-03 (Comparable Modern)
    vi.mocked(riskApi.fetchProjectRiskHistory).mockResolvedValueOnce({
      project_code: "976809",
      regime_filter: null,
      count: 2,
      items: [mixedHistory[2], mixedHistory[3]],
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <BrowserRouter>
          <DashboardRiskMovement projectCode="976809" projectName="Mixed Project C" />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("+5.0 percentage points")).toBeInTheDocument();
      expect(screen.queryByText("MODEL / REGIME TRANSITION DETECTED")).not.toBeInTheDocument();
    });
  });

  // Recent changes contract (Correction 2)
  it("renders recent physical and financial changes strictly according to response schema", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DashboardRiskMovement projectCode="976809" projectName="Amended BharatNet Program" />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("RECENT PROJECT-LEVEL CHANGE EVIDENCE")).toBeInTheDocument();
      expect(screen.getByText("+2.5%")).toBeInTheDocument(); // physical_progress_delta
      expect(screen.getByText("₹450.25 Cr")).toBeInTheDocument(); // expenditure_delta
      expect(screen.getByText("₹0.00 Cr")).toBeInTheDocument(); // revised_cost_delta
      expect(screen.getByText("No")).toBeInTheDocument(); // completion_date_changed
    });
  });

  // Recent changes absent (Correction 2)
  it("renders truthful unavailable state when recent_changes has no prior observation", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValue({
      ...mockRecentChangesData,
      recent_changes: {
        has_prior_observation: false,
        prior_report_month: null,
        physical_progress_delta: null,
        expenditure_delta: null,
        revised_cost_delta: null,
        completion_date_changed: false,
      },
    } as ProjectRiskIntelligenceResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DashboardRiskMovement projectCode="976809" projectName="Amended BharatNet Program" />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText("RECENT PROJECT-LEVEL CHANGE EVIDENCE: Not available from the current serving contract.")
      ).toBeInTheDocument();
    });
  });

  // 20: Empty queue is truthful (does NOT claim "no risk")
  it("20: renders truthful empty queue message without declaring 'no risk'", () => {
    renderEarlyWarning({ projects: [] });

    expect(
      screen.getByText("No project-level investigation records are available.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/no risk detected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/all clear/i)).not.toBeInTheDocument();
  });

  // 22: Error state with retry button
  it("22: renders error state with retry button on API failure", async () => {
    const onRetry = vi.fn();
    renderEarlyWarning({
      isError: true,
      error: new Error("Network timeout connecting to risk serving layer"),
      onRetry,
    });

    expect(screen.getByText("EARLY WARNING DATA UNAVAILABLE")).toBeInTheDocument();
    expect(screen.getByText(/Network timeout connecting to risk serving layer/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
    await userEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  // 23: Loading state with skeleton
  it("23: renders loading skeleton without crashing", () => {
    renderEarlyWarning({ isLoading: true });

    expect(
      screen.getByLabelText("Loading early warning investigation signals...")
    ).toBeInTheDocument();
  });

  // 24 & 25: Navigation routes
  it("24-25: provides valid navigation links into Project inspection and Intelligence terminal", () => {
    renderEarlyWarning();

    const inspectLinks = screen.getAllByRole("link", { name: "INSPECT" });
    expect(inspectLinks[0]).toHaveAttribute("href", "/projects/976809");

    const intelLinks = screen.getAllByRole("link", { name: /Open intelligence for project/i });
    expect(intelLinks[0]).toHaveAttribute("href", "/intelligence?project=976809");

    const deepAnalysisLink = screen.getByRole("link", { name: "DEEP RISK ANALYSIS" });
    expect(deepAnalysisLink).toHaveAttribute("href", "/intelligence");
  });

  // 26, 28, 29: Unserved targets, no warning score, district unavailable
  it("26, 28, 29: enforces unserved targets, no warning scores, and district omission", () => {
    renderEarlyWarning();

    expect(screen.getByText(/cost_overrun/i)).toBeInTheDocument();
    expect(screen.getByText(/progress_stagnation/i)).toBeInTheDocument();
    expect(screen.getAllByText(/UNSERVED \/ SPECIFICATION ONLY/i).length).toBeGreaterThanOrEqual(1);

    expect(screen.queryByText(/Warning Score/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI Score/i)).not.toBeInTheDocument();

    expect(
      screen.getAllByText((_, el) => el?.textContent?.includes("District is structurally omitted") ?? false).length
    ).toBeGreaterThanOrEqual(1);
  });
});
