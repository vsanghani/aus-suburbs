"""Seed values shared by the migration and the tests.

``contracts/states.json`` and ``contracts/formula.json`` stay the files the
API serves. This module only adds facts those files do not carry: the ABS
state identifier, the indexable threshold, and which page sections count.
"""

# ASGS Edition 3 state/territory identifier. It is the first digit of SAL_CODE_2021.
STE_CODE_2021: dict[str, str] = {
    "nsw": "1",
    "vic": "2",
    "qld": "3",
    "sa": "4",
    "wa": "5",
    "tas": "6",
    "nt": "7",
    "act": "8",
    "ot": "9",
}

OTHER_TERRITORIES_CODE = "ot"
OTHER_TERRITORIES_NAME = "Other Territories"

# Seed values for curated.readiness_rule. The indexable test reads that table.
# sections_filled must reach the first threshold and own (suburb-level) sections
# must reach the second. Change the row, not the view.
MIN_SECTIONS_FILLED = 4
MIN_OWN_FIGURE_SECTIONS = 2

# Section ids match src/metrics/registry.ts. Commute waits on a router.
# Nearby is derived from geometry, not from a loaded dataset.
READINESS_SECTIONS: tuple[tuple[str, bool], ...] = (
    ("score", True),
    ("housing", True),
    ("education", True),
    ("transport", True),
    ("emergency", True),
    ("crime", True),
    ("hazards", True),
    ("amenities", True),
    ("census", True),
    ("naplan", True),
    ("heat", True),
    ("noise", True),
    ("canopy", True),
    ("lifestyle", True),
    ("development", True),
    ("commute", False),
    ("nearby", False),
)

# type_key, label, place_group. place_group lines up with the page's place groups.
AMENITY_TYPES: tuple[tuple[str, str, str], ...] = (
    ("school", "School", "education"),
    ("childcare", "Childcare", "education"),
    ("park", "Park", "parks"),
    ("hospital", "Hospital", "health"),
    ("police", "Police", "emergency"),
    ("fire", "Fire station", "emergency"),
    ("ambulance", "Ambulance station", "emergency"),
    ("supermarket", "Supermarket", "errands"),
    ("pharmacy", "Pharmacy", "errands"),
    ("library", "Library", "amenities"),
    ("sport", "Sport facility", "amenities"),
    ("community", "Community facility", "amenities"),
    ("cafe", "Cafe or restaurant", "lifestyle"),
    ("market", "Market", "lifestyle"),
    ("arts", "Arts venue", "lifestyle"),
    ("club", "Sports club", "lifestyle"),
    ("beach", "Beach", "lifestyle"),
    ("pool", "Pool", "lifestyle"),
    ("safer_place", "Neighbourhood safer place", "hazards"),
    ("water_point", "Fire water point", "hazards"),
    ("gp", "GP clinic", "health"),
)
