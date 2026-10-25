from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.v1 import router as api_router
from app.checks import check_database, check_redis
from app.schemas import HealthResponse
from app.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Places API",
        version=settings.app_version,
        description=(
            "Versioned contract for the suburb record. "
            "Routes return empty payloads on purpose and do not ship suburb data."
        ),
        servers=[{"url": "/"}],
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET", "OPTIONS"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/", include_in_schema=False)
    def root() -> RedirectResponse:
        return RedirectResponse(url="/docs")

    @app.get("/health", response_model=HealthResponse, tags=["Meta"])
    def health() -> HealthResponse:
        current = get_settings()
        database = check_database(current.database_url)
        redis_state = check_redis(current.redis_url)
        degraded = database == "error" or redis_state == "error"
        return HealthResponse(
            status="degraded" if degraded else "ok",
            version=current.app_version,
            environment=current.app_env,
            database=database,
            redis=redis_state,
        )

    return app


app = create_app()
