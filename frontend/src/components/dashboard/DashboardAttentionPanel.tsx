import React from "react";
import { Link, useNavigate } from "react-router-dom";
import type { TopRiskProject } from "@/types/risk.ts";
import { DashboardCardSkeleton } from "./DashboardSkeleton.tsx";
import { DashboardErrorState } from "./DashboardErrorState.tsx";
import { ArrowUpRight, Search, ExternalLink } from "lucide-react";

interface DashboardAttentionPanelProps {
  projects?: TopRiskProject[];
  evaluationMonth?: string | null;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export const DashboardAttentionPanel: React.FC<DashboardAttentionPanelProps> = ({
  projects = [],
  evaluationMonth,
  isLoading,
  isError,
  error,
  onRetry,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <DashboardCardSkeleton height="300px" label="Loading projects to investigate..." />;
  }

  if (isError) {
    return (
      <DashboardErrorState
        title="Failed to load projects to investigate"
        message={error?.message || "Attention queue data could not be retrieved from the risk serving layer."}
        onRetry={onRetry}
      />
    );
  }

  return (
    <section className="dashboard-section" aria-label="Projects to Investigate Panel">
      <div className="dashboard-section-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 className="dashboard-section-title">PROJECTS TO INVESTIGATE</h2>
            <span className="dashboard-section-subtitle">
              Ranked by production-served schedule-extension risk · target: H=3
              {evaluationMonth ? ` · Cycle: ${evaluationMonth}` : ""}
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Link
              to="/projects"
              className="dashboard-section-link"
            >
              <span>EXPLORE ALL PROJECTS</span>
              <Search size={13} aria-hidden="true" />
            </Link>
            <Link
              to="/intelligence"
              className="dashboard-section-link"
            >
              <span>FULL RISK RANKING</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="dashboard-card-white" style={{ padding: "0" }}>
        {projects.length === 0 ? (
          <div className="dashboard-empty-panel" style={{ padding: "48px 24px", textAlign: "center" }}>
            <span className="dashboard-empty-title">
              No project-level investigation records are available.
            </span>
            <p className="dashboard-empty-desc">
              No evaluated records returned from the serving layer for the active evaluation cycle ({evaluationMonth || "None"}).
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
              <Link to="/projects" className="dashboard-action-link-btn">
                GO TO PROJECTS
              </Link>
              <Link to="/intelligence" className="dashboard-action-link-btn">
                GO TO INTELLIGENCE
              </Link>
            </div>
          </div>
        ) : (
          <div className="dashboard-table-wrap" style={{ overflowX: "auto" }}>
            <table className="dashboard-table" aria-label="Projects Requiring Investigation">
              <thead>
                <tr>
                  <th scope="col" style={{ width: "60px" }}>RANK</th>
                  <th scope="col">PROJECT</th>
                  <th scope="col">CODE</th>
                  <th scope="col">SECTOR / STATE</th>
                  <th scope="col" style={{ textAlign: "right" }}>CALIBRATED RISK</th>
                  <th scope="col" style={{ textAlign: "right" }}>RAW PROBABILITY</th>
                  <th scope="col" style={{ textAlign: "right" }}>PERCENTILE</th>
                  <th scope="col" style={{ textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const encodedCode = encodeURIComponent(p.project_code);
                  const calRiskFormatted = `${(p.risk_probability * 100).toFixed(1)}%`;
                  const rawProbFormatted = `${(p.raw_probability * 100).toFixed(1)}%`;
                  // Display exact percentile without TOP X% label
                  const percentileFormatted = `${(p.risk_percentile * 100).toFixed(1)}%`;

                  return (
                    <tr
                      key={p.project_code}
                      onClick={() => navigate(`/projects/${encodedCode}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/projects/${encodedCode}`);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Inspect ${p.project_name || p.project_code} - Rank ${p.risk_rank}`}
                      className="dashboard-table-interactive-row"
                    >
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        #{p.risk_rank}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
                            {p.project_name || "—"}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-text-dim)" }}>
                            {p.agency || "—"} · {p.regime} REGIME
                          </span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-variant)" }}>
                        {p.project_code}
                      </td>
                      <td>
                        <span style={{ color: "var(--color-text-main)" }}>{p.sector || "—"}</span>
                        {p.state && (
                          <span style={{ color: "var(--color-text-dim)", fontSize: "11px" }}>
                            {" "}· {p.state}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-coral)" }}>
                        {calRiskFormatted}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-text-dim)" }}>
                        {rawProbFormatted}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                        {percentileFormatted}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{ display: "inline-flex", gap: "12px", alignItems: "center" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            to={`/projects/${encodedCode}`}
                            className="dashboard-table-action-link"
                            title={`Inspect project ${p.project_code}`}
                          >
                            <span>INSPECT</span>
                          </Link>
                          <Link
                            to={`/intelligence?project=${encodedCode}`}
                            className="dashboard-table-action-link"
                            aria-label={`Open intelligence for project ${p.project_code}`}
                            title="Open in Risk Intelligence"
                          >
                            <span>INTEL</span>
                            <ExternalLink size={10} aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="dashboard-table-footer-note">
          <span>
            NOTE: Projects are strictly ordered by backend risk rank. Probabilities represent continuous likelihood of schedule extension (target_effective_schedule_ext_3m). No arbitrary categorization or filtering threshold is applied.
          </span>
        </div>
      </div>
    </section>
  );
};
