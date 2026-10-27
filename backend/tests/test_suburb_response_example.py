import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXAMPLE = ROOT / "contracts" / "suburb-response.example.json"
SECTIONS = (
    "overview",
    "score",
    "housing",
    "education",
    "transport",
    "services",
    "safety",
    "climate_hazards",
    "amenities",
)
LEVELS = {"suburb", "postcode", "lga", "state"}
FIGURE_KEYS = {
    "value",
    "unit",
    "source",
    "licence",
    "as_of",
    "status",
    "geo_level",
    "fallback_from",
}


def _figures(node: object) -> list[dict[str, object]]:
    found: list[dict[str, object]] = []
    if isinstance(node, dict):
        status = node.get("status")
        if status in {"ok", "not_available"} and "value" in node:
            found.append(node)
        for value in node.values():
            found.extend(_figures(value))
    elif isinstance(node, list):
        for value in node:
            found.extend(_figures(value))
    return found


def test_suburb_response_example_parses() -> None:
    body = json.loads(EXAMPLE.read_text(encoding="utf-8"))
    assert body["example"] is True
    for section in SECTIONS:
        assert body[section]["data_level"] in LEVELS
    meta = body["meta"]
    assert meta["state"] == "vic"
    assert meta["slug"] == "richmond"
    assert isinstance(meta["sections_filled"], int)
    assert isinstance(meta["own_figure_sections"], int)
    assert isinstance(meta["indexable"], bool)
    assert meta["last_updated"]
    figures = _figures(body)
    assert figures
    assert any(figure["status"] == "ok" and figure["value"] == 0 for figure in figures)
    assert any(figure["status"] == "not_available" for figure in figures)
    for figure in figures:
        assert FIGURE_KEYS <= set(figure)
        assert set(figure["source"]) >= {"name", "agency"}
        assert set(figure["licence"]) >= {"id", "text"}
        assert figure["geo_level"] in LEVELS
        if figure["status"] == "ok":
            assert figure["value"] is not None
            assert figure.get("reason") in (None,)
        else:
            assert figure["value"] is None
            assert isinstance(figure["reason"], str) and figure["reason"].strip()
