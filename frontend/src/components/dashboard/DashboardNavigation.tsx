import React from "react";
import { Link } from "react-router-dom";
import { Database, BarChart3, Cpu, ArrowRight } from "lucide-react";

export const DashboardNavigation: React.FC = () => {
  return (
    <section className="dashboard-section" aria-label="Operational Navigation Pathways">
      <div className="dashboard-section-header">
        <h2 className="dashboard-section-title">OPERATIONAL NAVIGATION PATHWAYS</h2>
        <span className="dashboard-section-subtitle">
          Direct progressive disclosure pathways from command center decision summary to deep investigation
        </span>
      </div>

      <div className="dashboard-grid-3-col">
        {/* Pathway 1: Project Discovery */}
        <Link to="/projects" className="dashboard-nav-card" aria-label="Navigate to Project Discovery">
          <div className="nav-card-header">
            <div className="nav-card-icon-wrap">
              <Database size={16} aria-hidden="true" />
            </div>
            <span className="nav-card-step">01 / DISCOVERY</span>
          </div>
          <div className="nav-card-body">
            <h3 className="nav-card-title">PROJECT DISCOVERY</h3>
            <p className="nav-card-desc">
              Search, filter, and inspect individual project entities, chronological trajectories, and reported cost/schedule revisions.
            </p>
          </div>
          <div className="nav-card-footer">
            <span>EXPLORE CATALOG</span>
            <ArrowRight size={13} aria-hidden="true" />
          </div>
        </Link>

        {/* Pathway 2: Portfolio Analytics */}
        <Link to="/analytics" className="dashboard-nav-card" aria-label="Navigate to Portfolio Analytics">
          <div className="nav-card-header">
            <div className="nav-card-icon-wrap">
              <BarChart3 size={16} aria-hidden="true" />
            </div>
            <span className="nav-card-step">02 / EXPLORATION</span>
          </div>
          <div className="nav-card-body">
            <h3 className="nav-card-title">PORTFOLIO ANALYTICS</h3>
            <p className="nav-card-desc">
              Explore cross-filtered longitudinal trends, state-level geography, agency distributions, and comprehensive financial aggregations.
            </p>
          </div>
          <div className="nav-card-footer">
            <span>OPEN ANALYTICS</span>
            <ArrowRight size={13} aria-hidden="true" />
          </div>
        </Link>

        {/* Pathway 3: Risk Intelligence */}
        <Link to="/intelligence" className="dashboard-nav-card" aria-label="Navigate to Risk Intelligence Terminal">
          <div className="nav-card-header">
            <div className="nav-card-icon-wrap">
              <Cpu size={16} aria-hidden="true" />
            </div>
            <span className="nav-card-step">03 / INVESTIGATION</span>
          </div>
          <div className="nav-card-body">
            <h3 className="nav-card-title">RISK INTELLIGENCE</h3>
            <p className="nav-card-desc">
              Deep ML investigation terminal with TreeSHAP feature drivers, calibrated risk distributions, and model governance registry.
            </p>
          </div>
          <div className="nav-card-footer">
            <span>OPEN TERMINAL</span>
            <ArrowRight size={13} aria-hidden="true" />
          </div>
        </Link>
      </div>
    </section>
  );
};
