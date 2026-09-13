/**
 * Authoritative feature metadata grounded strictly in:
 * schemas/schedule_extension_3m_v1.contract.json and src/serving/builder.py
 *
 * Covers all 36 locked model features across the 9 authoritative feature families.
 * Never invents causal claims, percentage probability interpretations, or undocumented semantics.
 */

export interface FeatureMetadata {
  feature: string;
  displayName: string;
  familyId: string;
  familyName: string;
  unit?: string;
  description: string;
  isDocumented: boolean;
}

export const FEATURE_FAMILY_NAMES: Record<string, string> = {
  static_categoricals: "Static Categoricals",
  static_cost_financial: "Static Cost & Financial",
  schedule: "Schedule Dynamics",
  progress: "Physical Progress",
  missingness_presence_indicators: "Missingness & Presence Indicators",
  historical_expenditure: "Historical Expenditure",
  historical_progress: "Historical Progress",
  historical_schedule_cost_revision_counts: "Historical Revision Counts",
  delta_support: "Delta Continuity Support",
};

export const AUTHORITATIVE_FEATURE_CATALOG: Record<string, Omit<FeatureMetadata, "feature" | "isDocumented">> = {
  // 1. static_categoricals
  sector: {
    displayName: "Sector",
    familyId: "static_categoricals",
    familyName: FEATURE_FAMILY_NAMES.static_categoricals,
    description: "Operational infrastructure sector classification.",
  },
  agency: {
    displayName: "Agency",
    familyId: "static_categoricals",
    familyName: FEATURE_FAMILY_NAMES.static_categoricals,
    description: "Executing agency or public enterprise responsible for project execution.",
  },
  state: {
    displayName: "State",
    familyId: "static_categoricals",
    familyName: FEATURE_FAMILY_NAMES.static_categoricals,
    description: "State or geographic territory of project execution.",
  },

  // 2. static_cost_financial
  original_cost: {
    displayName: "Original cost",
    familyId: "static_cost_financial",
    familyName: FEATURE_FAMILY_NAMES.static_cost_financial,
    unit: "₹ crore",
    description: "Sanctioned original project capital expenditure budget.",
  },
  revised_cost_t: {
    displayName: "Revised cost",
    familyId: "static_cost_financial",
    familyName: FEATURE_FAMILY_NAMES.static_cost_financial,
    unit: "₹ crore",
    description: "Latest reported revised cost at observation time T.",
  },
  cumulative_expenditure_t: {
    displayName: "Cumulative expenditure",
    familyId: "static_cost_financial",
    familyName: FEATURE_FAMILY_NAMES.static_cost_financial,
    unit: "₹ crore",
    description: "Reported cumulative financial expenditure at observation time T.",
  },
  expenditure_to_original_cost_ratio: {
    displayName: "Expenditure to original cost ratio",
    familyId: "static_cost_financial",
    familyName: FEATURE_FAMILY_NAMES.static_cost_financial,
    description: "Ratio of cumulative expenditure to original sanctioned cost at time T.",
  },
  revised_to_original_cost_ratio: {
    displayName: "Revised to original cost ratio",
    familyId: "static_cost_financial",
    familyName: FEATURE_FAMILY_NAMES.static_cost_financial,
    description: "Ratio of revised cost to original cost at time T.",
  },
  cost_has_been_revised: {
    displayName: "Cost has been revised",
    familyId: "static_cost_financial",
    familyName: FEATURE_FAMILY_NAMES.static_cost_financial,
    description: "Binary indicator whether a cost revision has appeared at or before time T.",
  },

  // 3. schedule
  project_age_months: {
    displayName: "Project age (months)",
    familyId: "schedule",
    familyName: FEATURE_FAMILY_NAMES.schedule,
    unit: "months",
    description: "Elapsed calendar months from approval date to observation time T.",
  },
  months_to_original_schedule: {
    displayName: "Months to original schedule",
    familyId: "schedule",
    familyName: FEATURE_FAMILY_NAMES.schedule,
    unit: "months",
    description: "Months remaining to original completion commitment (negative if overdue).",
  },
  months_to_effective_schedule: {
    displayName: "Months to effective schedule",
    familyId: "schedule",
    familyName: FEATURE_FAMILY_NAMES.schedule,
    unit: "months",
    description: "Months remaining to operational schedule baseline at time T.",
  },
  schedule_revision_lag_months: {
    displayName: "Schedule revision lag (months)",
    familyId: "schedule",
    familyName: FEATURE_FAMILY_NAMES.schedule,
    unit: "months",
    description: "Months between original completion commitment and latest revised date.",
  },
  schedule_has_been_revised: {
    displayName: "Schedule has been revised",
    familyId: "schedule",
    familyName: FEATURE_FAMILY_NAMES.schedule,
    description: "Binary indicator whether completion date has been revised at or before time T.",
  },
  months_since_start: {
    displayName: "Months since start",
    familyId: "schedule",
    familyName: FEATURE_FAMILY_NAMES.schedule,
    unit: "months",
    description: "Elapsed calendar months from reported start date to time T.",
  },

  // 4. progress
  physical_progress_t: {
    displayName: "Physical progress",
    familyId: "progress",
    familyName: FEATURE_FAMILY_NAMES.progress,
    unit: "%",
    description: "Reported physical progress percentage at observation time T.",
  },

  // 5. missingness_presence_indicators
  state_is_missing: {
    displayName: "State is missing",
    familyId: "missingness_presence_indicators",
    familyName: FEATURE_FAMILY_NAMES.missingness_presence_indicators,
    description: "Binary indicator whether state is absent from source Flash Report.",
  },
  approval_date_is_missing: {
    displayName: "Approval date is missing",
    familyId: "missingness_presence_indicators",
    familyName: FEATURE_FAMILY_NAMES.missingness_presence_indicators,
    description: "Binary indicator whether approval date is absent from source reporting.",
  },
  original_completion_date_is_missing: {
    displayName: "Original completion date is missing",
    familyId: "missingness_presence_indicators",
    familyName: FEATURE_FAMILY_NAMES.missingness_presence_indicators,
    description: "Binary indicator whether original completion date is absent from source reporting.",
  },
  revised_cost_is_present: {
    displayName: "Revised cost is present",
    familyId: "missingness_presence_indicators",
    familyName: FEATURE_FAMILY_NAMES.missingness_presence_indicators,
    description: "Binary indicator whether revised cost is explicitly reported in source table.",
  },
  revised_date_is_present: {
    displayName: "Revised completion date is present",
    familyId: "missingness_presence_indicators",
    familyName: FEATURE_FAMILY_NAMES.missingness_presence_indicators,
    description: "Binary indicator whether revised completion date is explicitly reported.",
  },
  physical_progress_is_present: {
    displayName: "Physical progress is present",
    familyId: "missingness_presence_indicators",
    familyName: FEATURE_FAMILY_NAMES.missingness_presence_indicators,
    description: "Binary indicator whether physical progress value is reported in source record.",
  },
  physical_progress_supported: {
    displayName: "Physical progress is structurally supported",
    familyId: "missingness_presence_indicators",
    familyName: FEATURE_FAMILY_NAMES.missingness_presence_indicators,
    description: "Binary indicator whether source report layout structurally includes physical progress.",
  },
  start_date_is_present: {
    displayName: "Start date is present",
    familyId: "missingness_presence_indicators",
    familyName: FEATURE_FAMILY_NAMES.missingness_presence_indicators,
    description: "Binary indicator whether project start date is explicitly reported.",
  },
  start_date_supported: {
    displayName: "Start date is structurally supported",
    familyId: "missingness_presence_indicators",
    familyName: FEATURE_FAMILY_NAMES.missingness_presence_indicators,
    description: "Binary indicator whether source report layout structurally includes start date.",
  },

  // 6. historical_expenditure
  exp_delta_1m: {
    displayName: "Expenditure change (1 month)",
    familyId: "historical_expenditure",
    familyName: FEATURE_FAMILY_NAMES.historical_expenditure,
    unit: "₹ crore",
    description: "One-month rolling change in reported cumulative expenditure.",
  },
  exp_delta_3m: {
    displayName: "Expenditure change (3 months)",
    familyId: "historical_expenditure",
    familyName: FEATURE_FAMILY_NAMES.historical_expenditure,
    unit: "₹ crore",
    description: "Three-month rolling change in reported cumulative expenditure.",
  },
  past_exp_stagnant_3m: {
    displayName: "Expenditure stagnant over prior 3 months",
    familyId: "historical_expenditure",
    familyName: FEATURE_FAMILY_NAMES.historical_expenditure,
    description: "Indicator whether reported expenditure showed zero net change over prior 3 months.",
  },

  // 7. historical_progress
  past_progress_delta_3m: {
    displayName: "Physical progress change (3 months)",
    familyId: "historical_progress",
    familyName: FEATURE_FAMILY_NAMES.historical_progress,
    unit: "%",
    description: "Three-month rolling change in reported physical progress percentage.",
  },
  past_progress_stagnant_3m: {
    displayName: "Physical progress stagnant over prior 3 months",
    familyId: "historical_progress",
    familyName: FEATURE_FAMILY_NAMES.historical_progress,
    description: "Indicator whether physical progress showed zero net change over prior 3 months.",
  },

  // 8. historical_schedule_cost_revision_counts
  n_prior_schedule_extensions: {
    displayName: "Prior schedule extensions",
    familyId: "historical_schedule_cost_revision_counts",
    familyName: FEATURE_FAMILY_NAMES.historical_schedule_cost_revision_counts,
    unit: "events",
    description: "Count of distinct schedule revision events observed prior to observation time T.",
  },
  n_prior_cost_revisions: {
    displayName: "Prior cost revisions",
    familyId: "historical_schedule_cost_revision_counts",
    familyName: FEATURE_FAMILY_NAMES.historical_schedule_cost_revision_counts,
    unit: "events",
    description: "Count of distinct cost revision events observed prior to observation time T.",
  },
  observed_tenure_months: {
    displayName: "Observed tenure (months)",
    familyId: "historical_schedule_cost_revision_counts",
    familyName: FEATURE_FAMILY_NAMES.historical_schedule_cost_revision_counts,
    unit: "months",
    description: "Count of monthly Flash Reports in which this project has been continuously observed.",
  },

  // 9. delta_support
  exp_delta_1m_is_supported: {
    displayName: "One-month expenditure change is supported",
    familyId: "delta_support",
    familyName: FEATURE_FAMILY_NAMES.delta_support,
    description: "Indicator whether 1-month expenditure delta has unbroken observation continuity.",
  },
  exp_delta_3m_is_supported: {
    displayName: "Three-month expenditure change is supported",
    familyId: "delta_support",
    familyName: FEATURE_FAMILY_NAMES.delta_support,
    description: "Indicator whether 3-month expenditure delta has unbroken observation continuity.",
  },
  progress_delta_3m_is_supported: {
    displayName: "Three-month progress change is supported",
    familyId: "delta_support",
    familyName: FEATURE_FAMILY_NAMES.delta_support,
    description: "Indicator whether 3-month progress delta has unbroken observation continuity.",
  },
};

/**
 * Safely resolves feature metadata for any feature string.
 * If the feature is not documented in the frozen ML contract, returns a truthful
 * fallback clearly stating metadata limitation rather than inventing meaning.
 */
export function getFeatureMetadata(feature: string, defaultDisplayName?: string): FeatureMetadata {
  const entry = AUTHORITATIVE_FEATURE_CATALOG[feature];
  if (entry) {
    return {
      feature,
      displayName: entry.displayName || defaultDisplayName || feature,
      familyId: entry.familyId,
      familyName: entry.familyName,
      unit: entry.unit,
      description: entry.description,
      isDocumented: true,
    };
  }

  return {
    feature,
    displayName: defaultDisplayName || feature,
    familyId: "undocumented",
    familyName: "Model Serving Feature",
    description: "Feature metadata is limited to the model-serving identifier.",
    isDocumented: false,
  };
}
