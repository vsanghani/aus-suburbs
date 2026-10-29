"""Curated and staging tables.

The Alembic SQL is the constraint source. These models name the same columns
so a later query can use them. The API does not read them yet. raw has no
tables: loaders own that schema.
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    Computed,
    Date,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    Numeric,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.geometry import Geometry

CURATED = "curated"
STAGING = "staging"
_PLACE_KEY = (
    "CASE WHEN sal_code IS NOT NULL THEN 'sal:' || sal_code "
    "WHEN lga_code IS NOT NULL THEN 'lga:' || lga_code "
    "ELSE 'ste:' || state_code END"
)


class Base(DeclarativeBase):
    pass


class State(Base):
    __tablename__ = "state"
    __table_args__ = {"schema": CURATED}

    code: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    ste_code_2021: Mapped[str] = mapped_column(Text, unique=True)
    in_catalogue: Mapped[bool] = mapped_column(Boolean)
    centre_longitude: Mapped[Decimal | None] = mapped_column(Numeric)
    centre_latitude: Mapped[Decimal | None] = mapped_column(Numeric)
    zoom: Mapped[Decimal | None] = mapped_column(Numeric)


class DatasetSource(Base):
    __tablename__ = "dataset_source"
    __table_args__ = {"schema": CURATED}

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    dataset_key: Mapped[str] = mapped_column(Text)
    version_label: Mapped[str] = mapped_column(Text)
    agency: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text)
    licence_id: Mapped[str] = mapped_column(Text)
    licence_text: Mapped[str] = mapped_column(Text)
    commercial_use_ok: Mapped[bool] = mapped_column(Boolean)
    source_url: Mapped[str] = mapped_column(Text)
    published_date: Mapped[date | None] = mapped_column(Date)
    fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    file_checksum: Mapped[str | None] = mapped_column(Text)
    state_scope: Mapped[list[str]] = mapped_column(ARRAY(Text))
    refresh_frequency: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)


class Sa4(Base):
    __tablename__ = "sa4"
    __table_args__ = {"schema": CURATED}

    sa4_code: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    state_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.state.code"))
    slug: Mapped[str] = mapped_column(Text)


class Lga(Base):
    __tablename__ = "lga"
    __table_args__ = {"schema": CURATED}

    lga_code: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    state_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.state.code"))
    slug: Mapped[str] = mapped_column(Text)
    is_council: Mapped[bool] = mapped_column(Boolean)
    geom: Mapped[object | None] = mapped_column(Geometry("MultiPolygon", 4326))
    centroid: Mapped[object | None] = mapped_column(Geometry("Point", 4326))
    area_sqkm: Mapped[Decimal | None] = mapped_column(Numeric)


class Postcode(Base):
    __tablename__ = "postcode"
    __table_args__ = {"schema": CURATED}

    postcode: Mapped[str] = mapped_column(Text, primary_key=True)


class Sal(Base):
    __tablename__ = "sal"
    __table_args__ = {"schema": CURATED}

    sal_code: Mapped[str] = mapped_column(Text, primary_key=True)
    sal_name: Mapped[str] = mapped_column(Text)
    state_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.state.code"))
    slug: Mapped[str] = mapped_column(Text)
    path: Mapped[str] = mapped_column(Text, Computed("state_code || '/' || slug", persisted=True))
    geom: Mapped[object] = mapped_column(Geometry("MultiPolygon", 4326))
    centroid: Mapped[object] = mapped_column(Geometry("Point", 4326))
    area_sqkm: Mapped[Decimal | None] = mapped_column(Numeric)
    asgs_loci_uri: Mapped[str | None] = mapped_column(Text)
    traditional_owners: Mapped[str | None] = mapped_column(Text)
    traditional_owners_source_id: Mapped[int | None] = mapped_column(
        ForeignKey(f"{CURATED}.dataset_source.id")
    )


class SalPostcode(Base):
    __tablename__ = "sal_postcode"
    __table_args__ = {"schema": CURATED}

    sal_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.sal.sal_code"), primary_key=True)
    postcode: Mapped[str] = mapped_column(
        ForeignKey(f"{CURATED}.postcode.postcode"), primary_key=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean)


class SalLga(Base):
    __tablename__ = "sal_lga"
    __table_args__ = {"schema": CURATED}

    sal_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.sal.sal_code"), primary_key=True)
    lga_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.lga.lga_code"), primary_key=True)
    area_share: Mapped[Decimal | None] = mapped_column(Numeric)
    is_primary: Mapped[bool] = mapped_column(Boolean)


class SalSa4(Base):
    __tablename__ = "sal_sa4"
    __table_args__ = {"schema": CURATED}

    sal_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.sal.sal_code"), primary_key=True)
    sa4_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.sa4.sa4_code"), primary_key=True)
    area_share: Mapped[Decimal | None] = mapped_column(Numeric)
    is_primary: Mapped[bool] = mapped_column(Boolean)


class SlugRedirect(Base):
    __tablename__ = "slug_redirect"
    __table_args__ = {"schema": CURATED}

    state_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.state.code"), primary_key=True)
    old_slug: Mapped[str] = mapped_column(Text, primary_key=True)
    sal_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.sal.sal_code"))
    redirected_on: Mapped[date] = mapped_column(Date)
    reason: Mapped[str | None] = mapped_column(Text)


class FormulaGroup(Base):
    __tablename__ = "formula_group"
    __table_args__ = {"schema": CURATED}

    group_id: Mapped[str] = mapped_column(Text, primary_key=True)
    label: Mapped[str] = mapped_column(Text)
    direction: Mapped[str] = mapped_column(Text)
    draft_max_points: Mapped[Decimal] = mapped_column(Numeric)
    summary: Mapped[str] = mapped_column(Text)


class ScoreTier(Base):
    __tablename__ = "score_tier"
    __table_args__ = {"schema": CURATED}

    tier_id: Mapped[str] = mapped_column(Text, primary_key=True)
    label: Mapped[str] = mapped_column(Text)
    minimum: Mapped[Decimal] = mapped_column(Numeric)
    meaning: Mapped[str] = mapped_column(Text)


class ReadinessRule(Base):
    __tablename__ = "readiness_rule"
    __table_args__ = {"schema": CURATED}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    min_sections_filled: Mapped[int] = mapped_column(Integer)
    min_own_figure_sections: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ReadinessSection(Base):
    __tablename__ = "readiness_section"
    __table_args__ = {"schema": CURATED}

    section_id: Mapped[str] = mapped_column(Text, primary_key=True)
    counts_toward_indexable: Mapped[bool] = mapped_column(Boolean)


class MetricDefinition(Base):
    __tablename__ = "metric_definition"
    __table_args__ = {"schema": CURATED}

    metric_key: Mapped[str] = mapped_column(Text, primary_key=True)
    label: Mapped[str] = mapped_column(Text)
    section_id: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.readiness_section.section_id"))
    group_id: Mapped[str | None] = mapped_column(Text)
    unit: Mapped[str | None] = mapped_column(Text)
    direction: Mapped[str] = mapped_column(Text)
    value_kind: Mapped[str] = mapped_column(Text)
    formula_group_id: Mapped[str | None] = mapped_column(
        ForeignKey(f"{CURATED}.formula_group.group_id")
    )
    map_metric: Mapped[bool] = mapped_column(Boolean)
    description: Mapped[str] = mapped_column(Text)


class MetricValue(Base):
    __tablename__ = "metric_value"
    __table_args__ = {"schema": CURATED}

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    sal_code: Mapped[str | None] = mapped_column(ForeignKey(f"{CURATED}.sal.sal_code"))
    lga_code: Mapped[str | None] = mapped_column(ForeignKey(f"{CURATED}.lga.lga_code"))
    state_code: Mapped[str | None] = mapped_column(ForeignKey(f"{CURATED}.state.code"))
    place_key: Mapped[str] = mapped_column(Text, Computed(_PLACE_KEY, persisted=True))
    metric_key: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.metric_definition.metric_key"))
    period_label: Mapped[str] = mapped_column(Text)
    as_of: Mapped[date | None] = mapped_column(Date)
    value: Mapped[Decimal | None] = mapped_column(Numeric)
    value_text: Mapped[str | None] = mapped_column(Text)
    unit: Mapped[str | None] = mapped_column(Text)
    geo_level: Mapped[str] = mapped_column(Text)
    fallback_from: Mapped[str | None] = mapped_column(Text)
    dataset_source_id: Mapped[int] = mapped_column(ForeignKey(f"{CURATED}.dataset_source.id"))
    quality_flag: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    not_available_reason: Mapped[str | None] = mapped_column(Text)


class MetricValueInput(Base):
    __tablename__ = "metric_value_input"
    __table_args__ = {"schema": CURATED}

    metric_value_id: Mapped[int] = mapped_column(
        ForeignKey(f"{CURATED}.metric_value.id"), primary_key=True
    )
    dataset_source_id: Mapped[int] = mapped_column(
        ForeignKey(f"{CURATED}.dataset_source.id"), primary_key=True
    )


class OffenceCount(Base):
    __tablename__ = "offence_count"
    __table_args__ = {"schema": CURATED}

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    sal_code: Mapped[str | None] = mapped_column(ForeignKey(f"{CURATED}.sal.sal_code"))
    lga_code: Mapped[str | None] = mapped_column(ForeignKey(f"{CURATED}.lga.lga_code"))
    state_code: Mapped[str | None] = mapped_column(ForeignKey(f"{CURATED}.state.code"))
    place_key: Mapped[str] = mapped_column(Text, Computed(_PLACE_KEY, persisted=True))
    dataset_source_id: Mapped[int] = mapped_column(ForeignKey(f"{CURATED}.dataset_source.id"))
    period_label: Mapped[str] = mapped_column(Text)
    as_of: Mapped[date | None] = mapped_column(Date)
    category: Mapped[str] = mapped_column(Text)
    offence: Mapped[str] = mapped_column(Text)
    recorded_count: Mapped[Decimal | None] = mapped_column(Numeric)
    rate_per_1000: Mapped[Decimal | None] = mapped_column(Numeric)
    geo_level: Mapped[str] = mapped_column(Text)
    fallback_from: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    not_available_reason: Mapped[str | None] = mapped_column(Text)
    quality_flag: Mapped[str | None] = mapped_column(Text)


class AmenityType(Base):
    __tablename__ = "amenity_type"
    __table_args__ = {"schema": CURATED}

    type_key: Mapped[str] = mapped_column(Text, primary_key=True)
    label: Mapped[str] = mapped_column(Text)
    place_group: Mapped[str | None] = mapped_column(Text)


class AmenityFeature(Base):
    __tablename__ = "amenity_feature"
    __table_args__ = {"schema": CURATED}

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    feature_type: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.amenity_type.type_key"))
    name: Mapped[str] = mapped_column(Text)
    geom: Mapped[object] = mapped_column(Geometry("Point", 4326))
    state_code: Mapped[str | None] = mapped_column(ForeignKey(f"{CURATED}.state.code"))
    sal_code: Mapped[str | None] = mapped_column(ForeignKey(f"{CURATED}.sal.sal_code"))
    dataset_source_id: Mapped[int] = mapped_column(ForeignKey(f"{CURATED}.dataset_source.id"))
    source_feature_id: Mapped[str] = mapped_column(Text)
    subtype: Mapped[str | None] = mapped_column(Text)
    attributes: Mapped[dict[str, object]] = mapped_column(JSONB)


class TransitStop(Base):
    __tablename__ = "transit_stop"
    __table_args__ = {"schema": CURATED}

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    dataset_source_id: Mapped[int] = mapped_column(ForeignKey(f"{CURATED}.dataset_source.id"))
    source_stop_id: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    geom: Mapped[object] = mapped_column(Geometry("Point", 4326))
    state_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.state.code"))
    mode: Mapped[str] = mapped_column(Text)
    location_type: Mapped[str | None] = mapped_column(Text)
    parent_source_stop_id: Mapped[str | None] = mapped_column(Text)


class PlanningOverlay(Base):
    __tablename__ = "planning_overlay"
    __table_args__ = {"schema": CURATED}

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    dataset_source_id: Mapped[int] = mapped_column(ForeignKey(f"{CURATED}.dataset_source.id"))
    state_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.state.code"))
    overlay_family: Mapped[str] = mapped_column(Text)
    overlay_code: Mapped[str] = mapped_column(Text)
    name: Mapped[str | None] = mapped_column(Text)
    geom: Mapped[object] = mapped_column(Geometry("MultiPolygon", 4326))
    source_feature_id: Mapped[str] = mapped_column(Text)


class ScoreRun(Base):
    __tablename__ = "score_run"
    __table_args__ = {"schema": CURATED}

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    formula_key: Mapped[str] = mapped_column(Text)
    formula_status: Mapped[str] = mapped_column(Text)
    base: Mapped[Decimal] = mapped_column(Numeric)
    floor: Mapped[Decimal] = mapped_column(Numeric)
    ceiling: Mapped[Decimal] = mapped_column(Numeric)
    formula_document: Mapped[dict[str, object]] = mapped_column(JSONB)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)


class PlaceScore(Base):
    __tablename__ = "place_score"
    __table_args__ = {"schema": CURATED}

    score_run_id: Mapped[int] = mapped_column(
        ForeignKey(f"{CURATED}.score_run.id"), primary_key=True
    )
    sal_code: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.sal.sal_code"), primary_key=True)
    score: Mapped[Decimal] = mapped_column(Numeric)
    tier_id: Mapped[str] = mapped_column(ForeignKey(f"{CURATED}.score_tier.tier_id"))
    inputs_used: Mapped[int] = mapped_column(Integer)
    inputs_skipped: Mapped[int] = mapped_column(Integer)
    geo_level: Mapped[str] = mapped_column(Text)
    fallback_from: Mapped[str | None] = mapped_column(Text)


class PlaceScoreGroup(Base):
    __tablename__ = "place_score_group"
    __table_args__ = {"schema": CURATED}

    score_run_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    sal_code: Mapped[str] = mapped_column(Text, primary_key=True)
    group_id: Mapped[str] = mapped_column(
        ForeignKey(f"{CURATED}.formula_group.group_id"), primary_key=True
    )
    direction: Mapped[str] = mapped_column(Text)
    max_points: Mapped[Decimal] = mapped_column(Numeric)
    points: Mapped[Decimal | None] = mapped_column(Numeric)
    skipped: Mapped[bool] = mapped_column(Boolean)
    skip_reason: Mapped[str | None] = mapped_column(Text)
    metric_key: Mapped[str | None] = mapped_column(
        ForeignKey(f"{CURATED}.metric_definition.metric_key")
    )
    raw_value: Mapped[Decimal | None] = mapped_column(Numeric)
    raw_unit: Mapped[str | None] = mapped_column(Text)
    chart_value: Mapped[Decimal | None] = mapped_column(Numeric)


class LoadBatch(Base):
    __tablename__ = "load_batch"
    __table_args__ = {"schema": STAGING}

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    dataset_key: Mapped[str] = mapped_column(Text)
    dataset_source_id: Mapped[int | None] = mapped_column(
        ForeignKey(f"{CURATED}.dataset_source.id")
    )
    status: Mapped[str] = mapped_column(Text)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    file_checksum: Mapped[str | None] = mapped_column(Text)
    row_count: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)


class SalLoad(Base):
    __tablename__ = "sal_load"
    __table_args__ = {"schema": STAGING}

    load_batch_id: Mapped[int] = mapped_column(
        ForeignKey(f"{STAGING}.load_batch.id"), primary_key=True
    )
    sal_code: Mapped[str] = mapped_column(Text, primary_key=True)
    sal_name: Mapped[str] = mapped_column(Text)
    state_code: Mapped[str] = mapped_column(Text)
    slug: Mapped[str | None] = mapped_column(Text)
    geom: Mapped[object | None] = mapped_column(Geometry("MultiPolygon", 4326))
    centroid: Mapped[object | None] = mapped_column(Geometry("Point", 4326))
    area_sqkm: Mapped[Decimal | None] = mapped_column(Numeric)


class MetricValueLoad(Base):
    __tablename__ = "metric_value_load"
    __table_args__ = {"schema": STAGING}

    load_batch_id: Mapped[int] = mapped_column(
        ForeignKey(f"{STAGING}.load_batch.id"), primary_key=True
    )
    place_kind: Mapped[str] = mapped_column(Text, primary_key=True)
    place_code: Mapped[str] = mapped_column(Text, primary_key=True)
    metric_key: Mapped[str] = mapped_column(Text, primary_key=True)
    period_label: Mapped[str] = mapped_column(Text, primary_key=True)
    as_of: Mapped[date | None] = mapped_column(Date)
    value: Mapped[Decimal | None] = mapped_column(Numeric)
    value_text: Mapped[str | None] = mapped_column(Text)
    unit: Mapped[str | None] = mapped_column(Text)
    geo_level: Mapped[str] = mapped_column(Text)
    fallback_from: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    not_available_reason: Mapped[str | None] = mapped_column(Text)
    quality_flag: Mapped[str | None] = mapped_column(Text)


class AmenityFeatureLoad(Base):
    __tablename__ = "amenity_feature_load"
    __table_args__ = {"schema": STAGING}

    load_batch_id: Mapped[int] = mapped_column(
        ForeignKey(f"{STAGING}.load_batch.id"), primary_key=True
    )
    source_feature_id: Mapped[str] = mapped_column(Text, primary_key=True)
    feature_type: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    geom: Mapped[object | None] = mapped_column(Geometry("Point", 4326))
    state_code: Mapped[str | None] = mapped_column(Text)
    subtype: Mapped[str | None] = mapped_column(Text)
    attributes: Mapped[dict[str, object]] = mapped_column(JSONB)


class TransitStopLoad(Base):
    __tablename__ = "transit_stop_load"
    __table_args__ = {"schema": STAGING}

    load_batch_id: Mapped[int] = mapped_column(
        ForeignKey(f"{STAGING}.load_batch.id"), primary_key=True
    )
    source_stop_id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    geom: Mapped[object | None] = mapped_column(Geometry("Point", 4326))
    state_code: Mapped[str] = mapped_column(Text)
    mode: Mapped[str] = mapped_column(Text)


class PlanningOverlayLoad(Base):
    __tablename__ = "planning_overlay_load"
    __table_args__ = {"schema": STAGING}

    load_batch_id: Mapped[int] = mapped_column(
        ForeignKey(f"{STAGING}.load_batch.id"), primary_key=True
    )
    source_feature_id: Mapped[str] = mapped_column(Text, primary_key=True)
    state_code: Mapped[str] = mapped_column(Text)
    overlay_family: Mapped[str] = mapped_column(Text)
    overlay_code: Mapped[str] = mapped_column(Text)
    name: Mapped[str | None] = mapped_column(Text)
    geom: Mapped[object | None] = mapped_column(Geometry("MultiPolygon", 4326))


class OffenceCountLoad(Base):
    __tablename__ = "offence_count_load"
    __table_args__ = {"schema": STAGING}

    load_batch_id: Mapped[int] = mapped_column(
        ForeignKey(f"{STAGING}.load_batch.id"), primary_key=True
    )
    place_kind: Mapped[str] = mapped_column(Text, primary_key=True)
    place_code: Mapped[str] = mapped_column(Text, primary_key=True)
    period_label: Mapped[str] = mapped_column(Text, primary_key=True)
    category: Mapped[str] = mapped_column(Text, primary_key=True)
    offence: Mapped[str] = mapped_column(Text, primary_key=True)
    as_of: Mapped[date | None] = mapped_column(Date)
    recorded_count: Mapped[Decimal | None] = mapped_column(Numeric)
    rate_per_1000: Mapped[Decimal | None] = mapped_column(Numeric)
    geo_level: Mapped[str] = mapped_column(Text)
    fallback_from: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    not_available_reason: Mapped[str | None] = mapped_column(Text)
