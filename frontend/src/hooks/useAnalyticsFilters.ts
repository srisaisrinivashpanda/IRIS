/**
 * Hook for managing shared URL-synchronized Analytics filter state (PR-10)
 */

import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { GlobalAnalyticsFilters, RiskAnalyticsFilters } from "@/types/analytics.ts";

export type FilterKey = "from_month" | "to_month" | "state" | "sector" | "agency" | "project_code" | "regime";

export interface ActiveFilterBadge {
  key: FilterKey;
  label: string;
  value: string;
}

export function useAnalyticsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse global filters from URL
  const globalFilters: GlobalAnalyticsFilters = useMemo(() => {
    const fromMonth = searchParams.get("from_month")?.trim() || null;
    const toMonth = searchParams.get("to_month")?.trim() || null;
    const state = searchParams.get("state")?.trim() || null;
    const sector = searchParams.get("sector")?.trim() || null;
    const agency = searchParams.get("agency")?.trim() || null;
    const projectCode = searchParams.get("project_code")?.trim() || null;

    return {
      from_month: fromMonth,
      to_month: toMonth,
      state: state,
      sector: sector,
      agency: agency,
      project_code: projectCode,
    };
  }, [searchParams]);

  // Risk-specific filters (includes global filters + regime)
  const riskFilters: RiskAnalyticsFilters = useMemo(() => {
    const regime = searchParams.get("regime")?.trim() || null;
    return {
      ...globalFilters,
      regime: regime,
    };
  }, [globalFilters, searchParams]);

  // Client-side validation check (e.g. from_month > to_month)
  const validationError = useMemo(() => {
    if (globalFilters.from_month && globalFilters.to_month) {
      if (globalFilters.from_month > globalFilters.to_month) {
        return `Invalid month range: Start month (${globalFilters.from_month}) cannot be after End month (${globalFilters.to_month}).`;
      }
    }
    return null;
  }, [globalFilters.from_month, globalFilters.to_month]);

  // Update a single filter key
  const setFilter = useCallback(
    (key: FilterKey, value: string | null | undefined) => {
      // Disallow district
      if ((key as string) === "district") return;

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const trimmed = value?.trim();
          if (trimmed) {
            next.set(key, trimmed);
          } else {
            next.delete(key);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Batch update filters
  const setFilters = useCallback(
    (updates: Partial<RiskAnalyticsFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, val]) => {
            if (key === "district") return; // Never set district
            const trimmed = typeof val === "string" ? val.trim() : null;
            if (trimmed) {
              next.set(key, trimmed);
            } else {
              next.delete(key);
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Clear a single filter
  const clearFilter = useCallback(
    (key: FilterKey) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(key);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const keys: FilterKey[] = [
          "from_month",
          "to_month",
          "state",
          "sector",
          "agency",
          "project_code",
          "regime",
        ];
        keys.forEach((k) => next.delete(k));
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  // Toggle filter (for cross-filtering interaction on charts)
  const toggleFilter = useCallback(
    (key: FilterKey, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const current = next.get(key)?.trim();
          if (current === value.trim()) {
            next.delete(key);
          } else {
            next.set(key, value.trim());
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Active filters summary
  const activeFilters = useMemo<ActiveFilterBadge[]>(() => {
    const badges: ActiveFilterBadge[] = [];
    if (globalFilters.from_month) {
      badges.push({ key: "from_month", label: "From", value: globalFilters.from_month });
    }
    if (globalFilters.to_month) {
      badges.push({ key: "to_month", label: "To", value: globalFilters.to_month });
    }
    if (globalFilters.state) {
      badges.push({ key: "state", label: "State", value: globalFilters.state });
    }
    if (globalFilters.sector) {
      badges.push({ key: "sector", label: "Sector", value: globalFilters.sector });
    }
    if (globalFilters.agency) {
      badges.push({ key: "agency", label: "Agency", value: globalFilters.agency });
    }
    if (globalFilters.project_code) {
      badges.push({ key: "project_code", label: "Project", value: globalFilters.project_code });
    }
    if (riskFilters.regime) {
      badges.push({ key: "regime", label: "Regime", value: riskFilters.regime });
    }
    return badges;
  }, [globalFilters, riskFilters.regime]);

  const isFiltered = activeFilters.length > 0;

  return {
    globalFilters,
    riskFilters,
    validationError,
    setFilter,
    setFilters,
    clearFilter,
    clearAllFilters,
    toggleFilter,
    activeFilters,
    isFiltered,
  };
}
