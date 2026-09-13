import React from "react";

export interface IntelligenceRiskProbabilityScaleProps {
  probability: number;
  rawProbability?: number | null;
  calibrationActive?: boolean;
  ariaLabel?: string;
}

export const IntelligenceRiskProbabilityScale: React.FC<IntelligenceRiskProbabilityScaleProps> = ({
  probability,
  rawProbability,
  calibrationActive = false,
  ariaLabel = "Operational schedule risk probability",
}) => {
  const clampedProb = Math.min(100, Math.max(0, probability * 100));
  const probPercent = clampedProb.toFixed(1);

  const clampedRaw =
    rawProbability !== null && rawProbability !== undefined
      ? Math.min(100, Math.max(0, rawProbability * 100))
      : null;
  const rawPercent = clampedRaw !== null ? clampedRaw.toFixed(1) : null;

  return (
    <div
      className="terminal-prob-scale-container"
      role="meter"
      aria-valuenow={Number(probPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${ariaLabel}: ${probPercent}%`}
    >
      <div className="terminal-prob-scale-header">
        <span className="terminal-prob-scale-title">RISK PROBABILITY SCALE</span>
        <div className="terminal-prob-scale-values monospace">
          <span className="terminal-prob-scale-current">{probPercent}%</span>
          {calibrationActive && rawPercent !== null && (
            <span className="terminal-prob-scale-raw">(RAW: {rawPercent}%)</span>
          )}
        </div>
      </div>

      {/* Analytical Track */}
      <div className="terminal-prob-scale-track-wrap">
        <div className="terminal-prob-scale-track">
          {/* Fill up to operational probability */}
          <div
            className="terminal-prob-scale-fill"
            style={{ width: `${clampedProb}%` }}
          />

          {/* Operational Probability Marker */}
          <div
            className="terminal-prob-scale-marker operational"
            style={{ left: `${clampedProb}%` }}
            title={`Operational Risk: ${probPercent}%`}
          >
            <div className="terminal-marker-pin" />
            <span className="terminal-marker-tooltip monospace">{probPercent}%</span>
          </div>

          {/* Raw Probability Marker (Only when calibration is active and raw is provided) */}
          {calibrationActive && clampedRaw !== null && (
            <div
              className="terminal-prob-scale-marker raw"
              style={{ left: `${clampedRaw}%` }}
              title={`Raw Model Score: ${rawPercent}%`}
            >
              <div className="terminal-marker-pin-raw" />
            </div>
          )}
        </div>

        {/* Axis Ticks without subjective categories */}
        <div className="terminal-prob-scale-ticks monospace" aria-hidden="true">
          <span className="scale-tick start">0%</span>
          <span className="scale-tick mid-low">25%</span>
          <span className="scale-tick mid">50%</span>
          <span className="scale-tick mid-high">75%</span>
          <span className="scale-tick end">100%</span>
        </div>
      </div>

      {/* Subtext explaining operational vs raw strictly if calibrated */}
      {calibrationActive && rawPercent !== null && (
        <div className="terminal-prob-scale-subtext monospace">
          Solid marker reflects calibrated operational probability; dashed marker indicates raw model logit score ({rawPercent}%).
        </div>
      )}
    </div>
  );
};
