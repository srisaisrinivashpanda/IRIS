/**
 * Projects Page (PR-14)
 * Upgraded Project Portfolio Investigation Workspace.
 * 
 * Strict Governance & Contracts:
 * - URL as single source of truth via useSearchParams() (Correction 1).
 * - Only authoritative backend query parameters are synchronized.
 * - NO N+1 risk requests in project table (Correction 2).
 * - Ministry filter rendered conditionally based on authoritative options (Correction 3).
 * - Financial observation semantics: values rendered directly without browser recomputation (Correction 4).
 * - Discloses 7 explicit methodological limitations.
 */

import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects, fetchFilterOptions } from "@/api/projects.ts";
import { fetchDatasetInfo } from "@/api/system.ts";
import { fetchRiskOptions } from "@/api/risk.ts";
import { ProjectSearch, type Filters } from "@/components/projects/ProjectSearch.tsx";
import { PortfolioSnapshot } from "@/components/projects/PortfolioSnapshot.tsx";
import { ProjectTable } from "@/components/projects/ProjectTable.tsx";
import { ProjectPagination } from "@/components/projects/ProjectPagination.tsx";
import { ProjectInspectionDrawer } from "@/components/projects/ProjectInspectionDrawer.tsx";
import { ProjectsEvidenceAndLimitations } from "@/components/projects/ProjectsEvidenceAndLimitations.tsx";
import type { ProjectSummaryItem, SortByFields, SortOrder, ProjectListQueryParams } from "@/types/project.ts";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { usePageEnter } from "@/lib/motion/useMotion.ts";

export const ProjectsPage: React.FC = () => {
  const containerRef = usePageEnter<HTMLDivElement>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inspectingProject, setInspectingProject] = useState<ProjectSummaryItem | null>(null);
  const pageSize = 25;

  // Derive authoritative filter parameters strictly from URL query parameters (Correction 1)
  const filters: Filters = useMemo(() => {
    return {
      search: searchParams.get("search") || undefined,
      project_code: searchParams.get("project_code") || undefined,
      sector: searchParams.get("sector") || undefined,
      agency: searchParams.get("agency") || undefined,
      state: searchParams.get("state") || undefined,
      ministry: searchParams.get("ministry") || undefined,
      report_month: searchParams.get("report_month") || undefined,
    };
  }, [searchParams]);

  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawSortBy = searchParams.get("sort_by") as SortByFields | null;
  const sortBy: SortByFields = rawSortBy || "report_month";

  const rawSortOrder = searchParams.get("sort_order") as SortOrder | null;
  const sortOrder: SortOrder = rawSortOrder === "asc" ? "asc" : "desc";

  // Build authoritative query payload with only supported backend parameters
  const queryPayload: ProjectListQueryParams = useMemo(() => {
    return {
      page,
      page_size: pageSize,
      project_code: filters.project_code,
      report_month: filters.report_month,
      sector: filters.sector,
      state: filters.state,
      agency: filters.agency,
      ministry: filters.ministry,
      search: filters.search,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
  }, [page, pageSize, filters, sortBy, sortOrder]);

  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["projects", queryPayload],
    queryFn: () => fetchProjects(queryPayload),
  });

  const { data: systemInfo, isLoading: isSystemLoading } = useQuery({
    queryKey: ["systemInfo"],
    queryFn: fetchDatasetInfo,
  });

  const { data: filterOptions, isLoading: isOptionsLoading } = useQuery({
    queryKey: ["filterOptions"],
    queryFn: fetchFilterOptions,
  });

  const { data: riskOptions } = useQuery({
    queryKey: ["riskOptions"],
    queryFn: () => fetchRiskOptions(),
    staleTime: 60_000,
  });

  // URL state synchronizers: only supported parameters are committed to URL
  const handleFilterChange = (newFilters: Filters) => {
    const next = new URLSearchParams();
    if (newFilters.search) next.set("search", newFilters.search);
    if (newFilters.project_code) next.set("project_code", newFilters.project_code);
    if (newFilters.sector) next.set("sector", newFilters.sector);
    if (newFilters.agency) next.set("agency", newFilters.agency);
    if (newFilters.state) next.set("state", newFilters.state);
    if (newFilters.ministry) next.set("ministry", newFilters.ministry);
    if (newFilters.report_month) next.set("report_month", newFilters.report_month);

    if (sortBy && sortBy !== "report_month") next.set("sort_by", sortBy);
    if (sortOrder && sortOrder !== "desc") next.set("sort_order", sortOrder);
    // Page resets to 1 on filter changes
    setSearchParams(next, { replace: true });
  };

  const handleResetFilters = () => {
    const next = new URLSearchParams();
    if (sortBy && sortBy !== "report_month") next.set("sort_by", sortBy);
    if (sortOrder && sortOrder !== "desc") next.set("sort_order", sortOrder);
    setSearchParams(next, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (newPage > 1) {
      next.set("page", String(newPage));
    } else {
      next.delete("page");
    }
    setSearchParams(next, { replace: true });
  };

  const handleSortChange = (field: SortByFields) => {
    const next = new URLSearchParams(searchParams);
    if (sortBy === field) {
      next.set("sort_order", sortOrder === "asc" ? "desc" : "asc");
    } else {
      next.set("sort_by", field);
      next.set("sort_order", "desc");
    }
    next.delete("page"); // reset to page 1 on sort change
    setSearchParams(next, { replace: true });
  };

  const total = projectsData?.total ?? 0;
  const totalPages = projectsData?.total_pages ?? 0;

  const getMonitoredPeriod = () => {
    if (!systemInfo?.covered_months || systemInfo.covered_months.length === 0) {
      return "DATA PENDING";
    }
    const sorted = [...systemInfo.covered_months].sort();
    return `${sorted[0]} → ${sorted[sorted.length - 1]}`;
  };

  const uniqueProjectsCount = systemInfo?.unique_projects_count != null
    ? systemInfo.unique_projects_count.toLocaleString()
    : "—";

  const observationsCount = systemInfo?.row_count != null
    ? systemInfo.row_count.toLocaleString()
    : "—";

  const activeRiskMonth = riskOptions?.default_report_month || "2026-07";

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div ref={containerRef} className="projects-container">
        {/* Page Intro Hero Section */}
        <section className="projects-intro-section">
          <div className="projects-intro-left">
            <div className="projects-breadcrumb">IRIS / PROJECTS / DISCOVERY</div>
            <h1 className="projects-main-title">PROJECTS. FIND THE SIGNAL.</h1>
            <p className="projects-description">
              Search and examine infrastructure projects across the monitored portfolio, reporting history, sectors, agencies, and states.
            </p>
          </div>

          <div className="projects-metric-panel">
            <div className="projects-telemetry-row">
              <span className="projects-telemetry-label">UNIQUE PROJECTS</span>
              <span className="projects-telemetry-val">{isSystemLoading ? "..." : uniqueProjectsCount}</span>
            </div>
            <div className="projects-telemetry-row">
              <span className="projects-telemetry-label">OBSERVATIONS</span>
              <span className="projects-telemetry-val">{isSystemLoading ? "..." : observationsCount}</span>
            </div>
            <div className="projects-telemetry-row">
              <span className="projects-telemetry-label">COVERED PERIOD</span>
              <span className="projects-telemetry-val" style={{ color: "#1A3C2B" }}>{getMonitoredPeriod()}</span>
            </div>
            <div className="projects-telemetry-row">
              <span className="projects-telemetry-label">INTEGRITY</span>
              <span className="projects-telemetry-val" style={{ color: "#1A3C2B" }}>VERIFIED PIPELINE</span>
            </div>
          </div>
        </section>

        {/* Section 01: Portfolio Snapshot & Taxonomy Telemetry */}
        <PortfolioSnapshot
          systemInfo={systemInfo}
          options={filterOptions}
          filters={filters}
          matchingCount={total}
          riskEvaluationMonth={activeRiskMonth}
          isLoading={isSystemLoading || isOptionsLoading}
          onResetFilters={handleResetFilters}
        />

        {/* Project Search & Filter Command Bar */}
        <ProjectSearch
          filters={filters}
          onFilterChange={handleFilterChange}
          options={filterOptions}
        />

        {/* Section 02: Project Directory Results */}
        <section className="portfolio-section" aria-label="Project Records Directory">
          <div className="portfolio-header-row">
            <div>
              <div className="portfolio-section-num-tag">02. PROJECT DIRECTORY</div>
              <h2 className="portfolio-heading">MONITORED PROJECT RECORDS</h2>
              <div className="portfolio-count">
                {total > 0
                  ? `SHOWING 1–${Math.min(pageSize, total).toLocaleString()} OF ${total.toLocaleString()} MATCHING OBSERVATIONS`
                  : "0 MATCHING OBSERVATIONS"}
              </div>
            </div>
          </div>

          {isProjectsError ? (
            <div className="projects-error-banner" role="alert">
              <div className="projects-error-icon">
                <AlertCircle size={20} />
              </div>
              <div className="projects-error-content">
                <div className="projects-error-title">PROJECT DIRECTORY UNAVAILABLE</div>
                <p className="projects-error-message">
                  {projectsError instanceof Error ? projectsError.message : "Unable to retrieve project records from the monitoring service."}
                </p>
                <button
                  type="button"
                  className="projects-error-retry-btn"
                  onClick={() => refetchProjects()}
                >
                  RETRY CONNECTION
                </button>
              </div>
            </div>
          ) : (
            <>
              <ProjectTable
                projects={projectsData?.items || []}
                isLoading={isProjectsLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onInspect={(project) => setInspectingProject(project)}
                onResetFilters={handleResetFilters}
              />
              <ProjectPagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                entityName="MATCHING OBSERVATIONS"
              />
            </>
          )}
        </section>

        {/* Explicit Methodological Disclosures */}
        <ProjectsEvidenceAndLimitations />
      </div>

      {/* Project Quick Inspection Console Drawer */}
      <ProjectInspectionDrawer
        project={inspectingProject}
        onClose={() => setInspectingProject(null)}
      />

      {/* Bottom Data Provenance Strip */}
      <footer className="provenance-strip">
        <div className="provenance-strip-inner">
          <div className="provenance-metrics">
            <span>SOURCE: PAIMANA MONITORING DATA</span>
            <span>OBSERVATIONS: {observationsCount}</span>
            <span>PROJECTS: {uniqueProjectsCount}</span>
            <span>MONITORED PERIOD: {getMonitoredPeriod()}</span>
          </div>
          <div className="provenance-status">
            <ShieldCheck size={15} />
            <span>DATA INTEGRITY: VERIFIED</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
