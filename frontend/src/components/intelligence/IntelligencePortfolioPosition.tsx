import React from "react";

export interface IntelligencePortfolioPositionProps {
  rank: number | null | undefined;
  populationSize: number | null | undefined;
  percentile: number | null | undefined;
}

export const IntelligencePortfolioPosition: React.FC<IntelligencePortfolioPositionProps> = ({
  rank,
  populationSize,
  percentile,
}) => {
  const hasRank = rank !== null && rank !== undefined;
  const hasPop = populationSize !== null && populationSize !== undefined && populationSize > 0;
  const hasPercentile = percentile !== null && percentile !== undefined;

  if (!hasRank || !hasPop || !hasPercentile) {
    return (
      <div className="terminal-portfolio-pos-container unavailable">
        <div className="terminal-portfolio-pos-header">
          <span className="terminal-portfolio-pos-title">PORTFOLIO POSITION</span>
          <span className="terminal-portfolio-badge unavailable monospace">UNAVAILABLE</span>
        </div>
        <p className="terminal-portfolio-unavailable-text monospace">
          Portfolio distribution metrics are unavailable for this project assessment.
        </p>
      </div>
    );
  }

  const clampedPercentile = Math.min(100, Math.max(0, percentile * 100));
  const percentileDisplay = clampedPercentile.toFixed(1);

  return (
    <div
      className="terminal-portfolio-pos-container"
      role="region"
      aria-label={`Portfolio position: Rank #${rank} of ${populationSize.toLocaleString()}, Percentile P${percentileDisplay}`}
    >
      <div className="terminal-portfolio-pos-header">
        <span className="terminal-portfolio-pos-title">PORTFOLIO POSITION</span>
        <div className="terminal-portfolio-pos-summary monospace">
          <span className="terminal-portfolio-rank">#{rank}</span>
          <span className="terminal-portfolio-pop">/ {populationSize.toLocaleString()}</span>
          <span className="terminal-portfolio-percentile-tag">P{percentileDisplay}</span>
        </div>
      </div>

      {/* Analytical Percentile Track */}
      <div className="terminal-portfolio-track-wrap">
        <div className="terminal-portfolio-track">
          <div
            className="terminal-portfolio-fill"
            style={{ width: `${clampedPercentile}%` }}
          />
          <div
            className="terminal-portfolio-marker"
            style={{ left: `${clampedPercentile}%` }}
            title={`Percentile: P${percentileDisplay} (Rank #${rank} of ${populationSize})`}
          >
            <div className="terminal-portfolio-pin" />
            <span className="terminal-portfolio-marker-val monospace">P{percentileDisplay}</span>
          </div>
        </div>

        <div className="terminal-portfolio-ticks monospace" aria-hidden="true">
          <span className="portfolio-tick start">P0.0</span>
          <span className="portfolio-tick mid">P50.0 (Median)</span>
          <span className="portfolio-tick end">P100.0</span>
        </div>
      </div>

      <div className="terminal-portfolio-meta monospace">
        <span>RELATIVE POSITION: RANK #{rank} ACROSS {populationSize.toLocaleString()} MONITORED PROJECTS</span>
      </div>
    </div>
  );
};
