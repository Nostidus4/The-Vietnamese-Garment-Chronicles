"""Giọng đọc cho Opening (Gemini TTS). Chạy trong thư mục backend:

  python -m scripts.generate_voices plan  [--screen s01 …]        in các "đoạn nói liền" sẽ tạo, không gọi API
  python -m scripts.generate_voices design --voice ba [--voice ti …]   thiết kế 3 phương án giọng cho mỗi nhân vật
  python -m scripts.generate_voices takes --screen s01 [--screen s05] [--take t02]
                                                                  tạo 3 bản cho mỗi đoạn, tự chọn bản tốt nhất
  python -m scripts.generate_voices recue --screen s01            đo lại mốc thời gian của âm thanh đã có

Sau đó mở http://localhost:3001/voice-review (backend chạy với DEV_TOOLS=1) để nghe, đổi bản đã chọn,
chọn giọng thiết kế, hoặc tạo lại riêng một đoạn. Cần GEMINI_API_KEY (backend/.env) và ffmpeg.
"""

import argparse

from app.content import store
from app.services import voiceover as vo


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["plan", "design", "takes", "recue"])
    ap.add_argument("--screen", action="append", default=[])
    ap.add_argument("--voice", action="append", default=[])
    ap.add_argument("--take")
    args = ap.parse_args()

    store.reload()
    screens = [s for s in store.get().opening if not args.screen or s.id in args.screen]
    voices = {v["id"]: v for v in vo.voices_doc()["voices"]}

    if args.cmd == "plan":
        for s in screens:
            for t in vo.takes_of(s, voices):
                v = voices[t.voice]
                print(f"{s.id} {t.id} [{t.voice} → {(voices[v["same_as"]] if v.get("same_as") else v).get("voice_id") or v["fallback"]}] câu {t.beats}: {t.text}")
        return

    c = vo.client()
    if args.cmd == "design":
        for vid in args.voice or list(voices):
            print(f"Thiết kế giọng {vid}…")
            vo.design(c, vid)
        print("Nghe và chọn ở /voice-review (mặc định dùng phương án a).")
        return

    for s in screens:
        if not any(b.voice for b in s.beats):
            continue
        print(f"Screen {s.id}…")
        if args.cmd == "recue":
            vo.recue_screen(c, s)  # re-measure cue times of the audio already made
        else:
            vo.make_screen(c, s, only=args.take)
    print("Xong. Nghe lại ở /voice-review.")


if __name__ == "__main__":
    main()
