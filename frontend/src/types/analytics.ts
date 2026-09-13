/**
 * Analytics Contracts and Types for IRIS Portfolio Aggregations (PR-09)
 */

import type { ScoreDistribution } from "./risk.ts";
export type { ScoreDistribution };



export interface CoverageMetadata {
  total_observations: number;
  unique_projects: number;
  earliest_month: string | null;
  latest_month: string | null;
  missing_original_cost_count: number;
  missing_revised_cost_count: number;
  missing_cumulative_expenditure_count: number;
  missing_physical_progress_count: number;
  unavailable_dimensions: Record<string, string>;
}

export interface OverviewResponse {
  unique_project_count: number;
  observation_count: number;
  earliest_observation_month: string | null;
  latest_observation_month: string | null;
  states_count: number;
  agencies_count: number;
  sectors_count: number;
  districts_count: number | null;
  total_sanctioned_cost: number | null;
  total_revised_cost: number | null;
  total_cumulative_expenditure: number | null;
  average_physical_progress: number | null;
  progress_reporting_observations: number;
  assessed_project_count: number;
  financial_basis: string;
  progress_basis: string;
  coverage: CoverageMetadata;
}

export interface TrendPoint {
  report_month: string;
  observation_count: number;
  unique_project_count: number;
  total_cumulative_expenditure: number | null;
  average_cumulative_expenditure: number | null;
  total_original_cost: number | null;
  total_revised_cost: number | null;
  average_physical_progress: number | null;
  progress_reporting_count: number;
  risk_assessed_project_count: number;
  average_risk_probability: number | null;
  average_raw_probability: number | null;
}

export interface TrendsResponse {
  items: TrendPoint[];
  total_months: number;
  earliest_month: string | null;
  latest_month: string | null;
  disclaimer: string;
}

export interface GeographyGroup {
  state: string;
  unique_project_count: number;
  observation_count: number;
  total_cumulative_expenditure: number | null;
  average_physical_progress: number | null;
  progress_reporting_count: number;
  assessed_project_count: number;
  average_risk_probability: number | null;
}

export interface GeographyResponse {
  items: GeographyGroup[];
  total_states: number;
  district_dimension_status: string;
  district_dimension_reason: string;
}

export interface SectorGroup {
  sector: string;
  unique_project_count: number;
  observation_count: number;
  total_original_cost: number | null;
  total_cumulative_expenditure: number | null;
  average_physical_progress: number | null;
  progress_reporting_count: number;
  assessed_project_count: number;
  average_risk_probability: number | null;
}

export interface SectorsResponse {
  items: SectorGroup[];
  total_sectors: number;
}

export interface AgencyGroup {
  agency: string;
  unique_project_count: number;
  observation_count: number;
  total_original_cost: number | null;
  total_cumulative_expenditure: number | null;
  average_physical_progress: number | null;
  progress_reporting_count: number;
  assessed_project_count: number;
  average_risk_probability: number | null;
}

export interface AgenciesResponse {
  items: AgencyGroup[];
  total_agencies: number;
}

export interface FinancialMetrics {
  projects_with_cost: number;
  total_original_cost: number | null;
  mean_original_cost: number | null;
  projects_with_revised_cost: number;
  total_revised_cost: number | null;
  mean_revised_cost: number | null;
  projects_with_expenditure: number;
  total_cumulative_expenditure: number | null;
  mean_cumulative_expenditure: number | null;
  cost_revision_projects_count: number;
  total_cost_escalation: number | null;
  overall_expenditure_to_revised_cost_ratio: number | null;
  overall_expenditure_to_original_cost_ratio: number | null;
}

export interface FinancialsResponse {
  metrics: FinancialMetrics;
  aggregation_basis: string;
  observation_count: number;
  unique_project_count: number;
}

export interface ProgressSectorBreakdown {
  sector: string;
  reporting_count: number;
  missing_count: number;
  mean_physical_progress: number | null;
}

export interface ProgressMetrics {
  total_observations: number;
  reporting_observations: number;
  missing_observations: number;
  coverage_rate: number;
  mean_physical_progress: number | null;
  median_physical_progress: number | null;
  min_physical_progress: number | null;
  max_physical_progress: number | null;
  distribution_quantiles: ScoreDistribution | null;
}

export interface ProgressResponse {
  metrics: ProgressMetrics;
  by_sector: ProgressSectorBreakdown[];
  progress_basis: string;
}

export interface RiskRegimeBreakdown {
  regime: string;
  model_id: string;
  unique_project_count: number;
  observation_count: number;
  calibration_active_count: number;
}

export interface RiskMonthlyTrend {
  evaluation_month: string;
  assessed_project_count: number;
  assessed_observation_count: number;
  mean_risk_probability: number | null;
  mean_raw_probability: number | null;
}

export interface RiskAnalyticsResponse {
  target: string;
  target_label: string;
  assessed_project_count: number;
  assessed_observation_count: number;
  evaluation_earliest_month: string | null;
  evaluation_latest_month: string | null;
  calibrated_risk_distribution: ScoreDistribution | null;
  raw_probability_distribution: ScoreDistribution | null;
  regime_breakdown: RiskRegimeBreakdown[];
  monthly_trend: RiskMonthlyTrend[];
  governance_notice: string;
  unserved_targets: string[];
}

export interface GlobalAnalyticsFilters {
  from_month?: string | null;
  to_month?: string | null;
  state?: string | null;
  sector?: string | null;
  agency?: string | null;
  project_code?: string | null;
}

export interface RiskAnalyticsFilters extends GlobalAnalyticsFilters {
  regime?: string | null;
}

export interface AnalyticsFilterParams extends RiskAnalyticsFilters {}

