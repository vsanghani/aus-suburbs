import re
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Path, Query

from app.catalogue import find_ranking, find_state, load_formula, load_rankings, normalise_weights
from app.schemas import (
    CommuteMode,
    CommuteResponse,
    CompareResponse,
    CouncilDetail,
    CouncilListResponse,
    ExploreResponse,
    ExportResponse,
    FeatureCollection,
    MatchResponse,
    MethodologyResponse,
    Problem,
    RankingFilters,
    RankingInfo,
    RankingListResponse,
    RankingResponse,
    SearchResponse,
    StateDetail,
    SuburbDetail,
    SuburbListResponse,
    Weights,
)

router = APIRouter()

StateQuery = Annotated[str | None, Query(pattern=r"^[a-z]{2,3}$")]
StatePath = Annotated[str, Path(pattern=r"^[A-Za-z]{2,3}$")]
SlugPath = Annotated[str, Path(pattern=r"^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$")]
PLACE_TOKEN = re.compile(r"^[a-z]{2,3}:[a-z0-9]+(?:-[a-z0-9]+)*$")

NOT_CONNECTED = "No dataset is connected."


def require_state(code: str) -> dict[str, Any]:
    found = find_state(code)
    if found is None:
        raise HTTPException(status_code=404, detail="No state is on file for this code.")
    return found


@router.get("/search", response_model=SearchResponse, tags=["Search"])
def search(
    q: Annotated[str, Query(max_length=80)] = "",
    state: StateQuery = None,
    limit: Annotated[int, Query(ge=1, le=25)] = 10,
) -> SearchResponse:
    if state is not None:
        require_state(state)
    return SearchResponse(
        query=q.strip(),
        limit=limit,
        dataset_connected=False,
        results=[],
        councils=[],
        notice="No dataset is connected, so the search cannot match places.",
    )


@router.get("/suburbs", response_model=SuburbListResponse, tags=["Places"])
def suburb_index(
    state: StateQuery = None,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> SuburbListResponse:
    """Pages of suburbs for the sitemap. Returns nothing until a dataset is connected."""
    if state is not None:
        require_state(state)
    return SuburbListResponse(
        state=state,
        dataset_connected=False,
        total=None,
        offset=offset,
        limit=limit,
        suburbs=[],
        notice="No dataset is connected, so no suburbs are listed.",
    )


@router.get(
    "/suburbs/{state}/{slug}",
    response_model=SuburbDetail,
    responses={404: {"model": Problem}},
    tags=["Places"],
)
def suburb(state: StatePath, slug: SlugPath) -> SuburbDetail:
    require_state(state.lower())
    raise HTTPException(
        status_code=404,
        detail=f"No suburb is on file for {state.lower()}/{slug.lower()}.",
    )


@router.get("/councils", response_model=CouncilListResponse, tags=["Places"])
def councils(state: StateQuery = None) -> CouncilListResponse:
    if state is not None:
        require_state(state)
    return CouncilListResponse(
        state=state,
        dataset_connected=False,
        councils=[],
        notice="No councils are loaded.",
    )


@router.get(
    "/councils/{state}/{slug}",
    response_model=CouncilDetail,
    responses={404: {"model": Problem}},
    tags=["Places"],
)
def council(state: StatePath, slug: SlugPath) -> CouncilDetail:
    require_state(state.lower())
    raise HTTPException(
        status_code=404,
        detail=f"No council is on file for {state.lower()}/{slug.lower()}.",
    )


@router.get(
    "/states/{code}",
    response_model=StateDetail,
    responses={404: {"model": Problem}},
    tags=["Places"],
)
def state_detail(code: StatePath) -> StateDetail:
    found = require_state(code.lower())
    return StateDetail(
        code=found["code"],
        name=found["name"],
        dataset_connected=False,
        narrative=None,
        suburb_count=None,
        council_count=None,
        regions=[],
        councils=[],
        notice="No councils are loaded for this state.",
    )


@router.get("/rankings", response_model=RankingListResponse, tags=["Lists"])
def rankings() -> RankingListResponse:
    return RankingListResponse(
        rankings=[RankingInfo.model_validate(item) for item in load_rankings()]
    )


@router.get(
    "/rankings/{slug}",
    response_model=RankingResponse,
    responses={404: {"model": Problem}},
    tags=["Lists"],
)
def ranking_detail(
    slug: Annotated[str, Path(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")],
    state: StateQuery = None,
    region: Annotated[str | None, Query(max_length=80)] = None,
    council: Annotated[str | None, Query(max_length=80)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> RankingResponse:
    found = find_ranking(slug)
    if found is None:
        raise HTTPException(status_code=404, detail="No list is published under this name.")
    if state is not None:
        require_state(state)
    return RankingResponse(
        ranking=RankingInfo.model_validate(found),
        dataset_connected=False,
        total=None,
        offset=offset,
        limit=limit,
        filters=RankingFilters(state=state, region=region, council=council),
        regions=[],
        councils=[],
        rows=[],
        notice="This list has no dataset behind it yet.",
    )


@router.get("/compare", response_model=CompareResponse, tags=["Compare"])
def compare(p: Annotated[list[str] | None, Query()] = None) -> CompareResponse:
    requested = p or []
    kept: list[str] = []
    omitted: list[str] = []
    for token in requested:
        normalised = token.strip().lower()
        if PLACE_TOKEN.match(normalised) and normalised not in kept and len(kept) < 4:
            kept.append(normalised)
        else:
            omitted.append(token)
    notice = "No dataset is connected, so columns stay empty."
    if len(kept) == 4 and len(requested) > len(kept):
        notice = "Only four places are compared. Extra selections were left off. " + notice
    return CompareResponse(
        requested=kept,
        dataset_connected=False,
        places=[],
        omitted=omitted,
        notice=notice,
    )


@router.get("/match", response_model=MatchResponse, tags=["Match"])
def match(
    budget: Annotated[float, Query(ge=0, le=100)] = 50,
    commute: Annotated[float, Query(ge=0, le=100)] = 50,
    schools: Annotated[float, Query(ge=0, le=100)] = 50,
    safety: Annotated[float, Query(ge=0, le=100)] = 50,
    quiet: Annotated[float, Query(ge=0, le=100)] = 50,
    family: Annotated[float, Query(ge=0, le=100)] = 50,
    errands: Annotated[float, Query(ge=0, le=100)] = 50,
    green: Annotated[float, Query(ge=0, le=100)] = 50,
    state: StateQuery = None,
    budget_weekly: Annotated[int | None, Query(ge=0, le=20000)] = None,
    commute_to: Annotated[str | None, Query(max_length=120)] = None,
    needs_schools: bool = False,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> MatchResponse:
    if state is not None:
        require_state(state)
    raw = {
        "budget": budget,
        "commute": commute,
        "schools": schools,
        "safety": safety,
        "quiet": quiet,
        "family": family,
        "errands": errands,
        "green": green,
    }
    normalised = normalise_weights(raw)
    return MatchResponse(
        weights=Weights.model_validate(raw),
        normalised=Weights.model_validate(normalised),
        state=state,
        budget_weekly=budget_weekly,
        commute_to=commute_to.strip() if commute_to else None,
        needs_schools=needs_schools,
        limit=limit,
        dataset_connected=False,
        results=[],
        notice="No scores are loaded, so nothing can be ranked.",
    )


@router.get("/explore", response_model=ExploreResponse, tags=["Map"])
def explore(
    metric: Annotated[str, Query(max_length=80)] = "score",
    state: StateQuery = None,
    layers: Annotated[str, Query(max_length=200)] = "",
) -> ExploreResponse:
    if state is not None:
        require_state(state)
    selected = [part.strip() for part in layers.split(",") if part.strip()]
    return ExploreResponse(
        metric=metric,
        state=state,
        layers=selected,
        dataset_connected=False,
        feature_collection=FeatureCollection(type="FeatureCollection", features=[]),
        notice="No geometries are loaded.",
    )


@router.get("/methodology", response_model=MethodologyResponse, tags=["Meta"])
def methodology() -> MethodologyResponse:
    return MethodologyResponse.model_validate(load_formula())


@router.get("/commute", response_model=CommuteResponse, tags=["Map"])
def commute(
    state: Annotated[str, Query(pattern=r"^[a-z]{2,3}$")],
    slug: Annotated[str, Query(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")],
    to: Annotated[str, Query(min_length=1, max_length=160)],
) -> CommuteResponse:
    require_state(state)
    modes = [
        CommuteMode(mode="transit", minutes=None, note=None),
        CommuteMode(mode="drive", minutes=None, note=None),
        CommuteMode(mode="cycle", minutes=None, note=None),
        CommuteMode(mode="walk", minutes=None, note=None),
    ]
    return CommuteResponse(
        origin_state=state,
        origin_slug=slug,
        destination=to.strip(),
        dataset_connected=False,
        modes=modes,
        notice="Travel times are not calculated yet.",
    )


@router.get("/export", response_model=ExportResponse, tags=["Meta"])
def export_rows() -> ExportResponse:
    return ExportResponse(
        dataset_connected=False,
        available=False,
        row_count=None,
        notice="Export is not available until a dataset is connected.",
    )
