import React from "react";
import {
  ProjectsPortfolioSummary,
  type ProjectsPortfolioSummaryProps,
} from "./ProjectsPortfolioSummary.tsx";

export type PortfolioSnapshotProps = ProjectsPortfolioSummaryProps;

export const PortfolioSnapshot: React.FC<PortfolioSnapshotProps> = (props) => {
  return <ProjectsPortfolioSummary {...props} />;
};
