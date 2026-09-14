import React from "react";
import {
  DashboardInvestigationQueue,
  type DashboardInvestigationQueueProps,
} from "./DashboardInvestigationQueue.tsx";

/**
 * DashboardAttentionPanel acts as a backwards-compatible wrapper around
 * DashboardInvestigationQueue, guaranteeing that existing tests and imports
 * continue to function while maintaining a single authoritative queue implementation.
 */
export const DashboardAttentionPanel: React.FC<DashboardInvestigationQueueProps> = (props) => {
  return <DashboardInvestigationQueue {...props} />;
};

export default DashboardAttentionPanel;
