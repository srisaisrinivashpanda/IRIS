import React from "react";
import { Link } from "react-router-dom";
import type { OverviewResponse, RiskAnalyticsResponse } from "@/types/analytics.ts";
import { ShieldCheck, Info, Database, AlertCircle } from "lucide-react";

interface DashboardCoverageProps {
  overview?: OverviewResponse;
  risk?: RiskAnalyticsResponse;
}

export const DashboardCoverage: React.FC<DashboardCoverageProps> = ({
  overview,
  risk,
}) => {
  const observedRange =
    overview?.earliest_observation_month && overview?.latest_observation_month
      ? `${overview.earliest_observation_month} → ${overview.latest_observation_month}`
      : "2023-01 → 2026-07";

  const riskRange =
    risk?.evaluation_earliest_month && risk?.evaluation_latest_month
      ? `${risk.evaluation_earliest_month} → ${risk.evaluation_latest_month}`
      : risk?.evaluation_latest_month || "ACTIVE EVALUATION";

  const uniqueProjects = overview?.unique_project_count != null
    ? overview.unique_project_count.toLocaleString()
    : "—";

  const observations = overview?.observation_count != null
    ? overview.observation_count.toLocaleString()
    : "—";

  const assessedProjects = risk?.assessed_project_count != null
    ? risk.assessed_project_count.toLocaleString()
    : overview?.assessed_project_count != null
    ? overview.assessed_project_count.toLocaleString()
    : "—";

  return (
    <section className="dashboard-section" aria-label="Data Coverage and Governance Disclosures">
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">DATA COVERAGE & SOURCE STATUS</h2>
        <span className="dashboard-section-subtitle">
          Auditable provenance, dimensional availability, and ML target serving status
        </span>
      </div>

      <div className="system-provenance-bar">
        <div className="provenance-pills-wrap">
          <div className="provenance-pill">
            <Database size={13} aria-hidden="true" />
            <span>OBSERVED SPAN:</span>
            <span className="provenance-pill-val">{observedRange}</span>
          </div>

          <div className="provenance-pill">
            <span>PORTFOLIO SCOPE:</span>
            <span className="provenance-pill-val">{uniqueProjects} PROJECTS ({observations} OBS)</span>
          </div>

          <div className="provenance-pill">
            <span>RISK EVALUATION SPAN:</span>
            <span className="provenance-pill-val">{riskRange}</span>
          </div>

          <div className="provenance-pill">
            <span>ASSESSED POPULATION:</span>
            <span className="provenance-pill-val">{assessedProjects} PROJECTS</span>
          </div>

          <div className="provenance-pill">
            <ShieldCheck size={13} aria-hidden="true" />
            <span>PRIMARY SERVED TARGET:</span>
            <span className="provenance-pill-val">target_effective_schedule_ext_3m (SERVED)</span>
          </div>

          <div className="provenance-pill" title="Target registered in specification but unserved by production model.">
            <AlertCircle size={13} aria-hidden="true" style={{ color: "var(--color-coral)" }} />
            <span>UNSERVED ML TARGETS:</span>
            <span className="provenance-pill-val pending">cost_overrun (UNSERVED), progress_stagnation (UNSERVED)</span>
          </div>

          <div className="provenance-pill" title="District dimension structurally absent in Flash Report source data.">
            <Info size={13} aria-hidden="true" />
            <span>DIMENSIONAL STATUS:</span>
            <span className="provenance-pill-val pending">DISTRICT = UNAVAILABLE</span>
          </div>
        </div>

        <div className="dashboard-coverage-links">
          <span>Explore governance details in:</span>
          <Link to="/analytics" className="coverage-inline-link">
            Portfolio Analytics →
          </Link>
          <Link to="/intelligence" className="coverage-inline-link">
            Risk Intelligence Terminal →
          </Link>
        </div>
      </div>
    </section>
  );
};
