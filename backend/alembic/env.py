import os
from logging.config import fileConfig

from alembic import context
from app.models import Base
from sqlalchemy import engine_from_config, pool, text

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Handwritten revisions. PostGIS types and triggers do not round-trip through autogenerate.
target_metadata = Base.metadata

# Neon kf_loader cannot create tables in public. The version table lives in curated.
VERSION_TABLE_SCHEMA = "curated"


def database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("Set DATABASE_URL before running Alembic.")
    return url


def migration_kwargs() -> dict[str, object]:
    """Options shared by offline and online runs. Both files name the schema."""
    configured = config.get_main_option("version_table_schema")
    if configured != VERSION_TABLE_SCHEMA:
        raise RuntimeError("alembic.ini version_table_schema must be curated.")
    include_schemas = config.get_main_option("include_schemas", "false")
    if str(include_schemas).lower() != "true":
        raise RuntimeError("alembic.ini include_schemas must be true.")
    return {
        "target_metadata": target_metadata,
        "include_schemas": True,
        "version_table_schema": VERSION_TABLE_SCHEMA,
    }


def ensure_version_schema(connection) -> None:
    """curated must exist before Alembic creates curated.alembic_version.

    On Neon the schema is already there, so this is a no-op. Tables are not
    created in public.
    """
    connection.execute(text("CREATE SCHEMA IF NOT EXISTS raw"))
    connection.execute(text("CREATE SCHEMA IF NOT EXISTS staging"))
    connection.execute(text("CREATE SCHEMA IF NOT EXISTS curated"))
    connection.commit()


def run_migrations_offline() -> None:
    context.configure(url=database_url(), literal_binds=True, **migration_kwargs())
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    section = config.get_section(config.config_ini_section) or {}
    section["sqlalchemy.url"] = database_url()
    connectable = engine_from_config(section, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        ensure_version_schema(connection)
        context.configure(connection=connection, **migration_kwargs())
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
