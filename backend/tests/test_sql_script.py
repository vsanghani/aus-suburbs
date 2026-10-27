from pathlib import Path

from app.sql_script import split_sql

SQL_DIR = Path(__file__).resolve().parents[1] / "alembic" / "sql"


def test_split_keeps_a_function_body_together() -> None:
    script = """
    CREATE FUNCTION curated.example()
    RETURNS void
    LANGUAGE plpgsql
    AS $func$
    BEGIN
      PERFORM 1;
      PERFORM 2;
    END;
    $func$;

    CREATE TABLE curated.widget (id integer);
    """
    statements = split_sql(script)
    assert len(statements) == 2
    assert "PERFORM 1" in statements[0]
    assert "PERFORM 2" in statements[0]
    assert statements[1].startswith("CREATE TABLE")


def test_upgrade_script_is_schema_qualified_and_idempotent_at_the_edges() -> None:
    script = (SQL_DIR / "0002_national_schema_upgrade.sql").read_text(encoding="utf-8")
    lowered = script.lower()
    for extension in ("postgis", "pg_trgm", "btree_gist"):
        assert f"create extension if not exists {extension}" in lowered
    for schema in ("raw", "staging", "curated"):
        assert f"create schema if not exists {schema}" in lowered
    assert "suburb_is_indexable" in script
    statements = split_sql(script)
    function = next(item for item in statements if "FUNCTION curated.slugify_name" in item)
    assert "RETURN cleaned" in function
    for statement in statements:
        compact = " ".join(statement.split())
        if compact.lower().startswith("create table"):
            assert " curated." in compact.lower() or " staging." in compact.lower()


def test_downgrade_keeps_schemas_and_extensions() -> None:
    script = (SQL_DIR / "0002_national_schema_downgrade.sql").read_text(encoding="utf-8")
    lowered = script.lower()
    assert "drop schema" not in lowered
    assert "drop extension" not in lowered
    assert "drop view if exists curated.sitemap_entry" in lowered
    assert "drop function if exists curated.suburb_is_indexable(integer, integer)" in lowered
    executable = "\n".join(
        line for line in lowered.splitlines() if not line.strip().startswith("--")
    )
    assert "alembic_version" not in executable
