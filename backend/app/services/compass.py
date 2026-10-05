"""Cultural Compass: the single source of truth for cultural verdicts.

Gemini never decides whether a look is right; it only renders or explains what this module decides.
All wording comes from content (rules.json, accessory.message), so the logic here never changes
when the team adds data.
"""

from ..content import store
from ..content.schemas import KEEP_OPTION, Garment, Message, ZoneOption
from ..models import LABELS, SEVERITY, CompassResult, Selection, Trigger
from .harmony import harmony_notes


class SelectionError(ValueError):
    """The selection refers to something this garment does not offer (HTTP 422)."""


def _validate(sel: Selection) -> Garment:
    c = store.get()
    g = c.garments.get(sel.garment_id)
    if g is None:
        raise SelectionError(f"Không có trang phục '{sel.garment_id}'")
    if sel.occasion_id not in c.occasions:
        raise SelectionError(f"Không có dịp '{sel.occasion_id}'")
    for col in sel.colors:
        if col not in g.colors:
            raise SelectionError(f"Màu '{col}' không có trong lựa chọn của {g.name_vi}")
    for acc in sel.accessories:
        if acc not in g.accessories:
            raise SelectionError(f"Phụ kiện '{acc}' không có trong lựa chọn của {g.name_vi}")
    zones = {z.part: z for z in g.zones}
    for m in sel.modifications:
        if m.zone not in zones:
            raise SelectionError(f"'{m.zone}' không phải một phần của {g.name_vi}")
        if m.change not in {o.id for o in zones[m.zone].options}:
            raise SelectionError(f"'{m.change}' không phải lựa chọn của phần '{m.zone}' ({g.name_vi})")
    return g


def changes(sel: Selection, g: Garment) -> list[tuple[str, ZoneOption]]:
    """The zone options picked in a valid selection, leaving out the ones that keep the garment as it is."""
    options = {(z.part, o.id): o for z in g.zones for o in z.options}
    return [(m.zone, options[m.zone, m.change]) for m in sel.modifications if m.change != KEEP_OPTION]


def _fill(text: str, blanks: dict[str, str]) -> str:
    """The rule's words with the blanks filled; a sentence that opens with a part's name ("cổ áo …") gets its capital."""
    for k, v in blanks.items():
        text = text.replace("{" + k + "}", v)
    return text[:1].upper() + text[1:]


def _trigger(
    rule_type: str,
    target: str,
    target_name: str,
    kind: str,
    override: Message | None = None,
    blanks: dict[str, str] | None = None,
) -> Trigger:
    """One rule that fired, in words about the thing that was changed (an accessory's own message wins)."""
    rule = store.get().rules[rule_type]
    msg = override or rule.by.get(kind) or rule
    fill = {"name": target_name, **(blanks or {})}
    return Trigger(
        type=rule_type,
        state=rule.state,
        target=target,
        target_name=target_name,
        ti=_fill(msg.ti, fill),
        teo=_fill(msg.teo, fill),
        why=_fill(msg.why, fill),
        sources=rule.sources,
    )


def _collect(sel: Selection, g: Garment) -> list[Trigger]:
    c = store.get()
    out: list[Trigger] = []

    for acc_id in sel.accessories:
        a = c.accessories[acc_id]
        kind_rule = {"traditional-foreign": "fusion", "restricted": "restricted", "modern": "flexible"}.get(a.kind)
        if kind_rule:
            out.append(_trigger(kind_rule, acc_id, a.name_vi, "accessory", a.message))
        if a.occasions and sel.occasion_id not in a.occasions:
            out.append(_trigger("occasion", acc_id, a.name_vi, "accessory"))

    for col_id in sel.colors:
        col = c.colors[col_id]
        if col.restricted:
            out.append(_trigger("restricted", col_id, col.name, "color"))
    changed = [x for x in sel.colors if x not in g.default_colors and not c.colors[x].restricted]
    if changed:
        out.append(_trigger("flexible", changed[0], c.colors[changed[0]].name, "color"))

    levels = {z.part: z.level for z in g.zones}
    for zone, option in changes(sel, g):
        rule_type = {"keep": "core", "caution": "caution", "free": "flexible"}[levels[zone]]
        out.append(_trigger(rule_type, zone, f"{zone}: {option.label}", "zone", blanks={"zone": zone, "option": option.label}))

    if sel.occasion_id not in g.occasions:
        out.append(_trigger("occasion", g.id, g.name_vi, "garment"))

    return out


def _alternative(sel: Selection, g: Garment, triggers: list[Trigger]) -> Selection:
    """Swap or drop only what caused a distorted verdict; keep the rest of the user's choices."""
    c = store.get()
    bad = {t.target for t in triggers if t.state == "distorted"}
    accessories: list[str] = []
    for a in sel.accessories:
        if a not in bad:
            accessories.append(a)
            continue
        alt = c.accessories[a].alternative
        if alt and alt in g.accessories and alt not in accessories:
            accessories.append(alt)
    colors = [x for x in sel.colors if x not in bad] or g.default_colors[:1]
    return sel.model_copy(
        update={
            "accessories": accessories,
            "colors": colors,
            "modifications": [m for m in sel.modifications if m.zone not in bad],
        }
    )


def _state(triggers: list[Trigger]) -> str:
    return max((t.state for t in triggers), key=SEVERITY.__getitem__, default="fit")


def evaluate(sel: Selection) -> CompassResult:
    g = _validate(sel)
    triggers = _collect(sel, g)
    state = _state(triggers)

    alternative = alt_state = None
    if state == "distorted":
        alternative = _alternative(sel, g, triggers)
        alt_state = _state(_collect(alternative, g))

    # Most severe first so the UI can show triggers[0] as the headline
    triggers.sort(key=lambda t: -SEVERITY[t.state])
    return CompassResult(
        state=state,
        label=LABELS[state],
        triggers=triggers,
        harmony_notes=harmony_notes(sel.colors),
        alternative=alternative,
        alternative_state=alt_state,
    )
