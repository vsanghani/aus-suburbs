from app.catalogue import weight_ids
from app.main import create_app
from fastapi.testclient import TestClient
from pytest import MonkeyPatch


def client() -> TestClient:
    return TestClient(create_app())


def test_health_is_ok_without_dependencies(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("REDIS_URL", raising=False)
    from app.settings import get_settings

    get_settings.cache_clear()
    response = client().get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "unconfigured"
    assert body["redis"] == "unconfigured"


def test_search_returns_nothing() -> None:
    response = client().get("/api/v1/search", params={"q": "richmond", "limit": 5})
    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "richmond"
    assert body["dataset_connected"] is False
    assert body["limit"] == 5
    assert body["results"] == []
    assert body["councils"] == []


def test_unknown_state_is_404() -> None:
    response = client().get("/api/v1/search", params={"state": "xx"})
    assert response.status_code == 404


def test_suburb_is_not_on_file() -> None:
    response = client().get("/api/v1/suburbs/vic/richmond")
    assert response.status_code == 404
    assert "No suburb" in response.json()["detail"]


def test_council_is_not_on_file() -> None:
    response = client().get("/api/v1/councils/nsw/inner-west")
    assert response.status_code == 404


def test_state_shell() -> None:
    response = client().get("/api/v1/states/qld")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Queensland"
    assert body["councils"] == []
    assert body["dataset_connected"] is False


def test_rankings_catalogue_and_empty_list() -> None:
    catalogue = client().get("/api/v1/rankings")
    assert catalogue.status_code == 200
    slugs = [item["slug"] for item in catalogue.json()["rankings"]]
    assert "rent" in slugs
    detail = client().get("/api/v1/rankings/rent", params={"state": "vic"})
    assert detail.status_code == 200
    body = detail.json()
    assert body["rows"] == []
    assert body["total"] is None
    assert body["dataset_connected"] is False


def test_unknown_ranking_is_404() -> None:
    response = client().get("/api/v1/rankings/not-a-list")
    assert response.status_code == 404


def test_compare_keeps_four_valid_tokens() -> None:
    tokens = [f"vic:place-{index}" for index in range(6)]
    response = client().get("/api/v1/compare", params=[("p", token) for token in tokens])
    assert response.status_code == 200
    body = response.json()
    assert body["requested"] == tokens[:4]
    assert body["places"] == []
    assert len(body["omitted"]) == 2
    assert body["dataset_connected"] is False


def test_match_normalises_weights() -> None:
    response = client().get("/api/v1/match", params={"budget": 75, "green": 25, "commute": 0})
    assert response.status_code == 200
    body = response.json()
    assert body["results"] == []
    assert body["dataset_connected"] is False
    normalised = body["normalised"]
    assert abs(sum(normalised.values()) - 1) < 1e-9
    assert normalised["budget"] > normalised["green"] > normalised["commute"]


def test_match_weights_cover_the_formula() -> None:
    response = client().get("/api/v1/match")
    assert set(response.json()["weights"]) == set(weight_ids())


def test_explore_is_an_empty_collection() -> None:
    response = client().get(
        "/api/v1/explore", params={"metric": "canopy-pct", "layers": "flood,parks"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["feature_collection"]["features"] == []
    assert body["layers"] == ["flood", "parks"]
    assert body["dataset_connected"] is False


def test_methodology_serves_the_draft_formula() -> None:
    response = client().get("/api/v1/methodology")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "draft"
    assert body["base"] == 50
    assert body["sources_connected"] is False
    assert body["sources"] == []
    assert {group["id"] for group in body["groups"]} >= {"transport", "hazards"}


def test_commute_has_no_minutes() -> None:
    response = client().get(
        "/api/v1/commute",
        params={"state": "vic", "slug": "richmond", "to": "Flinders Street"},
    )
    assert response.status_code == 200
    body = response.json()
    assert [mode["minutes"] for mode in body["modes"]] == [None, None, None, None]
    assert body["dataset_connected"] is False


def test_export_is_unavailable() -> None:
    response = client().get("/api/v1/export")
    assert response.status_code == 200
    assert response.json()["available"] is False


def test_openapi_lists_the_contract() -> None:
    schema = client().get("/openapi.json")
    assert schema.status_code == 200
    paths = schema.json()["paths"]
    for path in (
        "/health",
        "/api/v1/search",
        "/api/v1/suburbs/{state}/{slug}",
        "/api/v1/councils",
        "/api/v1/councils/{state}/{slug}",
        "/api/v1/states/{code}",
        "/api/v1/rankings",
        "/api/v1/rankings/{slug}",
        "/api/v1/compare",
        "/api/v1/match",
        "/api/v1/explore",
        "/api/v1/methodology",
        "/api/v1/commute",
        "/api/v1/export",
    ):
        assert path in paths
