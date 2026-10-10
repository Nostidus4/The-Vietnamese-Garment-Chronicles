"""The try-on dresses the person in the photo, never a model in their place: a man stays a man (the refs are women's cuts)."""

import pytest

from app.content import store
from app.models import Selection
from app.services import tryon


def sel(garment_id: str) -> Selection:
    return Selection(garment_id=garment_id, occasion_id=store.get().garments[garment_id].occasions[0])


@pytest.mark.parametrize("garment_id", ["ao-ngu-than", "ao-dai", "ao-tu-than", "ao-ba-ba", "ao-com", "tho-cam-e-de"])
@pytest.mark.parametrize("with_reference", [True, False])
def test_the_wearer_stays_the_same_person(garment_id, with_reference):
    p = tryon.build_prompt(sel(garment_id), with_reference=with_reference)
    assert "same person" in p and "same gender" in p
    assert "Do not replace them" in p
    assert ("IMAGE 2" in p) == with_reference


@pytest.mark.parametrize("garment_id", ["ao-ngu-than", "ao-dai", "ao-ba-ba"])
def test_a_man_gets_the_mens_cut(garment_id):
    g = store.get().garments[garment_id]
    p = tryon.build_prompt(sel(garment_id), with_reference=True)
    assert g.men_cut and f"If the wearer is a man, use the men's cut: {g.men_cut}" in p


@pytest.mark.parametrize("garment_id", ["ao-tu-than", "ao-com", "tho-cam-e-de"])
def test_womens_garments_have_no_mens_cut(garment_id):
    assert "men's cut" not in tryon.build_prompt(sel(garment_id), with_reference=True)
