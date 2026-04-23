import type { Metric, RankingRow, SortKey, YearRow } from "./types";

export const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export const compact = new Intl.NumberFormat("en-PH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const plain = new Intl.NumberFormat("en-PH");

export function fmtAmount(value: number | null | undefined): string {
  return currency.format(value || 0);
}

export function fmtMetric(value: number | null | undefined, metric: Metric): string {
  return metric === "records" ? plain.format(value || 0) : fmtAmount(value);
}

export function rowValue(row: Pick<YearRow, "amount" | "records" | "median_amount">, metric: Metric): number {
  return Number(row[metric] || 0);
}

export function validYears(rows: YearRow[]): number[] {
  return rows
    .filter((row): row is YearRow & { year: number } => row.year !== null && row.year >= 2007 && row.year <= new Date().getFullYear())
    .map((row) => row.year);
}

export function sortRankings(rows: RankingRow[], sort: SortKey, query: string): RankingRow[] {
  const needle = query.trim().toLowerCase();
  return [...rows]
    .filter((row) => !needle || row.name.toLowerCase().includes(needle))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "average") return b.amount / Math.max(b.records, 1) - a.amount / Math.max(a.records, 1);
      if (sort === "start_date" || sort === "end_date") return String(b[sort] || "").localeCompare(String(a[sort] || ""));
      return Number(b[sort]) - Number(a[sort]);
    });
}

export function yearsBetween(start: number, end: number): number[] {
  const years: number[] = [];
  for (let year = start; year <= end; year += 1) years.push(year);
  return years;
}
