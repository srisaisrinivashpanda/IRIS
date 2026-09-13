# PR-10: Analytics UI & Cross-Filtering Architecture

## Executive Overview
PR-10 transforms the IRIS Analytics page (`/analytics`) into a portfolio analytics workspace built on the authoritative PR-09 backend endpoints (`/api/v1/analytics/*`). 

The frontend never duplicates database aggregation logic, never imputes missing observations, and never synthesizes continuous time horizons. Every chart, metric card, and distribution is driven by server-side aggregations with URL-synchronized cross-filtering.

---

## 1. Architecture & Data Flow

```text
Chart / Filter Interaction (Toolbar, Bar Click, Range Select)
                           │
                           ▼
          useAnalyticsFilters (URL Query State)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
       globalFilters                riskFilters
 (from/to, state, sector,       (globalFilters + regime)
    agency, project_code)                │
             │                           ▼
             ▼                     /analytics/risk
  /analytics/{overview,trends,
  geography,sectors,agencies,
  financials,progress}
             │                           │
             └─────────────┬─────────────┘
                           ▼
               TanStack Query Cache
                           │
                           ▼
          Coordinated Component Re-renders
      (KPIs, Trends, Bar Charts, Tables)
```

---

## 2. Shared vs Section-Specific Filters

In accordance with PR-10 architectural guidelines and user reviews:

| Parameter | Filter Scope | Target Endpoints | Behavior & Guardrails |
| :--- | :--- | :--- | :--- |
| `from_month` | Global | All 8 analytics endpoints | Validates `YYYY-MM` format against observed cadence; ensures `from_month <= to_month`. |
| `to_month` | Global | All 8 analytics endpoints | Validates `YYYY-MM` format; ensures `to_month >= from_month`. |
| `state` | Global | All 8 analytics endpoints | Trimmed uppercase state matching canonical dataset. |
| `sector` | Global | All 8 analytics endpoints | Trimmed uppercase sector matching canonical dataset. |
| `agency` | Global | All 8 analytics endpoints | Trimmed uppercase executing agency code/name. |
| `project_code` | Global | All 8 analytics endpoints | Exact reported project code (`100001` or `N########`). |
| `regime` | **Risk-Specific** | `/analytics/risk` ONLY | **Strictly isolated.** Derived dynamically from backend model governance; never passed to overview, trends, financials, or progress endpoints. |

### District Filter Absence
District is **structurally omitted** from MoSPI flash report source tables. In adherence to source-faithful principles, no district dropdown or synthetic spatial hierarchy is exposed in the UI. A clear disclosure is presented in the filter toolbar and data coverage audit table.

---

## 3. Truthful Terminology & Data Quality Disclosures

The UI enforces strict adherence to truthfulness and transparency:

1. **Observed Coverage**: Labeled strictly as `OBSERVED COVERAGE: 2023-01 → 2026-07` or `EVALUATION WINDOW: [range]`. Never uses deceptive terms such as "LIVE", "REAL-TIME", or "STREAMING".
2. **Financial Aggregations**: Calculated using the latest qualifying observation per distinct project within the active filter scope to prevent multi-month row inflation. Units are explicitly reported in Indian Rupees (₹ Cr).
3. **Physical Progress Semantics**: Missing physical progress values are excluded from the arithmetic mean denominator and **never coerced to 0%**.
4. **Schedule Extension Risk**: Continuous probabilities are displayed as calibrated vs raw model outputs across authentic evaluation months. The UI explicitly refuses to manufacture arbitrary discrete risk bins (`LOW` / `MEDIUM` / `HIGH`) or percentile thresholds (`TOP-X%`).
5. **Unserved Target Disclosures**: Explicit banners disclose unserved ML targets (cost overrun, progress stagnation), preventing false assumptions regarding unsupported model domains.

---

## 4. UI Components & Visualizations

| Section | Component | Features |
| :--- | :--- | :--- |
| **Header** | `AnalyticsHeader.tsx` | Truthful observed coverage window (`2023-01 → 2026-07`), unique project counts, total observations, risk-assessed project counts. |
| **Toolbar** | `AnalyticsFilterBar.tsx` | Native accessible `<select>` dropdowns, text filter, active filter chips with individual removal and "RESET FILTERS" action. |
| **01. Overview** | `AnalyticsOverviewKpi.tsx` | 5 KPI cards: Unique projects vs observations, sanctioned vs revised commitments, cumulative expenditure, arithmetic mean progress, assessed risk count. |
| **02. Trends** | `AnalyticsTrends.tsx` | Recharts `ComposedChart` with financial, volume, progress, and risk view toggles; accessible data table toggle; strictly observed months. |
| **03. Geography** | `AnalyticsGeography.tsx` | Interactive horizontal bar breakdown of top states; click-to-filter toggle; structural district omission notice. |
| **04. Sectors** | `AnalyticsSectors.tsx` | Ranked sector breakdown; click-to-filter toggle; projects and expenditure distribution. |
| **05. Agencies** | `AnalyticsAgencies.tsx` | Agency delivery breakdown with name truncation and tooltips; click-to-filter toggle. |
| **06. Financials** | `AnalyticsFinancials.tsx` | Original cost, revised cost, expenditure, cost escalation, escalation ratio, revision frequency. |
| **07. Progress** | `AnalyticsProgress.tsx` | Non-imputed progress quantiles (Min, P25, Median, P75, Max), reporting rate, sectoral spread. |
| **08. Risk Profile** | `AnalyticsRisk.tsx` | Calibrated vs raw probability quantiles, evaluation trajectory line chart, dynamic regime breakdown, unserved targets banner. |
| **09. Quality Audit** | `AnalyticsCoverage.tsx` | Explicit missingness rates for cost, revised cost, expenditure, and physical progress; structural dimension explanations. |

---

## 5. Verification & Test Suite

The implementation is verified by 25 comprehensive Vitest integration tests in `AnalyticsWorkspace.test.tsx` and 5 unit tests in `AnalyticsPage.test.tsx`:

- **URL Synchronization**: Bidirectional synchronization between URL parameters and toolbar inputs.
- **Filter Cleansing**: Reset actions, active chip removals, and validation error presentation.
- **Filter Scope Isolation**: Proof that `regime` is passed exclusively to `/analytics/risk` and not to other endpoints.
- **Cross-Filtering**: Clicking state, sector, or agency items updates global filters and triggers query invalidation.
- **Null Safety**: Validates that missing values render as em-dash (`—`) without crashing.
- **Accessible Alternatives**: Every Recharts chart provides a companion screen-reader-accessible table.
- **Error & Loading States**: Realistic loading spinners and recoverable error states with retry buttons.

100% of all backend (119/119), serving API (13/13), and frontend (198/198) tests pass.
