/**
 * Analytics Investigation Action Component (PR-15)
 * 
 * Reusable, accessible navigation control transitioning from aggregate Analytics
 * evidence to the compatible project population in the Projects workspace.
 * 
 * Accessibility & Truthfulness:
 * - Semantic <Link> with React Router state carrying investigation context.
 * - Keyboard accessible with clear focus ring.
 * - Meaningful accessible name via aria-label.
 * - Truthful wording ("INVESTIGATE PROJECTS", "VIEW PROJECT POPULATION").
 */

import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { AnalyticsInvestigationContext } from "@/utils/analyticsProjectNavigation.ts";

export interface AnalyticsInvestigationActionProps {
  url: string;
  context?: AnalyticsInvestigationContext;
  label?: string;
  ariaLabel?: string;
  title?: string;
  variant?: "table-btn" | "pill-btn" | "card-link" | "inline";
  dataTestId?: string;
}

export const AnalyticsInvestigationAction: React.FC<AnalyticsInvestigationActionProps> = ({
  url,
  context,
  label = "INVESTIGATE PROJECTS",
  ariaLabel,
  title,
  variant = "table-btn",
  dataTestId = "analytics-investigate-projects-btn",
}) => {
  const classNameMap = {
    "table-btn": "analytics-investigate-btn",
    "pill-btn": "analytics-investigate-pill",
    "card-link": "analytics-investigate-card-link",
    "inline": "analytics-investigate-inline",
  };

  const appliedClass = classNameMap[variant] || "analytics-investigate-btn";

  return (
    <Link
      to={url}
      state={context}
      className={appliedClass}
      aria-label={ariaLabel || label}
      title={title || label}
      data-testid={dataTestId}
    >
      <span>{label}</span>
      <ArrowUpRight size={12} className="analytics-investigate-icon" aria-hidden="true" />
    </Link>
  );
};
