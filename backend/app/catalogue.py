import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any


def contracts_dir() -> Path:
    override = os.environ.get("CONTRACTS_DIR")
    if override:
        return Path(override)
    return Path(__file__).resolve().parents[2] / "contracts"


@lru_cache
def _read(name: str) -> Any:
    path = contracts_dir() / name
    return json.loads(path.read_text(encoding="utf-8"))


def load_states() -> list[dict[str, Any]]:
    data = _read("states.json")
    if not isinstance(data, list):
        raise RuntimeError("contracts/states.json must be a list.")
    return data


def load_rankings() -> list[dict[str, Any]]:
    data = _read("rankings.json")
    if not isinstance(data, list):
        raise RuntimeError("contracts/rankings.json must be a list.")
    return data


def load_formula() -> dict[str, Any]:
    data = _read("formula.json")
    if not isinstance(data, dict) or "groups" not in data or "weights" not in data:
        raise RuntimeError("contracts/formula.json is missing groups or weights.")
    return data


def find_state(code: str) -> dict[str, Any] | None:
    lowered = code.lower()
    for state in load_states():
        if state["code"] == lowered:
            return state
    return None


def find_ranking(slug: str) -> dict[str, Any] | None:
    for ranking in load_rankings():
        if ranking["slug"] == slug:
            return ranking
    return None


def weight_ids() -> list[str]:
    return [item["id"] for item in load_formula()["weights"]]


def normalise_weights(raw: dict[str, float]) -> dict[str, float]:
    ids = weight_ids()
    total = sum(max(0.0, raw.get(key, 0.0)) for key in ids)
    if total <= 0:
        share = 1 / len(ids)
        return {key: share for key in ids}
    return {key: max(0.0, raw.get(key, 0.0)) / total for key in ids}
