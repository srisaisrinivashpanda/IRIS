/**
 * Analytics API Client for IRIS (PR-09)
 */

import { apiClient, API_BASE_URL } from "./client.ts";
import type {
  AgenciesResponse,
  AnalyticsFilterParams,
  FinancialsResponse,
  GeographyResponse,
  OverviewResponse,
  ProgressResponse,
  RiskAnalyticsResponse,
  SectorsResponse,
  TrendsResponse,
} from "@/types/analytics.ts";

const ANALYTICS_BASE = `${API_BASE_URL}/analytics`;

/**
 * Fetch portfolio overview metrics and coverage metadata.
 */
export async function fetchAnalyticsOverview(
  params: AnalyticsFilterParams = {}
): Promise<OverviewResponse> {
  return apiClient<OverviewResponse>(`${ANALYTICS_BASE}/overview`, {
    params: params as Record<string, string | number | boolean | null | undefined>,
  });
}

/**
 * Fetch temporal trend observations strictly for observed months.
 */
export async function fetchAnalyticsTrends(
  params: AnalyticsFilterParams = {}
): Promise<TrendsResponse> {
  return apiClient<TrendsResponse>(`${ANALYTICS_BASE}/trends`, {
    params: params as Record<string, string | number | boolean | null | undefined>,
  });
}

/**
 * Fetch state-level geographic aggregations.
 */
export async function fetchAnalyticsGeography(
  params: AnalyticsFilterParams = {}
): Promise<GeographyResponse> {
  return apiClient<GeographyResponse>(`${ANALYTICS_BASE}/geography`, {
    params: params as Record<string, string | number | boolean | null | undefined>,
  });
}

/**
 * Fetch sector-level categorical aggregations.
 */
export async function fetchAnalyticsSectors(
  params: AnalyticsFilterParams = {}
): Promise<SectorsResponse> {
  return apiClient<SectorsResponse>(`${ANALYTICS_BASE}/sectors`, {
    params: params as Record<string, string | number | boolean | null | undefined>,
  });
}

/**
 * Fetch agency-level categorical aggregations.
 */
export async function fetchAnalyticsAgencies(
  params: AnalyticsFilterParams = {}
): Promise<AgenciesResponse> {
  return apiClient<AgenciesResponse>(`${ANALYTICS_BASE}/agencies`, {
    params: params as Record<string, string | number | boolean | null | undefined>,
  });
}

/**
 * Fetch project-level portfolio financial metrics.
 */
export async function fetchAnalyticsFinancials(
  params: AnalyticsFilterParams = {}
): Promise<FinancialsResponse> {
  return apiClient<FinancialsResponse>(`${ANALYTICS_BASE}/financials`, {
    params: params as Record<string, string | number | boolean | null | undefined>,
  });
}

/**
 * Fetch physical progress distribution and sectoral breakdown.
 */
export async function fetchAnalyticsProgress(
  params: AnalyticsFilterParams = {}
): Promise<ProgressResponse> {
  return apiClient<ProgressResponse>(`${ANALYTICS_BASE}/progress`, {
    params: params as Record<string, string | number | boolean | null | undefined>,
  });
}

/**
 * Fetch production schedule-extension risk analytics.
 */
export async function fetchAnalyticsRisk(
  params: AnalyticsFilterParams = {}
): Promise<RiskAnalyticsResponse> {
  return apiClient<RiskAnalyticsResponse>(`${ANALYTICS_BASE}/risk`, {
    params: params as Record<string, string | number | boolean | null | undefined>,
  });
}
