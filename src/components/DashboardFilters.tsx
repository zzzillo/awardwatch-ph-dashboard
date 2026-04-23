import { useEffect, useRef, useState } from "react";
import type { RankingRow } from "../types";
import { FilterIndicator, MultiPick } from "./FilterControls";
import { filterLabels, type FilterKey, ui } from "../dashboard/config";

export function DashboardFilters({
  years,
  startYear,
  endYear,
  filters,
  filterOptions,
  onStartYearChange,
  onEndYearChange,
  onFilterChange,
  onClearAll,
}: {
  years: number[];
  startYear: number;
  endYear: number;
  filters: Record<FilterKey, string[]>;
  filterOptions: Record<FilterKey, RankingRow[]>;
  onStartYearChange: (year: number) => void;
  onEndYearChange: (year: number) => void;
  onFilterChange: (key: FilterKey, next: string[]) => void;
  onClearAll: () => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!filterOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (filterWrapRef.current && !filterWrapRef.current.contains(event.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [filterOpen]);

  return (
    <div className="relative" ref={filterWrapRef}>
      <FilterIndicator
        filters={filters}
        startYear={startYear}
        endYear={endYear}
        action={
          <button
            className="flex min-h-11 w-fit shrink-0 items-center gap-2 rounded bg-zinc-950 px-4 py-2.5 text-base font-black text-zinc-100 transition hover:bg-zinc-900"
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
          >
            <span>Filter</span>
            <svg className={`size-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        }
      />
      {filterOpen && (
        <section className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[calc(100vh-13rem)] w-full overflow-auto rounded-lg border border-zinc-800 bg-black p-3 shadow-2xl shadow-black xl:w-[min(92vw,1180px)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className={ui.eyebrow}>Filter</p>
              <h2 className="text-lg font-black text-zinc-100">Choose dashboard scope</h2>
            </div>
            <div className="flex gap-2">
              <button className={ui.button} type="button" onClick={onClearAll}>
                Clear all
              </button>
              <button className={ui.button} type="button" onClick={() => setFilterOpen(false)}>
                Close
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-[430px]">
            <label className={ui.label}>
              Start year
              <select className={ui.input} onChange={(event) => onStartYearChange(Number(event.target.value))} value={startYear}>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className={ui.label}>
              End year
              <select className={ui.input} onChange={(event) => onEndYearChange(Number(event.target.value))} value={endYear}>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-2 flex snap-x gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
            <MultiPick title="Areas" rows={filterOptions.areas} selected={filters.areas} onChange={(next) => onFilterChange("areas", next)} />
            <MultiPick title="Awardees" rows={filterOptions.awardees} selected={filters.awardees} onChange={(next) => onFilterChange("awardees", next)} />
            <MultiPick title="Business categories" rows={filterOptions.categories} selected={filters.categories} onChange={(next) => onFilterChange("categories", next)} />
            <MultiPick title="Organizations" rows={filterOptions.organizations} selected={filters.organizations} onChange={(next) => onFilterChange("organizations", next)} />
          </div>
        </section>
      )}
    </div>
  );
}
