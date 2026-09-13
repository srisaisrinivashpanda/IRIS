import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { IntelligenceRiskProbabilityScale } from "@/components/intelligence/IntelligenceRiskProbabilityScale.tsx";
import { IntelligencePortfolioPosition } from "@/components/intelligence/IntelligencePortfolioPosition.tsx";
import { IntelligenceRiskAssessment } from "@/components/intelligence/IntelligenceRiskAssessment.tsx";
import { IntelligenceRiskHistory } from "@/components/intelligence/IntelligenceRiskHistory.tsx";
import { IntelligenceRiskDrivers } from "@/components/intelligence/IntelligenceRiskDrivers.tsx";
import { IntelligenceTerminalHeader } from "@/components/intelligence/IntelligenceTerminalHeader.tsx";
import type {
  ProjectIntelligenceRisk,
  ProjectRiskHistoryPoint,
  ProjectRiskDrivers,
  ProjectIntelligenceIdentity,
} from "@/types/project.ts";

describe("PR-06: Advanced Intelligence Visualizations", () => {
  const mockProjectIdentity: ProjectIntelligenceIdentity = {
    project_code: "617936",
    project_name: "Dedicated Freight Corridor (Western)",
    agency: "DFCCIL",
    ministry: "RAILWAYS",
    sector: "RAILWAYS",
    state: "MAHARASHTRA",
    legacy_ocms_code: "OCMS-1234",
    pmgid: "PMG-5678",
  };

  const mockAssessedRisk: ProjectIntelligenceRisk = {
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

  const mockUncalibratedRisk: ProjectIntelligenceRisk = {
    risk_probability: 0.421,
    raw_probability: 0.421,
    risk_rank: 55,
    risk_percentile: 0.78,
    population_size: 1580,
    report_month: "2025-06",
    regime: "LEGACY",
    model_id: "catboost_full_v1__unweighted",
    target: "target_effective_schedule_ext_3m",
    calibration_active: false,
  };

  const mockTransitionHistory: ProjectRiskHistoryPoint[] = [
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

  const mockModernOnlyHistory: ProjectRiskHistoryPoint[] = [
    {
      report_month: "2026-03",
      risk_probability: 0.35,
      raw_probability: 0.31,
      risk_rank: 50,
      risk_percentile: 0.8,
      population_size: 1620,
      regime: "MODERN",
      model_id: "logistic_static_only__unweighted",
      calibration_active: true,
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

  const mockDrivers: ProjectRiskDrivers = {
    top_positive: [
      {
        feature: "schedule_extensions_count",
        display_name: "Schedule Extensions Count",
        value: "4",
        contribution: 0.412,
        direction: "POSITIVE",
        rank: 1,
      },
      {
        feature: "cumulative_expenditure_lag",
        display_name: "Cumulative Expenditure Lag",
        value: "32%",
        contribution: 0.185,
        direction: "POSITIVE",
        rank: 2,
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
  };

  // 1. Current risk probability visualization uses actual probability
  it("renders exact authoritative probability in probability scale without fabrication", () => {
    render(
      <IntelligenceRiskProbabilityScale
        probability={mockAssessedRisk.risk_probability}
        rawProbability={mockAssessedRisk.raw_probability}
        calibrationActive={mockAssessedRisk.calibration_active}
      />
    );

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "38.4");
    expect(screen.getAllByText("38.4%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("(RAW: 32.1%)")).toBeInTheDocument();
  });

  // 2. No arbitrary risk threshold labels are introduced
  it("never introduces subjective threshold categories like 'Low / Medium / High Risk'", () => {
    render(<IntelligenceRiskAssessment risk={mockAssessedRisk} />);

    expect(screen.queryByText(/LOW RISK/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/MEDIUM RISK/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/HIGH RISK/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CRITICAL RISK/i)).not.toBeInTheDocument();
  });

  // 3. Portfolio rank/population use actual values
  it("renders portfolio risk rank and population size using exact reported values", () => {
    render(
      <IntelligencePortfolioPosition
        rank={mockAssessedRisk.risk_rank}
        populationSize={mockAssessedRisk.population_size}
        percentile={mockAssessedRisk.risk_percentile}
      />
    );

    expect(screen.getByText("#42")).toBeInTheDocument();
    expect(screen.getByText("/ 1,625")).toBeInTheDocument();
    expect(screen.getByText(/RANK #42 ACROSS 1,625 MONITORED PROJECTS/)).toBeInTheDocument();
  });

  // 4. Percentile is rendered as provided (no derived TOP X%)
  it("renders risk percentile directly as P82.5 and 82.5% without deriving TOP X%", () => {
    render(
      <IntelligencePortfolioPosition
        rank={mockAssessedRisk.risk_rank}
        populationSize={mockAssessedRisk.population_size}
        percentile={mockAssessedRisk.risk_percentile}
      />
    );

    expect(screen.getAllByText("P82.5").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/TOP 17\.5%/i)).not.toBeInTheDocument();
  });

  // 5. History renders actual observed months only
  // 6. History does not fabricate missing months
  it("renders exactly observed months without manufacturing unobserved periods", () => {
    render(<IntelligenceRiskHistory history={mockTransitionHistory} />);

    // Observed months: 2025-05, 2025-06, 2026-04
    expect(screen.getAllByText("2025-05").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2025-06").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2026-04").length).toBeGreaterThanOrEqual(1);

    // Unobserved months must NOT be present
    expect(screen.queryByText("2025-07")).not.toBeInTheDocument();
    expect(screen.queryByText("2025-08")).not.toBeInTheDocument();
    expect(screen.queryByText("2025-12")).not.toBeInTheDocument();
    expect(screen.queryByText("2026-01")).not.toBeInTheDocument();
  });

  // 7. Single-observation history does not imply a trend
  it("renders a discrete single-observation card without implying a trend line when history has 1 record", () => {
    render(<IntelligenceRiskHistory history={mockSingleHistory} />);

    expect(screen.getByText("DISCRETE SINGLE EVALUATION")).toBeInTheDocument();
    expect(screen.getAllByText("2026-07").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("28.5%").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/Only a single historical evaluation is recorded for this project/i)
    ).toBeInTheDocument();

    // Line chart container should NOT render for single observation
    expect(screen.queryByRole("region", { name: /chart/i })).not.toBeInTheDocument();
  });

  // 8. Empty history does not render a zero line
  it("renders truthful empty text and no zero line when history is empty", () => {
    render(<IntelligenceRiskHistory history={[]} />);

    expect(
      screen.getByText("NO HISTORICAL EVALUATIONS RECORDED FOR THIS PROJECT")
    ).toBeInTheDocument();
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
  });

  // 9. Calibrated and raw probability series use the correct fields
  it("renders calibrated risk and raw probability in distinct series", () => {
    render(<IntelligenceRiskHistory history={mockTransitionHistory} />);

    // In 2026-04: calibrated = 38.4%, raw = 32.1%
    expect(screen.getAllByText("38.4%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("32.1%").length).toBeGreaterThanOrEqual(1);
  });

  // 10. Calibration-inactive observations do not receive fabricated calibrated values
  it("shows RAW / UNCALIBRATED for uncalibrated observations without inventing calibrated values", () => {
    render(<IntelligenceRiskHistory history={mockTransitionHistory} />);

    // For 2025-05 and 2025-06, calibration is inactive
    const rawBadges = screen.getAllByText("RAW");
    expect(rawBadges.length).toBeGreaterThanOrEqual(2);

    const activeBadges = screen.getAllByText("ACTIVE");
    expect(activeBadges.length).toBeGreaterThanOrEqual(1);
  });

  // 11. Legacy/modern transition is shown only when history actually contains a transition
  // 12. Model IDs in transition display dynamically
  it("displays regime transition banner dynamically only when history contains multiple regimes", () => {
    const { rerender } = render(<IntelligenceRiskHistory history={mockTransitionHistory} />);

    // Multi-regime history: transition banner present
    expect(screen.getByText("REGIME TRANSITION DETECTED")).toBeInTheDocument();
    expect(screen.getByText(/LEGACY → MODERN/)).toBeInTheDocument();
    expect(
      screen.getByText(/catboost_full_v1__unweighted → logistic_static_only__unweighted/)
    ).toBeInTheDocument();

    // Modern-only history: transition banner MUST NOT be present
    rerender(<IntelligenceRiskHistory history={mockModernOnlyHistory} />);
    expect(screen.queryByText("REGIME TRANSITION DETECTED")).not.toBeInTheDocument();
  });

  // 13. Driver bars preserve signed contribution values
  // 14. Drivers are not relabeled as causal effects
  it("renders signed margin contributions in model logit space with causality disclaimer", () => {
    render(<IntelligenceRiskDrivers drivers={mockDrivers} />);

    expect(screen.getByText("Schedule Extensions Count")).toBeInTheDocument();
    expect(screen.getByText("+0.412")).toBeInTheDocument();
    expect(screen.getByText("Cumulative Expenditure Lag")).toBeInTheDocument();
    expect(screen.getByText("+0.185")).toBeInTheDocument();
    expect(screen.getByText("Physical Progress Percentage")).toBeInTheDocument();
    expect(screen.getByText("-0.285")).toBeInTheDocument();

    // Baseline axis guidance
    expect(screen.getByText("0.0 BASELINE")).toBeInTheDocument();
    expect(screen.getAllByText(/RISK-REDUCING/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/RISK-INCREASING/).length).toBeGreaterThanOrEqual(1);

    // Footnote disclaiming causality
    expect(
      screen.getByText(
        /Values represent signed feature margin contributions in model logit space, not probabilities or verified causal mechanisms\./i
      )
    ).toBeInTheDocument();

    // Causal assertions must NOT exist
    expect(screen.queryByText(/causal effect/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/root cause/i)).not.toBeInTheDocument();
  });

  // 15. Snapshot and risk assessment months remain distinct
  it("maintains distinct temporal markers for project snapshot and risk assessment months", () => {
    render(
      <MemoryRouter>
        <IntelligenceTerminalHeader
          project={mockProjectIdentity}
          snapshotReportMonth="2026-07"
          riskReportMonth="2026-04"
        />
      </MemoryRouter>
    );

    expect(screen.getByText("PROJECT SNAPSHOT MONTH:")).toBeInTheDocument();
    expect(screen.getByText("RISK ASSESSMENT MONTH:")).toBeInTheDocument();
    expect(screen.getAllByText("2026-07").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2026-04").length).toBeGreaterThanOrEqual(1);

    // Temporal divergence notice
    expect(screen.getByText(/TEMPORAL ALIGNMENT: Distinct evaluation cycles/)).toBeInTheDocument();
  });

  // 16. No-risk state does not render zero-valued charts
  it("renders honest NOT ASSESSED state without zero-valued charts or 0% gauges", () => {
    render(<IntelligenceRiskAssessment risk={null} />);

    expect(screen.getByText("NOT ASSESSED")).toBeInTheDocument();
    expect(
      screen.getByText(/no operational risk assessment is currently served/i)
    ).toBeInTheDocument();

    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
    expect(screen.queryByText("#0")).not.toBeInTheDocument();
  });

  // 17. Tooltips / accessibility in chronological table
  it("provides full chronological table as accessible alternative to chart", () => {
    render(<IntelligenceRiskHistory history={mockTransitionHistory} />);

    const table = screen.getByRole("table", { name: /chronological risk history/i });
    expect(table).toBeInTheDocument();

    // Table rows for all 3 records
    expect(screen.getByRole("cell", { name: "2025-05" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2025-06" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2026-04" })).toBeInTheDocument();
  });

  // 18. Unavailable portfolio metrics handle nulls gracefully
  it("handles unavailable portfolio position gracefully without crashing or fabricating rank", () => {
    render(
      <IntelligencePortfolioPosition
        rank={null}
        populationSize={null}
        percentile={null}
      />
    );

    expect(screen.getByText("UNAVAILABLE")).toBeInTheDocument();
    expect(
      screen.getByText(/Portfolio distribution metrics are unavailable for this project assessment\./i)
    ).toBeInTheDocument();
  });

  // 19. Calibration-inactive probability scale does not fabricate raw distinction
  it("omits raw score marker and subtext when calibration is inactive", () => {
    render(
      <IntelligenceRiskProbabilityScale
        probability={mockUncalibratedRisk.risk_probability}
        rawProbability={mockUncalibratedRisk.raw_probability}
        calibrationActive={mockUncalibratedRisk.calibration_active}
      />
    );

    expect(screen.getAllByText("42.1%").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/RAW:/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Solid marker reflects calibrated operational probability/i)
    ).not.toBeInTheDocument();
  });

  // 20. Synchronized temporal alignment renders coincident tag
  it("renders synchronized evaluation cycle note when snapshot and risk months are identical", () => {
    render(
      <MemoryRouter>
        <IntelligenceTerminalHeader
          project={mockProjectIdentity}
          snapshotReportMonth="2026-04"
          riskReportMonth="2026-04"
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/TEMPORAL ALIGNMENT: Synchronized evaluation cycle \(2026-04\)/)
    ).toBeInTheDocument();
  });
});

