export type SourceRef = {
  id: string;
  name: string;
  agency: string;
  published: string | null;
  licence: string | null;
  url: string | null;
  note: string | null;
};

export type ScoreDriver = {
  id: string;
  label: string;
  direction: "positive" | "negative";
  points: number | null;
  raw_value: number | null;
  raw_unit: string | null;
  context: string | null;
  chart_value: number | null;
};

export type ScoreDetail = {
  value: number | null;
  tier: string | null;
  base: number;
  drivers: ScoreDriver[];
};

export type RankBadge = {
  list_slug: string;
  list_title: string;
  position: number | null;
  scope: string | null;
};

export type MetricValue = {
  id: string;
  label: string;
  group: string | null;
  value: number | string | null;
  unit: string | null;
  context_label: string | null;
  context_value: string | null;
  tier: string | null;
  note: string | null;
};

export type SeriesPoint = { year: number; value: number | null };

export type TimeSeries = {
  id: string;
  label: string;
  unit: string | null;
  group: string | null;
  reference_label: string | null;
  reference_value: number | null;
  points: SeriesPoint[];
  narrative: string | null;
};

export type TableColumn = { id: string; label: string };

export type DataTable = {
  id: string;
  label: string;
  group: string | null;
  columns: TableColumn[];
  rows: Record<string, string | number | null>[];
};

export type NamedPlace = {
  id: string;
  name: string;
  group: string | null;
  kind: string | null;
  sector: string | null;
  distance_m: number | null;
  detail: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type SectionPayload = {
  updated: string | null;
  narrative: string | null;
  source: SourceRef | null;
  metrics: MetricValue[];
  series: TimeSeries[];
  tables: DataTable[];
  places: NamedPlace[];
  notes: string[];
};

export type SuburbSummary = {
  state: string;
  slug: string;
  name: string;
  postcode: string | null;
  council_name: string | null;
  council_slug: string | null;
  region_name: string | null;
  region_slug: string | null;
  traditional_owners: string | null;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  score: number | null;
  tier: string | null;
  blurb: string | null;
};

export type SuburbDetail = SuburbSummary & {
  description: string | null;
  description_source: SourceRef | null;
  score_detail: ScoreDetail | null;
  sections: Record<string, SectionPayload>;
  nearby: SuburbSummary[];
  ranks: RankBadge[];
  geometry: Record<string, unknown> | null;
};

export type CouncilSummary = {
  state: string;
  slug: string;
  name: string;
  region_name: string | null;
  region_slug: string | null;
  score: number | null;
  tier: string | null;
  suburb_count: number | null;
};

export type CouncilDetail = CouncilSummary & {
  narrative: string | null;
  score_detail: ScoreDetail | null;
  sections: Record<string, SectionPayload>;
  suburbs: SuburbSummary[];
  dataset_connected: boolean;
  notice: string;
};

export type RegionSummary = {
  state: string;
  slug: string;
  name: string;
  council_count: number | null;
};

export type StateDetail = {
  code: string;
  name: string;
  dataset_connected: boolean;
  narrative: string | null;
  suburb_count: number | null;
  council_count: number | null;
  regions: RegionSummary[];
  councils: CouncilSummary[];
  notice: string;
};

export type CouncilListResponse = {
  state: string | null;
  dataset_connected: boolean;
  councils: CouncilSummary[];
  notice: string;
};

export type SearchResponse = {
  query: string;
  limit: number;
  dataset_connected: boolean;
  results: SuburbSummary[];
  councils: CouncilSummary[];
  notice: string;
};

export type RankingInfo = {
  slug: string;
  title: string;
  question: string;
  unit: string | null;
  value_label: string;
};

export type RankingRow = {
  position: number;
  place: SuburbSummary;
  value: number | string | null;
  value_label: string | null;
  context: string | null;
  tier: string | null;
};

export type RankingResponse = {
  ranking: RankingInfo;
  dataset_connected: boolean;
  total: number | null;
  offset: number;
  limit: number;
  filters: { state: string | null; region: string | null; council: string | null };
  regions: RegionSummary[];
  councils: CouncilSummary[];
  rows: RankingRow[];
  notice: string;
};

export type RankingListResponse = { rankings: RankingInfo[] };

export type CompareResponse = {
  requested: string[];
  dataset_connected: boolean;
  places: SuburbDetail[];
  omitted: string[];
  notice: string;
};

export type Weights = {
  budget: number;
  commute: number;
  schools: number;
  safety: number;
  quiet: number;
  family: number;
  errands: number;
  green: number;
};

export type MatchResponse = {
  weights: Weights;
  normalised: Weights;
  state: string | null;
  budget_weekly: number | null;
  commute_to: string | null;
  needs_schools: boolean;
  limit: number;
  dataset_connected: boolean;
  results: SuburbSummary[];
  notice: string;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: Record<string, unknown>[];
};

export type ExploreResponse = {
  metric: string;
  state: string | null;
  layers: string[];
  dataset_connected: boolean;
  feature_collection: FeatureCollection;
  notice: string;
};

export type MethodologyGroup = {
  id: string;
  label: string;
  direction: "positive" | "negative";
  draft_max_points: number;
  summary: string;
};

export type MethodologyTier = {
  id: string;
  label: string;
  minimum: number;
  meaning: string;
};

export type MethodologyResponse = {
  score_label: string;
  status: string;
  base: number;
  ceiling: number;
  floor: number;
  summary: string;
  groups: MethodologyGroup[];
  tiers: MethodologyTier[];
  weights: { id: string; label: string; help: string }[];
  caveats: string[];
  sources_connected: boolean;
  sources: SourceRef[];
};

export type CommuteMode = {
  mode: "transit" | "drive" | "cycle" | "walk";
  minutes: number | null;
  note: string | null;
};

export type CommuteResponse = {
  origin_state: string;
  origin_slug: string;
  destination: string;
  dataset_connected: boolean;
  modes: CommuteMode[];
  notice: string;
};

export type ExportResponse = {
  dataset_connected: boolean;
  available: boolean;
  row_count: number | null;
  notice: string;
};

export type HealthResponse = {
  status: "ok" | "degraded";
  version: string;
  environment: string;
  database: "ok" | "unconfigured" | "error";
  redis: "ok" | "unconfigured" | "error";
};
