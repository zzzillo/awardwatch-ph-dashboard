import { useMemo, useState } from "react";
import { BrandHeader } from "./components/BrandHeader";
import { LineChart, BarChart } from "./components/Charts";
import { DashboardFilters } from "./components/DashboardFilters";
import { KpiGrid } from "./components/KpiGrid";
import { ContractsList, RankingExplorer } from "./components/Tables";
import { defaultYears, filterLabels, type FilterKey, ui } from "./dashboard/config";
import { useDashboardApi } from "./dashboard/hooks";
import { fmtAmount, plain } from "./utils";

function App() {
  const years = defaultYears;
  const [startYear, setStartYear] = useState(years[0]);
  const [endYear, setEndYear] = useState(years.at(-1) || years[0]);
  const [filters, setFilters] = useState<Record<FilterKey, string[]>>({ awardees: [], areas: [], categories: [], organizations: [] });
  const [rankingTab, setRankingTab] = useState<FilterKey>("awardees");
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

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <BrandHeader />

      <main className="grid gap-2.5 px-3 py-3 sm:px-4 lg:px-11">
        <DashboardFilters
          years={years}
          startYear={startYear}
          endYear={endYear}
          filters={filters}
          filterOptions={filterOptions}
          onStartYearChange={setStartYear}
          onEndYearChange={setEndYear}
          onFilterChange={setFilter}
          onClearAll={clearAllFilters}
        />

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

export default App;
