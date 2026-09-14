import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface DashboardErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({
  title = "Failed to load section data",
  message = "An error occurred while fetching data from authoritative services.",
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`dashboard-section-error ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="dashboard-section-error-left">
        <AlertTriangle size={18} className="dashboard-error-icon" aria-hidden="true" />
        <div className="dashboard-error-content">
          <span className="dashboard-error-title">{title}</span>
          <span className="dashboard-error-desc">{message}</span>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          className="dashboard-retry-btn"
          onClick={onRetry}
          aria-label={`Retry loading ${title}`}
        >
          <RefreshCw size={12} aria-hidden="true" />
          <span>RETRY</span>
        </button>
      )}
    </div>
  );
};
