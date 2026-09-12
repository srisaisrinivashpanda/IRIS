/**
 * Risk Intelligence API Endpoints
 */

import { apiClient, RISK_BASE_URL } from "./client.ts";
import type {
  DashboardOptionsResponse,
  HistoryResponse,
  ModelInfoResponse,
  ModelRegistryEntry,
  ModelRegistryListResponse,
  ProjectListResponse,
  Regime,
  RiskListQueryParams,
  RiskRecord,
  RiskSummaryQueryParams,
  SummaryResponse,
  TargetRegistryListResponse,
} from "@/types/risk.ts";

/**
 * Retrieve risk dashboard options (report months, default month, regimes, metadata values).
 */
export async function fetchRiskOptions(reportMonth?: string): Promise<DashboardOptionsResponse> {
  return apiClient<DashboardOptionsResponse>(`${RISK_BASE_URL}/options`, {
    params: { report_month: reportMonth },
  });
}

/**
 * Retrieve portfolio-level risk summary, score distribution, quantiles, and sector summaries.
 */
export async function fetchRiskSummary(params: RiskSummaryQueryParams): Promise<SummaryResponse> {
  return apiClient<SummaryResponse>(`${RISK_BASE_URL}/summary`, {
    params: {
      report_month: params.report_month,
      regime: params.regime,
      top_n: params.top_n ?? 10,
      sector: params.sector,
      agency: params.agency,
      ministry: params.ministry,
      state: params.state,
      search: params.search,
    },
  });
}

/**
 * List ranked projects with calibrated probabilities and signed TreeSHAP/logistic contributors.
 */
export async function fetchRiskProjects(params: RiskListQueryParams): Promise<ProjectListResponse> {
  return apiClient<ProjectListResponse>(`${RISK_BASE_URL}/projects`, {
    params: {
      report_month: params.report_month,
      page: params.page ?? 1,
      page_size: params.page_size ?? 25,
      regime: params.regime,
      min_risk_probability: params.min_risk_probability,
      max_risk_probability: params.max_risk_probability,
      sector: params.sector,
      agency: params.agency,
      ministry: params.ministry,
      state: params.state,
      search: params.search,
    },
  });
}

/**
 * Retrieve model governance, feature metadata, explanation methods, and calibration policies.
 */
export async function fetchModelInfo(): Promise<ModelInfoResponse> {
  return apiClient<ModelInfoResponse>(`${RISK_BASE_URL}/model-info`);
}

/**
 * Retrieve exact project-month risk record with full explainability contributors.
 */
export async function fetchProjectRiskRecord(projectCode: string, reportMonth: string): Promise<RiskRecord> {
  return apiClient<RiskRecord>(`${RISK_BASE_URL}/project/${encodeURIComponent(projectCode)}`, {
    params: { report_month: reportMonth },
  });
}

/**
 * Retrieve exact project risk history across all evaluated months.
 */
export async function fetchProjectRiskHistory(projectCode: string, regime?: Regime): Promise<HistoryResponse> {
  return apiClient<HistoryResponse>(`${RISK_BASE_URL}/project/${encodeURIComponent(projectCode)}/history`, {
    params: { regime },
  });
}

/**
 * Retrieve complete model registry including active and historical models.
 */
export async function fetchRiskModels(): Promise<ModelRegistryListResponse> {
  return apiClient<ModelRegistryListResponse>(`${RISK_BASE_URL}/models`);
}

/**
 * Retrieve the currently active production model.
 */
export async function fetchActiveRiskModel(): Promise<ModelRegistryEntry> {
  return apiClient<ModelRegistryEntry>(`${RISK_BASE_URL}/models/active`);
}

/**
 * Retrieve exact model registry entry by model ID.
 */
export async function fetchRiskModel(modelId: string): Promise<ModelRegistryEntry> {
  return apiClient<ModelRegistryEntry>(`${RISK_BASE_URL}/models/${encodeURIComponent(modelId.trim())}`);
}

/**
 * Retrieve registered ML target domains and implementation statuses.
 */
export async function fetchRiskTargets(): Promise<TargetRegistryListResponse> {
  return apiClient<TargetRegistryListResponse>(`${RISK_BASE_URL}/targets`);
}

// Aliases matching alternative naming conventions
export const getRiskModels = fetchRiskModels;
export const getActiveRiskModel = fetchActiveRiskModel;
export const getRiskModel = fetchRiskModel;
export const getRiskTargets = fetchRiskTargets;

