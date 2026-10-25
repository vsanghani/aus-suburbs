from typing import Literal

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

DependencyState = Literal["ok", "unconfigured", "error"]


def check_database(url: str | None) -> DependencyState:
    if not url:
        return "unconfigured"
    try:
        engine = create_engine(
            url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 2},
        )
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        engine.dispose()
    except SQLAlchemyError:
        return "error"
    except Exception:
        return "error"
    return "ok"


def check_redis(url: str | None) -> DependencyState:
    if not url:
        return "unconfigured"
    try:
        from redis import Redis

        client = Redis.from_url(url, socket_connect_timeout=1, socket_timeout=1)
        client.ping()
        client.close()
    except Exception:
        return "error"
    return "ok"
