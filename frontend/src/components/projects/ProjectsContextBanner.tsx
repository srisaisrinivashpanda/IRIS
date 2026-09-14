/**
 * Projects Context Banner Component (PR-15)
 * 
 * Displays truthful investigation context when the Projects workspace is opened
 * from an Analytics investigation action.
 * 
 * Strict Governance & Truthfulness:
 * - Clarifies that the population shown is the compatible project population under
 *   the supported Projects filter contract (never claiming identical KPI denominator).
 * - Explicitly lists transferred filters and omitted/incompatible dimensions (e.g. time range, regime).
 * - Provides keyboard-accessible return path to the originating Analytics workspace.
 * - Respects institutional visual styling without alarmist warning styles.
 */

import React, { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, Compass, Info, X } from "lucide-react";
import type { AnalyticsInvestigationContext } from "@/utils/analyticsProjectNavigation.ts";

export interface ProjectsContextBannerProps {
  onDismiss?: () => void;
}

export const ProjectsContextBanner: React.FC<ProjectsContextBannerProps> = ({ onDismiss }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if opened from Analytics either via React Router location.state or URL parameter
  const navState = location.state as AnalyticsInvestigationContext | undefined;
  const isFromAnalyticsState = navState?.source === "analytics";
  const isFromAnalyticsQuery = searchParams.get("source") === "analytics" || searchParams.get("from") === "analytics";

  if (isDismissed || (!isFromAnalyticsState && !isFromAnalyticsQuery)) {
    return null;
  }

  // Derive transferred filters and omitted filters from state or fallback to query params
  const transferredFilters: Record<string, string> = navState?.transferredFilters
    ? (navState.transferredFilters as Record<string, string>)
    : (() => {
        const derived: Record<string, string> = {};
        const supported = ["sector", "agency", "state", "ministry", "project_code", "report_month"];
        supported.forEach((key) => {
          const val = searchParams.get(key);
          if (val) derived[key] = val;
        });
        return derived;
      })();

  const omittedFilters = navState?.omittedFilters || {};
  const returnUrl = navState?.analyticsUrl || "/analytics";

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  const hasTransferred = Object.keys(transferredFilters).length > 0;
  const hasTimeRangeOmitted = Boolean(omittedFilters.timeRange);
  const hasRegimeOmitted = Boolean(omittedFilters.regime);

  return (
    <aside
      className="projects-context-banner"
      role="region"
      aria-label="Analytics Investigation Context"
      data-testid="projects-context-banner"
    >
      <div className="projects-context-header">
        <div className="projects-context-title-group">
          <Compass size={16} className="projects-context-icon" aria-hidden="true" />
          <span className="projects-context-eyebrow font-mono">INVESTIGATION CONTEXT</span>
          <span className="projects-context-source-badge font-mono">OPENED FROM ANALYTICS</span>
        </div>

        <div className="projects-context-actions">
          <Link
            to={returnUrl}
            className="projects-context-back-btn"
            data-testid="back-to-analytics-btn"
            title="Return to originating Analytics workspace and restore filter state"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span>BACK TO ANALYTICS</span>
          </Link>
          <button
            type="button"
            className="projects-context-dismiss-btn"
            onClick={handleDismiss}
            aria-label="Dismiss investigation context banner"
            title="Dismiss context banner"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="projects-context-body">
        <div className="projects-context-summary-line">
          Projects view reflects the <strong>compatible project population under the supported Projects filter contract</strong>.
        </div>

        {/* Transferred Filters Strip */}
        <div className="projects-context-transferred-strip" data-testid="transferred-filters-strip">
          <span className="projects-context-strip-label font-mono">TRANSFERRED FILTERS:</span>
          {hasTransferred ? (
            <div className="projects-context-pills">
              {Object.entries(transferredFilters).map(([key, val]) => (
                <span key={key} className="projects-context-pill font-mono" data-testid={`transferred-pill-${key}`}>
                  <strong>{key.toUpperCase()}:</strong> {val}
                </span>
              ))}
            </div>
          ) : (
            <span className="projects-context-empty-hint text-muted font-mono">
              All portfolio projects (unfiltered)
            </span>
          )}
        </div>

        {/* Omitted / Incompatible Scopes Disclosure */}
        {(hasTimeRangeOmitted || hasRegimeOmitted) && (
          <div className="projects-context-omitted-notice" data-testid="omitted-filters-notice">
            <Info size={13} className="projects-context-info-icon" aria-hidden="true" />
            <div className="projects-context-omitted-text">
              {hasTimeRangeOmitted && (
                <div data-testid="omitted-time-range-text">
                  <strong>Time range ({omittedFilters.timeRange}):</strong> was not collapsed into a single project month. Projects view reflects observations across all reporting months matching the transferable filters.
                </div>
              )}
              {hasRegimeOmitted && (
                <div data-testid="omitted-regime-text">
                  <strong>Risk regime ({String(omittedFilters.regime)}):</strong> was excluded from query scope. The Projects API filters project observations and cannot restrict results by model regime.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
