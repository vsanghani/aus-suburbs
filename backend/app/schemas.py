from datetime import date
from typing import Any, Literal

from pydantic import BaseModel


class Problem(BaseModel):
    detail: str


class SourceRef(BaseModel):
    id: str
    name: str
    agency: str
    published: date | None
    licence: str | None
    url: str | None
    note: str | None


class ScoreDriver(BaseModel):
    id: str
    label: str
    direction: Literal["positive", "negative"]
    points: float | None
    raw_value: float | None
    raw_unit: str | None
    context: str | None
    # Optional 0–100 position for charts. Points stay in the composite's own units.
    chart_value: float | None


class ScoreDetail(BaseModel):
    value: float | None
    tier: str | None
    base: float
    drivers: list[ScoreDriver]


class RankBadge(BaseModel):
    list_slug: str
    list_title: str
    position: int | None
    scope: str | None


class MetricValue(BaseModel):
    id: str
    label: str
    group: str | None
    value: float | str | None
    unit: str | None
    context_label: str | None
    context_value: str | None
    tier: str | None
    note: str | None


class SeriesPoint(BaseModel):
    year: int
    value: float | None


class TimeSeries(BaseModel):
    id: str
    label: str
    unit: str | None
    group: str | None
    reference_label: str | None
    reference_value: float | None
    points: list[SeriesPoint]
    narrative: str | None


class TableColumn(BaseModel):
    id: str
    label: str


class DataTable(BaseModel):
    id: str
    label: str
    group: str | None
    columns: list[TableColumn]
    rows: list[dict[str, str | float | int | None]]


class NamedPlace(BaseModel):
    id: str
    name: str
    group: str | None
    kind: str | None
    sector: str | None
    distance_m: int | None
    detail: str | None
    latitude: float | None
    longitude: float | None


class SectionPayload(BaseModel):
    updated: date | None
    narrative: str | None
    source: SourceRef | None
    metrics: list[MetricValue]
    series: list[TimeSeries]
    tables: list[DataTable]
    places: list[NamedPlace]
    notes: list[str]


class SuburbSummary(BaseModel):
    state: str
    slug: str
    name: str
    postcode: str | None
    council_name: str | None
    council_slug: str | None
    region_name: str | None
    region_slug: str | None
    traditional_owners: str | None
    population: int | None
    latitude: float | None
    longitude: float | None
    score: float | None
    tier: str | None
    blurb: str | None


class SuburbDetail(SuburbSummary):
    description: str | None
    description_source: SourceRef | None
    score_detail: ScoreDetail | None
    sections: dict[str, SectionPayload]
    nearby: list[SuburbSummary]
    ranks: list[RankBadge]
    geometry: dict[str, Any] | None


class SuburbListResponse(BaseModel):
    state: str | None
    dataset_connected: bool
    total: int | None
    offset: int
    limit: int
    suburbs: list[SuburbSummary]
    notice: str


class CouncilSummary(BaseModel):
    state: str
    slug: str
    name: str
    region_name: str | None
    region_slug: str | None
    score: float | None
    tier: str | None
    suburb_count: int | None


class CouncilDetail(CouncilSummary):
    narrative: str | None
    score_detail: ScoreDetail | None
    sections: dict[str, SectionPayload]
    suburbs: list[SuburbSummary]
    dataset_connected: bool
    notice: str


class RegionSummary(BaseModel):
    state: str
    slug: str
    name: str
    council_count: int | None


class StateDetail(BaseModel):
    code: str
    name: str
    dataset_connected: bool
    narrative: str | None
    suburb_count: int | None
    council_count: int | None
    regions: list[RegionSummary]
    councils: list[CouncilSummary]
    notice: str


class CouncilListResponse(BaseModel):
    state: str | None
    dataset_connected: bool
    councils: list[CouncilSummary]
    notice: str


class SearchResponse(BaseModel):
    query: str
    limit: int
    dataset_connected: bool
    results: list[SuburbSummary]
    councils: list[CouncilSummary]
    notice: str


class RankingInfo(BaseModel):
    slug: str
    title: str
    question: str
    unit: str | None
    value_label: str


class RankingRow(BaseModel):
    position: int
    place: SuburbSummary
    value: float | str | None
    value_label: str | None
    context: str | None
    tier: str | None


class RankingFilters(BaseModel):
    state: str | None
    region: str | None
    council: str | None


class RankingListResponse(BaseModel):
    rankings: list[RankingInfo]


class RankingResponse(BaseModel):
    ranking: RankingInfo
    dataset_connected: bool
    total: int | None
    offset: int
    limit: int
    filters: RankingFilters
    regions: list[RegionSummary]
    councils: list[CouncilSummary]
    rows: list[RankingRow]
    notice: str


class CompareResponse(BaseModel):
    requested: list[str]
    dataset_connected: bool
    places: list[SuburbDetail]
    omitted: list[str]
    notice: str


class Weights(BaseModel):
    budget: float
    commute: float
    schools: float
    safety: float
    quiet: float
    family: float
    errands: float
    green: float


class MatchResponse(BaseModel):
    weights: Weights
    normalised: Weights
    state: str | None
    budget_weekly: int | None
    commute_to: str | None
    needs_schools: bool
    limit: int
    dataset_connected: bool
    results: list[SuburbSummary]
    notice: str


class FeatureCollection(BaseModel):
    type: Literal["FeatureCollection"]
    features: list[dict[str, Any]]


class ExploreResponse(BaseModel):
    metric: str
    state: str | None
    layers: list[str]
    dataset_connected: bool
    feature_collection: FeatureCollection
    notice: str


class MethodologyGroup(BaseModel):
    id: str
    label: str
    direction: Literal["positive", "negative"]
    draft_max_points: float
    summary: str


class MethodologyTier(BaseModel):
    id: str
    label: str
    minimum: float
    meaning: str


class WeightDef(BaseModel):
    id: str
    label: str
    help: str


class MethodologyResponse(BaseModel):
    score_label: str
    status: str
    base: float
    ceiling: float
    floor: float
    summary: str
    groups: list[MethodologyGroup]
    tiers: list[MethodologyTier]
    weights: list[WeightDef]
    caveats: list[str]
    sources_connected: bool
    sources: list[SourceRef]


class CommuteMode(BaseModel):
    mode: Literal["transit", "drive", "cycle", "walk"]
    minutes: int | None
    note: str | None


class CommuteResponse(BaseModel):
    origin_state: str
    origin_slug: str
    destination: str
    dataset_connected: bool
    modes: list[CommuteMode]
    notice: str


class ExportResponse(BaseModel):
    dataset_connected: bool
    available: bool
    row_count: int | None
    notice: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    version: str
    environment: str
    database: Literal["ok", "unconfigured", "error"]
    redis: Literal["ok", "unconfigured", "error"]
