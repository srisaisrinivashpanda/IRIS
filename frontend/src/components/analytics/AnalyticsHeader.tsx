import React from "react";
import type { OverviewResponse } from "@/types/analytics.ts";

interface AnalyticsHeaderProps {
  overview?: OverviewResponse;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ overview }) => {
  const uniqueProjects = overview?.unique_project_count != null
    ? overview.unique_project_count.toLocaleString()
    : "—";

  const totalObs = overview?.observation_count != null && overview.observation_count > 0
    ? overview.observation_count.toLocaleString()
    : "—";

  const earliestMonth = overview?.earliest_observation_month || overview?.coverage?.earliest_month;
  const latestMonth = overview?.latest_observation_month || overview?.coverage?.latest_month;
  const coveragePeriod = earliestMonth && latestMonth
    ? `${earliestMonth} → ${latestMonth}`
    : "—";

  const assessedProjects = overview?.assessed_project_count != null && overview.assessed_project_count > 0
    ? overview.assessed_project_count.toLocaleString()
    : "—";

  return (
    <header className="analytics-intro-header">
      <div className="analytics-breadcrumb">IRIS / ANALYTICS / PORTFOLIO WORKSPACE</div>
      <h1 className="analytics-main-title">PORTFOLIO INTELLIGENCE & CROSS-FILTERING</h1>
      <p className="analytics-subtitle">
        Authoritative portfolio aggregation across monitored projects, financial commitments,
        physical progress, and production schedule-extension risk.
      </p>

      <div className="analytics-meta-strip">
        <div className="analytics-meta-item">
          <span className="analytics-meta-label">OBSERVED COVERAGE</span>
          <span className="analytics-meta-val">{coveragePeriod}</span>
        </div>

        <div className="analytics-meta-item">
          <span className="analytics-meta-label">MONITORED PROJECTS</span>
          <span className="analytics-meta-val">{uniqueProjects}</span>
        </div>

        <div className="analytics-meta-item">
          <span className="analytics-meta-label">PORTFOLIO OBSERVATIONS</span>
          <span className="analytics-meta-val">{totalObs}</span>
        </div>

        <div className="analytics-meta-item">
          <span className="analytics-meta-label">RISK ASSESSED PROJECTS</span>
          <span className="analytics-meta-val">{assessedProjects}</span>
        </div>
      </div>
    </header>
  );
};
