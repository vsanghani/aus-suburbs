"""Migration round trip. Skipped unless TEST_DATABASE_URL is set.

The database is wiped at the start (schemas only). Downgrade must leave the
schemas and the PostGIS extensions in place, which is what a Neon branch does.
"""

import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from app.models import Base
from app.slug import slugify_name
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

pytestmark = pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL"),
    reason="Set TEST_DATABASE_URL to run migration tests.",
)

BACKEND = Path(__file__).resolve().parents[1]
SQUARE = (
    "MULTIPOLYGON(((144.99 -37.82, 145.01 -37.82, 145.01 -37.80, 144.99 -37.80, 144.99 -37.82)))"
)
POINT = "POINT(145.00 -37.81)"


def _engine() -> Engine:
    return create_engine(os.environ["TEST_DATABASE_URL"])


def _config(monkeypatch: pytest.MonkeyPatch) -> Config:
    monkeypatch.setenv("DATABASE_URL", os.environ["TEST_DATABASE_URL"])
    return Config(str(BACKEND / "alembic.ini"))


def _wipe(engine: Engine) -> None:
    with engine.begin() as connection:
        connection.execute(text("DROP SCHEMA IF EXISTS staging CASCADE"))
        connection.execute(text("DROP SCHEMA IF EXISTS curated CASCADE"))
        connection.execute(text("DROP SCHEMA IF EXISTS raw CASCADE"))


def _exec(connection, sql: str, **params: object) -> None:
    connection.execute(text(sql), params)


def _fails(connection, sql: str, **params: object) -> None:
    # A failed statement aborts the surrounding transaction. A savepoint keeps the rest.
    with pytest.raises(SQLAlchemyError):
        with connection.begin_nested():
            connection.execute(text(sql), params)


def test_upgrade_downgrade_upgrade(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = _engine()
    _wipe(engine)
    config = _config(monkeypatch)
    command.upgrade(config, "head")
    _assert_schema(engine)
    _assert_behaviour(engine)
    command.downgrade(config, "base")
    _assert_downgrade_kept_the_database(engine)
    command.upgrade(config, "head")
    with engine.connect() as connection:
        codes = {
            row[0]
            for row in connection.execute(text("SELECT code FROM curated.state WHERE in_catalogue"))
        }
    assert codes == {"nsw", "vic", "qld", "sa", "wa", "tas", "nt", "act"}
    engine.dispose()


def _assert_downgrade_kept_the_database(engine: Engine) -> None:
    with engine.connect() as connection:
        schemas = {
            row[0]
            for row in connection.execute(
                text(
                    "SELECT nspname FROM pg_namespace "
                    "WHERE nspname IN ('raw', 'staging', 'curated')"
                )
            )
        }
        extensions = {
            row[0]
            for row in connection.execute(
                text(
                    "SELECT extname FROM pg_extension "
                    "WHERE extname IN ('postgis', 'pg_trgm', 'btree_gist')"
                )
            )
        }
        curated_tables = {
            row[0]
            for row in connection.execute(
                text(
                    "SELECT tablename FROM pg_tables "
                    "WHERE schemaname = 'curated' AND tablename <> 'alembic_version'"
                )
            )
        }
        version_schema = connection.execute(
            text(
                "SELECT table_schema FROM information_schema.tables "
                "WHERE table_name = 'alembic_version'"
            )
        ).scalar()
    assert schemas == {"raw", "staging", "curated"}
    assert extensions == {"postgis", "pg_trgm", "btree_gist"}
    assert curated_tables == set()
    assert version_schema in {None, "curated"}


def _assert_schema(engine: Engine) -> None:
    from sqlalchemy import inspect

    inspector = inspect(engine)
    public_tables = set(inspector.get_table_names(schema="public"))
    curated_tables = set(inspector.get_table_names(schema="curated"))
    assert "alembic_version" not in public_tables
    assert "state" not in public_tables
    assert "alembic_version" in curated_tables
    model_tables = {
        (table.schema, table.name): {column.name for column in table.columns}
        for table in Base.metadata.tables.values()
    }
    db_tables = {}
    for schema in ("curated", "staging"):
        for name in inspector.get_table_names(schema=schema):
            if name == "alembic_version":
                continue
            db_tables[(schema, name)] = {
                column["name"] for column in inspector.get_columns(name, schema=schema)
            }
    assert set(model_tables) == set(db_tables)
    for key, columns in model_tables.items():
        assert columns == db_tables[key], (key, columns ^ db_tables[key])
    with engine.connect() as connection:
        rule = connection.execute(
            text(
                "SELECT min_sections_filled, min_own_figure_sections "
                "FROM curated.readiness_rule WHERE id = 1"
            )
        ).one()
        assert tuple(rule) == (4, 2)
        groups = {
            row[0] for row in connection.execute(text("SELECT group_id FROM curated.formula_group"))
        }
        assert "hazards" in groups
        assert connection.execute(
            text("SELECT curated.slugify_name('Richmond (Vic.)')")
        ).scalar() == slugify_name("Richmond (Vic.)")


def _assert_behaviour(engine: Engine) -> None:
    with engine.begin() as connection:
        _fails(
            connection,
            """
            INSERT INTO curated.dataset_source (
              dataset_key, version_label, agency, title, licence_id, licence_text,
              commercial_use_ok, source_url, state_scope, refresh_frequency, status
            )
            VALUES (
              'blocked', 'v1', 'Agency', 'Blocked', 'proprietary', 'No commercial use',
              false, 'https://example.com/blocked', ARRAY['vic'], 'annual', 'enabled'
            )
            """,
        )
        source_id = connection.execute(
            text(
                """
                INSERT INTO curated.dataset_source (
                  dataset_key, version_label, agency, title, licence_id, licence_text,
                  commercial_use_ok, source_url, published_date, state_scope,
                  refresh_frequency, status
                )
                VALUES (
                  'abs_census_2021', '2021', 'Australian Bureau of Statistics',
                  'Census', 'CC-BY-4.0', 'Creative Commons Attribution 4.0 International',
                  true, 'https://example.com/census', DATE '2022-06-28', ARRAY['national'],
                  'static', 'enabled'
                )
                RETURNING id
                """
            )
        ).scalar_one()
        disabled_id = connection.execute(
            text(
                """
                INSERT INTO curated.dataset_source (
                  dataset_key, version_label, agency, title, licence_id, licence_text,
                  commercial_use_ok, source_url, state_scope, refresh_frequency, status
                )
                VALUES (
                  'acar_naplan', '2023', 'ACARA', 'NAPLAN', 'restricted',
                  'Terms restrict republication',
                  false, 'https://example.com/naplan', ARRAY['national'], 'annual', 'disabled'
                )
                RETURNING id
                """
            )
        ).scalar_one()
        assert (
            connection.execute(
                text("SELECT curated.source_is_loadable(:source_id)"),
                {"source_id": source_id},
            ).scalar()
            is True
        )
        assert (
            connection.execute(
                text("SELECT curated.source_is_loadable(:source_id)"),
                {"source_id": disabled_id},
            ).scalar()
            is False
        )
        slug = connection.execute(
            text("SELECT curated.allocate_slug('vic', 'Richmond (Vic.)')")
        ).scalar_one()
        assert slug == "richmond"
        _exec(
            connection,
            """
            INSERT INTO curated.sal (sal_code, sal_name, state_code, slug, geom, centroid)
            VALUES (
              '20001', 'Richmond (Vic.)', 'vic', :slug,
              ST_SetSRID(ST_GeomFromText(:square), 4326),
              ST_SetSRID(ST_GeomFromText(:point), 4326)
            )
            """,
            slug=slug,
            square=SQUARE,
            point=POINT,
        )
        second = connection.execute(
            text("SELECT curated.allocate_slug('vic', 'Richmond (Vic.)')")
        ).scalar_one()
        assert second == "richmond-2"
        _insert_metric(
            connection,
            source_id=source_id,
            sal_code="20001",
            metric_key="population",
            value=100,
            geo_level="suburb",
            fallback_from=None,
        )
        _insert_metric(
            connection,
            source_id=source_id,
            sal_code="20001",
            metric_key="school-count",
            value=2,
            geo_level="suburb",
            fallback_from=None,
        )
        _insert_metric(
            connection,
            source_id=source_id,
            sal_code="20001",
            metric_key="median-rent",
            value=500,
            geo_level="postcode",
            fallback_from="suburb",
        )
        _insert_metric(
            connection,
            source_id=source_id,
            sal_code="20001",
            metric_key="person-rate",
            value=None,
            geo_level="suburb",
            fallback_from=None,
            status="not_available",
            reason="Not published for this suburb.",
        )
        _fails(
            connection,
            """
            INSERT INTO curated.metric_value (
              sal_code, metric_key, period_label, as_of, value, unit, geo_level,
              dataset_source_id, status
            )
            VALUES (
              '20001', 'school-count', '2024', DATE '2024-01-01', NULL, 'schools',
              'suburb', :source_id, 'ok'
            )
            """,
            source_id=source_id,
        )
        _fails(
            connection,
            """
            INSERT INTO curated.metric_value (
              sal_code, metric_key, period_label, as_of, value, unit, geo_level,
              dataset_source_id, status, not_available_reason
            )
            VALUES (
              '20001', 'park-count', '2024', DATE '2024-01-01', 0, 'parks',
              'suburb', :source_id, 'not_available', 'missing'
            )
            """,
            source_id=source_id,
        )
        _fails(
            connection,
            """
            INSERT INTO curated.metric_value (
              sal_code, metric_key, period_label, as_of, value, unit, geo_level,
              dataset_source_id, status
            )
            VALUES (
              '20001', 'park-count', '2024', DATE '2024-01-01', 1, 'parks',
              'postcode', :source_id, 'ok'
            )
            """,
            source_id=source_id,
        )
        _insert_metric(
            connection,
            source_id=source_id,
            sal_code="20001",
            metric_key="bushfire-pct",
            value=0,
            geo_level="suburb",
            fallback_from=None,
        )
        thin = connection.execute(
            text(
                """
                SELECT sections_filled, own_figure_sections, indexable
                FROM curated.suburb_readiness
                WHERE sal_code = '20001'
                """
            )
        ).one()
        # population, school-count, median-rent, bushfire. person-rate is not_available.
        # own: population, school-count, bushfire. rent is a postcode fallback.
        assert tuple(thin) == (4, 3, True)
        _exec(
            connection,
            """
            INSERT INTO curated.sal (sal_code, sal_name, state_code, slug, geom, centroid)
            VALUES (
              '20002', 'Example', 'vic', 'example',
              ST_SetSRID(ST_GeomFromText(:square), 4326),
              ST_SetSRID(ST_GeomFromText(:point), 4326)
            )
            """,
            square=SQUARE,
            point=POINT,
        )
        for key, level, fallback in (
            ("population", "suburb", None),
            ("median-rent", "postcode", "suburb"),
            ("person-rate", "postcode", "suburb"),
            ("park-count", "lga", "suburb"),
        ):
            _insert_metric(
                connection,
                source_id=source_id,
                sal_code="20002",
                metric_key=key,
                value=1,
                geo_level=level,
                fallback_from=fallback,
            )
        fallback_only = connection.execute(
            text(
                """
                SELECT sections_filled, own_figure_sections, indexable
                FROM curated.suburb_readiness
                WHERE sal_code = '20002'
                """
            )
        ).one()
        assert tuple(fallback_only) == (4, 1, False)
        sitemap = {
            row[0] for row in connection.execute(text("SELECT sal_code FROM curated.sitemap_entry"))
        }
        assert sitemap == {"20001"}
        _exec(
            connection, "UPDATE curated.sal SET slug = 'richmond-central' WHERE sal_code = '20001'"
        )
        retired = connection.execute(
            text(
                """
                SELECT old_slug FROM curated.slug_redirect
                WHERE state_code = 'vic' AND sal_code = '20001'
                """
            )
        ).scalar_one()
        assert retired == "richmond"
        _fails(
            connection,
            """
            INSERT INTO curated.sal (sal_code, sal_name, state_code, slug, geom, centroid)
            VALUES (
              '20003', 'Other Richmond', 'vic', 'richmond',
              ST_SetSRID(ST_GeomFromText(:square), 4326),
              ST_SetSRID(ST_GeomFromText(:point), 4326)
            )
            """,
            square=SQUARE,
            point=POINT,
        )
        with pytest.raises(SQLAlchemyError, match="stub"):
            with connection.begin_nested():
                connection.execute(text("SELECT curated.compute_place_score('20001')"))


def _insert_metric(
    connection,
    *,
    source_id: int,
    sal_code: str,
    metric_key: str,
    value: float | None,
    geo_level: str,
    fallback_from: str | None,
    status: str = "ok",
    reason: str | None = None,
) -> None:
    unit = connection.execute(
        text("SELECT unit FROM curated.metric_definition WHERE metric_key = :metric_key"),
        {"metric_key": metric_key},
    ).scalar_one()
    connection.execute(
        text(
            """
            INSERT INTO curated.metric_value (
              sal_code, metric_key, period_label, as_of, value, unit,
              geo_level, fallback_from, dataset_source_id, status, not_available_reason
            )
            VALUES (
              :sal_code, :metric_key, '2024',
              CASE WHEN :status = 'ok' THEN DATE '2024-09-30' ELSE NULL END,
              :value, :unit, :geo_level, :fallback_from, :source_id, :status, :reason
            )
            """
        ),
        {
            "sal_code": sal_code,
            "metric_key": metric_key,
            "value": value,
            "unit": unit,
            "geo_level": geo_level,
            "fallback_from": fallback_from,
            "source_id": source_id,
            "status": status,
            "reason": reason,
        },
    )
