/**
 * Projects Portfolio Summary (PR-14)
 * Authoritative summary of monitored project portfolio records,
 * strictly separating portfolio observation scope from risk evaluation coverage.
 * Adheres to Correction 1 & 4: Truthful observation counts and explicit scope indicators.
 */

import React from "react";
import type { DatasetInfoResponse } from "@/types/system.ts";
import type { FilterOptionsResponse } from "@/types/project.ts";
import type { Filters } from "./ProjectSearch.tsx";
import { useStaggerList } from "@/lib/motion/useMotion.ts";
import { ShieldCheck, Database, SlidersHorizontal } from "lucide-react";

export interface ProjectsPortfolioSummaryProps {
  systemInfo?: DatasetInfoResponse;
  options?: FilterOptionsResponse;
  filters?: Filters;
  matchingCount?: number;
  riskEvaluationMonth?: string | null;
  riskAssessedCount?: number | null;
  isLoading?: boolean;
  onResetFilters?: () => void;
}

export const ProjectsPortfolioSummary: React.FC<ProjectsPortfolioSummaryProps> = ({
  systemInfo,
  options,
  filters = {},
  matchingCount,
  riskEvaluationMonth,
  riskAssessedCount,
  isLoading = false,
  onResetFilters,
}) => {
  const gridRef = useStaggerList<HTMLDivElement>(systemInfo, ".portfolio-snapshot-card");

  const uniqueProjects =
    systemInfo?.unique_projects_count != null
      ? systemInfo.unique_projects_count.toLocaleString()
      : "—";

  const observations =
    systemInfo?.row_count != null
      ? systemInfo.row_count.toLocaleString()
      : "—";

  const monthsCount = systemInfo?.covered_months?.length
    ? `${systemInfo.covered_months.length} MONTHS`
    : "—";

  const latestReport = systemInfo?.covered_months?.length
    ? [...systemInfo.covered_months].sort().slice(-1)[0]
    : "—";

  const sectorsCount =
    options?.sectors?.length != null ? options.sectors.length.toLocaleString() : "—";

  const agenciesCount =
    options?.agencies?.length != null ? options.agencies.length.toLocaleString() : "—";

  const statesCount =
    options?.states?.length != null ? options.states.length.toLocaleString() : "—";

  const hasActiveFilters = Boolean(
    filters.sector ||
    filters.agency ||
    filters.state ||
    filters.ministry ||
    filters.report_month ||
    filters.project_code ||
    filters.search
  );

  return (
    <section className="portfolio-snapshot-section" aria-label="Portfolio Snapshot">
      <div className="portfolio-snapshot-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="portfolio-snapshot-num">01.</span>
          <h2 className="portfolio-snapshot-title" style={{ margin: 0 }}>
            PORTFOLIO SNAPSHOT & TAXONOMY TELEMETRY
          </h2>
        </div>
        {hasActiveFilters && (
          <div className="active-scope-pill" data-testid="portfolio-active-scope-pill">
            <SlidersHorizontal size={12} />
            <span>FILTERED SCOPE: {matchingCount != null ? `${matchingCount.toLocaleString()} MATCHING OBSERVATIONS` : "ACTIVE FILTERS"}</span>
            {onResetFilters && (
              <button
                type="button"
                className="scope-reset-btn"
                onClick={onResetFilters}
                title="Reset all active filters"
                aria-label="Reset all filters"
              >
                CLEAR
              </button>
            )}
          </div>
        )}
      </div>

      {/* Primary Telemetry Grid */}
      <div ref={gridRef} className="portfolio-snapshot-grid">
        <div className="portfolio-snapshot-card" data-testid="summary-card-total-projects">
          <span className="snapshot-card-label">TOTAL PROJECTS</span>
          <span className="snapshot-card-val font-mono">{isLoading ? "..." : uniqueProjects}</span>
          <span className="snapshot-card-sub">UNIQUE IDENTIFIERS</span>
        </div>

        <div className="portfolio-snapshot-card" data-testid="summary-card-observations">
          <span className="snapshot-card-label">OBSERVATIONS</span>
          <span className="snapshot-card-val font-mono">{isLoading ? "..." : observations}</span>
          <span className="snapshot-card-sub">HISTORICAL RECORDS</span>
        </div>

        <div className="portfolio-snapshot-card" data-testid="summary-card-monitored-period">
          <span className="snapshot-card-label">MONITORED PERIOD</span>
          <span className="snapshot-card-val font-mono">{isLoading ? "..." : monthsCount}</span>
          <span className="snapshot-card-sub">LONGITUDINAL SPAN</span>
        </div>

        <div className="portfolio-snapshot-card" data-testid="summary-card-latest-evaluation">
          <span className="snapshot-card-label">LATEST EVALUATION</span>
          <span className="snapshot-card-val font-mono">{isLoading ? "..." : latestReport}</span>
          <span className="snapshot-card-sub">ACTIVE AUDIT MONTH</span>
        </div>

        <div className="portfolio-snapshot-card" data-testid="summary-card-active-sectors">
          <span className="snapshot-card-label">ACTIVE SECTORS</span>
          <span className="snapshot-card-val font-mono">{isLoading ? "..." : sectorsCount}</span>
          <span className="snapshot-card-sub">INFRASTRUCTURE DOMAINS</span>
        </div>

        <div className="portfolio-snapshot-card" data-testid="summary-card-agencies">
          <span className="snapshot-card-label">AGENCIES</span>
          <span className="snapshot-card-val font-mono">{isLoading ? "..." : agenciesCount}</span>
          <span className="snapshot-card-sub">EXECUTING BODIES</span>
        </div>

        <div className="portfolio-snapshot-card" data-testid="summary-card-states">
          <span className="snapshot-card-label">STATES / REGIONS</span>
          <span className="snapshot-card-val font-mono">{isLoading ? "..." : statesCount}</span>
          <span className="snapshot-card-sub">GEOGRAPHIC SCOPE</span>
        </div>
      </div>

      {/* Scope Separation Bar: Portfolio Observations vs Risk Evaluation Coverage */}
      <div className="portfolio-scope-separation-bar" data-testid="portfolio-scope-separation">
        <div className="scope-box observation-scope" data-testid="summary-observation-scope">
          <div className="scope-box-header">
            <Database size={14} className="text-emerald" />
            <span className="scope-box-title">PORTFOLIO OBSERVATIONS</span>
          </div>
          <p className="scope-box-desc">
            All monthly infrastructure project submissions under MoSPI Flash Report monitoring.
            {systemInfo?.covered_months && systemInfo.covered_months.length > 0 && (
              <span className="scope-meta font-mono">
                {" "}Cadence: {[...systemInfo.covered_months].sort()[0]} → {[...systemInfo.covered_months].sort().slice(-1)[0]}
              </span>
            )}
          </p>
        </div>

        <div className="scope-box risk-scope" data-testid="summary-risk-evaluation-scope">
          <div className="scope-box-header">
            <ShieldCheck size={14} className="text-blue" />
            <span className="scope-box-title">RISK EVALUATION COVERAGE</span>
          </div>
          <p className="scope-box-desc">
            Projects meeting feature completeness requirements under locked operational serving models.
            <span className="scope-meta font-mono">
              {" "}Target: target_effective_schedule_ext_3m
              {riskEvaluationMonth ? ` · Active Cycle: ${riskEvaluationMonth}` : ""}
              {riskAssessedCount != null ? ` · Assessed: ${riskAssessedCount.toLocaleString()} projects` : ""}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};
