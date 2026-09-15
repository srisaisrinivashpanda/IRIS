/**
 * Authoritative Cross-Workspace Navigation Utility: Analytics → Projects (PR-15)
 * 
 * Strict Governance & Contracts:
 * - Only parameters explicitly supported by `/projects` are serialized.
 * - Single exact months transfer to `report_month`.
 * - Multi-month ranges (from_month != to_month) are NEVER collapsed into a single month.
 * - Analytics-only filters (regime, district, model_id, risk_probability) are strictly excluded from Projects URL.
 * - Deterministic URL generation with safe parameter encoding and no duplicate keys.
 * - Canonical destination: `/projects?...`. Never generates forbidden `/intelligence/projects`.
 * - Truthful population semantics: compatible project population under supported contract.
 */

import type { GlobalAnalyticsFilters, RiskAnalyticsFilters } from "@/types/analytics.ts";

export interface SupportedProjectsParams {
  project_code?: string | null;
  report_month?: string | null;
  sector?: string | null;
  state?: string | null;
  agency?: string | null;
  ministry?: string | null;
  search?: string | null;
  page?: number | null;
  sort_by?: string | null;
  sort_order?: string | null;
}

export interface AnalyticsInvestigationContext {
  source: "analytics";
  transferredFilters: Partial<Record<string, string>>;
  omittedFilters: {
    from_month?: string | null;
    to_month?: string | null;
    timeRange?: string | null;
    regime?: string | null;
    [key: string]: unknown;
  };
  analyticsUrl: string;
}

const ALLOWED_PROJECTS_PARAMS = new Set([
  "project_code",
  "report_month",
  "sector",
  "state",
  "agency",
  "ministry",
  "search",
  "page",
  "sort_by",
  "sort_order",
]);

/**
 * Construct canonical Projects workspace URL containing only supported parameters.
 */
export function buildProjectsInvestigationUrl(params: SupportedProjectsParams = {}): string {
  const searchParams = new URLSearchParams();

  // Iterate strictly in deterministic order
  const orderedKeys: Array<keyof SupportedProjectsParams> = [
    "project_code",
    "report_month",
    "sector",
    "state",
    "agency",
    "ministry",
    "search",
    "page",
    "sort_by",
    "sort_order",
  ];

  for (const key of orderedKeys) {
    if (!ALLOWED_PROJECTS_PARAMS.has(key)) continue;
    const rawVal = params[key];
    if (rawVal === null || rawVal === undefined) continue;
    const strVal = String(rawVal).trim();
    if (strVal === "") continue;

    // Filter out page if 1 (default)
    if (key === "page" && strVal === "1") continue;

    searchParams.set(key, strVal);
  }

  const query = searchParams.toString();
  return query ? `/projects?${query}` : "/projects";
}

/**
 * Determine single month transference vs multi-month range.
 * If from_month === to_month, it represents an exact single month eligible for transference.
 * If from_month != to_month, it is a range that must NOT be collapsed into report_month.
 */
export function resolveTransferredMonth(
  explicitMonth?: string | null,
  fromMonth?: string | null,
  toMonth?: string | null
): { report_month?: string; isRangeOmitted: boolean; timeRangeString?: string } {
  if (explicitMonth && explicitMonth.trim()) {
    return { report_month: explicitMonth.trim(), isRangeOmitted: false };
  }

  const f = fromMonth?.trim();
  const t = toMonth?.trim();

  if (f && t && f === t) {
    return { report_month: f, isRangeOmitted: false };
  }

  if (f && !t) {
    // Open-ended or single start month
    return { report_month: undefined, isRangeOmitted: true, timeRangeString: `From ${f}` };
  }

  if (!f && t) {
    return { report_month: undefined, isRangeOmitted: true, timeRangeString: `Up to ${t}` };
  }

  if (f && t && f !== t) {
    return { report_month: undefined, isRangeOmitted: true, timeRangeString: `${f} → ${t}` };
  }

  return { report_month: undefined, isRangeOmitted: false };
}

/**
 * Reconstruct current Analytics URL query string to preserve state for return navigation.
 */
export function buildAnalyticsCurrentUrl(
  globalFilters: GlobalAnalyticsFilters = {},
  riskFilters: RiskAnalyticsFilters = {}
): string {
  const searchParams = new URLSearchParams();
  if (globalFilters.from_month?.trim()) searchParams.set("from_month", globalFilters.from_month.trim());
  if (globalFilters.to_month?.trim()) searchParams.set("to_month", globalFilters.to_month.trim());
  if (globalFilters.state?.trim()) searchParams.set("state", globalFilters.state.trim());
  if (globalFilters.sector?.trim()) searchParams.set("sector", globalFilters.sector.trim());
  if (globalFilters.agency?.trim()) searchParams.set("agency", globalFilters.agency.trim());
  if (globalFilters.project_code?.trim()) searchParams.set("project_code", globalFilters.project_code.trim());
  if (riskFilters.regime?.trim()) searchParams.set("regime", riskFilters.regime.trim());

  const qs = searchParams.toString();
  return qs ? `/analytics?${qs}` : "/analytics";
}

export interface BuildInvestigationNavigationOptions {
  globalFilters?: GlobalAnalyticsFilters;
  riskFilters?: RiskAnalyticsFilters;
  overrideSector?: string | null;
  overrideAgency?: string | null;
  overrideState?: string | null;
  overrideReportMonth?: string | null;
  overrideProjectCode?: string | null;
}

/**
 * Full investigation navigation package: destination URL + context for React Router state.
 */
export function buildInvestigationPackage(options: BuildInvestigationNavigationOptions = {}): {
  url: string;
  context: AnalyticsInvestigationContext;
} {
  const {
    globalFilters = {},
    riskFilters = {},
    overrideSector,
    overrideAgency,
    overrideState,
    overrideReportMonth,
    overrideProjectCode,
  } = options;

  // Resolve dimensions: overrides take precedence over global filters
  const sector = overrideSector !== undefined ? (overrideSector?.trim() || undefined) : (globalFilters.sector?.trim() || undefined);
  const agency = overrideAgency !== undefined ? (overrideAgency?.trim() || undefined) : (globalFilters.agency?.trim() || undefined);
  const state = overrideState !== undefined ? (overrideState?.trim() || undefined) : (globalFilters.state?.trim() || undefined);
  const projectCode = overrideProjectCode !== undefined ? (overrideProjectCode?.trim() || undefined) : (globalFilters.project_code?.trim() || undefined);

  // Month resolution
  const monthResolution = resolveTransferredMonth(
    overrideReportMonth,
    globalFilters.from_month,
    globalFilters.to_month
  );

  const supportedParams: SupportedProjectsParams = {
    sector,
    agency,
    state,
    project_code: projectCode,
    report_month: monthResolution.report_month,
  };

  const url = buildProjectsInvestigationUrl(supportedParams);

  // Transferred map for display
  const transferredFilters: Partial<Record<string, string>> = {};
  if (sector) transferredFilters.sector = sector;
  if (agency) transferredFilters.agency = agency;
  if (state) transferredFilters.state = state;
  if (projectCode) transferredFilters.project_code = projectCode;
  if (monthResolution.report_month) transferredFilters.report_month = monthResolution.report_month;

  // Omitted map
  const omittedFilters: AnalyticsInvestigationContext["omittedFilters"] = {};
  if (monthResolution.isRangeOmitted) {
    omittedFilters.from_month = globalFilters.from_month;
    omittedFilters.to_month = globalFilters.to_month;
    omittedFilters.timeRange = monthResolution.timeRangeString;
  }
  if (riskFilters.regime) {
    omittedFilters.regime = riskFilters.regime;
  }

  const analyticsUrl = buildAnalyticsCurrentUrl(globalFilters, riskFilters);

  const context: AnalyticsInvestigationContext = {
    source: "analytics",
    transferredFilters,
    omittedFilters,
    analyticsUrl,
  };

  return { url, context };
}
