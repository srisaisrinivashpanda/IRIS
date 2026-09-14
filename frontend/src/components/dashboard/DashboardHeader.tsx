import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, BarChart3, Database, Cpu } from "lucide-react";

interface DashboardHeaderProps {
  observedEarliestMonth?: string | null;
  observedLatestMonth?: string | null;
  riskEarliestMonth?: string | null;
  riskLatestMonth?: string | null;
  lastUpdated?: string;
  isRiskReady?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  observedEarliestMonth,
  observedLatestMonth,
  riskEarliestMonth,
  riskLatestMonth,
  lastUpdated,
  isRiskReady = true,
}) => {
  const observedRange =
    observedEarliestMonth && observedLatestMonth
      ? `${observedEarliestMonth} → ${observedLatestMonth}`
      : "2023-01 → 2026-07";

  const riskRange =
    riskEarliestMonth && riskLatestMonth
      ? `${riskEarliestMonth} → ${riskLatestMonth}`
      : riskLatestMonth
      ? riskLatestMonth
      : "EVALUATION ACTIVE";

  return (
    <header className="dashboard-header-command" aria-label="Portfolio Command Center Header">
      <div className="dashboard-header-top">
        <div className="dashboard-header-identity">
          <div className="dashboard-breadcrumb" aria-label="Breadcrumb">
            <span>IRIS</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">COMMAND CENTER</span>
          </div>

          <h1 className="dashboard-main-title">PORTFOLIO COMMAND CENTER</h1>

          <p className="dashboard-description">
            Production portfolio monitoring and schedule-extension risk intelligence.
          </p>
        </div>

        <div className="dashboard-header-actions" role="toolbar" aria-label="Command Center Quick Navigation">
          <Link
            to="/analytics"
            className="dashboard-header-action-btn primary"
          >
            <BarChart3 size={14} aria-hidden="true" />
            <span>VIEW ANALYTICS</span>
          </Link>
          <Link
            to="/projects"
            className="dashboard-header-action-btn secondary"
          >
            <Database size={14} aria-hidden="true" />
            <span>EXPLORE PROJECTS</span>
          </Link>
          <Link
            to="/intelligence"
            className="dashboard-header-action-btn secondary"
          >
            <Cpu size={14} aria-hidden="true" />
            <span>OPEN INTELLIGENCE</span>
          </Link>
        </div>
      </div>

      <div className="dashboard-header-meta-strip" aria-label="Coverage and Governance Metadata">
        <div className="dashboard-meta-item">
          <span className="meta-label">OBSERVED COVERAGE</span>
          <span className="meta-value" data-testid="header-observed-coverage">{observedRange}</span>
        </div>

        <div className="meta-divider" aria-hidden="true" />

        <div className="dashboard-meta-item">
          <span className="meta-label">RISK EVALUATION WINDOW</span>
          <span className="meta-value" data-testid="header-risk-coverage">{riskRange}</span>
        </div>

        <div className="meta-divider" aria-hidden="true" />

        <div className="dashboard-meta-item">
          <span className="meta-label">SYSTEM STATUS</span>
          <div className="meta-status-pill">
            <ShieldCheck size={12} className="meta-status-icon" aria-hidden="true" />
            <span>{isRiskReady ? "PRODUCTION SERVING" : "SERVING PENDING"}</span>
          </div>
        </div>

        {lastUpdated && (
          <>
            <div className="meta-divider" aria-hidden="true" />
            <div className="dashboard-meta-item">
              <span className="meta-label">DATASET INGESTED</span>
              <span className="meta-value">{lastUpdated}</span>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
