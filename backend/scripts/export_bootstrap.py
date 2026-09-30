"""Write the whole book's content (the same JSON as GET /content/bootstrap) to a file.

Used to build the site without a backend (GitHub Pages): the frontend reads /bootstrap.json instead of the API.

  python -m scripts.export_bootstrap ../frontend/public/bootstrap.json
"""

import json
import sys
from pathlib import Path

from app.content import store
from app.routers.content import bootstrap


def main() -> None:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "bootstrap.json")
    store.reload()  # refuses broken content, like the server does
    out.write_text(json.dumps(bootstrap(), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
