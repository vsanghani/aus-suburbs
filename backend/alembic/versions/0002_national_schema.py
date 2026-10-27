"""National raw, staging, and curated schema.

Revision ID: 0002_national_schema
Revises: 0001_empty
Create Date: 2026-10-27

"""

from collections.abc import Sequence
from pathlib import Path

import sqlalchemy as sa
from alembic import op
from app.catalogue import load_formula, load_states
from app.metric_catalogue import metric_definitions
from app.reference import (
    AMENITY_TYPES,
    MIN_OWN_FIGURE_SECTIONS,
    MIN_SECTIONS_FILLED,
    OTHER_TERRITORIES_CODE,
    OTHER_TERRITORIES_NAME,
    READINESS_SECTIONS,
    STE_CODE_2021,
)
from app.sql_script import split_sql

revision: str = "0002_national_schema"
down_revision: str | None = "0001_empty"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SQL_DIR = Path(__file__).resolve().parent.parent / "sql"


def _run(name: str) -> None:
    script = (SQL_DIR / name).read_text(encoding="utf-8")
    bind = op.get_bind()
    for statement in split_sql(script):
        bind.exec_driver_sql(statement)


def upgrade() -> None:
    _run("0002_national_schema_upgrade.sql")
    _seed()


def downgrade() -> None:
    _run("0002_national_schema_downgrade.sql")


def _seed() -> None:
    bind = op.get_bind()
    formula = load_formula()
    for group in formula["groups"]:
        bind.execute(
            sa.text(
                """
                INSERT INTO curated.formula_group (
                  group_id, label, direction, draft_max_points, summary
                )
                VALUES (
                  :group_id, :label, :direction, :draft_max_points, :summary
                )
                """
            ),
            {
                "group_id": group["id"],
                "label": group["label"],
                "direction": group["direction"],
                "draft_max_points": group["draft_max_points"],
                "summary": group["summary"],
            },
        )
    for tier in formula["tiers"]:
        bind.execute(
            sa.text(
                """
                INSERT INTO curated.score_tier (tier_id, label, minimum, meaning)
                VALUES (:tier_id, :label, :minimum, :meaning)
                """
            ),
            {
                "tier_id": tier["id"],
                "label": tier["label"],
                "minimum": tier["minimum"],
                "meaning": tier["meaning"],
            },
        )
    centres = {item["code"]: item for item in load_states()}
    for code, ste_code in STE_CODE_2021.items():
        if code == OTHER_TERRITORIES_CODE:
            bind.execute(
                sa.text(
                    """
                    INSERT INTO curated.state (
                      code, name, ste_code_2021, in_catalogue,
                      centre_longitude, centre_latitude, zoom
                    )
                    VALUES (:code, :name, :ste_code, false, NULL, NULL, NULL)
                    """
                ),
                {
                    "code": code,
                    "name": OTHER_TERRITORIES_NAME,
                    "ste_code": ste_code,
                },
            )
            continue
        state = centres[code]
        longitude, latitude = state["centre"]
        bind.execute(
            sa.text(
                """
                INSERT INTO curated.state (
                  code, name, ste_code_2021, in_catalogue,
                  centre_longitude, centre_latitude, zoom
                )
                VALUES (
                  :code, :name, :ste_code, true,
                  :centre_longitude, :centre_latitude, :zoom
                )
                """
            ),
            {
                "code": code,
                "name": state["name"],
                "ste_code": ste_code,
                "centre_longitude": longitude,
                "centre_latitude": latitude,
                "zoom": state["zoom"],
            },
        )
    for section_id, counts in READINESS_SECTIONS:
        bind.execute(
            sa.text(
                """
                INSERT INTO curated.readiness_section (section_id, counts_toward_indexable)
                VALUES (:section_id, :counts)
                """
            ),
            {"section_id": section_id, "counts": counts},
        )
    bind.execute(
        sa.text(
            """
            INSERT INTO curated.readiness_rule (
              id, min_sections_filled, min_own_figure_sections
            )
            VALUES (1, :min_sections_filled, :min_own_figure_sections)
            """
        ),
        {
            "min_sections_filled": MIN_SECTIONS_FILLED,
            "min_own_figure_sections": MIN_OWN_FIGURE_SECTIONS,
        },
    )
    for metric in metric_definitions():
        bind.execute(
            sa.text(
                """
                INSERT INTO curated.metric_definition (
                  metric_key, label, section_id, group_id, unit, direction,
                  value_kind, formula_group_id, map_metric, description
                )
                VALUES (
                  :metric_key, :label, :section_id, :group_id, :unit, :direction,
                  :value_kind, :formula_group_id, :map_metric, :description
                )
                """
            ),
            {
                "metric_key": metric.metric_key,
                "label": metric.label,
                "section_id": metric.section_id,
                "group_id": metric.group_id,
                "unit": metric.unit,
                "direction": metric.direction,
                "value_kind": metric.value_kind,
                "formula_group_id": metric.formula_group_id,
                "map_metric": metric.map_metric,
                "description": metric.description,
            },
        )
    for type_key, label, place_group in AMENITY_TYPES:
        bind.execute(
            sa.text(
                """
                INSERT INTO curated.amenity_type (type_key, label, place_group)
                VALUES (:type_key, :label, :place_group)
                """
            ),
            {"type_key": type_key, "label": label, "place_group": place_group},
        )
