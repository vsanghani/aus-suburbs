"""Suburb and council slugs.

The public path is ``{state}/{slug}``. ``slug`` is the place part only.
It is lowercase, unique inside the state, and permanent: a rename inserts
``slug_redirect`` and the old slug is never given to another place.

ABS SAL names in the national file carry a state suffix, for example
``Richmond (Vic.)``. That suffix is dropped because the state is already
in the path. Apostrophes are removed (``O'Connor`` becomes ``oconnor``).
Everything else that is not a letter or digit becomes a single hyphen.
"""

import re

_STATE_SUFFIX = re.compile(
    r"\s*\((?:nsw|vic\.?|qld|sa|wa|tas\.?|nt|act|ot)\)\s*$",
    re.IGNORECASE,
)
_APOSTROPHE = re.compile(r"['\u2019]")
_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_HYPHENS = re.compile(r"-+")


def slugify_name(name: str) -> str:
    cleaned = name.strip().lower()
    cleaned = _STATE_SUFFIX.sub("", cleaned)
    cleaned = cleaned.replace("&", " and ")
    cleaned = _APOSTROPHE.sub("", cleaned)
    cleaned = _NON_ALNUM.sub("-", cleaned)
    cleaned = _HYPHENS.sub("-", cleaned)
    return cleaned.strip("-")
