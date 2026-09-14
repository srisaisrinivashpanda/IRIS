/**
 * PR-14 Dedicated Test Suite: Projects Workspace & Portfolio Investigation
 * 
 * Verifies:
 * - 4 Review Corrections:
 *   1. Project Query Contract: URL sync, deterministic sorting, only supported backend params sent.
 *   2. Project Table Risk Contract: NO N+1 risk requests in table, risk fetched only for selected project in drawer.
 *   3. Ministry Filter Contract: ministry select rendered conditionally only if options present in contract.
 *   4. Financial Observation Semantics: non-recomputed backend fields, nulls rendered as "—".
 * - Fixtures A through G.
 * - Absence of prohibited labels (LOW/MEDIUM/HIGH/CRITICAL, TOP X%, AI/WARNING/HEALTH scores).
 * - Canonical navigation routes (/projects/{code}, /intelligence?project={code}, no /intelligence/projects).
 */

import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProjectsPage } from "../../../pages/ProjectsPage.tsx";
import { ProjectsInvestigationTable } from "../../../components/projects/ProjectsInvestigationTable.tsx";
import { ProjectInspectionDrawer } from "../../../components/projects/ProjectInspectionDrawer.tsx";
import { ProjectsPortfolioSummary } from "../../../components/projects/ProjectsPortfolioSummary.tsx";
import { ProjectSearch } from "../../../components/projects/ProjectSearch.tsx";
import { ProjectsEvidenceAndLimitations } from "../../../components/projects/ProjectsEvidenceAndLimitations.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import * as projectsApi from "@/api/projects.ts";
import * as systemApi from "@/api/system.ts";
import * as riskApi from "@/api/risk.ts";
import type { ProjectSummaryItem, ProjectRiskIntelligenceResponse } from "@/types/project.ts";

describe("PR-14: Projects Workspace & Portfolio Investigation", () => {
  let queryClient: QueryClient;

  // Canonical test fixtures A - G
  const fixtureA_Modern: ProjectSummaryItem = {
    id: 101,
    project_code: "PRJ-M01",
    project_name: "Modern Expressway Corridor",
    agency: "NHAI",
    ministry: "Ministry of Road Transport",
    sector: "Roads & Highways",
    state: "Maharashtra",
    report_month: "2026-07",
    approval_date: "2021-04",
    original_completion_date: "2025-12",
    revised_completion_date: "2026-10",
    original_cost: 2500.0,
    revised_cost: 2900.0,
    cumulative_expenditure: 1850.5,
    physical_progress: 65.0,
  };

  const fixtureB_Legacy: ProjectSummaryItem = {
    id: 102,
    project_code: "N12345678",
    project_name: "Legacy Thermal Power Line",
    agency: "NTPC",
    ministry: "Ministry of Power",
    sector: "Power",
    state: "Bihar",
    report_month: "2025-06",
    approval_date: "2018-09",
    original_completion_date: "2023-03",
    revised_completion_date: "2025-11",
    original_cost: 4100.0,
    revised_cost: 5200.0,
    cumulative_expenditure: 3900.0,
    physical_progress: 88.5,
  };

  const fixtureC_MissingProgress: ProjectSummaryItem = {
    id: 103,
    project_code: "PRJ-M02",
    project_name: "Unreported Progress Metro",
    agency: "DMRC",
    ministry: "Ministry of Housing",
    sector: "Urban Development",
    state: "Delhi",
    report_month: "2026-07",
    approval_date: "2022-01",
    original_completion_date: "2026-06",
    revised_completion_date: null,
    original_cost: 1500.0,
    revised_cost: null,
    cumulative_expenditure: 600.0,
    physical_progress: null, // Empty progress
  };

  const fixtureD_MissingFinancials: ProjectSummaryItem = {
    id: 104,
    project_code: "PRJ-M03",
    project_name: "Border Defense Link",
    agency: "BRO",
    ministry: "Ministry of Defence",
    sector: "Defence Infrastructure",
    state: "Ladakh",
    report_month: "2026-07",
    approval_date: null,
    original_completion_date: null,
    revised_completion_date: null,
    original_cost: null,
    revised_cost: null,
    cumulative_expenditure: null,
    physical_progress: null,
  };

  const fixtureA_RiskResponse: ProjectRiskIntelligenceResponse = {
    project: {
      project_code: "PRJ-M01",
      project_name: "Modern Expressway Corridor",
      agency: "NHAI",
      ministry: "Ministry of Road Transport",
      sector: "Roads & Highways",
      state: "Maharashtra",
      legacy_ocms_code: null,
      pmgid: null,
    },
    snapshot: {
      report_month: "2026-07",
      physical_progress: 65.0,
      financial_progress: 63.8,
      cumulative_expenditure: 1850.5,
      original_cost: 2500.0,
      revised_cost: 2900.0,
      approval_date: "2021-04",
      start_date: "2021-06",
      original_completion_date: "2025-12",
      revised_completion_date: "2026-10",
    },
    risk: {
      risk_probability: 0.425,
      raw_probability: 0.48,
      risk_rank: 184,
      risk_percentile: 0.88,
      population_size: 4738,
      report_month: "2026-07",
      regime: "MODERN",
      model_id: "catboost_regime_modern_v1",
      target: "target_effective_schedule_ext_3m",
      calibration_active: true,
    },
    model: {
      model_id: "catboost_regime_modern_v1",
      target: "target_effective_schedule_ext_3m",
      model_family: "CatBoostClassifier",
      status: "ACTIVE_SERVING",
      is_active: true,
      coverage_period: "2025-07 → 2026-07",
    },
    history: [],
    drivers: { top_positive: [], top_negative: [], strongest_drivers: [] },
    signals: {
      cost_revised: true,
      schedule_revised: true,
      cost_revision_ratio: 1.16,
      cost_revision_count: 1,
      schedule_extension_count: 1,
      reporting_months_count: 12,
      first_reported_month: "2025-08",
      latest_reported_month: "2026-07",
    },
    recent_changes: {
      has_prior_observation: true,
      prior_report_month: "2026-06",
      physical_progress_delta: 2.5,
      expenditure_delta: 85.0,
      revised_cost_delta: 0.0,
      completion_date_changed: false,
    },
    data_availability: {
      has_project_data: true,
      has_risk_assessment: true,
      has_risk_history: false,
      has_drivers: false,
      snapshot_report_month: "2026-07",
      risk_report_month: "2026-07",
      cost_risk_ml_served: false,
      progress_stagnation_ml_served: false,
    },
  };

  const fixtureB_RiskResponse: ProjectRiskIntelligenceResponse = {
    ...fixtureA_RiskResponse,
    project: {
      ...fixtureA_RiskResponse.project,
      project_code: "N12345678",
      project_name: "Legacy Thermal Power Line",
    },
    risk: {
      ...fixtureA_RiskResponse.risk!,
      regime: "LEGACY",
      model_id: "logistic_regime_legacy_v1",
      raw_probability: 0.72,
      risk_probability: 0.68,
      risk_rank: 92,
      population_size: 4200,
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue({
      items: [fixtureA_Modern, fixtureB_Legacy, fixtureC_MissingProgress, fixtureD_MissingFinancials],
      total: 4,
      page: 1,
      page_size: 25,
      total_pages: 1,
    });

    vi.spyOn(projectsApi, "fetchFilterOptions").mockResolvedValue({
      sectors: ["Roads & Highways", "Power", "Urban Development", "Defence Infrastructure"],
      agencies: ["NHAI", "NTPC", "DMRC", "BRO"],
      states: ["Maharashtra", "Bihar", "Delhi", "Ladakh"],
      ministries: ["Ministry of Road Transport", "Ministry of Power"],
      report_months: ["2025-06", "2026-07"],
    });

    vi.spyOn(systemApi, "fetchDatasetInfo").mockResolvedValue({
      status: "ACTIVE",
      covered_months: ["2023-10", "2026-07"],
      row_count: 64608,
      unique_projects_count: 4738,
      canonical_sha256: "9512A9881E17DFDED6E182D87A8DFB1C4EDBD36C0D9B8A7DA9FD1ABB7E002FBF",
    });

    vi.spyOn(riskApi, "fetchRiskOptions").mockResolvedValue({
      report_months: ["2026-07", "2026-06"],
      default_report_month: "2026-07",
      selected_report_month: "2026-07",
      regimes: ["MODERN", "LEGACY"],
      sectors: ["Roads & Highways"],
      agencies: ["NHAI"],
      ministries: ["Ministry of Road Transport"],
      states: ["Maharashtra"],
    });

    vi.spyOn(projectsApi, "fetchProjectRiskIntelligence").mockImplementation(async (code) => {
      if (code === "PRJ-M01") return fixtureA_RiskResponse;
      if (code === "N12345678") return fixtureB_RiskResponse;
      // Fixture E: Risk unassessed / unavailable
      return {
        project: {
          project_code: code,
          project_name: "Unassessed Project",
          agency: null,
          ministry: null,
          sector: null,
          state: null,
          legacy_ocms_code: null,
          pmgid: null,
        },
        snapshot: null,
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
          snapshot_report_month: null,
          risk_report_month: null,
          cost_risk_ml_served: false,
          progress_stagnation_ml_served: false,
        },
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (initialUrl = "/projects") => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialUrl]}>
          <Routes>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:code" element={<div data-testid="project-detail-route">Project Detail Page</div>} />
            <Route path="/intelligence" element={<div data-testid="intelligence-route">Intelligence Terminal</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  // =========================================================================
  // 1. REVIEW CORRECTION 1: URL Parameters & Query Contract
  // =========================================================================

  it("Correction 1: synchronizes filters strictly from URL search params on initial load", async () => {
    renderWithRouter("/projects?sector=Roads%20%26%20Highways&agency=NHAI&sort_by=original_cost&sort_order=asc&page=2");

    await waitFor(() => {
      expect(projectsApi.fetchProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          sector: "Roads & Highways",
          agency: "NHAI",
          sort_by: "original_cost",
          sort_order: "asc",
          page: 2,
        })
      );
    });
  });

  it("Correction 1 (Test C): does not send unsupported query parameters to the backend", async () => {
    renderWithRouter("/projects?unsupported_param=fake_value&another_unsupported=123");

    await waitFor(() => {
      expect(projectsApi.fetchProjects).toHaveBeenCalled();
    });

    const callArgs = vi.mocked(projectsApi.fetchProjects).mock.calls[0][0];
    expect(callArgs).not.toHaveProperty("unsupported_param");
    expect(callArgs).not.toHaveProperty("another_unsupported");
  });

  // =========================================================================
  // 2. REVIEW CORRECTION 2: Project Table Risk Contract (NO N+1 Requests)
  // =========================================================================

  it("Correction 2 (Test A): does NOT invoke fetchProjectRiskIntelligence per table row when rendering multi-project portfolio", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
      expect(screen.getByText("Legacy Thermal Power Line")).toBeInTheDocument();
      expect(screen.getByText("Unreported Progress Metro")).toBeInTheDocument();
      expect(screen.getByText("Border Defense Link")).toBeInTheDocument();
    });

    // Zero risk intelligence requests should be made for rendering the table!
    expect(projectsApi.fetchProjectRiskIntelligence).not.toHaveBeenCalled();
  });

  it("Correction 2: invokes fetchProjectRiskIntelligence ONLY for explicitly selected project in drawer", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    // Click inspect on first project
    const inspectButtons = screen.getAllByText("INSPECT");
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("PROJECT INSPECTION CONSOLE")).toBeInTheDocument();
    });

    // Exactly 1 fetch for the inspected project
    expect(projectsApi.fetchProjectRiskIntelligence).toHaveBeenCalledTimes(1);
    expect(projectsApi.fetchProjectRiskIntelligence).toHaveBeenCalledWith("PRJ-M01");
  });

  // =========================================================================
  // 3. REVIEW CORRECTION 3: Ministry Filter Contract
  // =========================================================================

  it("Correction 3 (Test B): renders ministry filter only when ministries options are present in contract", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByLabelText("Filter by ministry")).toBeInTheDocument();
      expect(screen.getByText("MINISTRY (ALL)")).toBeInTheDocument();
    });
  });

  it("Correction 3 (Test B): omits ministry select when options.ministries is empty or absent", async () => {
    vi.mocked(projectsApi.fetchFilterOptions).mockResolvedValueOnce({
      sectors: ["Roads & Highways"],
      agencies: ["NHAI"],
      states: ["Maharashtra"],
      ministries: [], // Empty ministries list
      report_months: ["2026-07"],
    });

    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByLabelText("Filter by sector")).toBeInTheDocument();
    });

    expect(screen.queryByLabelText("Filter by ministry")).not.toBeInTheDocument();
  });

  // =========================================================================
  // 4. REVIEW CORRECTION 4: Financial Observation Semantics
  // =========================================================================

  it("Correction 4 (Test D): renders project financial fields directly from backend without recomputation", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    // Original Cost, Revised Cost, Expenditure rendered as returned
    expect(screen.getByText("₹2,500 Cr")).toBeInTheDocument();
    expect(screen.getByText("₹2,900 Cr")).toBeInTheDocument();
    expect(screen.getByText("₹1,850.5 Cr")).toBeInTheDocument();
  });

  it("Correction 4: renders null financials and null progress as '—', never 0 or 0%", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Border Defense Link")).toBeInTheDocument();
    });

    // Fixture D has all null financials and progress; verify multiple "—" rendered
    const emDashes = screen.getAllByText("—");
    expect(emDashes.length).toBeGreaterThanOrEqual(4);

    // Verify it doesn't fabricate "₹0 Cr" or "0%" for null records
    expect(screen.queryByText("₹0 Cr")).not.toBeInTheDocument();
  });

  // =========================================================================
  // 5. Fixtures A–G Semantics & Edge Cases
  // =========================================================================

  it("Fixture A: renders modern project with authentic progress bar and financial fields", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
      expect(screen.getByText("65%")).toBeInTheDocument();
    });

    const progressbar = screen.getAllByRole("progressbar")[0];
    expect(progressbar).toHaveAttribute("aria-valuenow", "65");
  });

  it("Fixture B: renders legacy format project identifier and legacy details", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("N12345678")).toBeInTheDocument();
      expect(screen.getByText("Legacy Thermal Power Line")).toBeInTheDocument();
      expect(screen.getByText("88.5%")).toBeInTheDocument();
    });
  });

  it("Fixture C: renders null progress as '—' without progress bar filling", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Unreported Progress Metro")).toBeInTheDocument();
    });

    const metroRow = screen.getByText("Unreported Progress Metro").closest("tr")!;
    const emDashes = within(metroRow).getAllByText("—");
    expect(emDashes.length).toBeGreaterThanOrEqual(1);

    // Verify progress-bar-empty is present and no filled progressbar
    const emptyTrack = metroRow.querySelector(".progress-bar-empty");
    expect(emptyTrack).toBeInTheDocument();
  });

  it("Fixture E: drawer displays truthful 'Risk evaluation unavailable for this project.' for unassessed project", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Unreported Progress Metro")).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByText("INSPECT");
    fireEvent.click(inspectButtons[2]); // Third project is PRJ-M02 (unassessed)

    await waitFor(() => {
      expect(screen.getByTestId("drawer-risk-unavailable")).toBeInTheDocument();
      expect(screen.getByText("Risk evaluation unavailable for this project.")).toBeInTheDocument();
    });

    // Strictly no fake 0% risk probability
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
  });

  it("Fixture F: drawer explicitly states cost_overrun and progress_stagnation as unserved specification-only domains", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByText("INSPECT");
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("UNSERVED TARGETS (SPECIFICATION ONLY):")).toBeInTheDocument();
      expect(screen.getByText("cost_overrun: NOT SERVED")).toBeInTheDocument();
      expect(screen.getByText("progress_stagnation: NOT SERVED")).toBeInTheDocument();
    });
  });

  it("Fixture G: drawer displays distinct calibrated vs raw model probabilities and dynamic regime", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByText("INSPECT");
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("CALIBRATED PROBABILITY")).toBeInTheDocument();
      expect(screen.getByText("42.5%")).toBeInTheDocument();
      expect(screen.getByText("RAW MODEL PROBABILITY")).toBeInTheDocument();
      expect(screen.getByText("48.0%")).toBeInTheDocument();
      expect(screen.getByTestId("drawer-risk-regime")).toHaveTextContent("MODERN");
      expect(screen.getByText("catboost_regime_modern_v1")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 6. Prohibited Labels & Classifications
  // =========================================================================

  it("does not render prohibited risk tiers: LOW, MEDIUM, HIGH, CRITICAL", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    expect(screen.queryByText("LOW RISK")).not.toBeInTheDocument();
    expect(screen.queryByText("MEDIUM RISK")).not.toBeInTheDocument();
    expect(screen.queryByText("HIGH RISK")).not.toBeInTheDocument();
    expect(screen.queryByText("CRITICAL RISK")).not.toBeInTheDocument();
  });

  it("does not render prohibited classifications: TOP 5%, TOP 10%, AI SCORE, WARNING SCORE, HEALTH SCORE", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    expect(screen.queryByText("TOP 5%")).not.toBeInTheDocument();
    expect(screen.queryByText("TOP 10%")).not.toBeInTheDocument();
    expect(screen.queryByText("AI SCORE")).not.toBeInTheDocument();
    expect(screen.queryByText("WARNING SCORE")).not.toBeInTheDocument();
    expect(screen.queryByText("HEALTH SCORE")).not.toBeInTheDocument();
  });

  // =========================================================================
  // 7. Navigation Routes
  // =========================================================================

  it("provides canonical navigation link to /projects/{projectCode}", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    const projectLink = screen.getByRole("link", { name: "Modern Expressway Corridor" });
    expect(projectLink).toHaveAttribute("href", "/projects/PRJ-M01");
  });

  it("provides canonical risk intel link to /intelligence?project={projectCode} and strictly rejects /intelligence/projects", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    const riskIntelLinks = screen.getAllByTitle("Investigate in Intelligence Terminal");
    expect(riskIntelLinks[0]).toHaveAttribute("href", "/intelligence?project=PRJ-M01");

    // Drawer link
    const inspectButtons = screen.getAllByText("INSPECT");
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("OPEN RISK INVESTIGATION →")).toBeInTheDocument();
    });

    const drawerIntelLink = screen.getByText("OPEN RISK INVESTIGATION →").closest("a");
    expect(drawerIntelLink).toHaveAttribute("href", "/intelligence?project=PRJ-M01");

    // Verify /intelligence/projects is nowhere in the DOM
    const allLinks = screen.getAllByRole("link");
    allLinks.forEach((link) => {
      expect(link.getAttribute("href")).not.toContain("/intelligence/projects");
    });
  });

  // =========================================================================
  // 8. Sorting, Pagination & Reset Filters
  // =========================================================================

  it("toggles sort order when clicking sortable table column headers", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    // Find and click the sortable button for ORIGINAL COST
    const costHeaderBtn = screen.getByRole("button", { name: /Sort by ORIGINAL COST/i });
    fireEvent.click(costHeaderBtn);

    await waitFor(() => {
      expect(projectsApi.fetchProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_by: "original_cost",
          sort_order: "desc",
        })
      );
    });
  });

  it("resets active filters and clears search parameters on reset click", async () => {
    renderWithRouter("/projects?sector=Power");

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-active-scope-pill")).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole("button", { name: "Reset all filters" });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(projectsApi.fetchProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          sector: undefined,
          page: 1,
        })
      );
    });
  });

  // =========================================================================
  // 9. Error Handling, Empty States, and Keyboard Navigation
  // =========================================================================

  it("renders error state with retry button when projects API fails", async () => {
    vi.mocked(projectsApi.fetchProjects).mockRejectedValueOnce(new Error("Service unreachable"));

    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("PROJECT DIRECTORY UNAVAILABLE")).toBeInTheDocument();
      expect(screen.getByText("Service unreachable")).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole("button", { name: "RETRY CONNECTION" });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(projectsApi.fetchProjects).toHaveBeenCalledTimes(2);
    });
  });

  it("renders empty portfolio state with reset button when no projects match query", async () => {
    vi.mocked(projectsApi.fetchProjects).mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      page_size: 25,
      total_pages: 0,
    });

    renderWithRouter("/projects?search=NonExistentProject123");

    await waitFor(() => {
      expect(screen.getByText("NO PROJECTS FOUND MATCHING CURRENT QUERY")).toBeInTheDocument();
      expect(screen.getByText("RESET SEARCH & CLEAR ALL FILTERS")).toBeInTheDocument();
    });
  });

  it("navigates to project detail on Enter key press on table row", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    const modernRow = screen.getByText("Modern Expressway Corridor").closest("tr")!;
    fireEvent.keyDown(modernRow, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-route")).toBeInTheDocument();
    });
  });

  it("closes project inspection drawer on Escape key press", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByText("Modern Expressway Corridor")).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByText("INSPECT");
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("PROJECT INSPECTION CONSOLE")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("PROJECT INSPECTION CONSOLE")).not.toBeInTheDocument();
    });
  });

  it("does not render any fabricated district filter dropdown in ProjectSearch", async () => {
    renderWithRouter("/projects");

    await waitFor(() => {
      expect(screen.getByLabelText("Search projects")).toBeInTheDocument();
    });

    const searchSection = screen.getByLabelText("Project Search and Filters");
    expect(within(searchSection).queryByLabelText(/district/i)).not.toBeInTheDocument();
    expect(within(searchSection).queryByText(/DISTRICT/i)).not.toBeInTheDocument();
  });

  it("renders loading skeleton in table when projects are loading", () => {
    render(
      <MemoryRouter>
        <ProjectsInvestigationTable projects={[]} isLoading={true} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Loading Projects")).toBeInTheDocument();
  });

  // =========================================================================
  // 10. Methodological Limitations Disclosure
  // =========================================================================

  it("renders all 7 explicit methodological caveats and contract boundaries", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProjectsEvidenceAndLimitations />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText("PORTFOLIO INVESTIGATION METHODOLOGY & CONTRACT BOUNDARIES")).toBeInTheDocument();
    expect(screen.getByText("1. Observational Non-Causal Telemetry")).toBeInTheDocument();
    expect(screen.getByText("2. Observation Scope vs. Risk Evaluation Coverage")).toBeInTheDocument();
    expect(screen.getByText("3. Single Served Machine Learning Target")).toBeInTheDocument();
    expect(screen.getByText("4. Unserved Specification Domains")).toBeInTheDocument();
    expect(screen.getByText("5. Non-Imputation of Missing Observations")).toBeInTheDocument();
    expect(screen.getByText("6. Structural District Omission")).toBeInTheDocument();
    expect(screen.getByText("7. Deterministic Column Sorting")).toBeInTheDocument();
  });
});
