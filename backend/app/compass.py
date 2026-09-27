"""Cultural Compass: a rule engine that is the single source of truth for cultural verdicts.

Gemini never decides whether a look is right; it only renders or explains what this module decides.
"""

import colorsys

from . import data
from .models import LABELS, SEVERITY, CompassResult, Selection, Trigger


def _trigger(rule_id: str, target: str) -> Trigger:
    rule = data.rules()[rule_id]
    return Trigger(
        rule_id=rule["id"],
        type=rule["type"],
        state=rule["state"],
        target=target,
        ti=rule["ti"],
        teo=rule["teo"],
        why=rule["why"],
        sources=rule["sources"],
    )


def _harmony_notes(color_ids: list[str]) -> list[str]:
    """Aesthetic hints for Tí only; never changes the cultural state."""
    hsv = []
    for cid in color_ids:
        c = data.color(cid)
        if not c:
            continue
        r, g, b = (int(c["hex"][i : i + 2], 16) / 255 for i in (1, 3, 5))
        hsv.append(colorsys.rgb_to_hsv(r, g, b))
    warm_saturated = [h for h in hsv if (h[0] < 0.17 or h[0] > 0.92) and h[1] > 0.5]
    if len(warm_saturated) >= 3:
        return ["Ba màu nóng, đậm cùng lúc dễ bị rối mắt. Thử giữ một màu nóng làm điểm nhấn và đổi các màu còn lại sang tông trung tính."]
    return []


def evaluate(sel: Selection) -> CompassResult:
    g = data.garment(sel.garment_id)
    if g is None:
        raise ValueError(f"Unknown garment: {sel.garment_id}")

    triggers: list[Trigger] = []

    for acc_id in sel.accessories:
        acc = data.accessory(acc_id)
        if acc is None:
            continue
        if acc["kind"] == "traditional-foreign":
            triggers.append(_trigger("fusion-foreign-traditional", acc_id))
        elif acc["kind"] == "restricted":
            triggers.append(_trigger("restricted-ceremonial", acc_id))
        elif acc["kind"] == "modern":
            triggers.append(_trigger("flexible-modern", acc_id))
        allowed = acc.get("occasions")
        if allowed and sel.occasion_id not in allowed:
            triggers.append(_trigger("occasion-mismatch", acc_id))

    keep_zones = {z["part"] for z in g["zones"] if z["level"] == "keep"}
    for mod in sel.modifications:
        if mod.zone in keep_zones:
            triggers.append(_trigger("core-structure-changed", mod.zone))
        else:
            triggers.append(_trigger("flexible-modern", mod.zone))

    if sel.occasion_id not in g["occasions"]:
        triggers.append(_trigger("occasion-mismatch", sel.garment_id))

    non_default = [c for c in sel.colors if c not in g["default_colors"]]
    if non_default:
        triggers.append(_trigger("flexible-modern", non_default[0]))

    state = max((t.state for t in triggers), key=SEVERITY.__getitem__, default="fit")

    alternative = None
    if state == "distorted":
        alternative = _alternative(sel, triggers)

    return CompassResult(
        state=state,
        label=LABELS[state],
        triggers=triggers,
        harmony_notes=_harmony_notes(sel.colors),
        alternative=alternative,
    )


def _alternative(sel: Selection, triggers: list[Trigger]) -> Selection:
    """Drop whatever caused a distorted verdict; keep the rest of the user's choices."""
    bad = {t.target for t in triggers if t.state == "distorted"}
    return sel.model_copy(
        update={
            "accessories": [a for a in sel.accessories if a not in bad],
            "modifications": [m for m in sel.modifications if m.zone not in bad],
        }
    )
