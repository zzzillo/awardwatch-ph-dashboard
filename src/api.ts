import type { AmountBandRow, AwardRecord, MonthlyRow, RankingRow, YearRow } from "./types";

type FilterKey = "awardees" | "areas" | "categories" | "organizations";

export interface ApiFilters {
  startYear: number;
  endYear: number;
  filters: Record<FilterKey, string[]>;
}

export interface ApiSummary {
  records: number;
  total_amount: number;
  average_amount: number;
  top_awardee: string;
}

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

function queryString(scope: ApiFilters, extra: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  params.set("start_year", String(scope.startYear));
  params.set("end_year", String(scope.endYear));
  Object.entries(scope.filters).forEach(([key, values]) => values.forEach((value) => params.append(key, value)));
  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  return params.toString();
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function fetchSummary(scope: ApiFilters) {
  return get<ApiSummary>(`/api/summary?${queryString(scope)}`);
}

export function fetchYearly(scope: ApiFilters) {
  return get<YearRow[]>(`/api/yearly?${queryString(scope)}`);
}

export function fetchMonthly(scope: ApiFilters, year: number) {
  return get<MonthlyRow[]>(`/api/monthly?${queryString(scope, { year })}`);
}

export function fetchDistribution(scope: ApiFilters) {
  return get<AmountBandRow[]>(`/api/distribution?${queryString(scope)}`);
}

export function fetchRankings(scope: ApiFilters, dimension: FilterKey) {
  return get<RankingRow[]>(`/api/rankings?${queryString(scope, { dimension, limit: 120 })}`);
}

export function fetchFilterOptions(dimension: FilterKey) {
  return get<RankingRow[]>(`/api/filter-options?dimension=${dimension}&limit=100`);
}

export function fetchContracts(scope: ApiFilters) {
  return get<AwardRecord[]>(`/api/contracts?${queryString(scope, { limit: 120 })}`);
}
