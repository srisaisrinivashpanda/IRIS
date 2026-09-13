import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IntelligenceExplainability } from "@/components/intelligence/IntelligenceExplainability.tsx";
import { IntelligenceDriverSummary } from "@/components/intelligence/IntelligenceDriverSummary.tsx";
import { IntelligenceDriverDetail } from "@/components/intelligence/IntelligenceDriverDetail.tsx";
import { IntelligenceModelEvidence } from "@/components/intelligence/IntelligenceModelEvidence.tsx";
import { getFeatureMetadata, FEATURE_FAMILY_NAMES } from "@/utils/featureMetadata.ts";
import type {
  ProjectIntelligenceRisk,
  ProjectIntelligenceModelGovernance,
  ProjectRiskDrivers,
} from "@/types/project.ts";

const mockRiskCalibrated: ProjectIntelligenceRisk = {
  risk_probability: 0.384,
  raw_probability: 0.321,
  risk_rank: 42,
  risk_percentile: 0.825,
  population_size: 1625,
  report_month: "2026-04",
  regime: "MODERN",
  model_id: "logistic_static_only__unweighted",
  target: "target_effective_schedule_ext_3m",
  calibration_active: true,
};

const mockRiskUncalibrated: ProjectIntelligenceRisk = {
  risk_probability: 0.421,
  raw_probability: 0.421,
  risk_rank: 18,
  risk_percentile: 0.912,
  population_size: 980,
  report_month: "2025-03",
  regime: "LEGACY",
  model_id: "catboost_full_v1__unweighted",
  target: "target_effective_schedule_ext_3m",
  calibration_active: false,
};

const mockModelModern: ProjectIntelligenceModelGovernance = {
  model_id: "logistic_static_only__unweighted",
  target: "target_effective_schedule_ext_3m",
  model_family: "L2-Regularized Logistic Regression (C=1.0)",
  status: "ACTIVE_PRODUCTION",
  is_active: true,
  coverage_period: "2025-07 through 2026-07",
  calibration_policy: "Temporal Platt Scaling (active on 2026-04)",
  explanation_method: "LOGISTIC_COEFFICIENT_TIMES_TRANSFORMED_VALUE",
};

const mockModelLegacy: ProjectIntelligenceModelGovernance = {
  model_id: "catboost_full_v1__unweighted",
  target: "target_effective_schedule_ext_3m",
  model_family: "CatBoost Gradient Boosted Trees",
  status: "HISTORICAL_PRODUCTION",
  is_active: false,
  coverage_period: "2023-10 through 2025-06",
  calibration_policy: "None (Uncalibrated)",
  explanation_method: "CATBOOST_NATIVE_TREESHAP",
};

const mockDrivers: ProjectRiskDrivers = {
  top_positive: [
    {
      feature: "n_prior_schedule_extensions",
      display_name: "Prior schedule extensions",
      value: "3",
      contribution: 0.412,
      direction: "POSITIVE",
      rank: 1,
    },
    {
      feature: "cumulative_expenditure_t",
      display_name: "Cumulative expenditure",
      value: "1450.50",
      contribution: 0.185,
      direction: "POSITIVE",
      rank: 2,
    },
  ],
  top_negative: [
    {
      feature: "physical_progress_t",
      display_name: "Physical progress",
      value: "72.4",
      contribution: -0.285,
      direction: "NEGATIVE",
      rank: 1,
    },
    {
      feature: "exp_delta_1m",
      display_name: "Expenditure change (1 month)",
      value: "45.20",
      contribution: -0.095,
      direction: "NEGATIVE",
      rank: 2,
    },
  ],
  strongest_drivers: [
    {
      feature: "n_prior_schedule_extensions",
      display_name: "Prior schedule extensions",
      value: "3",
      contribution: 0.412,
      direction: "POSITIVE",
      rank: 1,
    },
    {
      feature: "physical_progress_t",
      display_name: "Physical progress",
      value: "72.4",
      contribution: -0.285,
      direction: "NEGATIVE",
      rank: 1,
    },
    {
      feature: "cumulative_expenditure_t",
      display_name: "Cumulative expenditure",
      value: "1450.50",
      contribution: 0.185,
      direction: "POSITIVE",
      rank: 2,
    },
    {
      feature: "exp_delta_1m",
      display_name: "Expenditure change (1 month)",
      value: "45.20",
      contribution: -0.095,
      direction: "NEGATIVE",
      rank: 2,
    },
  ],
};

describe("PR-07: Risk Explainability & Driver Analysis", () => {
  // 1. Authentic driver rendering and precision preservation
  it("renders authentic signed margin contributions preserving 3 decimal places", () => {
    render(
      <IntelligenceExplainability
        risk={mockRiskCalibrated}
        model={mockModelModern}
        drivers={mockDrivers}
      />
    );

    expect(screen.getAllByText("Prior schedule extensions").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Physical progress").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("+0.412").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("-0.285").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("+0.185").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("-0.095").length).toBeGreaterThanOrEqual(1);
  });

  // 2. Strongest positive and negative drivers selected correctly in summary
  it("selects strongest positive and negative contributors accurately in summary", () => {
    render(
      <IntelligenceDriverSummary
        drivers={mockDrivers}
        risk={mockRiskCalibrated}
      />
    );

    expect(screen.getByText("STRONGEST RISK-INCREASING CONTRIBUTION")).toBeInTheDocument();
    expect(screen.getByText("+0.412 logit")).toBeInTheDocument();
    expect(screen.getByText("STRONGEST RISK-REDUCING CONTRIBUTION")).toBeInTheDocument();
    expect(screen.getByText("-0.285 logit")).toBeInTheDocument();
  });

  // 3. Contribution totals remain in margin logit domain, labeled as displayed sum
  it("computes displayed positive and negative contribution sums in raw logit space without probability conversion", () => {
    render(
      <IntelligenceDriverSummary
        drivers={mockDrivers}
        risk={mockRiskCalibrated}
      />
    );

    // Sum positive: 0.412 + 0.185 = 0.597
    expect(screen.getByText("+0.597 logit")).toBeInTheDocument();
    expect(screen.getByText("DISPLAYED POSITIVE CONTRIBUTION SUM")).toBeInTheDocument();

    // Sum negative: -0.285 + -0.095 = -0.380
    expect(screen.getByText("-0.380 logit")).toBeInTheDocument();
    expect(screen.getByText("DISPLAYED NEGATIVE CONTRIBUTION SUM")).toBeInTheDocument();

    // Must NOT label sums as percentage probability shifts
    expect(screen.queryByText("+59.7%")).not.toBeInTheDocument();
    expect(screen.queryByText("-38.0%")).not.toBeInTheDocument();
  });

  // 4. Default driver ordering preserves backend authoritative ordering
  it("preserves authoritative backend model ordering by default", () => {
    render(<IntelligenceDriverDetail drivers={mockDrivers} />);

    const articleCards = screen.getAllByRole("article");
    expect(articleCards).toHaveLength(4);

    // First card must be the first in strongest_drivers (n_prior_schedule_extensions)
    expect(articleCards[0]).toHaveTextContent("Prior schedule extensions");
    // Second card must be the second in strongest_drivers (physical_progress_t)
    expect(articleCards[1]).toHaveTextContent("Physical progress");
  });

  // 5. Direction filtering controls (All, Risk-increasing, Risk-reducing)
  it("filters drivers by direction without mutating data", () => {
    render(<IntelligenceDriverDetail drivers={mockDrivers} />);

    // Filter to Risk-increasing
    const posFilterBtn = screen.getByRole("button", { name: /Risk-Increasing/i });
    fireEvent.click(posFilterBtn);

    const posCards = screen.getAllByRole("article");
    expect(posCards).toHaveLength(2);
    expect(posCards[0]).toHaveTextContent("Prior schedule extensions");
    expect(posCards[1]).toHaveTextContent("Cumulative expenditure");

    // Filter to Risk-reducing
    const negFilterBtn = screen.getByRole("button", { name: /Risk-Reducing/i });
    fireEvent.click(negFilterBtn);

    const negCards = screen.getAllByRole("article");
    expect(negCards).toHaveLength(2);
    expect(negCards[0]).toHaveTextContent("Physical progress");
    expect(negCards[1]).toHaveTextContent("Expenditure change (1 month)");
  });

  // 6. Absolute magnitude sorting control
  it("sorts drivers by absolute magnitude when requested while preserving model order toggle", () => {
    render(<IntelligenceDriverDetail drivers={mockDrivers} />);

    const magnitudeSortBtn = screen.getByRole("button", { name: /Magnitude/i });
    fireEvent.click(magnitudeSortBtn);

    const cards = screen.getAllByRole("article");
    // Magnitudes: 0.412, 0.285, 0.185, 0.095
    expect(cards[0]).toHaveTextContent("+0.412");
    expect(cards[1]).toHaveTextContent("-0.285");
    expect(cards[2]).toHaveTextContent("+0.185");
    expect(cards[3]).toHaveTextContent("-0.095");
  });

  // 7. Accessible data table alternative
  it("provides full accessible table view with scoped column and row headers", () => {
    render(<IntelligenceDriverDetail drivers={mockDrivers} />);

    const tableToggleBtn = screen.getByRole("button", { name: /ACCESSIBLE TABLE/i });
    fireEvent.click(tableToggleBtn);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    expect(screen.getByRole("columnheader", { name: "RANK" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "MARGIN CONTRIBUTION" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "FEATURE FAMILY" })).toBeInTheDocument();

    expect(screen.getByRole("rowheader", { name: "Prior schedule extensions" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Physical progress" })).toBeInTheDocument();
  });

  // 8. Screen-reader accessible directional text
  it("renders direction in accessible text for screen readers without relying on color alone", () => {
    render(<IntelligenceDriverDetail drivers={mockDrivers} />);

    expect(screen.getByLabelText(/\+0\.412 — risk-increasing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/-0\.285 — risk-reducing/i)).toBeInTheDocument();
  });

  // 9. Model evidence displays authentic explanation method from model governance
  it("displays model-specific explanation method from model governance for Modern regime", () => {
    render(
      <IntelligenceModelEvidence
        risk={mockRiskCalibrated}
        model={mockModelModern}
        drivers={mockDrivers}
      />
    );

    expect(screen.getByText("logistic_static_only__unweighted")).toBeInTheDocument();
    expect(screen.getByText("MODERN")).toBeInTheDocument();
    expect(screen.getByText("2026-04")).toBeInTheDocument();
    expect(screen.getByText("Logistic coefficient times transformed value")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE (Platt scaling)")).toBeInTheDocument();
    expect(screen.getByText("target_effective_schedule_ext_3m")).toBeInTheDocument();
  });

  // 10. Model evidence displays authentic TreeSHAP for Legacy regime
  it("displays CatBoost-native TreeSHAP explanation method for Legacy regime", () => {
    render(
      <IntelligenceModelEvidence
        risk={mockRiskUncalibrated}
        model={mockModelLegacy}
        drivers={mockDrivers}
      />
    );

    expect(screen.getByText("catboost_full_v1__unweighted")).toBeInTheDocument();
    expect(screen.getByText("LEGACY")).toBeInTheDocument();
    expect(screen.getByText("2025-03")).toBeInTheDocument();
    expect(screen.getByText("CatBoost-native TreeSHAP")).toBeInTheDocument();
    expect(screen.getByText("UNCALIBRATED / RAW")).toBeInTheDocument();
  });

  // 11. Calibrated vs raw probability distinction
  it("maintains distinct presentation for calibrated operational and raw model probabilities", () => {
    render(
      <IntelligenceModelEvidence
        risk={mockRiskCalibrated}
        model={mockModelModern}
        drivers={mockDrivers}
      />
    );

    expect(screen.getByText("38.4%")).toBeInTheDocument();
    expect(screen.getByText(/RAW SCORE: 32\.1%/)).toBeInTheDocument();
    expect(screen.getByText(/OPERATIONAL PROBABILITY \(CALIBRATED\)/)).toBeInTheDocument();
  });

  // 12. Unassessed project renders truthful state
  it("renders truthful unassessed state when risk assessment is null", () => {
    render(
      <IntelligenceExplainability
        risk={null}
        model={null}
        drivers={{ top_positive: [], top_negative: [], strongest_drivers: [] }}
      />
    );

    expect(screen.getAllByText("NOT ASSESSED").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(
        "Model driver evidence is unavailable because no production risk assessment is recorded for this project."
      ).length
    ).toBeGreaterThanOrEqual(1);

    // Must not show fake 0% contribution or zero bars
    expect(screen.queryByText("+0.000")).not.toBeInTheDocument();
    expect(screen.queryByText("#0")).not.toBeInTheDocument();
  });

  // 13. Empty driver state renders truthful unavailable indicator
  it("renders truthful NO MODEL DRIVER EVIDENCE AVAILABLE when assessment exists with 0 drivers", () => {
    render(
      <IntelligenceExplainability
        risk={mockRiskCalibrated}
        model={mockModelModern}
        drivers={{ top_positive: [], top_negative: [], strongest_drivers: [] }}
      />
    );

    expect(screen.getAllByText("NO MODEL DRIVER EVIDENCE AVAILABLE").length).toBeGreaterThanOrEqual(1);
  });

  // 14. Non-causal language audit
  it("contains non-causal disclaimer and avoids prohibited causal claims across all sections", () => {
    const { container } = render(
      <IntelligenceExplainability
        risk={mockRiskCalibrated}
        model={mockModelModern}
        drivers={mockDrivers}
      />
    );

    // Disclaimer presence
    expect(
      screen.getAllByText(
        /Signed contributions describe model evidence in margin\/logit space; they do not establish causal relationships\./i
      ).length
    ).toBeGreaterThanOrEqual(1);

    const fullContent = container.textContent || "";
    expect(fullContent).not.toMatch(/\bcaused\b/i);
    expect(fullContent).not.toMatch(/\broot cause\b/i);
    expect(fullContent).not.toMatch(/\bguarantees\b/i);
    expect(fullContent).not.toMatch(/\bpredicts because\b/i);
    expect(fullContent).not.toMatch(/\bresponsible for\b/i);
  });

  // 15. Authoritative feature families catalog audit
  it("resolves all 9 authoritative feature families from schemas/schedule_extension_3m_v1.contract.json", () => {
    expect(Object.keys(FEATURE_FAMILY_NAMES)).toHaveLength(9);

    const scheduleExtMeta = getFeatureMetadata("n_prior_schedule_extensions");
    expect(scheduleExtMeta.familyName).toBe("Historical Revision Counts");
    expect(scheduleExtMeta.unit).toBe("events");
    expect(scheduleExtMeta.isDocumented).toBe(true);

    const progMeta = getFeatureMetadata("physical_progress_t");
    expect(progMeta.familyName).toBe("Physical Progress");
    expect(progMeta.unit).toBe("%");

    const costMeta = getFeatureMetadata("cumulative_expenditure_t");
    expect(costMeta.familyName).toBe("Static Cost & Financial");
    expect(costMeta.unit).toBe("₹ crore");

    const schedMeta = getFeatureMetadata("months_to_effective_schedule");
    expect(schedMeta.familyName).toBe("Schedule Dynamics");
    expect(schedMeta.unit).toBe("months");

    const catMeta = getFeatureMetadata("sector");
    expect(catMeta.familyName).toBe("Static Categoricals");

    const missingMeta = getFeatureMetadata("start_date_supported");
    expect(missingMeta.familyName).toBe("Missingness & Presence Indicators");

    const expHistMeta = getFeatureMetadata("past_exp_stagnant_3m");
    expect(expHistMeta.familyName).toBe("Historical Expenditure");

    const progHistMeta = getFeatureMetadata("past_progress_delta_3m");
    expect(progHistMeta.familyName).toBe("Historical Progress");

    const deltaContMeta = getFeatureMetadata("exp_delta_3m_is_supported");
    expect(deltaContMeta.familyName).toBe("Delta Continuity Support");

    // Undocumented fallback test
    const unknownMeta = getFeatureMetadata("unknown_synthetic_feature_xyz");
    expect(unknownMeta.isDocumented).toBe(false);
    expect(unknownMeta.description).toBe("Feature metadata is limited to the model-serving identifier.");
  });
});
