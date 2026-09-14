/**
 * Projects Investigation Table (PR-14)
 * Complete, accessible table for portfolio exploration with sorting, authentic financials,
 * truthful non-imputed progress, and direct navigation links.
 * 
 * Strict Governance:
 * - NO N+1 risk requests (Correction 2): table does not fetch risk per row.
 * - Direct row actions: INSPECT (drawer), DETAILS (/projects/{code}), RISK INTEL (/intelligence?project={code}).
 * - Financials rendered directly from backend without browser recomputation (Correction 4).
 * - Nulls render as "—", never 0 or 0%.
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ProjectSummaryItem, SortByFields, SortOrder } from "@/types/project.ts";
import { ArrowUpRight, Eye, ChevronUp, ChevronDown, ChevronsUpDown, Shield } from "lucide-react";
import { useStaggerList } from "@/lib/motion/useMotion.ts";

export interface ProjectsInvestigationTableProps {
  projects: ProjectSummaryItem[];
  isLoading?: boolean;
  sortBy?: SortByFields;
  sortOrder?: SortOrder;
  onSortChange?: (field: SortByFields) => void;
  onInspect?: (project: ProjectSummaryItem) => void;
  onResetFilters?: () => void;
}

interface ColumnConfig {
  key: string;
  label: string;
  sortField?: SortByFields;
  width?: string;
  align?: "left" | "right" | "center";
}

const COLUMNS: ColumnConfig[] = [
  { key: "project_name", label: "PROJECT", sortField: "project_name", width: "22%", align: "left" },
  { key: "project_code", label: "PROJECT CODE", sortField: "project_code", width: "10%", align: "left" },
  { key: "sector", label: "SECTOR", width: "10%", align: "left" },
  { key: "agency", label: "AGENCY", width: "9%", align: "left" },
  { key: "state", label: "STATE / REGION", width: "9%", align: "left" },
  { key: "report_month", label: "LATEST REPORT", sortField: "report_month", width: "8%", align: "center" },
  { key: "original_cost", label: "ORIGINAL COST", sortField: "original_cost", width: "8%", align: "right" },
  { key: "revised_cost", label: "REVISED COST", sortField: "revised_cost", width: "8%", align: "right" },
  { key: "cumulative_expenditure", label: "EXPENDITURE", sortField: "cumulative_expenditure", width: "8%", align: "right" },
  { key: "physical_progress", label: "PHYSICAL PROGRESS", sortField: "physical_progress", width: "10%", align: "left" },
  { key: "actions", label: "ACTIONS", width: "8%", align: "center" },
];

export const ProjectsInvestigationTable: React.FC<ProjectsInvestigationTableProps> = ({
  projects,
  isLoading = false,
  sortBy,
  sortOrder = "desc",
  onSortChange,
  onInspect,
  onResetFilters,
}) => {
  const navigate = useNavigate();
  const tbodyRef = useStaggerList<HTMLTableSectionElement>(projects, "tr.project-row");

  const handleHeaderClick = (field?: SortByFields) => {
    if (!field || !onSortChange) return;
    onSortChange(field);
  };

  const getSortAria = (field?: SortByFields): "ascending" | "descending" | "none" => {
    if (!field || sortBy !== field) return "none";
    return sortOrder === "asc" ? "ascending" : "descending";
  };

  if (isLoading) {
    return (
      <div className="table-wrapper" aria-label="Loading Projects">
        <table className="projects-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} style={{ width: col.width, textAlign: col.align }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} className="project-table-skeleton-row">
                <td>
                  <div className="skeleton-bar" style={{ width: "75%", height: "14px", marginBottom: "6px" }} />
                  <div className="skeleton-bar" style={{ width: "45%", height: "10px" }} />
                </td>
                <td><div className="skeleton-bar" style={{ width: "65px", height: "12px" }} /></td>
                <td><div className="skeleton-bar" style={{ width: "80px", height: "12px" }} /></td>
                <td><div className="skeleton-bar" style={{ width: "70px", height: "12px" }} /></td>
                <td><div className="skeleton-bar" style={{ width: "50px", height: "12px" }} /></td>
                <td><div className="skeleton-bar" style={{ width: "60px", height: "12px" }} /></td>
                <td><div className="skeleton-bar" style={{ width: "60px", height: "12px", marginLeft: "auto" }} /></td>
                <td><div className="skeleton-bar" style={{ width: "60px", height: "12px", marginLeft: "auto" }} /></td>
                <td><div className="skeleton-bar" style={{ width: "60px", height: "12px", marginLeft: "auto" }} /></td>
                <td><div className="skeleton-bar" style={{ width: "100%", height: "10px" }} /></td>
                <td><div className="skeleton-bar" style={{ width: "50px", height: "12px", margin: "0 auto" }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-wrapper" aria-label="Project Records Table">
      <table className="projects-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const isSortable = Boolean(col.sortField && onSortChange);
              const isCurrentSort = col.sortField && sortBy === col.sortField;

              return (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align }}
                  aria-sort={isSortable ? getSortAria(col.sortField) : undefined}
                  className={isSortable ? "sortable-th" : undefined}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      className="sortable-header-btn"
                      onClick={() => handleHeaderClick(col.sortField)}
                      aria-label={`Sort by ${col.label}, currently ${isCurrentSort ? sortOrder : "unsorted"}`}
                    >
                      <span>{col.label}</span>
                      <span className="sort-icon-indicator" aria-hidden="true">
                        {isCurrentSort ? (
                          sortOrder === "asc" ? (
                            <ChevronUp size={13} />
                          ) : (
                            <ChevronDown size={13} />
                          )
                        ) : (
                          <ChevronsUpDown size={12} className="sort-inactive" />
                        )}
                      </span>
                    </button>
                  ) : (
                    <span>{col.label}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {projects.map((project) => {
            const encodedCode = encodeURIComponent(project.project_code);
            const progress = project.physical_progress;
            const progressVal = progress != null ? Math.max(0, Math.min(100, progress)) : null;

            return (
              <tr
                key={project.id ? `project-${project.id}` : `${project.project_code}-${project.report_month}`}
                className="project-row"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    navigate(`/projects/${encodedCode}`);
                  }
                }}
              >
                {/* Project Name Cell */}
                <td className="col-project-name">
                  <div className="project-name-cell-wrapper">
                    <Link
                      to={`/projects/${encodedCode}`}
                      className="project-name-link"
                      title={project.project_name || project.project_code}
                    >
                      {project.project_name || "—"}
                    </Link>
                    <div className="project-sub-meta">
                      {project.agency && <span>{project.agency}</span>}
                      {project.ministry && <span>• {project.ministry}</span>}
                    </div>
                  </div>
                </td>

                {/* Project Code */}
                <td className="col-project-code">
                  <Link
                    to={`/projects/${encodedCode}`}
                    className="project-code-link"
                  >
                    {project.project_code}
                  </Link>
                </td>

                {/* Sector */}
                <td className="col-sector">{project.sector || "—"}</td>

                {/* Agency */}
                <td className="col-agency">{project.agency || "—"}</td>

                {/* State */}
                <td className="col-state">{project.state || "—"}</td>

                {/* Report Month */}
                <td className="col-report" style={{ textAlign: "center" }}>
                  <span className="report-month-badge">
                    {project.report_month || "DATA PENDING"}
                  </span>
                </td>

                {/* Original Cost */}
                <td className="col-cost font-mono" style={{ textAlign: "right" }}>
                  {project.original_cost != null ? `₹${project.original_cost.toLocaleString()} Cr` : "—"}
                </td>

                {/* Revised Cost */}
                <td className="col-cost font-mono" style={{ textAlign: "right" }}>
                  {project.revised_cost != null ? `₹${project.revised_cost.toLocaleString()} Cr` : "—"}
                </td>

                {/* Cumulative Expenditure */}
                <td className="col-expenditure font-mono" style={{ textAlign: "right" }}>
                  {project.cumulative_expenditure != null ? `₹${project.cumulative_expenditure.toLocaleString()} Cr` : "—"}
                </td>

                {/* Physical Progress */}
                <td className="col-progress">
                  <div className="progress-cell-container">
                    <div className="progress-metrics-row">
                      <span className="progress-value-text font-mono">
                        {progress != null ? `${progress}%` : "—"}
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    {progressVal !== null ? (
                      <div
                        className="progress-bar-track"
                        role="progressbar"
                        aria-valuenow={progressVal}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Physical progress ${progress} percent`}
                      >
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${progressVal}%` }}
                        />
                      </div>
                    ) : (
                      <div className="progress-bar-track progress-bar-empty" />
                    )}
                  </div>
                </td>

                {/* Actions Column: Quick Inspect, Project Detail, Risk Intelligence */}
                <td className="col-actions" style={{ textAlign: "center" }}>
                  <div className="table-actions-container">
                    {onInspect && (
                      <button
                        type="button"
                        className="project-row-inspect-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspect(project);
                        }}
                        aria-label={`Inspect ${project.project_name || project.project_code}`}
                        title="Open Quick Inspection Drawer"
                      >
                        <Eye size={12} />
                        <span>INSPECT</span>
                      </button>
                    )}
                    <Link
                      to={`/projects/${encodedCode}`}
                      className="project-row-action-link"
                      aria-label={`View details for ${project.project_code}`}
                      title="View Full Longitudinal Project"
                    >
                      <ArrowUpRight size={13} />
                    </Link>
                    <Link
                      to={`/intelligence?project=${encodedCode}`}
                      className="project-row-action-link risk-intel-link"
                      aria-label={`Risk intelligence for ${project.project_code}`}
                      title="Investigate in Intelligence Terminal"
                    >
                      <Shield size={13} />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}

          {projects.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length}>
                <div className="empty-projects-container">
                  <div className="empty-projects-title">NO PROJECTS FOUND MATCHING CURRENT QUERY</div>
                  <p className="empty-projects-subtitle">
                    No infrastructure records match your active search terms or taxonomy filters.
                  </p>
                  {onResetFilters && (
                    <button
                      type="button"
                      className="empty-projects-reset-btn"
                      onClick={onResetFilters}
                    >
                      RESET SEARCH & CLEAR ALL FILTERS
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
