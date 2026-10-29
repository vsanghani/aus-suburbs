import re
from pathlib import Path

from app.catalogue import load_formula, load_states
from app.metric_catalogue import metric_definitions
from app.reference import (
    MIN_OWN_FIGURE_SECTIONS,
    MIN_SECTIONS_FILLED,
    READINESS_SECTIONS,
    STE_CODE_2021,
)

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "src" / "metrics" / "registry.ts"

REQUIRED_KEYS = {
    "population",
    "person-rate",
    "property-rate",
    "deception-rate",
    "median-rent",
    "median-house",
    "median-unit",
    "transit-stops-1km",
    "school-count",
    "childcare-count",
    "park-count",
    "supermarket-count",
    "flood-overlay-pct",
    "bushfire-pct",
    "lsio-pct",
    "sbo-pct",
    "distance-hospital-m",
    "distance-police-m",
    "distance-fire-m",
    "distance-ambulance-m",
    "distance-supermarket-m",
}


def registry_sections_and_slots(source: str) -> tuple[list[str], list[str]]:
    sections = re.findall(r'^    id: "([^"]+)"', source, re.M)
    slots: list[str] = []
    in_slots = False
    depth = 0
    for line in source.splitlines():
        if not in_slots:
            if re.search(r"slots:\s*\[", line):
                in_slots = True
                depth = line.count("[") - line.count("]")
                slots.extend(re.findall(r'id: "([^"]+)"', line))
                if depth <= 0:
                    in_slots = False
            continue
        slots.extend(re.findall(r'id: "([^"]+)"', line))
        depth += line.count("[") - line.count("]")
        if depth <= 0:
            in_slots = False
    return sections, slots


def test_catalogue_covers_the_page_slots_and_the_national_measures() -> None:
    sections, slots = registry_sections_and_slots(REGISTRY.read_text(encoding="utf-8"))
    metrics = metric_definitions()
    keys = [item.metric_key for item in metrics]
    assert len(keys) == len(set(keys))
    assert set(sections) == {section_id for section_id, _counts in READINESS_SECTIONS}
    assert set(slots) <= set(keys)
    assert REQUIRED_KEYS <= set(keys)
    formula_ids = {group["id"] for group in load_formula()["groups"]}
    for item in metrics:
        assert item.direction in {"positive", "negative", "context"}
        assert item.value_kind in {"numeric", "text"}
        if item.formula_group_id is not None:
            assert item.formula_group_id in formula_ids
        assert item.section_id in {section_id for section_id, _counts in READINESS_SECTIONS}


def test_readiness_thresholds_and_state_codes() -> None:
    assert MIN_SECTIONS_FILLED == 4
    assert MIN_OWN_FIGURE_SECTIONS == 2
    assert MIN_OWN_FIGURE_SECTIONS <= MIN_SECTIONS_FILLED
    excluded = {section_id for section_id, counts in READINESS_SECTIONS if not counts}
    assert excluded == {"commute", "nearby"}
    assert {state["code"] for state in load_states()} <= set(STE_CODE_2021)
    assert STE_CODE_2021["vic"] == "2"
    assert STE_CODE_2021["tas"] == "6"
