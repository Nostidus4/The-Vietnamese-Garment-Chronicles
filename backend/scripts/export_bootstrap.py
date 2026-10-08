"""Write the whole book's content (the same JSON as GET /content/bootstrap) to a file.

Used to build the site without a backend (GitHub Pages): the frontend reads /bootstrap.json instead of the API
(quiz pictures come from public/media/quiz, copied from backend/content/media/quiz by the Pages workflow).

  python -m scripts.export_bootstrap ../frontend/public/bootstrap.json
"""

import json
import sys
from pathlib import Path

from app.content import store
from app.routers.content import bootstrap
from app.routers.extras import ANSWER_NAMES


def main() -> None:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "bootstrap.json")
    store.reload()  # refuses broken content, like the server does
    content = bootstrap()
    # "Việt hay không?" needs no server: with answers in the file the browser can ask and judge it by itself (#151)
    content["quiz"] = {
        "choices": ANSWER_NAMES,
        "items": [
            {
                "id": q.id,
                "image": f"/media/{q.image}",
                "photo": q.photo.model_dump() if q.photo else None,
                "answer": q.answer,
                "answer_name": ANSWER_NAMES[q.answer],
                "explanation": q.explanation,
                "sources": q.sources,
            }
            for q in store.get().quiz.values()
        ],
    }
    out.write_text(json.dumps(content, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
