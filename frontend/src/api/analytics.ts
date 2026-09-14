/**
 * Analytics API Client for IRIS (PR-09)
 */

import { apiClient, API_BASE_URL } from "./client.ts";
import type {
  AgenciesResponse,
  FinancialsResponse,
  GeographyResponse,
  GlobalAnalyticsFilters,
  OverviewResponse,
  ProgressResponse,
  RiskAnalyticsFilters,
  RiskAnalyticsResponse,
  SectorsResponse,
  TrendsResponse,
} from "@/types/analytics.ts";

const ANALYTICS_BASE = `${API_BASE_URL}/analytics`;

/**
 * Filter cleaner ensuring strictly global parameters are sent to general analytics endpoints.
 * Never passes risk-specific parameters (like regime) to endpoints that do not accept them.
 */
function cleanGlobalParams(params: GlobalAnalyticsFilters = {}): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.from_month?.trim()) query.from_month = params.from_month.trim();
  if (params.to_month?.trim()) query.to_month = params.to_month.trim();
  if (params.state?.trim()) query.state = params.state.trim();
  if (params.sector?.trim()) query.sector = params.sector.trim();
  if (params.agency?.trim()) query.agency = params.agency.trim();
  if (params.project_code?.trim()) query.project_code = params.project_code.trim();
  return query;
}

/**
 * Filter cleaner for the risk endpoint, which accepts global filters plus regime.
 */
function cleanRiskParams(params: RiskAnalyticsFilters = {}): Record<string, string> {
  const query = cleanGlobalParams(params);
  if (params.regime?.trim()) query.regime = params.regime.trim();
  return query;
}

/**
 * Fetch portfolio overview metrics and coverage metadata.
 */
export async function fetchAnalyticsOverview(
  params: GlobalAnalyticsFilters = {}
): Promise<OverviewResponse> {
  return apiClient<OverviewResponse>(`${ANALYTICS_BASE}/overview`, {
    params: cleanGlobalParams(params),
  });
}

/**
 * Fetch temporal trend observations strictly for observed months.
 */
export async function fetchAnalyticsTrends(
  params: GlobalAnalyticsFilters = {}
): Promise<TrendsResponse> {
  return apiClient<TrendsResponse>(`${ANALYTICS_BASE}/trends`, {
    params: cleanGlobalParams(params),
  });
}

/**
 * Fetch state-level geographic aggregations.
 */
export async function fetchAnalyticsGeography(
  params: GlobalAnalyticsFilters = {}
): Promise<GeographyResponse> {
  return apiClient<GeographyResponse>(`${ANALYTICS_BASE}/geography`, {
    params: cleanGlobalParams(params),
  });
}

/**
 * Fetch sector-level categorical aggregations.
 */
export async function fetchAnalyticsSectors(
  params: GlobalAnalyticsFilters = {}
): Promise<SectorsResponse> {
  return apiClient<SectorsResponse>(`${ANALYTICS_BASE}/sectors`, {
    params: cleanGlobalParams(params),
  });
}

/**
 * Fetch agency-level categorical aggregations.
 */
export async function fetchAnalyticsAgencies(
  params: GlobalAnalyticsFilters = {}
): Promise<AgenciesResponse> {
  return apiClient<AgenciesResponse>(`${ANALYTICS_BASE}/agencies`, {
    params: cleanGlobalParams(params),
  });
}

/**
 * Fetch project-level portfolio financial metrics.
 */
export async function fetchAnalyticsFinancials(
  params: GlobalAnalyticsFilters = {}
): Promise<FinancialsResponse> {
  return apiClient<FinancialsResponse>(`${ANALYTICS_BASE}/financials`, {
    params: cleanGlobalParams(params),
  });
}

/**
 * Fetch physical progress distribution and sectoral breakdown.
 */
export async function fetchAnalyticsProgress(
  params: GlobalAnalyticsFilters = {}
): Promise<ProgressResponse> {
  return apiClient<ProgressResponse>(`${ANALYTICS_BASE}/progress`, {
    params: cleanGlobalParams(params),
  });
}

/**
 * Fetch production schedule-extension risk analytics.
 */
export async function fetchAnalyticsRisk(
  params: RiskAnalyticsFilters = {}
): Promise<RiskAnalyticsResponse> {
  return apiClient<RiskAnalyticsResponse>(`${ANALYTICS_BASE}/risk`, {
    params: cleanRiskParams(params),
  });
}

