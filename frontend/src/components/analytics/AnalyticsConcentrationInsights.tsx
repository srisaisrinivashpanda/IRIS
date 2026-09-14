/**
 * Analytics Concentration Insights (PR-13)
 * Truthful presentation of sectoral, agency, and state concentration.
 * Strictly adheres to Correction 2: No manufactured shares without guaranteed
 * compatible denominators; displays exact returned values and deterministic ranking.
 */

import React from "react";
import type {
  AgenciesResponse,
  AgencyGroup,
  GeographyGroup,
  GeographyResponse,
  OverviewResponse,
  SectorGroup,
  SectorsResponse,
} from "@/types/analytics.ts";

interface AnalyticsConcentrationInsightsProps {
  geography?: GeographyResponse;
  sectors?: SectorsResponse;
  agencies?: AgenciesResponse;
  overview?: OverviewResponse;
  selectedState?: string | null;
  selectedSector?: string | null;
  selectedAgency?: string | null;
  onToggleState?: (state: string) => void;
  onToggleSector?: (sector: string) => void;
  onToggleAgency?: (agency: string) => void;
  isLoading?: boolean;
}

export const AnalyticsConcentrationInsights: React.FC<AnalyticsConcentrationInsightsProps> = ({
  geography,
  sectors,
  agencies,
  overview,
  selectedState,
  selectedSector,
  selectedAgency,
  onToggleState,
  onToggleSector,
  onToggleAgency,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="analytics-intel-card" data-testid="concentration-insights-loading">
        <div className="analytics-skeleton-line" />
        <div className="analytics-skeleton-line short" />
      </div>
    );
  }

  // 1. Sector Analysis
  const sectorItems = sectors?.items ?? [];
  const leadSector: SectorGroup | undefined = sectorItems[0]; // backend sorts descending by project count
  const totalSectorProjects = sectorItems.reduce((sum, s) => sum + s.unique_project_count, 0);

  // Correction 2: Strict denominator check for sector share
  const isSectorDenominatorCompatible =
    overview?.unique_project_count !== undefined &&
    overview.unique_project_count > 0 &&
    totalSectorProjects === overview.unique_project_count;

  const leadSectorShare =
    isSectorDenominatorCompatible && leadSector && overview?.unique_project_count
      ? ((leadSector.unique_project_count / overview.unique_project_count) * 100).toFixed(1)
      : null;

  // 2. Agency Analysis
  const agencyItems = agencies?.items ?? [];
  // Sort deterministically by cumulative expenditure descending
  const sortedAgenciesByExpenditure = [...agencyItems].sort((a, b) => {
    const expA = a.total_cumulative_expenditure ?? -1;
    const expB = b.total_cumulative_expenditure ?? -1;
    return expB - expA;
  });
  const leadAgencyByExp: AgencyGroup | undefined = sortedAgenciesByExpenditure[0];

  const totalAgencyExpenditure = agencyItems.reduce(
    (sum, a) => sum + (a.total_cumulative_expenditure ?? 0),
    0
  );

  // Correction 2: Strict denominator check for agency expenditure share
  const isAgencyExpenditureCompatible =
    overview?.total_cumulative_expenditure !== undefined &&
    overview.total_cumulative_expenditure !== null &&
    overview.total_cumulative_expenditure > 0 &&
    Math.abs(totalAgencyExpenditure - overview.total_cumulative_expenditure) < 1.0;

  const leadAgencyExpenditureShare =
    isAgencyExpenditureCompatible &&
    leadAgencyByExp?.total_cumulative_expenditure &&
    overview?.total_cumulative_expenditure
      ? ((leadAgencyByExp.total_cumulative_expenditure / overview.total_cumulative_expenditure) * 100).toFixed(1)
      : null;

  // 3. State Analysis
  const stateItems = geography?.items ?? [];
  const leadState: GeographyGroup | undefined = stateItems[0]; // backend sorts descending by project count
  const totalStateProjects = stateItems.reduce((sum, st) => sum + st.unique_project_count, 0);

  const isStateDenominatorCompatible =
    overview?.unique_project_count !== undefined &&
    overview.unique_project_count > 0 &&
    totalStateProjects === overview.unique_project_count;

  const leadStateShare =
    isStateDenominatorCompatible && leadState && overview?.unique_project_count
      ? ((leadState.unique_project_count / overview.unique_project_count) * 100).toFixed(1)
      : null;

  // District status from authoritative response
  const districtStatus = geography?.district_dimension_status ?? "UNAVAILABLE";
  const districtReason =
    geography?.district_dimension_reason ??
    "District is structurally omitted from source flash reports.";

  return (
    <div className="analytics-intel-card" data-testid="analytics-concentration-insights">
      <div className="analytics-intel-card-header">
        <span className="analytics-intel-badge">PORTFOLIO CONCENTRATION</span>
        <h4 className="analytics-intel-card-title">Categorical & Geographic Concentration</h4>
      </div>

      <div className="analytics-intel-concentration-grid">
        {/* Sector Concentration */}
        <div className="concentration-column" data-testid="concentration-sector-column">
          <div className="concentration-column-title">
            <span>SECTOR DISTRIBUTION</span>
            <span className="count-pill font-mono">{sectors?.total_sectors ?? sectorItems.length} Sectors</span>
          </div>

          {leadSector ? (
            <div className="concentration-lead-card">
              <div className="lead-header">
                <span className="lead-rank-badge font-mono">#1 SECTOR</span>
                {selectedSector === leadSector.sector && (
                  <span className="filter-active-pill">FILTERED</span>
                )}
              </div>
              <button
                type="button"
                className="lead-name-btn"
                onClick={() => onToggleSector?.(leadSector.sector)}
                title={`Click to toggle filter for sector ${leadSector.sector}`}
              >
                {leadSector.sector}
              </button>
              <div className="lead-stats">
                <div className="stat-row">
                  <span className="stat-name">Observed Projects:</span>
                  <span className="stat-val font-mono" data-testid="sector-lead-projects">
                    {leadSector.unique_project_count.toLocaleString()}
                  </span>
                </div>
                {/* Denominator rule: render share only when provably compatible */}
                {leadSectorShare !== null ? (
                  <div className="stat-row">
                    <span className="stat-name">Portfolio Share:</span>
                    <span className="stat-val font-mono" data-testid="sector-lead-share">
                      {leadSectorShare}% of portfolio projects
                    </span>
                  </div>
                ) : (
                  <div className="stat-row text-muted text-xs" data-testid="sector-share-incompatible">
                    <span>Portfolio Share:</span>
                    <span>Exact count only (no compatible portfolio denominator)</span>
                  </div>
                )}
                {leadSector.total_cumulative_expenditure !== null && (
                  <div className="stat-row">
                    <span className="stat-name">Cumulative Expenditure:</span>
                    <span className="stat-val font-mono">
                      ₹{leadSector.total_cumulative_expenditure.toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="analytics-intel-empty-hint text-muted">No sector records returned.</div>
          )}
        </div>

        {/* Agency Concentration */}
        <div className="concentration-column" data-testid="concentration-agency-column">
          <div className="concentration-column-title">
            <span>EXECUTING AGENCIES</span>
            <span className="count-pill font-mono">{agencies?.total_agencies ?? agencyItems.length} Agencies</span>
          </div>

          {leadAgencyByExp ? (
            <div className="concentration-lead-card">
              <div className="lead-header">
                <span className="lead-rank-badge font-mono">#1 EXPENDITURE</span>
                {selectedAgency === leadAgencyByExp.agency && (
                  <span className="filter-active-pill">FILTERED</span>
                )}
              </div>
              <button
                type="button"
                className="lead-name-btn"
                onClick={() => onToggleAgency?.(leadAgencyByExp.agency)}
                title={`Click to toggle filter for agency ${leadAgencyByExp.agency}`}
              >
                {leadAgencyByExp.agency}
              </button>
              <div className="lead-stats">
                <div className="stat-row">
                  <span className="stat-name">Cumulative Expenditure:</span>
                  <span className="stat-val font-mono" data-testid="agency-lead-expenditure">
                    {leadAgencyByExp.total_cumulative_expenditure !== null
                      ? `₹${leadAgencyByExp.total_cumulative_expenditure.toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr`
                      : "—"}
                  </span>
                </div>
                {/* Denominator rule: render share only when provably compatible */}
                {leadAgencyExpenditureShare !== null ? (
                  <div className="stat-row">
                    <span className="stat-name">Expenditure Share:</span>
                    <span className="stat-val font-mono" data-testid="agency-lead-share">
                      {leadAgencyExpenditureShare}% of portfolio expenditure
                    </span>
                  </div>
                ) : (
                  <div className="stat-row text-muted text-xs" data-testid="agency-share-incompatible">
                    <span>Expenditure Share:</span>
                    <span>Exact value only (no compatible portfolio denominator)</span>
                  </div>
                )}
                <div className="stat-row">
                  <span className="stat-name">Observed Projects:</span>
                  <span className="stat-val font-mono">
                    {leadAgencyByExp.unique_project_count.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="analytics-intel-empty-hint text-muted">No agency records returned.</div>
          )}
        </div>

        {/* State Concentration & District Omission */}
        <div className="concentration-column" data-testid="concentration-state-column">
          <div className="concentration-column-title">
            <span>GEOGRAPHY (STATE-LEVEL)</span>
            <span className="count-pill font-mono">{geography?.total_states ?? stateItems.length} States</span>
          </div>

          {leadState ? (
            <div className="concentration-lead-card">
              <div className="lead-header">
                <span className="lead-rank-badge font-mono">#1 STATE</span>
                {selectedState === leadState.state && (
                  <span className="filter-active-pill">FILTERED</span>
                )}
              </div>
              <button
                type="button"
                className="lead-name-btn"
                onClick={() => onToggleState?.(leadState.state)}
                title={`Click to toggle filter for state ${leadState.state}`}
              >
                {leadState.state}
              </button>
              <div className="lead-stats">
                <div className="stat-row">
                  <span className="stat-name">Observed Projects:</span>
                  <span className="stat-val font-mono" data-testid="state-lead-projects">
                    {leadState.unique_project_count.toLocaleString()}
                  </span>
                </div>
                {leadStateShare !== null ? (
                  <div className="stat-row">
                    <span className="stat-name">Portfolio Share:</span>
                    <span className="stat-val font-mono" data-testid="state-lead-share">
                      {leadStateShare}% of portfolio projects
                    </span>
                  </div>
                ) : (
                  <div className="stat-row text-muted text-xs" data-testid="state-share-incompatible">
                    <span>Portfolio Share:</span>
                    <span>Exact count only (no compatible portfolio denominator)</span>
                  </div>
                )}
                {leadState.total_cumulative_expenditure !== null && (
                  <div className="stat-row">
                    <span className="stat-name">Cumulative Expenditure:</span>
                    <span className="stat-val font-mono">
                      ₹{leadState.total_cumulative_expenditure.toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="analytics-intel-empty-hint text-muted">No state records returned.</div>
          )}

          {/* District Dimension Truthful Status Disclosure */}
          <div className="district-omission-card" data-testid="district-dimension-disclosure">
            <div className="district-omission-header">
              <span className="omission-tag font-mono">DISTRICT DIMENSION: {districtStatus}</span>
            </div>
            <p className="omission-desc text-muted text-xs">{districtReason}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
