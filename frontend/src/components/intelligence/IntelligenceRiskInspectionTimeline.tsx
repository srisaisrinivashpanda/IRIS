import { Clock, Calendar } from "lucide-react";
import type {
  ProjectRiskHistoryPoint,
  ProjectIntelligenceSnapshot,
} from "@/types/project.ts";

interface IntelligenceRiskInspectionTimelineProps {
  record: ProjectRiskHistoryPoint;
  history: ProjectRiskHistoryPoint[];
  snapshot?: ProjectIntelligenceSnapshot | null;
  onSelectMonth?: (month: string) => void;
}

export const IntelligenceRiskInspectionTimeline: React.FC<
  IntelligenceRiskInspectionTimelineProps
> = ({ record, history, snapshot, onSelectMonth }) => {
  const sortedHistory = [...history].sort((a, b) =>
    a.report_month.localeCompare(b.report_month)
  );

  return (
    <div className="terminal-card inspection-timeline-card">
      <div className="terminal-card-header">
        <div className="terminal-card-title-lockup">
          <span className="terminal-section-eyebrow">TEMPORAL PROVENANCE</span>
          <h4 className="terminal-card-title">OBSERVATION SEQUENCE & SNAPSHOT CONTEXT</h4>
        </div>
        <span className="terminal-badge-muted monospace">
          {sortedHistory.length} OBSERVED {sortedHistory.length === 1 ? "MONTH" : "MONTHS"}
        </span>
      </div>

      {/* Temporal Comparison: Snapshot vs Evaluation Month */}
      <div className="inspection-temporal-grid">
        <div className="inspection-temporal-box">
          <div className="temporal-box-label">
            <Calendar size={12} aria-hidden="true" />
            <span>EVALUATION MONTH</span>
          </div>
          <div className="temporal-box-val monospace font-bold">
            {record.report_month}
          </div>
          <span className="temporal-box-sub monospace">
            Historical Flash Report observation period inspected in this drawer
          </span>
        </div>

        <div className="inspection-temporal-box">
          <div className="temporal-box-label">
            <Clock size={12} aria-hidden="true" />
            <span>LATEST SNAPSHOT MONTH</span>
          </div>
          <div className="temporal-box-val monospace font-bold">
            {snapshot?.report_month ?? "N/A"}
          </div>
          <span className="temporal-box-sub monospace">
            Most recent physical/financial Flash Report observation for this project
          </span>
        </div>
      </div>

      {/* Chronological Sequence Strip */}
      <div className="inspection-sequence-wrap">
        <span className="inspection-sequence-label monospace">
          OBSERVATION SEQUENCE ({sortedHistory[0].report_month} → {sortedHistory[sortedHistory.length - 1].report_month}):
        </span>

        <div className="inspection-sequence-strip" role="list" aria-label="Chronological evaluation sequence">
          {sortedHistory.map((item) => {
            const isInspected = item.report_month === record.report_month;
            return (
              <button
                key={item.report_month}
                type="button"
                className={`inspection-sequence-node monospace ${isInspected ? "active" : ""}`}
                onClick={() => onSelectMonth?.(item.report_month)}
                aria-current={isInspected ? "step" : undefined}
                aria-label={`Jump to evaluation month ${item.report_month}`}
              >
                <span className="node-month">{item.report_month}</span>
                <span className="node-pill">
                  {isInspected ? "INSPECTED" : item.regime}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
