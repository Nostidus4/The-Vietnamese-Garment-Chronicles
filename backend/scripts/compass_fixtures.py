"""Cases for the browser Compass (frontend/src/lib/compass.ts) to match, judged here by the Python one.

    python -m scripts.compass_fixtures ../frontend/src/lib/compass.fixtures.json

Writes the content the Compass reads (garments, accessories, colours, occasions, rules) and a few hundred looks with
the verdict this module gives them. Re-run after changing rules.json, accessories.json or a garment, then run
`npx vitest run` in frontend/: any look the two disagree on fails the test.
"""

import itertools
import json
import sys
from pathlib import Path

from app.content import store
from app.models import Modification, Selection
from app.services.compass import evaluate


def looks():
    c = store.get()
    for g in c.garments.values():
        occasions = list(c.occasions)
        accs = g.accessories
        # every occasion with the plain garment
        for o in occasions:
            yield Selection(garment_id=g.id, occasion_id=o)
        # each accessory alone, and every pair, at the garment's first occasion
        for a in accs:
            yield Selection(garment_id=g.id, occasion_id=g.occasions[0], accessories=[a])
        for a, b in itertools.combinations(accs, 2):
            yield Selection(garment_id=g.id, occasion_id=occasions[-1], accessories=[a, b])
        # colours: one, and the first pairs
        for col in g.colors:
            yield Selection(garment_id=g.id, occasion_id=g.occasions[0], colors=[col])
        for x, y in list(itertools.combinations(g.colors, 2))[:6]:
            yield Selection(garment_id=g.id, occasion_id=g.occasions[0], colors=[x, y])
        # every zone option
        for z in g.zones:
            for opt in z.options:
                yield Selection(garment_id=g.id, occasion_id=g.occasions[0], modifications=[Modification(zone=z.part, change=opt.id)])
        # a busy look: a foreign accessory, a modern one, a colour and a zone change together
        mods = [Modification(zone=z.part, change=z.options[-1].id) for z in g.zones if z.options][:1]
        foreign = [a for a in accs if c.accessories[a].kind != "traditional-vn"][:2]
        yield Selection(garment_id=g.id, occasion_id=occasions[-1], accessories=foreign, colors=g.colors[-1:], modifications=mods)


def main(out: str) -> None:
    store.reload()
    c = store.get()
    cases = []
    for sel in looks():
        try:
            r = evaluate(sel)
        except ValueError:
            continue
        cases.append({"selection": sel.model_dump(), "result": r.model_dump()})
    content = {
        "garments": {k: v.model_dump() for k, v in c.garments.items()},
        "accessories": {k: v.model_dump() for k, v in c.accessories.items()},
        "colors": {k: v.model_dump() for k, v in c.colors.items()},
        "occasions": list(c.occasions),
        "rules": [r.model_dump() for r in c.rules.values()],
    }
    Path(out).write_text(json.dumps({"content": content, "cases": cases}, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(cases)} looks → {out}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "compass.fixtures.json")
