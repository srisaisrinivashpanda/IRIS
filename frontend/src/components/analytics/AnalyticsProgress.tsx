import React from "react";
import type { ProgressResponse } from "@/types/analytics.ts";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner.tsx";
import { AlertTriangle, Activity } from "lucide-react";

interface AnalyticsProgressProps {
  data?: ProgressResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const AnalyticsProgress: React.FC<AnalyticsProgressProps> = ({
  data,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="analytics-section-card">
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <LoadingSpinner size="md" label="AGGREGATING PHYSICAL PROGRESS..." />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="analytics-section-card">
        <div className="analytics-section-error" role="alert">
          <AlertTriangle size={18} className="analytics-filter-error-icon" />
          <div className="analytics-section-error-content">
            <span className="analytics-section-error-title">Failed to load physical progress</span>
            <span className="analytics-section-error-desc">
              {error?.message || "An error occurred while fetching progress statistics."}
            </span>
          </div>
          {onRetry && (
            <button type="button" className="analytics-retry-button" onClick={onRetry}>
              RETRY
            </button>
          )}
        </div>
      </div>
    );
  }

  const m = data?.metrics;

  // Truthful empty check: if no reporting observations, or mean progress is null
  const isProgressUnavailable = !m || m.reporting_observations === 0 || m.mean_physical_progress == null;

  return (
    <div className="analytics-section-card" data-testid="analytics-progress-section">
      <div className="analytics-card-header">
        <div className="analytics-card-title-lockup">
          <span className="analytics-eyebrow">CONSTRUCTION COMPLETION STATUS</span>
          <h2 className="analytics-card-title">06. PHYSICAL PROGRESS</h2>
        </div>
      </div>

      <div className="analytics-disclaimer-strip">
        <Activity size={12} className="analytics-disclaimer-icon" />
        <span>
          {data?.progress_basis ||
            "Missing progress values are excluded from the arithmetic mean denominator and are never imputed as 0%."}
        </span>
      </div>

      {isProgressUnavailable ? (
        <div className="analytics-empty-state" role="status" data-testid="progress-unavailable-state">
          <span className="analytics-empty-text">
            Progress data unavailable for selected scope
          </span>
          <span className="analytics-empty-subtext">
            {m?.missing_observations
              ? `All ${m.missing_observations.toLocaleString()} observations in this filter scope omit physical progress reporting.`
              : "No qualifying observations found."}
          </span>
        </div>
      ) : (
        <>
          {/* Summary Stat Grid */}
          <div className="analytics-progress-grid">
            <div className="analytics-progress-stat-card" data-testid="progress-mean-card">
              <span className="analytics-progress-stat-label">ARITHMETIC MEAN</span>
              <span className="analytics-progress-stat-val">
                {m.mean_physical_progress != null ? `${m.mean_physical_progress.toFixed(1)}%` : "Unavailable"}
              </span>
              <span className="analytics-progress-stat-sub">EXCLUDES MISSING OBSERVATIONS</span>
            </div>

            <div className="analytics-progress-stat-card" data-testid="progress-median-card">
              <span className="analytics-progress-stat-label">MEDIAN (P50)</span>
              <span className="analytics-progress-stat-val">
                {m.median_physical_progress != null ? `${m.median_physical_progress.toFixed(1)}%` : "Unavailable"}
              </span>
              <span className="analytics-progress-stat-sub">CENTRAL TENDENCY</span>
            </div>

            <div className="analytics-progress-stat-card">
              <span className="analytics-progress-stat-label">REPORTED RANGE</span>
              <span className="analytics-progress-stat-val">
                {m.min_physical_progress != null && m.max_physical_progress != null
                  ? `${m.min_physical_progress.toFixed(0)}% → ${m.max_physical_progress.toFixed(0)}%`
                  : "—"}
              </span>
              <span className="analytics-progress-stat-sub">MINIMUM → MAXIMUM REPORTED</span>
            </div>

            <div className="analytics-progress-stat-card">
              <span className="analytics-progress-stat-label">REPORTING COVERAGE</span>
              <span className="analytics-progress-stat-val">
                {(m.coverage_rate * 100).toFixed(1)}%
              </span>
              <span className="analytics-progress-stat-sub">
                {m.reporting_observations.toLocaleString()} OF {m.total_observations.toLocaleString()} ROWS
              </span>
            </div>
          </div>

          {/* Statistical Quantiles Strip */}
          {m.distribution_quantiles && (
            <div className="analytics-quantiles-box" data-testid="progress-quantiles">
              <span className="analytics-quantiles-title">PROGRESS DISTRIBUTION QUANTILES</span>
              <div className="analytics-quantiles-strip">
                <div className="analytics-quantile-item">
                  <span className="analytics-quantile-label">MIN</span>
                  <span className="analytics-quantile-val">{m.distribution_quantiles.minimum.toFixed(1)}%</span>
                </div>
                <div className="analytics-quantile-item">
                  <span className="analytics-quantile-label">P25</span>
                  <span className="analytics-quantile-val">{m.distribution_quantiles.p25.toFixed(1)}%</span>
                </div>
                <div className="analytics-quantile-item highlight">
                  <span className="analytics-quantile-label">P50 (MEDIAN)</span>
                  <span className="analytics-quantile-val">{m.distribution_quantiles.median.toFixed(1)}%</span>
                </div>
                <div className="analytics-quantile-item">
                  <span className="analytics-quantile-label">P75</span>
                  <span className="analytics-quantile-val">{m.distribution_quantiles.p75.toFixed(1)}%</span>
                </div>
                <div className="analytics-quantile-item">
                  <span className="analytics-quantile-label">P90</span>
                  <span className="analytics-quantile-val">{m.distribution_quantiles.p90.toFixed(1)}%</span>
                </div>
                <div className="analytics-quantile-item">
                  <span className="analytics-quantile-label">P95</span>
                  <span className="analytics-quantile-val">{m.distribution_quantiles.p95.toFixed(1)}%</span>
                </div>
                <div className="analytics-quantile-item">
                  <span className="analytics-quantile-label">MAX</span>
                  <span className="analytics-quantile-val">{m.distribution_quantiles.maximum.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Sectoral Progress Breakdown Table */}
          {data?.by_sector && data.by_sector.length > 0 && (
            <div className="analytics-sector-progress-section">
              <h4 className="analytics-subheading">SECTORAL PROGRESS BREAKDOWN</h4>
              <div className="analytics-accessible-table-wrapper">
                <table className="analytics-data-table" aria-label="Sectoral Physical Progress Table">
                  <thead>
                    <tr>
                      <th scope="col">SECTOR</th>
                      <th scope="col">MEAN PROGRESS (%)</th>
                      <th scope="col">REPORTING ROWS</th>
                      <th scope="col">MISSING ROWS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_sector.map((s) => (
                      <tr key={s.sector}>
                        <td className="monospace font-bold">{s.sector}</td>
                        <td className="monospace">
                          {s.mean_physical_progress != null
                            ? `${s.mean_physical_progress.toFixed(1)}%`
                            : "Unavailable"}
                        </td>
                        <td>{s.reporting_count.toLocaleString()}</td>
                        <td>{s.missing_count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
