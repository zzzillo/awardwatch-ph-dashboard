import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { fetchContracts, fetchDistribution, fetchFilterOptions, fetchMonthly, fetchRankings, fetchSummary, fetchYearly, type ApiSummary } from "./api";
import type { AmountBandRow, AwardRecord, DashboardData, DimensionYearRow, MonthlyRow, RankingRow, SortKey, YearRow } from "./types";
import { compact, fmtAmount, plain, sortRankings, validYears } from "./utils";

type FilterKey = "awardees" | "areas" | "categories" | "organizations";

const filterLabels: Record<FilterKey, string> = {
  awardees: "Awardees",
  areas: "Areas",
  categories: "Business categories",
  organizations: "Organizations",
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const defaultYears = Array.from({ length: new Date().getFullYear() - 2007 + 1 }, (_, index) => 2007 + index);

const ui = {
  eyebrow: "text-[11px] font-black uppercase tracking-[0.18em] text-lime-300",
  panel: "min-w-0 rounded-md border border-zinc-800 bg-zinc-950",
  panelPad: "p-3 sm:p-4",
  label: "grid gap-1 text-xs font-bold text-zinc-500",
  input:
    "min-h-9 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm font-semibold text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-lime-300/70",
  button:
    "min-h-9 rounded border border-zinc-800 bg-black px-3 py-2 text-sm font-black text-zinc-100 transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40",
};

function AwardWatchLogo() {
  return (
    <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-zinc-950" aria-label="AwardWatch PH">
      <svg className="size-14" viewBox="0 0 32 32" role="img" aria-hidden="true">
          <path d="M7 6h18v8c0 6.2-3.5 10.3-9 12-5.5-1.7-9-5.8-9-12V6Z" fill="#050505" stroke="#d4d4d8" strokeWidth="1.8" />
          <path d="M11 19V13M16 20V10M21 17v-4" stroke="#d7ff5f" strokeLinecap="round" strokeWidth="2.6" />
          <path d="M10 23h12" stroke="#7dd3fc" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </div>
  );
}

function useDashboardApi(scope: { startYear: number; endYear: number; filters: Record<FilterKey, string[]> }, rankingTab: FilterKey) {
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [yearRows, setYearRows] = useState<YearRow[]>([]);
  const [monthlyRows, setMonthlyRows] = useState<MonthlyRow[]>([]);
  const [amountBands, setAmountBands] = useState<AmountBandRow[]>([]);
  const [contracts, setContracts] = useState<AwardRecord[]>([]);
  const [rankingRows, setRankingRows] = useState<RankingRow[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<FilterKey, RankingRow[]>>({ awardees: [], areas: [], categories: [], organizations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchFilterOptions("awardees"),
      fetchFilterOptions("areas"),
      fetchFilterOptions("categories"),
      fetchFilterOptions("organizations"),
    ])
      .then(([awardees, areas, categories, organizations]) => {
        if (!cancelled) setFilterOptions({ awardees, areas, categories, organizations });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchSummary(scope),
      fetchYearly(scope),
      fetchMonthly(scope, scope.endYear),
      fetchDistribution(scope),
      fetchContracts(scope),
      fetchRankings(scope, rankingTab),
    ])
      .then(([nextSummary, nextYearRows, nextMonthlyRows, nextAmountBands, nextContracts, nextRankingRows]) => {
        if (cancelled) return;
        setSummary(nextSummary);
        setYearRows(nextYearRows);
        setMonthlyRows(nextMonthlyRows);
        setAmountBands(nextAmountBands);
        setContracts(nextContracts);
        setRankingRows(nextRankingRows);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rankingTab, scope]);

  return { summary, yearRows, monthlyRows, amountBands, contracts, rankingRows, filterOptions, loading, error };
}

function compactDate(value: string) {
  return value ? value.slice(0, 10) : "Missing";
}

function selectedText(values: string[]) {
  if (!values.length) return "All";
  if (values.length === 1) return values[0];
  return `${values.length} selected`;
}

function average(row: Pick<RankingRow, "amount" | "records">) {
  return row.amount / Math.max(row.records, 1);
}

function rowName(row: RankingRow | undefined) {
  return row?.name || "Not available";
}

function filterRankRows(rows: RankingRow[], selected: string[]) {
  if (!selected.length) return rows;
  const selectedSet = new Set(selected);
  return rows.filter((row) => selectedSet.has(row.name));
}

function topAwardeeForSolo(data: DashboardData, key: FilterKey | undefined, selected: string[]) {
  if (!key || !selected.length) return { name: data.top_awardees[0]?.awardee_name || "Not available", note: "Highest total awardee overall" };
  if (key === "awardees") {
    const rows = filterRankRows(data.full_rankings.awardees, selected);
    return { name: rowName(sortRankings(rows, "amount", "")[0]), note: selected.length === 1 ? "Selected awardee" : "Top among selected awardees" };
  }

  const selectedSet = new Set(selected);
  const source =
    key === "areas"
      ? data.filter_views.area_awardees.filter((row) => selectedSet.has(row.area_of_delivery || ""))
      : key === "categories"
        ? data.filter_views.category_awardees.filter((row) => selectedSet.has(row.business_category || ""))
        : data.filter_views.organization_awardees.filter((row) => selectedSet.has(row.organization_name || ""));
  const awardees = new Map<string, { name: string; amount: number }>();
  source.forEach((row) => {
    const name = row.awardee_name || "Not stated";
    const current = awardees.get(name) || { name, amount: 0 };
    current.amount += row.amount;
    awardees.set(name, current);
  });
  const top = [...awardees.values()].sort((a, b) => b.amount - a.amount)[0];
  return { name: top?.name || "Not available", note: `Top awardee in selected ${filterLabels[key].toLowerCase()}` };
}

function aggregateYears(rows: DimensionYearRow[] | YearRow[], startYear: number, endYear: number): YearRow[] {
  const map = new Map<number, YearRow>();
  rows.forEach((row) => {
    if (row.year === null || row.year < startYear || row.year > endYear) return;
    const current = map.get(row.year) || { year: row.year, records: 0, amount: 0, median_amount: 0 };
    current.records += row.records;
    current.amount += row.amount;
    current.median_amount = Math.max(current.median_amount, row.median_amount || 0);
    map.set(row.year, current);
  });
  return [...map.values()].sort((a, b) => Number(a.year) - Number(b.year));
}

function useFilteredYears(data: DashboardData, filters: Record<FilterKey, string[]>, startYear: number, endYear: number) {
  const activeGroups = (Object.keys(filters) as FilterKey[]).filter((key) => filters[key].length);

  return useMemo(() => {
    if (!activeGroups.length || activeGroups.length > 1) return aggregateYears(data.by_year, startYear, endYear);
    const key = activeGroups[0];
    const selected = new Set(filters[key]);
    const source =
      key === "awardees"
        ? data.filter_views.awardee_year.filter((row) => selected.has(row.awardee_name || ""))
        : key === "areas"
          ? data.filter_views.area_year.filter((row) => selected.has(row.area_of_delivery || ""))
          : key === "categories"
            ? data.filter_views.category_year.filter((row) => selected.has(row.business_category || ""))
            : data.filter_views.organization_year.filter((row) => selected.has(row.organization_name || ""));
    return aggregateYears(source, startYear, endYear);
  }, [activeGroups, data, endYear, filters, startYear]);
}

function KpiGrid({ items }: { items: Array<[string, string, string]> }) {
  return (
    <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
      {items.map(([label, value, note]) => (
        <article className={`${ui.panel} p-3`} key={label}>
          <p className={ui.eyebrow}>{label}</p>
          <strong className="mt-2 block break-words text-2xl font-black leading-none tracking-normal text-zinc-100 sm:text-3xl">{value}</strong>
          <span className="mt-2 block text-sm leading-snug text-zinc-500">{note}</span>
        </article>
      ))}
    </section>
  );
}

function MultiPick({
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

function FilterIndicator({
  filters,
  startYear,
  endYear,
  action,
}: {
  filters: Record<FilterKey, string[]>;
  startYear: number;
  endYear: number;
  action?: React.ReactNode;
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
      : active
          .map((key) => `${filterLabels[key]}: ${selectedText(filters[key])}`)
          .join(" | ") + ` | ${startYear}-${endYear}`;

  return (
    <section className="flex flex-col justify-between gap-3 bg-zinc-950 px-3 py-2 sm:flex-row sm:items-center">
      <div>
        <p className={ui.eyebrow}>Active dashboard view</p>
        <strong className="mt-1 block text-base font-black text-zinc-100">{title}</strong>
        <span className="mt-1 block text-sm leading-snug text-zinc-500">{detail}</span>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        {action}
      </div>
    </section>
  );
}

function LineChart({ rows, captionId }: { rows: YearRow[]; captionId: string }) {
  const width = 920;
  const height = 300;
  const pad = { left: 66, right: 24, top: 22, bottom: 46 };
  const [hovered, setHovered] = useState<YearRow | null>(null);
  const cleanRows = rows.filter((row): row is YearRow & { year: number } => row.year !== null);
  if (!cleanRows.length) return <div className="p-6 text-sm text-zinc-500">No yearly data for this selection.</div>;

  const max = Math.max(...cleanRows.map((row) => row.amount), 1);
  const niceSteps = [
    10_000_000,
    25_000_000,
    50_000_000,
    100_000_000,
    250_000_000,
    500_000_000,
    1_000_000_000,
    2_500_000_000,
    5_000_000_000,
    10_000_000_000,
    25_000_000_000,
    50_000_000_000,
    100_000_000_000,
    250_000_000_000,
    500_000_000_000,
    1_000_000_000_000,
  ];
  const targetTickCount = 4;
  const step = niceSteps.find((candidate) => Math.ceil(max / candidate) <= targetTickCount) || niceSteps.at(-1) || 1_000_000_000_000;
  const yMax = Math.max(step, Math.ceil(max / step) * step);
  const yTicks = Array.from({ length: Math.ceil(yMax / step) + 1 }, (_, index) => index * step);
  const yLabel = (value: number) => (value >= 1_000_000_000_000 ? `${value / 1_000_000_000_000}T` : value >= 1_000_000_000 ? `${value / 1_000_000_000}B` : `${value / 1_000_000}M`);
  const minYear = cleanRows[0].year;
  const maxYear = cleanRows.at(-1)?.year || minYear;
  const x = (year: number) => pad.left + ((year - minYear) / Math.max(maxYear - minYear, 1)) * (width - pad.left - pad.right);
  const y = (value: number) => height - pad.bottom - (value / yMax) * (height - pad.top - pad.bottom);
  const points = cleanRows.map((row) => ({ x: x(row.year), y: y(row.amount) }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const ticks = cleanRows.filter((_, index) => index % Math.ceil(cleanRows.length / 8) === 0 || index === cleanRows.length - 1);
  const hoveredPoint = hovered?.year ? { x: x(hovered.year), y: y(hovered.amount) } : null;

  return (
    <div className="relative">
      <svg className="block h-auto w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={captionId} onMouseLeave={() => setHovered(null)}>
        {yTicks.map((value) => {
          const tickY = y(value);
          return (
            <g key={value}>
              <line stroke="#27272a" strokeDasharray={value === 0 ? undefined : "4 6"} x1={pad.left} x2={width - pad.right} y1={tickY} y2={tickY} />
              {value > 0 && (
                <text className="fill-zinc-500 text-[11px]" textAnchor="end" x={pad.left - 10} y={tickY + 4}>
                  {yLabel(value)}
                </text>
              )}
            </g>
          );
        })}
        <path d={path} fill="none" stroke="#d7ff5f" strokeLinecap="round" strokeWidth="4" />
        {points.map((point, index) => {
          const row = cleanRows[index];
          return (
            <g key={`${point.x}-${index}`} onMouseEnter={() => setHovered(row)} onFocus={() => setHovered(row)} tabIndex={0} role="button" aria-label={`${row.year}: ${fmtAmount(row.amount)}`}>
              <circle cx={point.x} cy={point.y} fill="#f4f4f5" r="4" />
              <circle cx={point.x} cy={point.y} fill="transparent" r="14" />
            </g>
          );
        })}
        {hoveredPoint && (
          <>
            <line stroke="#52525b" strokeDasharray="4 5" x1={hoveredPoint.x} x2={hoveredPoint.x} y1={pad.top} y2={height - pad.bottom} />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} fill="#d7ff5f" r="6" />
          </>
        )}
        {ticks.map((row) => (
          <text className="fill-zinc-500 text-[11px]" key={row.year} textAnchor="middle" x={x(row.year)} y={height - 16}>
            {row.year}
          </text>
        ))}
      </svg>
      {hovered && hoveredPoint && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-zinc-700 bg-black px-3 py-2 text-xs shadow-xl shadow-black"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: "translate(-50%, calc(-100% - 10px))",
          }}
        >
          <strong className="block text-zinc-100">{hovered.year}</strong>
          <span className="block whitespace-nowrap text-lime-300">{fmtAmount(hovered.amount)}</span>
          <span className="block whitespace-nowrap text-zinc-500">{compact.format(hovered.records)} contracts</span>
        </div>
      )}
    </div>
  );
}

function BarChart({ rows, kind }: { rows: AmountBandRow[] | MonthlyRow[]; kind: "bands" | "months" }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  return (
    <div className="grid gap-2">
      {rows.map((row, index) => {
        const label = kind === "bands" ? (row as AmountBandRow).band : monthLabels[(row as MonthlyRow).month - 1] || `${String((row as MonthlyRow).month).padStart(2, "0")}/${(row as MonthlyRow).year}`;
        return (
          <div className="grid items-center gap-1 text-sm sm:grid-cols-[132px_minmax(120px,1fr)_138px_78px] sm:gap-3" key={`${label}-${index}`}>
            <span className="min-w-0 font-bold text-zinc-100">{label}</span>
            <div className="h-3 overflow-hidden rounded border border-zinc-800 bg-black">
              <div className="h-full bg-gradient-to-r from-lime-300 to-sky-300" style={{ width: `${Math.max(2, (row.amount / max) * 100)}%` }} />
            </div>
            <strong className="font-black text-zinc-100 sm:text-right">{fmtAmount(row.amount)}</strong>
            <small className="text-zinc-500 sm:text-right">{compact.format(row.records)} records</small>
          </div>
        );
      })}
    </div>
  );
}

function RankingExplorer({ rows, selected }: { rows: RankingRow[]; selected: string[] }) {
  const [sort, setSort] = useState<SortKey>("amount");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  function changeSort(key: SortKey) {
    if (sort === key) setDirection((current) => (current === "desc" ? "asc" : "desc"));
    else {
      setSort(key);
      setDirection("desc");
    }
  }
  const filtered = useMemo(() => {
    const sorted = sortRankings(filterRankRows(rows, selected), sort, "");
    return direction === "desc" ? sorted : [...sorted].reverse();
  }, [direction, rows, selected, sort]);
  const top = filtered.slice(0, 120);
  const sortMark = (key: SortKey) => (sort === key ? (direction === "desc" ? " ↓" : " ↑") : "");

  return (
    <div className="grid max-h-[500px] min-w-[860px] grid-cols-[minmax(260px,1.5fr)_120px_150px_150px_110px_110px]">
        <div className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500">Name</div>
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-right text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("records")}>
          Count{sortMark("records")}
        </button>
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-right text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("amount")}>
          Total{sortMark("amount")}
        </button>
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-right text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("average")}>
          Average{sortMark("average")}
        </button>
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("start_date")}>
          Start{sortMark("start_date")}
        </button>
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("end_date")}>
          End{sortMark("end_date")}
        </button>
        {top.map((row) => (
          <Fragment key={row.name}>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-sm font-bold leading-snug text-zinc-100">{row.name || "Not stated"}</div>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-right text-sm text-zinc-500">{plain.format(row.records)}</div>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-right text-sm text-zinc-500">{fmtAmount(row.amount)}</div>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-right text-sm text-zinc-500">{fmtAmount(average(row))}</div>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-sm text-zinc-500">{compactDate(row.start_date)}</div>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-sm text-zinc-500">{compactDate(row.end_date)}</div>
          </Fragment>
        ))}
    </div>
  );
}

function ContractsList({
  rows,
  filters,
  startYear,
  endYear,
}: {
  rows: AwardRecord[];
  filters: Record<FilterKey, string[]>;
  startYear: number;
  endYear: number;
}) {
  type ContractSort = "award_date" | "awardee_name" | "organization_name" | "business_category" | "area_of_delivery" | "contract_amount";
  const [sort, setSort] = useState<ContractSort>("contract_amount");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  function changeSort(key: ContractSort) {
    if (sort === key) setDirection((current) => (current === "desc" ? "asc" : "desc"));
    else {
      setSort(key);
      setDirection("desc");
    }
  }
  const sortMark = (key: ContractSort) => (sort === key ? (direction === "desc" ? " ↓" : " ↑") : "");
  const selected = {
    awardees: new Set(filters.awardees),
    areas: new Set(filters.areas),
    categories: new Set(filters.categories),
    organizations: new Set(filters.organizations),
  };
  const filtered = rows
    .filter((row) => {
      const year = row.award_date ? Number(String(row.award_date).slice(0, 4)) : null;
      return year !== null && year >= startYear && year <= endYear;
    })
    .filter((row) => !selected.awardees.size || selected.awardees.has(row.awardee_name))
    .filter((row) => !selected.areas.size || selected.areas.has(row.area_of_delivery || ""))
    .filter((row) => !selected.categories.size || selected.categories.has(row.business_category))
    .filter((row) => !selected.organizations.size || selected.organizations.has(row.organization_name))
    .sort((a, b) => {
      const result = sort === "contract_amount" ? b.contract_amount - a.contract_amount : String(b[sort] || "").localeCompare(String(a[sort] || ""));
      return direction === "desc" ? result : -result;
    })
    .slice(0, 80);

  return (
    <section className={`${ui.panel} overflow-hidden`}>
      <div className="border-b border-zinc-800 p-3">
        <p className={ui.eyebrow}>Contracts</p>
        <h2 className="text-lg font-black leading-tight text-zinc-100">List of contracts</h2>
        <p className="mt-1 text-sm leading-snug text-zinc-500">Award records for the current dashboard view.</p>
      </div>
      <div className="grid max-h-[520px] min-w-[1080px] grid-cols-[110px_minmax(220px,1fr)_minmax(260px,1.2fr)_180px_150px_160px] overflow-auto">
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("award_date")}>
          Date{sortMark("award_date")}
        </button>
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("awardee_name")}>
          Awardee{sortMark("awardee_name")}
        </button>
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("organization_name")}>
          Agency{sortMark("organization_name")}
        </button>
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("business_category")}>
          Category{sortMark("business_category")}
        </button>
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-left text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("area_of_delivery")}>
          Area{sortMark("area_of_delivery")}
        </button>
        <button className="sticky top-0 z-10 min-h-9 border-b border-zinc-800 bg-zinc-950 p-2.5 text-right text-[11px] font-black uppercase tracking-wider text-zinc-500" type="button" onClick={() => changeSort("contract_amount")}>
          Contract value{sortMark("contract_amount")}
        </button>
        {!filtered.length && <div className="col-span-6 border-b border-zinc-900 p-5 text-sm text-zinc-500">No contract records found for this view.</div>}
        {filtered.map((row, index) => (
          <Fragment key={`${row.reference_id || row.contract_no || "missing"}-${index}`}>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-sm text-zinc-500">{compactDate(row.award_date || "")}</div>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-sm font-bold leading-snug text-zinc-100">{row.awardee_name}</div>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-sm text-zinc-500">{row.organization_name}</div>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-sm text-zinc-500">{row.business_category}</div>
            <div className="border-b border-zinc-900 bg-black/20 p-2.5 text-sm text-zinc-500">{row.area_of_delivery || "Not stated"}</div>
            <div className="whitespace-nowrap border-b border-zinc-900 bg-black/20 p-2.5 text-right text-sm font-black text-zinc-100">{fmtAmount(row.contract_amount)}</div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}

function Dashboard() {
  const years = defaultYears;
  const [startYear, setStartYear] = useState(years[0]);
  const [endYear, setEndYear] = useState(years.at(-1) || years[0]);
  const [filters, setFilters] = useState<Record<FilterKey, string[]>>({ awardees: [], areas: [], categories: [], organizations: [] });
  const [rankingTab, setRankingTab] = useState<FilterKey>("awardees");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterWrapRef = useRef<HTMLDivElement | null>(null);
  const scope = useMemo(() => ({ startYear, endYear, filters }), [endYear, filters, startYear]);
  const { summary, yearRows, monthlyRows, amountBands, contracts, rankingRows, filterOptions, loading, error } = useDashboardApi(scope, rankingTab);

  const totalValue = summary?.total_amount || 0;
  const totalContracts = summary?.records || 0;
  const activeGroups = (Object.keys(filters) as FilterKey[]).filter((key) => filters[key].length);
  const activeFilterCount = activeGroups.reduce((sum, key) => sum + filters[key].length, 0);
  const exactNote = activeGroups.length <= 1 ? "Selected date range and exact solo filter" : "Selected date range; combined dimensions are noted above";

  function setFilter(key: FilterKey, next: string[]) {
    setFilters((current) => ({ ...current, [key]: next }));
  }

  function clearAllFilters() {
    setStartYear(years[0]);
    setEndYear(years.at(-1) || years[0]);
    setFilters({ awardees: [], areas: [], categories: [], organizations: [] });
  }

  useEffect(() => {
    if (!filterOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (filterWrapRef.current && !filterWrapRef.current.contains(event.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [filterOpen]);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="relative z-40 border-b border-zinc-900 bg-black px-4 py-5 sm:px-6 lg:px-11">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <AwardWatchLogo />
          <div>
            <h1 className="max-w-5xl text-2xl font-semibold leading-tight tracking-[-0.01em] text-zinc-100 sm:text-3xl lg:text-4xl">AwardWatch PH Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-snug text-zinc-500 sm:text-base">A PhilGEPS contract award tracker for seeing where public procurement money goes, who wins contracts, and how awards shift over time.</p>
          </div>
        </div>
      </header>

      <main className="grid gap-2.5 px-3 py-3 sm:px-4 lg:px-11">
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
                  <button className={ui.button} type="button" onClick={clearAllFilters}>
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
                  <select className={ui.input} onChange={(event) => setStartYear(Number(event.target.value))} value={startYear}>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={ui.label}>
                  End year
                  <select className={ui.input} onChange={(event) => setEndYear(Number(event.target.value))} value={endYear}>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-2 flex snap-x gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
                <MultiPick title="Areas" rows={filterOptions.areas} selected={filters.areas} onChange={(next) => setFilter("areas", next)} />
                <MultiPick title="Awardees" rows={filterOptions.awardees} selected={filters.awardees} onChange={(next) => setFilter("awardees", next)} />
                <MultiPick title="Business categories" rows={filterOptions.categories} selected={filters.categories} onChange={(next) => setFilter("categories", next)} />
                <MultiPick title="Organizations" rows={filterOptions.organizations} selected={filters.organizations} onChange={(next) => setFilter("organizations", next)} />
              </div>
            </section>
          )}
        </div>

        {error && <section className={`${ui.panel} p-3 text-sm text-red-300`}>Dashboard API failed to load: {error}</section>}
        {loading && <section className={`${ui.panel} p-3 text-sm text-zinc-500`}>Loading dashboard data...</section>}

        <KpiGrid
          items={[
            ["Total Awarded Value", fmtAmount(totalValue), exactNote],
            ["Number Of contracts", plain.format(totalContracts), "Award records in the selected view"],
            ["Average value of contracts", fmtAmount(totalValue / Math.max(totalContracts, 1)), "Total value divided by contract count"],
            ["Top Awardee", summary?.top_awardee || "Not available", activeFilterCount ? "Top awardee in selected view" : "Highest total awardee overall"],
          ]}
        />

        <section className={`${ui.panel} ${ui.panelPad}`}>
          <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <p className={ui.eyebrow}>Awarded over time</p>
              <h2 className="text-lg font-black leading-tight text-zinc-100" id="year-caption">Yearly awarded value</h2>
              <p className="mt-1 text-sm leading-snug text-zinc-500">Annual awarded contract value for the selected dashboard view.</p>
            </div>
          </div>
          <LineChart captionId="year-caption" rows={yearRows} />
        </section>

        <ContractsList rows={contracts} filters={filters} startYear={startYear} endYear={endYear} />

        <section className={`${ui.panel} overflow-hidden`}>
          <div className="flex flex-col justify-between gap-3 border-b border-zinc-800 p-3 lg:flex-row lg:items-center">
            <div>
              <p className={ui.eyebrow}>Rankings</p>
              <h2 className="text-lg font-black leading-tight text-zinc-100">Contract award rankings</h2>
              <p className="mt-1 text-sm leading-snug text-zinc-500">Compare suppliers, delivery areas, business categories, and agencies by contract count, total value, average value, and date span.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
                <button className={`${ui.button} ${rankingTab === key ? "border-zinc-500 bg-zinc-800 text-zinc-100" : ""}`} key={key} onClick={() => setRankingTab(key)} type="button">
                  {filterLabels[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <RankingExplorer rows={rankingRows} selected={filters[rankingTab]} />
          </div>
        </section>

        <section className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className={`${ui.panel} ${ui.panelPad}`}>
            <div className="mb-2">
              <p className={ui.eyebrow}>Monthly trend</p>
              <h2 className="text-lg font-black leading-tight text-zinc-100">Monthly awarded value in {endYear}</h2>
              <p className="mt-1 text-sm leading-snug text-zinc-500">January to December monthly awarded value, with missing months shown as zero.</p>
            </div>
            <BarChart rows={monthlyRows} kind="months" />
          </article>
          <article className={`${ui.panel} ${ui.panelPad}`}>
            <div className="mb-2">
              <p className={ui.eyebrow}>Distribution</p>
              <h2 className="text-lg font-black leading-tight text-zinc-100">Awards amount distribution</h2>
              <p className="mt-1 text-sm leading-snug text-zinc-500">Contract records grouped by awarded value range.</p>
            </div>
            <BarChart rows={amountBands} kind="bands" />
          </article>
        </section>

        <footer className="py-2 text-sm text-zinc-500">
          Data source:{" "}
          <a className="text-lime-300 underline-offset-4 hover:underline" href="https://data.bettergov.ph/datasets/5" target="_blank" rel="noreferrer">
            BetterGov Open Data Portal
          </a>
        </footer>
      </main>
    </div>
  );
}

function App() {
  return <Dashboard />;
}

export default App;
