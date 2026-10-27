from app.slug import slugify_name


def test_slugify_strips_abs_state_suffix_and_punctuation() -> None:
    assert slugify_name("Richmond (Vic.)") == "richmond"
    assert slugify_name("Hobart (Tas.)") == "hobart"
    assert slugify_name("Abbotsford (NSW)") == "abbotsford"
    assert slugify_name("O'Connor") == "oconnor"
    assert slugify_name("D’Aguilar") == "daguilar"
    assert slugify_name("St Kilda") == "st-kilda"
    assert slugify_name("St. Kilda") == "st-kilda"
    assert slugify_name("Brighton-le-Sands") == "brighton-le-sands"
    assert slugify_name("Box Hill North") == "box-hill-north"
    assert slugify_name("Sandy Bay") == "sandy-bay"
    assert slugify_name("McMahons Creek") == "mcmahons-creek"
    assert slugify_name("Safety & Bay") == "safety-and-bay"


def test_non_state_parenthetical_stays_in_the_slug() -> None:
    assert slugify_name("Ascot (Ballarat)") == "ascot-ballarat"
