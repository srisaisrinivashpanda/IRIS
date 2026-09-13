import React, { useState, useMemo } from "react";
import type { ProjectRiskDrivers } from "@/types/project.ts";
import type { Contributor } from "@/types/risk.ts";
import { IrisSignedDriversChart } from "@/components/common/charts/IrisSignedDriversChart.tsx";
import { getFeatureMetadata } from "@/utils/featureMetadata.ts";
import { Table, BarChart2 } from "lucide-react";

interface IntelligenceDriverDetailProps {
  drivers: ProjectRiskDrivers;
}

type DirectionFilter = "ALL" | "POSITIVE" | "NEGATIVE";
type SortOption = "MODEL_ORDER" | "MAGNITUDE_DESC";
type ViewMode = "CHART" | "TABLE";

export const IntelligenceDriverDetail: React.FC<IntelligenceDriverDetailProps> = ({ drivers }) => {
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("MODEL_ORDER");
  const [viewMode, setViewMode] = useState<ViewMode>("CHART");

  const topPositive = drivers.top_positive ?? [];
  const topNegative = drivers.top_negative ?? [];
  const strongestDrivers = drivers.strongest_drivers ?? [];

  const hasDrivers =
    topPositive.length > 0 ||
    topNegative.length > 0 ||
    strongestDrivers.length > 0;

  // Derive initial list preserving backend authoritative model ordering
  const backendOrderedDrivers = useMemo<Contributor[]>(() => {
    if (strongestDrivers.length > 0) {
      return strongestDrivers;
    }
    return [...topPositive, ...topNegative];
  }, [strongestDrivers, topPositive, topNegative]);

  // Filtered and sorted display list without mutating source data
  const displayedDrivers = useMemo<Contributor[]>(() => {
    let list = [...backendOrderedDrivers];

    if (directionFilter === "POSITIVE") {
      list = list.filter((d) => d.contribution > 0 || d.direction === "POSITIVE");
    } else if (directionFilter === "NEGATIVE") {
      list = list.filter((d) => d.contribution < 0 || d.direction === "NEGATIVE");
    }

    if (sortOption === "MAGNITUDE_DESC") {
      list.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
    }

    return list;
  }, [backendOrderedDrivers, directionFilter, sortOption]);

  if (!hasDrivers) {
    return (
      <div className="terminal-card" role="region" aria-label="Driver Detail Empty">
        <div className="terminal-card-header">
          <div className="terminal-card-title-lockup">
            <span className="terminal-section-eyebrow">CONTRIBUTION DECOMPOSITION</span>
            <h3 className="terminal-card-title">DRIVER DETAIL & DECOMPOSITION</h3>
          </div>
          <span className="terminal-badge-muted monospace">0 DRIVERS</span>
        </div>
        <div className="terminal-empty-text monospace">
          NO MODEL DRIVER EVIDENCE AVAILABLE
        </div>
      </div>
    );
  }

  const posCount = topPositive.length;
  const negCount = topNegative.length;
  const chartHeight = Math.max(200, (posCount + negCount) * 36 + 56);

  return (
    <div className="terminal-card" role="region" aria-label="Signed Driver Detail and Decomposition">
      {/* Header and View Mode Toggle */}
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">CONTRIBUTION DECOMPOSITION</span>
          <h3 className="terminal-card-title">DRIVER DETAIL & MARGIN ANALYSIS</h3>
        </div>

        <div className="terminal-actions-group">
          <span className="terminal-badge-muted monospace">RAW MARGIN LOGIT SPACE</span>

          {/* View Mode Toggle */}
          <div className="terminal-view-toggle" role="group" aria-label="Visualization Mode">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "CHART" ? "active" : ""}`}
              onClick={() => setViewMode("CHART")}
              aria-pressed={viewMode === "CHART"}
              title="Diverging Chart View"
            >
              <BarChart2 size={13} aria-hidden="true" />
              <span>CHART & LIST</span>
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "TABLE" ? "active" : ""}`}
              onClick={() => setViewMode("TABLE")}
              aria-pressed={viewMode === "TABLE"}
              title="Accessible Table View"
            >
              <Table size={13} aria-hidden="true" />
              <span>ACCESSIBLE TABLE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar: Direction Filter & Sorting */}
      <div className="terminal-filter-toolbar" role="toolbar" aria-label="Driver Filter and Sort Controls">
        <div className="filter-group" role="group" aria-label="Filter by Direction">
          <span className="filter-label monospace">DIRECTION:</span>
          <button
            type="button"
            className={`terminal-tab-pill ${directionFilter === "ALL" ? "active" : ""}`}
            onClick={() => setDirectionFilter("ALL")}
            aria-pressed={directionFilter === "ALL"}
          >
            All ({backendOrderedDrivers.length})
          </button>
          <button
            type="button"
            className={`terminal-tab-pill pos ${directionFilter === "POSITIVE" ? "active" : ""}`}
            onClick={() => setDirectionFilter("POSITIVE")}
            aria-pressed={directionFilter === "POSITIVE"}
          >
            ▲ Risk-Increasing ({posCount})
          </button>
          <button
            type="button"
            className={`terminal-tab-pill neg ${directionFilter === "NEGATIVE" ? "active" : ""}`}
            onClick={() => setDirectionFilter("NEGATIVE")}
            aria-pressed={directionFilter === "NEGATIVE"}
          >
            ▼ Risk-Reducing ({negCount})
          </button>
        </div>

        <div className="filter-group sort-group" role="group" aria-label="Sort Order">
          <span className="filter-label monospace">ORDER:</span>
          <button
            type="button"
            className={`terminal-tab-pill ${sortOption === "MODEL_ORDER" ? "active" : ""}`}
            onClick={() => setSortOption("MODEL_ORDER")}
            aria-pressed={sortOption === "MODEL_ORDER"}
          >
            Model Order (Default)
          </button>
          <button
            type="button"
            className={`terminal-tab-pill ${sortOption === "MAGNITUDE_DESC" ? "active" : ""}`}
            onClick={() => setSortOption("MAGNITUDE_DESC")}
            aria-pressed={sortOption === "MAGNITUDE_DESC"}
          >
            Magnitude (|Δ|)
          </button>
        </div>
      </div>

      {/* View Mode 1: Chart & Detailed Cards */}
      {viewMode === "CHART" ? (
        <>
          {/* Diverging Bar Chart Representation */}
          <div className="terminal-driver-chart-wrapper">
            <div className="terminal-driver-axis-guide monospace">
              <span className="driver-guide-neg">◀ RISK-REDUCING (- MARGIN LOGIT)</span>
              <span className="driver-guide-zero">0.0 BASELINE</span>
              <span className="driver-guide-pos">RISK-INCREASING (+ MARGIN LOGIT) ▶</span>
            </div>

            <IrisSignedDriversChart
              positiveContributors={
                directionFilter === "NEGATIVE" ? [] : topPositive
              }
              negativeContributors={
                directionFilter === "POSITIVE" ? [] : topNegative
              }
              height={chartHeight}
            />
          </div>

          {/* Detailed Contribution Breakdown List */}
          <div className="terminal-driver-detail-cards-wrap" role="feed" aria-label="Driver Contribution Cards">
            {displayedDrivers.map((driver, idx) => {
              const meta = getFeatureMetadata(driver.feature, driver.display_name);
              const isPositive = driver.contribution >= 0;
              const signPrefix = isPositive ? "+" : "";
              const formattedContribution = `${signPrefix}${driver.contribution.toFixed(3)}`;
              const directionLabel = isPositive ? "risk-increasing" : "risk-reducing";
              const magnitudeVal = Math.abs(driver.contribution).toFixed(3);

              return (
                <article
                  key={`driver-detail-${driver.feature}-${idx}`}
                  className={`terminal-driver-card ${isPositive ? "increasing" : "reducing"}`}
                  aria-label={`${meta.displayName}, margin contribution ${formattedContribution}, ${directionLabel}`}
                >
                  <div className="driver-card-header-line">
                    <div className="driver-card-title-wrap">
                      <span className="driver-rank-badge monospace">#{driver.rank ?? idx + 1}</span>
                      <h4 className="driver-card-name">{meta.displayName}</h4>
                      <span className="driver-family-pill monospace">{meta.familyName}</span>
                    </div>

                    <div className="driver-card-value-lockup">
                      <span
                        className={`driver-card-contribution monospace ${isPositive ? "positive" : "negative"}`}
                        aria-label={`${formattedContribution} — ${directionLabel}`}
                      >
                        {formattedContribution}
                      </span>
                      <span className="driver-direction-tag monospace">
                        {isPositive ? "▲ RISK-INCREASING" : "▼ RISK-REDUCING"}
                      </span>
                    </div>
                  </div>

                  <div className="driver-card-meta-line">
                    <div className="driver-canonical-wrap monospace">
                      <span className="meta-label">IDENTIFIER:</span>
                      <span className="meta-val">{driver.feature}</span>
                    </div>

                    {driver.value !== null && driver.value !== undefined && (
                      <div className="driver-reported-wrap monospace">
                        <span className="meta-label">VALUE AT T:</span>
                        <span className="meta-val">{driver.value}</span>
                        {meta.unit && <span className="meta-unit">({meta.unit})</span>}
                      </div>
                    )}

                    <div className="driver-magnitude-wrap monospace">
                      <span className="meta-label">MAGNITUDE |Δ|:</span>
                      <span className="meta-val">{magnitudeVal}</span>
                    </div>
                  </div>

                  <p className="driver-card-description">
                    {meta.description}
                  </p>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        /* View Mode 2: Accessible Full Data Table */
        <div className="terminal-table-container" tabIndex={0} role="region" aria-label="Accessible Driver Data Table">
          <table className="terminal-accessible-driver-table">
            <caption className="sr-only">
              Detailed list of signed feature margin contributions for the current risk assessment
            </caption>
            <thead>
              <tr>
                <th scope="col">RANK</th>
                <th scope="col">DISPLAY NAME</th>
                <th scope="col">FEATURE IDENTIFIER</th>
                <th scope="col">FEATURE FAMILY</th>
                <th scope="col">REPORTED VALUE</th>
                <th scope="col">MARGIN CONTRIBUTION</th>
                <th scope="col">DIRECTION</th>
                <th scope="col">MAGNITUDE |Δ|</th>
              </tr>
            </thead>
            <tbody>
              {displayedDrivers.map((driver, idx) => {
                const meta = getFeatureMetadata(driver.feature, driver.display_name);
                const isPositive = driver.contribution >= 0;
                const signPrefix = isPositive ? "+" : "";
                const formattedContrib = `${signPrefix}${driver.contribution.toFixed(3)}`;
                const directionText = isPositive ? "Risk-increasing" : "Risk-reducing";

                return (
                  <tr key={`table-row-${driver.feature}-${idx}`}>
                    <td className="monospace">#{driver.rank ?? idx + 1}</td>
                    <th scope="row" className="driver-row-header">{meta.displayName}</th>
                    <td className="monospace feature-cell">{driver.feature}</td>
                    <td className="monospace">{meta.familyName}</td>
                    <td className="monospace">
                      {driver.value ?? "—"} {driver.value && meta.unit ? meta.unit : ""}
                    </td>
                    <td className={`monospace contrib-cell ${isPositive ? "positive" : "negative"}`}>
                      {formattedContrib}
                    </td>
                    <td className="monospace">
                      <span className={`direction-badge ${isPositive ? "pos" : "neg"}`}>
                        {directionText}
                      </span>
                    </td>
                    <td className="monospace">{Math.abs(driver.contribution).toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="terminal-card-footnote">
        Signed contributions describe model evidence in margin/logit space; they do not establish causal relationships.
      </div>
    </div>
  );
};
