import { Fragment, useMemo, useState } from "react";
import type { AwardRecord, RankingRow, SortKey } from "../types";
import { compact, fmtAmount, plain, sortRankings } from "../utils";
import type { FilterKey } from "../dashboard/config";
import { ui } from "../dashboard/config";

function compactDate(value: string) {
  return value ? value.slice(0, 10) : "Missing";
}

function average(row: Pick<RankingRow, "amount" | "records">) {
  return row.amount / Math.max(row.records, 1);
}

function filterRankRows(rows: RankingRow[], selected: string[]) {
  if (!selected.length) return rows;
  const selectedSet = new Set(selected);
  return rows.filter((row) => selectedSet.has(row.name));
}

export function RankingExplorer({ rows, selected }: { rows: RankingRow[]; selected: string[] }) {
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

export function ContractsList({
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
