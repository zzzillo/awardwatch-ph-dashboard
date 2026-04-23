export type Metric = "amount" | "records" | "median_amount";
export type Page =
  | "overview"
  | "custom"
  | "trends"
  | "entities"
  | "suppliers"
  | "categories"
  | "geography"
  | "records"
  | "sources";
export type Scope = "all" | "area" | "organization" | "category";
export type SortKey = "amount" | "records" | "average" | "start_date" | "end_date" | "name";

export interface Summary {
  records: number;
  total_amount: number;
  average_amount: number;
  median_amount: number;
  largest_amount: number;
  organizations: number;
  awardees: number;
  business_categories: number;
  delivery_areas_including_null: number;
  date_min: string;
  date_max: string;
  missing_reference_id: number;
  missing_area_of_delivery: number;
  missing_award_date: number;
  missing_award_title: number;
  missing_notice_title: number;
  pre_1990_dates: number;
  future_dates_after_current_year: number;
  duplicated_reference_ids: number;
  records_in_duplicated_references: number;
}

export interface YearRow {
  year: number | null;
  records: number;
  amount: number;
  median_amount: number;
}

export interface TopRow {
  records: number;
  amount: number;
  median_amount?: number;
  organization_name?: string;
  awardee_name?: string;
  business_category?: string;
  area_of_delivery?: string | null;
}

export interface RankingRow {
  name: string;
  records: number;
  amount: number;
  start_date: string;
  end_date: string;
}

export interface DimensionYearRow {
  year: number;
  records: number;
  amount: number;
  median_amount: number;
  organization_name?: string;
  awardee_name?: string;
  business_category?: string;
  area_of_delivery?: string | null;
}

export interface PairingRow {
  records: number;
  amount: number;
  rank: number;
  organization_name?: string;
  awardee_name?: string;
  business_category?: string;
  area_of_delivery?: string | null;
}

export interface AmountBandRow {
  band: string;
  records: number;
  amount: number;
}

export interface MonthlyRow {
  year: number;
  month: number;
  records: number;
  amount: number;
}

export interface AwardRecord {
  reference_id: string | null;
  contract_no: string | null;
  award_title: string | null;
  notice_title: string | null;
  awardee_name: string;
  organization_name: string;
  area_of_delivery: string | null;
  business_category: string;
  contract_amount: number;
  award_date: string | null;
}

export interface DashboardData {
  generated_at: string;
  source_files: string[];
  schema: Record<string, string>;
  summary: Summary;
  dimensions: Record<string, unknown>;
  by_year: YearRow[];
  monthly_value: MonthlyRow[];
  amount_bands: AmountBandRow[];
  category_year: DimensionYearRow[];
  area_year: DimensionYearRow[];
  top_categories: TopRow[];
  top_areas: TopRow[];
  top_organizations: TopRow[];
  top_awardees: TopRow[];
  largest_records: AwardRecord[];
  recent_records: AwardRecord[];
  contract_records: AwardRecord[];
  full_rankings: {
    organizations: RankingRow[];
    awardees: RankingRow[];
    business_categories: RankingRow[];
    delivery_areas: RankingRow[];
  };
  filter_views: {
    organization_year: DimensionYearRow[];
    category_year: DimensionYearRow[];
    area_year: DimensionYearRow[];
    awardee_year: DimensionYearRow[];
    area_categories: PairingRow[];
    category_areas: PairingRow[];
    organization_categories: PairingRow[];
    area_awardees: PairingRow[];
    category_awardees: PairingRow[];
    organization_awardees: PairingRow[];
  };
  notes: string[];
}
