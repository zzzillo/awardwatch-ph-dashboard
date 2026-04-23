import { useEffect, useState } from "react";
import { fetchContracts, fetchDistribution, fetchFilterOptions, fetchMonthly, fetchRankings, fetchSummary, fetchYearly, type ApiSummary } from "../api";
import type { AmountBandRow, AwardRecord, MonthlyRow, RankingRow, YearRow } from "../types";
import type { FilterKey } from "./config";

export function useDashboardApi(scope: { startYear: number; endYear: number; filters: Record<FilterKey, string[]> }, rankingTab: FilterKey) {
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
    Promise.all([fetchFilterOptions("awardees"), fetchFilterOptions("areas"), fetchFilterOptions("categories"), fetchFilterOptions("organizations")])
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
    Promise.all([fetchSummary(scope), fetchYearly(scope), fetchMonthly(scope, scope.endYear), fetchDistribution(scope), fetchContracts(scope), fetchRankings(scope, rankingTab)])
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
