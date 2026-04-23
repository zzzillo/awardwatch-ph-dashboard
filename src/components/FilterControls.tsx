import { useMemo, useState, type ReactNode } from "react";
import type { RankingRow } from "../types";
import { sortRankings, fmtAmount } from "../utils";
import { filterLabels, type FilterKey, ui } from "../dashboard/config";

function selectedText(values: string[]) {
  if (!values.length) return "All";
  if (values.length === 1) return values[0];
  return `${values.length} selected`;
}

export function MultiPick({
  title,
  rows,
  selected,
  onChange,
}: {
  title: string;
  rows: RankingRow[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => sortRankings(rows, "amount", query).slice(0, 70), [query, rows]);
  const selectedSet = new Set(selected);

  function toggle(name: string) {
    onChange(selectedSet.has(name) ? selected.filter((value) => value !== name) : [...selected, name]);
  }

  return (
    <section className={`${ui.panel} w-[86vw] min-w-0 shrink-0 snap-start overflow-hidden sm:w-[340px] lg:w-auto`}>
      <div className="grid gap-2 border-b border-zinc-800 p-3">
        <label className={ui.label}>
          {title}
          <input className={ui.input} value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={`Search ${title.toLowerCase()}`} />
        </label>
        <div className="flex gap-2">
          <button className={ui.button} type="button" onClick={() => onChange([])}>
            All
          </button>
          <button className={ui.button} type="button" onClick={() => onChange([])} disabled={!selected.length}>
            Clear
          </button>
        </div>
      </div>
      <div className="grid max-h-40 overflow-auto">
        {visible.map((row) => (
          <label className="grid min-h-8 grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 border-b border-zinc-900 px-3 py-1.5 text-sm" key={row.name}>
            <input className="h-4 w-4 accent-lime-300" checked={selectedSet.has(row.name)} onChange={() => toggle(row.name)} type="checkbox" />
            <span className="min-w-0 break-words font-bold leading-tight text-zinc-100">{row.name || "Not stated"}</span>
            <small className="whitespace-nowrap text-[11px] font-bold text-zinc-500">{fmtAmount(row.amount)}</small>
          </label>
        ))}
      </div>
    </section>
  );
}

export function FilterIndicator({
  filters,
  startYear,
  endYear,
  action,
}: {
  filters: Record<FilterKey, string[]>;
  startYear: number;
  endYear: number;
  action?: ReactNode;
}) {
  const active = (Object.keys(filters) as FilterKey[]).filter((key) => filters[key].length);
  const total = active.reduce((sum, key) => sum + filters[key].length, 0);
  const title =
    active.length === 0
      ? "All data"
      : active.length === 1 && total === 1
        ? `Solo filter: ${filterLabels[active[0]]}`
        : active.length === 1
          ? `Solo filter group: ${filterLabels[active[0]]}`
          : "Combined filters";
  const detail =
    active.length === 0
      ? `All records in ${startYear}-${endYear}.`
      : active.map((key) => `${filterLabels[key]}: ${selectedText(filters[key])}`).join(" | ") + ` | ${startYear}-${endYear}`;

  return (
    <section className="flex flex-col justify-between gap-3 bg-zinc-950 px-3 py-2 sm:flex-row sm:items-center">
      <div>
        <p className={ui.eyebrow}>Active dashboard view</p>
        <strong className="mt-1 block text-base font-black text-zinc-100">{title}</strong>
        <span className="mt-1 block text-sm leading-snug text-zinc-500">{detail}</span>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">{action}</div>
    </section>
  );
}
