import ast
import json
from pathlib import Path

from app.catalogue import load_formula, load_rankings, load_states, normalise_weights
from app.main import app

ROOT = Path(__file__).resolve().parents[2]


def test_initial_migration_creates_no_tables() -> None:
    path = ROOT / "backend" / "alembic" / "versions" / "0001_empty.py"
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source)
    functions = {
        node.name: node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name in {"upgrade", "downgrade"}
    }
    assert set(functions) == {"upgrade", "downgrade"}
    for function in functions.values():
        assert len(function.body) == 1
        statement = function.body[0]
        assert isinstance(statement, ast.Pass)
    assert "create_table" not in source


def test_formula_tiers_cover_zero_and_groups_are_unique() -> None:
    formula = load_formula()
    group_ids = [group["id"] for group in formula["groups"]]
    assert len(group_ids) == len(set(group_ids))
    minimums = [tier["minimum"] for tier in formula["tiers"]]
    assert 0 in minimums
    assert minimums == sorted(minimums, reverse=True)
    weight_ids = [item["id"] for item in formula["weights"]]
    assert len(weight_ids) == len(set(weight_ids))


def test_zero_weights_fall_back_to_even() -> None:
    even = normalise_weights({})
    assert abs(sum(even.values()) - 1) < 1e-9
    assert len(set(round(value, 6) for value in even.values())) == 1


def test_catalogues_are_unique() -> None:
    state_codes = [state["code"] for state in load_states()]
    ranking_slugs = [ranking["slug"] for ranking in load_rankings()]
    assert len(state_codes) == len(set(state_codes)) == 8
    assert len(ranking_slugs) == len(set(ranking_slugs))


def test_committed_openapi_matches_the_app() -> None:
    committed_path = ROOT / "contracts" / "openapi.json"
    assert committed_path.exists(), "Run `make openapi` and commit contracts/openapi.json."
    committed = json.loads(committed_path.read_text(encoding="utf-8"))
    assert app.openapi() == committed
