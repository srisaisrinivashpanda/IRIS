# IRIS Dashboard Command Center Architecture (PR-11)

## Overview

The IRIS Dashboard (`/dashboard`) serves as the operational **Command Center** for infrastructure monitoring and production risk oversight. It is designed specifically as an executive decision summary rather than an exploratory analytics engine or machine learning laboratory.

### Core Role Separation

- **Dashboard (`/dashboard`)**: Executive decision summary, scale, risk quantiles, projects requiring immediate investigation, temporal movement, and progressive disclosure navigation.
- **Analytics (`/analytics`)**: Deep multi-dimensional portfolio exploration, cross-filtering, and macro breakdowns across states, sectors, agencies, and financial trajectories (established in PR-10).
- **Projects (`/projects`)**: Granular catalog exploration, search, project trajectory inspection, and individual operational context (established in PR-01/02).
- **Intelligence (`/intelligence`)**: Deep explainable AI investigation terminal with TreeSHAP signed contributors, quantile distributions, and model governance (established in PR-05–08).

---

## Data Composition & Authoritative Contracts

The Command Center composes existing, audited backend endpoints without duplicating aggregation logic or inventing client-side metrics:

| Panel | Authoritative API Endpoint | Contract Origin | Key Data Elements |
|---|---|---|---|
| **Operational Header** | `fetchAnalyticsOverview`, `fetchAnalyticsRisk`, `fetchDatasetInfo` | PR-09, PR-03-08 | Observation span, risk evaluation window, system status |
| **Executive KPI Strip** | `fetchAnalyticsOverview`, `fetchAnalyticsRisk` | PR-09 | Unique projects, observations, latest qualifying expenditure, reporting progress mean, assessed project count, risk window |
| **Risk Command Panel** | `fetchAnalyticsRisk` | PR-09, PR-03-08 | Target (`target_effective_schedule_ext_3m`), H=3 horizon, calibrated quantiles (P25, Median, Mean, P75, P90), raw vs calibrated separation, regime model IDs |
| **Attention Queue** | `fetchRiskSummary({ top_n: 5 })` | PR-03-08 | Authoritative top risk projects ordered by backend `risk_rank`, without client-side thresholding or synthetic categorization |
| **Portfolio Movement** | `fetchAnalyticsTrends` | PR-09 | Strictly observed report cycles, dual-tab visualization (Activity & Expenditure vs Calibrated Risk & Raw Probability) |
| **Concentration Snapshot** | `fetchAnalyticsGeography`, `fetchAnalyticsSectors` | PR-09 | Top 5 state and sector rankings with direct cross-filtering links to `/analytics` |
| **Coverage & Governance** | `fetchAnalyticsOverview`, `fetchAnalyticsRisk` | PR-09 | Dimensional disclosures (`DISTRICT = UNAVAILABLE`), unserved ML targets (`cost_overrun`, `progress_stagnation`) |
| **Operational Navigation** | Client routing | PR-11 | 3 progressive disclosure pathways into Project Discovery, Portfolio Analytics, and Risk Intelligence |

---

## Critical Semantic Rules

### 1. Risk Coverage Semantics

- **Rule**: Never calculate a Dashboard "Risk Coverage %" merely by dividing `assessed_project_count` by `overview.unique_project_count`.
- **Rationale**: The risk-serving population (`assessed_project_count`) is independent from the project-observation population (`unique_project_count`). Dividing them without explicit denominator and population compatibility produces misleading metrics.
- **Implementation**: The dashboard presents the authoritative `assessed_project_count` (Card 05) and `unique_project_count` (Card 01) as distinct, unconflated figures, paired with the exact `risk evaluation window` (Card 06: e.g., `2024-06 → 2026-04`).

### 2. Attention Queue Evaluation Month

- **Rule**: Do not derive the attention queue's `report_month` from the portfolio's latest observation month (`overview.latest_observation_month`).
- **Rationale**: Portfolio observations may extend to months (e.g. `2026-07`) for which machine learning risk assessments have not yet been evaluated (e.g. `2026-04`). Blindly requesting the portfolio's latest observation month would cause 404/empty responses.
- **Implementation**: The attention query delegates directly to the risk serving API (`fetchRiskSummary({ top_n: 5 })`), allowing the backend repository to serve its authoritative latest evaluation cycle (`repo.latest_month`). The evaluation cycle returned in the response is then faithfully displayed in the panel subtitle.

---

## Component Hierarchy

```text
DashboardPage (/dashboard)
├── DashboardHeader
├── DashboardKpiStrip
│   ├── 01 / UNIQUE PROJECTS
│   ├── 02 / MONTHLY OBSERVATIONS
│   ├── 03 / PORTFOLIO EXPENDITURE
│   ├── 04 / AVERAGE PROGRESS (Unavailable if null, never 0%)
│   ├── 05 / RISK-ASSESSED
│   └── 06 / RISK WINDOW
├── DashboardRiskCommand
│   ├── Calibrated Quantiles (P25, Median, Mean, P75, P90, Min, Max)
│   ├── Horizontal Visual IQR Track
│   ├── Empirical Quantile Table
│   ├── Probability Context Separation (Calibrated vs Raw)
│   └── Active Serving Regimes Breakdown
├── DashboardAttentionPanel ("PROJECTS TO INVESTIGATE")
│   └── Ranked table ordered strictly by backend risk_rank
│       ├── Links to /projects/:code (INSPECT)
│       └── Links to /intelligence?project=:code (INTEL)
├── DashboardTrendPanel ("PORTFOLIO MOVEMENT & RECENT TRENDS")
│   ├── Tab: Activity & Cumulative Expenditure
│   └── Tab: Calibrated Risk & Raw Model Probability
├── DashboardConcentration ("PORTFOLIO CONCENTRATION SNAPSHOT")
│   ├── Top States -> /analytics?state=:state
│   └── Top Sectors -> /analytics?sector=:sector
├── DashboardCoverage ("DATA COVERAGE & SOURCE STATUS")
└── DashboardNavigation ("OPERATIONAL NAVIGATION PATHWAYS")
```
