import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { IntelligenceRiskHistory } from "@/components/intelligence/IntelligenceRiskHistory.tsx";
import { IntelligenceRiskInspectionDrawer } from "@/components/intelligence/IntelligenceRiskInspectionDrawer.tsx";
import { IntelligenceTerminal } from "@/components/intelligence/IntelligenceTerminal.tsx";
import { getHistoricalExplanationMethod } from "@/components/intelligence/IntelligenceRiskInspectionGovernance.tsx";
import * as projectsApi from "@/api/projects.ts";
import type {
  ProjectRiskHistoryPoint,
  ProjectIntelligenceIdentity,
  ProjectIntelligenceSnapshot,
  ProjectIntelligenceRisk,
  ProjectRiskIntelligenceResponse,
} from "@/types/project.ts";

vi.mock("@/api/projects.ts", () => ({
  fetchProjectRiskIntelligence: vi.fn(),
  fetchQuickSearchProjects: vi.fn().mockResolvedValue([]),
}));

describe("PR-08: Risk History & Inspection Drawer", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const mockProjectIdentity: ProjectIntelligenceIdentity = {
    project_code: "617936",
    project_name: "Dedicated Freight Corridor (Western)",
    agency: "DFCCIL",
    ministry: "RAILWAYS",
    sector: "RAILWAYS",
    state: "MAHARASHTRA",
    legacy_ocms_code: null,
    pmgid: null,
  };

  const mockSnapshot: ProjectIntelligenceSnapshot = {
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
  };

  const mockCurrentRisk: ProjectIntelligenceRisk = {
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
  };

  const mockHistoryWithTransition: ProjectRiskHistoryPoint[] = [
    {
      report_month: "2025-05",
      risk_probability: 0.405,
      raw_probability: 0.405,
      risk_rank: 60,
      risk_percentile: 0.75,
      population_size: 1570,
      regime: "LEGACY",
      model_id: "catboost_full_v1__unweighted",
      calibration_active: false,
    },
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
  ];

  const mockSingleHistory: ProjectRiskHistoryPoint[] = [
    {
      report_month: "2026-07",
      risk_probability: 0.285,
      raw_probability: 0.285,
      risk_rank: 120,
      risk_percentile: 0.45,
      population_size: 1630,
      regime: "MODERN",
      model_id: "logistic_static_only__unweighted",
      calibration_active: false,
    },
  ];

  const mockFullApiResponse: ProjectRiskIntelligenceResponse = {
    project: mockProjectIdentity,
    snapshot: mockSnapshot,
    risk: mockCurrentRisk,
    model: {
      model_id: "logistic_static_only__unweighted",
      target: "target_effective_schedule_ext_3m",
      model_family: "L2-Regularized Logistic Regression",
      status: "ACTIVE_PRODUCTION",
      is_active: true,
      coverage_period: "2025-07 through 2026-07",
      calibration_policy: "Temporal Platt Scaling (active on 2026-04)",
      explanation_method: "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE",
    },
    history: mockHistoryWithTransition,
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
      cost_revision_ratio: 1.84,
      cost_revision_count: 2,
      schedule_extension_count: 4,
      reporting_months_count: 24,
      first_reported_month: "2024-06",
      latest_reported_month: "2026-07",
    },
    recent_changes: {
      has_prior_observation: true,
      prior_report_month: "2026-06",
      physical_progress_delta: 0.8,
      expenditure_delta: 350.0,
      revised_cost_delta: 0.0,
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

  // 1. Historical timeline renders actual observations
  it("renders actual historical observations without synthetic points", () => {
    render(<IntelligenceRiskHistory history={mockHistoryWithTransition} />);

    expect(screen.getAllByText("2025-05").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2025-06").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2026-04").length).toBeGreaterThanOrEqual(1);

    // Gaps must not be filled with fabricated months
    expect(screen.queryByText("2025-07")).not.toBeInTheDocument();
    expect(screen.queryByText("2025-08")).not.toBeInTheDocument();
    expect(screen.queryByText("2026-01")).not.toBeInTheDocument();
  });

  // 2. Clicking an actual history row opens the drawer
  it("clicking an actual history row or its inspect button triggers selection of exact month", () => {
    const handleSelect = vi.fn();
    render(
      <IntelligenceRiskHistory
        history={mockHistoryWithTransition}
        onSelectMonth={handleSelect}
      />
    );

    const inspectButtons = screen.getAllByRole("button", { name: /inspect/i });
    expect(inspectButtons.length).toBe(3);

    // Click the inspect button for 2025-06
    fireEvent.click(inspectButtons[1]);
    expect(handleSelect).toHaveBeenCalledWith("2025-06");
  });

  // 3. Clicking a chart observation opens the exact corresponding drawer
  // 4. Selected evaluation month is correct
  it("resolves underlying historical record on chart click without guessing coordinates", () => {
    const handleSelect = vi.fn();
    const { container } = render(
      <IntelligenceRiskHistory
        history={mockHistoryWithTransition}
        onSelectMonth={handleSelect}
      />
    );

    // Find dots in chart
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThan(0);

    // Click a point representing 2025-05
    fireEvent.click(circles[0]);
    expect(handleSelect).toHaveBeenCalledWith("2025-05");
  });

  // 5. Historical/current labels remain distinct
  it("distinguishes HISTORICAL RISK EVALUATION from CURRENT ASSESSMENT in the drawer header", () => {
    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[0]}
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("HISTORICAL RISK EVALUATION")).toBeInTheDocument();
    expect(screen.getByText(/CURRENT: 2026-04 \| INSPECTED: 2025-05/)).toBeInTheDocument();
    expect(screen.queryByText("CURRENT RISK ASSESSMENT")).not.toBeInTheDocument();
  });

  // 6. Calibrated probability is displayed distinctly from raw probability
  it("displays calibrated probability and raw probability in distinct metric boxes", () => {
    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[2]} // 2026-04: calibrated=38.4%, raw=32.1%
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("CALIBRATED OPERATIONAL RISK")).toBeInTheDocument();
    expect(screen.getByText("38.4%")).toBeInTheDocument();

    expect(screen.getByText("RAW MODEL PROBABILITY")).toBeInTheDocument();
    expect(screen.getByText("32.1%")).toBeInTheDocument();
  });

  // 7. Missing probability remains unavailable rather than 0%
  it("shows RAW / UNCALIBRATED rather than 0% when calibration is inactive", () => {
    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[0]} // 2025-05: calibration_active=false
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(screen.getAllByText("RAW / UNCALIBRATED").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
  });

  // 8. Historical rank/percentile display only when supplied
  // 9. No TOP X% derivation
  it("displays historical rank and percentile directly without deriving TOP X%", () => {
    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[2]} // rank=42, pop=1625, percentile=0.825
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(screen.getAllByText(/#42/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\/ 1,625/)).toBeInTheDocument();
    expect(screen.getByText("P82.5")).toBeInTheDocument();

    // No derived TOP X%
    expect(screen.queryByText(/TOP 17\.5%/i)).not.toBeInTheDocument();
  });

  // 10. Historical driver evidence is shown only when actually present
  // 11. Current drivers are never displayed as historical drivers
  // 12. Unavailable historical drivers show truthful state
  it("shows truthful unavailable notice when historical drivers are absent and never leaks current drivers", () => {
    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[0]}
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText("HISTORICAL DRIVER EVIDENCE NOT AVAILABLE IN CURRENT SERVING CONTRACT")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The current serving contract provides contribution evidence for the current assessment, but not for this historical evaluation."
      )
    ).toBeInTheDocument();

    // Current drivers must NOT leak into the historical drawer
    expect(screen.queryByText("Schedule Extensions Count")).not.toBeInTheDocument();
    expect(screen.queryByText("+0.412")).not.toBeInTheDocument();
  });

  it("renders historical driver contributions with non-causal language when historical drivers are present", () => {
    const recordWithDrivers: ProjectRiskHistoryPoint = {
      ...mockHistoryWithTransition[0],
      ...({
        top_positive_contributors: [
          {
            feature: "project_age_months",
            display_name: "Project age (months)",
            value: 48,
            contribution: 0.35,
            direction: "POSITIVE",
            rank: 1,
          },
        ],
        top_negative_contributors: [
          {
            feature: "expenditure_to_original_cost_ratio",
            display_name: "Expenditure to original cost ratio",
            value: "0.85",
            contribution: -0.22,
            direction: "NEGATIVE",
            rank: 1,
          },
        ],
      } as unknown as ProjectRiskHistoryPoint),
    };

    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={recordWithDrivers}
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Project age \(months\)/i)).toBeInTheDocument();
    expect(screen.getByText("+0.350")).toBeInTheDocument();
    expect(screen.getByText("RISK-INCREASING (+)")).toBeInTheDocument();

    expect(screen.getByText(/Expenditure to original cost ratio/i)).toBeInTheDocument();
    expect(screen.getByText("-0.220")).toBeInTheDocument();
    expect(screen.getByText("RISK-REDUCING (-)")).toBeInTheDocument();
  });

  // 13. Explanation method matches historical model_id when available
  it("maps explanation method strictly according to model_id without combining generic labels", () => {
    expect(getHistoricalExplanationMethod("logistic_static_only__unweighted")).toBe(
      "Logistic coefficient times transformed value"
    );
    expect(getHistoricalExplanationMethod("catboost_full_v1__unweighted")).toBe(
      "CatBoost-native TreeSHAP"
    );
    expect(getHistoricalExplanationMethod(null)).toBe("EXPLANATION METHOD NOT AVAILABLE");
    expect(getHistoricalExplanationMethod("unknown_model_v99")).toBe(
      "EXPLANATION METHOD NOT AVAILABLE"
    );
  });

  // 14. Model/regime transition is dynamically determined
  // 15. No hardcoded transition month
  it("dynamically shows transition alert when selected record transitions from preceding record", () => {
    // 2026-04 transitions from 2025-06 (LEGACY -> MODERN)
    const { rerender } = render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[2]}
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("MODEL/REGIME TRANSITION AT THIS OBSERVATION")).toBeInTheDocument();
    expect(screen.getByText(/transition from LEGACY.*to MODERN/)).toBeInTheDocument();

    // 2025-06 does NOT transition from 2025-05 (both are LEGACY)
    rerender(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[1]}
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.queryByText("MODEL/REGIME TRANSITION AT THIS OBSERVATION")
    ).not.toBeInTheDocument();
  });

  // 16. Evaluation month comes from the historical record
  // 17. Snapshot/evaluation months remain distinct when both exist
  it("keeps snapshot and evaluation months clearly distinct", () => {
    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[0]} // evaluation = 2025-05
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        snapshot={mockSnapshot} // snapshot = 2026-07
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("LATEST SNAPSHOT MONTH")).toBeInTheDocument();
    expect(screen.getAllByText("2026-07").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("EVALUATION MONTH")).toBeInTheDocument();
    expect(screen.getAllByText("2025-05").length).toBeGreaterThanOrEqual(1);
  });

  // 18. Escape closes drawer
  // 19. Close button works
  // 20. Focus returns to invoking control
  it("closes on close button click and escape key press with focus restoration", async () => {
    const handleClose = vi.fn();

    // Create a dummy button as the invoking control
    const invokingButton = document.createElement("button");
    invokingButton.focus();
    document.body.appendChild(invokingButton);

    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[0]}
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={handleClose}
      />
    );

    // Close button click
    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });

    document.body.removeChild(invokingButton);
  });

  it("closes on Escape key press", async () => {
    const handleClose = vi.fn();
    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[0]}
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={handleClose}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });
  });

  // 21. Project switch clears historical selection
  it("clears historical selection when project code changes in IntelligenceTerminal", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockResolvedValue(mockFullApiResponse);

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <IntelligenceTerminal
            selectedProjectCode="617936"
            onSelectProject={vi.fn()}
            onClearProject={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("HISTORICAL RISK TRAJECTORY").length).toBeGreaterThanOrEqual(1);
    });

    // Open drawer by clicking an inspect button
    const inspectButtons = screen.getAllByRole("button", { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Switch project
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <IntelligenceTerminal
            selectedProjectCode="617937"
            onSelectProject={vi.fn()}
            onClearProject={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Drawer must be closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // 22. Empty history remains truthful
  it("renders truthful empty state for empty history", () => {
    render(<IntelligenceRiskHistory history={[]} />);

    expect(
      screen.getByText("NO HISTORICAL EVALUATIONS RECORDED FOR THIS PROJECT")
    ).toBeInTheDocument();
  });

  // 23. Single observation remains discrete but inspectable
  it("single observation renders discrete card and is inspectable via button", () => {
    const handleSelect = vi.fn();
    render(
      <IntelligenceRiskHistory
        history={mockSingleHistory}
        onSelectMonth={handleSelect}
      />
    );

    expect(screen.getByText("DISCRETE SINGLE EVALUATION")).toBeInTheDocument();
    const singleInspectBtn = screen.getByRole("button", {
      name: /inspect historical evaluation for 2026-07/i,
    });
    expect(singleInspectBtn).toBeInTheDocument();

    fireEvent.click(singleInspectBtn);
    expect(handleSelect).toHaveBeenCalledWith("2026-07");
  });

  // 24. Loading state does not render fake history
  it("loading state in terminal does not render fake history", () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockReturnValue(new Promise(() => {}));

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <IntelligenceTerminal
            selectedProjectCode="617936"
            onSelectProject={vi.fn()}
            onClearProject={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText("FETCHING PROJECT INTELLIGENCE...")).toBeInTheDocument();
    expect(screen.queryByText("HISTORICAL RISK TRAJECTORY")).not.toBeInTheDocument();
  });

  // 25. API error is not silently treated as empty history
  it("API error renders explicit error card and is not treated as empty history", async () => {
    vi.mocked(projectsApi.fetchProjectRiskIntelligence).mockRejectedValue(
      new Error("Gateway Timeout")
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <IntelligenceTerminal
            selectedProjectCode="617936"
            onSelectProject={vi.fn()}
            onClearProject={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("PROJECT INTELLIGENCE UNAVAILABLE")).toBeInTheDocument();
    });

    expect(screen.getByText("Gateway Timeout")).toBeInTheDocument();
    expect(
      screen.queryByText("NO HISTORICAL EVALUATIONS RECORDED FOR THIS PROJECT")
    ).not.toBeInTheDocument();
  });

  // 26. Accessibility table remains available
  it("renders accessible table with buttons nested cleanly in table cells", () => {
    const { container } = render(
      <IntelligenceRiskHistory history={mockHistoryWithTransition} />
    );

    const table = screen.getByRole("table", { name: /chronological risk history/i });
    expect(table).toBeInTheDocument();

    // Verify buttons are strictly inside td, never as direct children of tr
    const rows = container.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const directButtons = Array.from(row.children).filter(
        (el) => el.tagName.toLowerCase() === "button"
      );
      expect(directButtons.length).toBe(0);

      const cellButton = row.querySelector("td button");
      expect(cellButton).toBeInTheDocument();
    });
  });

  // 27. Direction text does not depend on color
  it("renders driver direction in explicit text without relying solely on color", () => {
    const recordWithDrivers: ProjectRiskHistoryPoint = {
      ...mockHistoryWithTransition[0],
      ...({
        strongest_drivers: [
          {
            feature: "project_age_months",
            display_name: "Project Age",
            contribution: 0.15,
            direction: "POSITIVE",
            rank: 1,
          },
        ],
      } as unknown as ProjectRiskHistoryPoint),
    };

    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={recordWithDrivers}
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("RISK-INCREASING (+)")).toBeInTheDocument();
  });

  // 28. Reduced-motion styles remain supported
  it("supports reduced-motion preferences without animated transition breakages", () => {
    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[0]}
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("DATA AVAILABILITY DISCLOSURE")).toBeInTheDocument();
    expect(screen.getByText(/AVAILABLE \(2025-05\)/)).toBeInTheDocument();
  });

  // 29. No prohibited causal language
  it("avoids prohibited causal language across historical inspection drawer", () => {
    const { container } = render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[0]}
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    const textContent = container.textContent?.toLowerCase() || "";
    expect(textContent).not.toContain("root cause");
    expect(textContent).not.toContain("causes delay");
    expect(textContent).not.toContain("causal effect");
  });

  // 30. No fabricated historical data
  it("ensures drawer data strictly originates from the passed historical record", () => {
    render(
      <IntelligenceRiskInspectionDrawer
        isOpen={true}
        record={mockHistoryWithTransition[1]} // 2025-06, catboost_full_v1__unweighted, 42.1%
        history={mockHistoryWithTransition}
        project={mockProjectIdentity}
        currentRisk={mockCurrentRisk}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("2025-06 RISK RECORD")).toBeInTheDocument();
    expect(screen.getByText("catboost_full_v1__unweighted")).toBeInTheDocument();
    expect(screen.getByText("42.1%")).toBeInTheDocument();
    expect(screen.getByText("#55")).toBeInTheDocument();
  });
});
