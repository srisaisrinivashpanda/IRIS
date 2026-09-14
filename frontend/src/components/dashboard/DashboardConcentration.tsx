import React from "react";
import { Link } from "react-router-dom";
import type { GeographyResponse, SectorsResponse } from "@/types/analytics.ts";
import { DashboardCardSkeleton } from "./DashboardSkeleton.tsx";
import { DashboardErrorState } from "./DashboardErrorState.tsx";
import { MapPin, PieChart, ArrowUpRight } from "lucide-react";

interface DashboardConcentrationProps {
  geographyData?: GeographyResponse;
  sectorsData?: SectorsResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const DashboardConcentration: React.FC<DashboardConcentrationProps> = ({
  geographyData,
  sectorsData,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return <DashboardCardSkeleton height="280px" label="Loading portfolio concentration..." />;
  }

  if (isError) {
    return (
      <DashboardErrorState
        title="Failed to load portfolio concentration"
        message={error?.message || "Geographic and sectoral aggregations could not be retrieved."}
        onRetry={onRetry}
      />
    );
  }

  const topStates = (geographyData?.items || [])
    .slice()
    .sort((a, b) => b.unique_project_count - a.unique_project_count)
    .slice(0, 5);

  const topSectors = (sectorsData?.items || [])
    .slice()
    .sort((a, b) => b.unique_project_count - a.unique_project_count)
    .slice(0, 5);

  const maxStateCount = topStates.length > 0 ? topStates[0].unique_project_count : 1;
  const maxSectorCount = topSectors.length > 0 ? topSectors[0].unique_project_count : 1;

  return (
    <section className="dashboard-section" aria-label="Portfolio Concentration Snapshot">
      <div className="dashboard-section-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 className="dashboard-section-title">PORTFOLIO CONCENTRATION SNAPSHOT</h2>
            <span className="dashboard-section-subtitle">
              Top geographic and sectoral clusters by unique project count
            </span>
          </div>
          <Link
            to="/analytics"
            className="dashboard-section-link"
            aria-label="Navigate to full portfolio analytics"
          >
            <span>EXPLORE ALL DIMENSIONS</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="dashboard-grid-2-col">
        {/* Top States Card */}
        <div className="dashboard-card-white">
          <div className="card-header-lockup">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MapPin size={14} className="concentration-icon" aria-hidden="true" />
              <span className="card-label">TOP STATES BY PROJECT COUNT</span>
            </div>
            <span className="card-tag-neutral">
              {geographyData?.total_states ? `${geographyData.total_states} STATES` : "GEOGRAPHY"}
            </span>
          </div>

          <div className="concentration-list" role="list" aria-label="Top states by project count">
            {topStates.length === 0 ? (
              <span className="dashboard-empty-card-text">No state aggregations available.</span>
            ) : (
              topStates.map((st) => {
                const pctOfMax = Math.round((st.unique_project_count / maxStateCount) * 100);
                const encodedState = encodeURIComponent(st.state);
                return (
                  <Link
                    key={st.state}
                    to={`/analytics?state=${encodedState}`}
                    className="concentration-item-row"
                    role="listitem"
                    aria-label={`${st.state}: ${st.unique_project_count} projects. Open in Analytics.`}
                  >
                    <div className="concentration-item-info">
                      <span className="concentration-item-name">{st.state}</span>
                      <span className="concentration-item-meta">
                        {st.unique_project_count.toLocaleString()} projects · {st.observation_count.toLocaleString()} obs
                      </span>
                    </div>
                    <div className="concentration-bar-track" aria-hidden="true">
                      <div
                        className="concentration-bar-fill primary"
                        style={{ width: `${Math.max(4, pctOfMax)}%` }}
                      />
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="dashboard-card-footnote">
            <span>
              GOVERNANCE: District dimension is structurally omitted in primary source Flash Reports and unavailable.
            </span>
          </div>
        </div>

        {/* Top Sectors Card */}
        <div className="dashboard-card-white">
          <div className="card-header-lockup">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <PieChart size={14} className="concentration-icon" aria-hidden="true" />
              <span className="card-label">TOP SECTORS BY PROJECT COUNT</span>
            </div>
            <span className="card-tag-neutral">
              {sectorsData?.total_sectors ? `${sectorsData.total_sectors} SECTORS` : "SECTORAL"}
            </span>
          </div>

          <div className="concentration-list" role="list" aria-label="Top sectors by project count">
            {topSectors.length === 0 ? (
              <span className="dashboard-empty-card-text">No sector aggregations available.</span>
            ) : (
              topSectors.map((sec) => {
                const pctOfMax = Math.round((sec.unique_project_count / maxSectorCount) * 100);
                const encodedSector = encodeURIComponent(sec.sector);
                return (
                  <Link
                    key={sec.sector}
                    to={`/analytics?sector=${encodedSector}`}
                    className="concentration-item-row"
                    role="listitem"
                    aria-label={`${sec.sector}: ${sec.unique_project_count} projects. Open in Analytics.`}
                  >
                    <div className="concentration-item-info">
                      <span className="concentration-item-name">{sec.sector}</span>
                      <span className="concentration-item-meta">
                        {sec.unique_project_count.toLocaleString()} projects · {sec.observation_count.toLocaleString()} obs
                      </span>
                    </div>
                    <div className="concentration-bar-track" aria-hidden="true">
                      <div
                        className="concentration-bar-fill coral"
                        style={{ width: `${Math.max(4, pctOfMax)}%` }}
                      />
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="dashboard-card-footnote">
            <span>
              Click any state or sector to filter and investigate in Portfolio Analytics.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
