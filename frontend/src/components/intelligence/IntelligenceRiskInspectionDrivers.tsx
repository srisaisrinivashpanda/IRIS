import React from "react";
import { Info, AlertCircle } from "lucide-react";
import type { ProjectRiskHistoryPoint } from "@/types/project.ts";
import type { Contributor } from "@/types/risk.ts";
import { getFeatureMetadata } from "@/utils/featureMetadata.ts";

interface IntelligenceRiskInspectionDriversProps {
  record: ProjectRiskHistoryPoint;
}

export const IntelligenceRiskInspectionDrivers: React.FC<
  IntelligenceRiskInspectionDriversProps
> = ({ record }) => {
  // Check if historical record actually contains driver evidence
  // In the IRIS v1 serving contract, ProjectRiskHistoryPoint does NOT contain drivers.
  const recAny = record as unknown as {
    top_positive_contributors?: Contributor[];
    top_negative_contributors?: Contributor[];
    strongest_drivers?: Contributor[];
    drivers?: {
      top_positive?: Contributor[];
      top_negative?: Contributor[];
      strongest_drivers?: Contributor[];
    };
  };

  const posDrivers =
    recAny.top_positive_contributors || recAny.drivers?.top_positive || [];
  const negDrivers =
    recAny.top_negative_contributors || recAny.drivers?.top_negative || [];
  const strongestDrivers =
    recAny.strongest_drivers ||
    recAny.drivers?.strongest_drivers ||
    [...posDrivers, ...negDrivers].sort(
      (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
    );

  const hasDrivers = strongestDrivers.length > 0;

  if (!hasDrivers) {
    return (
      <div
        className="terminal-card inspection-drivers-card"
        role="region"
        aria-label="Historical Model Driver Evidence"
      >
        <div className="terminal-card-header">
          <div className="terminal-card-title-lockup">
            <span className="terminal-section-eyebrow">MARGIN DECOMPOSITION</span>
            <h4 className="terminal-card-title">HISTORICAL MODEL DRIVER EVIDENCE</h4>
          </div>
          <span className="terminal-badge-muted monospace">0 DRIVERS STORED</span>
        </div>

        <div className="inspection-drivers-unavailable">
          <div className="inspection-drivers-unavailable-header">
            <AlertCircle size={16} className="text-stone-500" aria-hidden="true" />
            <span className="font-bold monospace text-xs">
              HISTORICAL DRIVER EVIDENCE NOT AVAILABLE IN CURRENT SERVING CONTRACT
            </span>
          </div>
          <p className="inspection-drivers-unavailable-text">
            The current serving contract provides contribution evidence for the current assessment, but not for this historical evaluation.
          </p>
          <div className="inspection-drivers-unavailable-footnote monospace text-xs">
            Temporal integrity guarantee: Current assessment drivers are never backfilled into historical evaluations to prevent retrospective misattribution.
          </div>
        </div>
      </div>
    );
  }

  // Case A: Historical driver evidence actually present on this record
  return (
    <div
      className="terminal-card inspection-drivers-card"
      role="region"
      aria-label="Historical Model Driver Evidence"
    >
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">MARGIN DECOMPOSITION</span>
          <h4 className="terminal-card-title">HISTORICAL MODEL DRIVER EVIDENCE</h4>
        </div>
        <span className="terminal-badge monospace">
          {strongestDrivers.length} CONTRIBUTIONS
        </span>
      </div>

      <p className="terminal-section-sub">
        Historical model contributions observed in evaluation month {record.report_month}.
        Signed contributions describe model decision shifts, not causal real-world mechanisms.
      </p>

      <div className="terminal-driver-list">
        {strongestDrivers.map((driver) => {
          const meta = getFeatureMetadata(driver.feature, driver.display_name);
          const isPositive = driver.contribution > 0;
          const directionText = isPositive
            ? "RISK-INCREASING (+)"
            : "RISK-REDUCING (-)";

          return (
            <div
              key={`${record.report_month}-${driver.feature}`}
              className={`terminal-driver-item ${isPositive ? "risk-up" : "risk-down"}`}
            >
              <div className="driver-item-main">
                <div className="driver-item-header">
                  <span className="driver-feature-name">{meta.displayName}</span>
                  <span
                    className={`driver-direction-tag monospace ${
                      isPositive ? "up" : "down"
                    }`}
                  >
                    {directionText}
                  </span>
                </div>
                <div className="driver-item-meta monospace text-xs">
                  <span>FEATURE: {driver.feature}</span>
                  {driver.value !== undefined && driver.value !== null && (
                    <span>VALUE: {String(driver.value)} {meta.unit || ""}</span>
                  )}
                  <span>RANK: #{driver.rank}</span>
                </div>
              </div>

              <div className="driver-contribution-score monospace font-bold">
                {driver.contribution > 0 ? `+${driver.contribution.toFixed(3)}` : driver.contribution.toFixed(3)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="terminal-card-footnote">
        <Info size={12} aria-hidden="true" />
        <span>
          Historical model contributions reflect margin shifts in model logit space; they do not establish causal relationships or intervention effects.
        </span>
      </div>
    </div>
  );
};
