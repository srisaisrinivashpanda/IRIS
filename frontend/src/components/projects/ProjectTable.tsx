import React from "react";
import {
  ProjectsInvestigationTable,
  type ProjectsInvestigationTableProps,
} from "./ProjectsInvestigationTable.tsx";

export type ProjectTableProps = ProjectsInvestigationTableProps;

export const ProjectTable: React.FC<ProjectTableProps> = (props) => {
  return <ProjectsInvestigationTable {...props} />;
};
