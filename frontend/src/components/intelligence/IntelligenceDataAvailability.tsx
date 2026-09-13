import React from "react";
import type { ProjectDataAvailability } from "@/types/project.ts";

interface IntelligenceDataAvailabilityProps {
  availability?: ProjectDataAvailability;
}

export const IntelligenceDataAvailability: React.FC<IntelligenceDataAvailabilityProps> = ({
  availability,
}) => {
  const scheduleRiskServed = Boolean(availability?.has_risk_assessment);
  const costRiskServed = Boolean(availability?.cost_risk_ml_served);
  const progressStagnationServed = Boolean(availability?.progress_stagnation_ml_served);

  return (
    <div className="terminal-card">
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">ML SERVING SYSTEM AUDIT</span>
          <h3 className="terminal-card-title">DATA AVAILABILITY & UNSERVED DOMAINS</h3>
        </div>
      </div>

      <div className="terminal-availability-grid">
        {/* Schedule Risk Domain */}
        <div className="terminal-availability-cell">
          <div className="availability-domain-header">
            <span className="availability-domain-title">Schedule Extension Risk</span>
            <span
              className={`availability-status-pill ${
                scheduleRiskServed ? "served" : "unassessed"
              }`}
            >
              {scheduleRiskServed ? "SERVED" : "NOT ASSESSED"}
            </span>
          </div>
          <p className="availability-domain-desc">
            Production model evaluating operational schedule risk with signed feature contributions.
          </p>
        </div>

        {/* Cost Overrun Domain */}
        <div className="terminal-availability-cell">
          <div className="availability-domain-header">
            <span className="availability-domain-title">Cost Overrun Risk</span>
            <span
              className={`availability-status-pill ${
                costRiskServed ? "served" : "pending"
              }`}
            >
              {costRiskServed ? "SERVED" : "DATA PENDING"}
            </span>
          </div>
          <p className="availability-domain-desc">
            Target specification formulated in model governance, but no machine learning model is trained or served.
          </p>
        </div>

        {/* Progress Stagnation Domain */}
        <div className="terminal-availability-cell">
          <div className="availability-domain-header">
            <span className="availability-domain-title">Progress Stagnation Risk</span>
            <span
              className={`availability-status-pill ${
                progressStagnationServed ? "served" : "pending"
              }`}
            >
              {progressStagnationServed ? "SERVED" : "DATA PENDING"}
            </span>
          </div>
          <p className="availability-domain-desc">
            Physical progress flatlining model specification exists; production deployment remains unserved.
          </p>
        </div>
      </div>

      <div className="terminal-card-footnote">
        Only schedule extension risk is served in production. Cost overrun and progress stagnation ML models are not deployed.
      </div>
    </div>
  );
};
