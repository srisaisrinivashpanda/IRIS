import React from "react";

interface SkeletonProps {
  height?: string | number;
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({
  height = "20px",
  width = "100%",
  className = "",
  style = {},
}) => {
  return (
    <div
      className={`dashboard-skeleton-box ${className}`}
      style={{
        height,
        width,
        backgroundColor: "var(--color-surface-container-high, #e2e3df)",
        opacity: 0.6,
        borderRadius: "2px",
        animation: "dashboard-pulse 1.6s ease-in-out infinite",
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export const DashboardKpiSkeleton: React.FC = () => {
  return (
    <div className="dashboard-metrics-grid" aria-label="Loading portfolio key performance indicators">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="metric-cell">
          <SkeletonBox height="10px" width="60%" style={{ marginBottom: "10px" }} />
          <SkeletonBox height="28px" width="80%" style={{ marginBottom: "8px" }} />
          <SkeletonBox height="8px" width="90%" />
        </div>
      ))}
    </div>
  );
};

export const DashboardCardSkeleton: React.FC<{ height?: string; label?: string }> = ({
  height = "240px",
  label = "Loading section data...",
}) => {
  return (
    <div
      className="dashboard-card-white"
      style={{ height, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
      aria-label={label}
    >
      <div className="card-header-lockup">
        <SkeletonBox height="12px" width="35%" />
        <SkeletonBox height="16px" width="80px" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "auto 0" }}>
        <SkeletonBox height="14px" width="95%" />
        <SkeletonBox height="14px" width="85%" />
        <SkeletonBox height="14px" width="70%" />
      </div>
      <SkeletonBox height="10px" width="50%" />
    </div>
  );
};
