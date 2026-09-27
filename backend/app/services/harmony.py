"""F2 color harmony: aesthetic hints for Tí only. Never changes the cultural state."""

import colorsys

from ..content import store


def _hsv(hex_color: str) -> tuple[float, float, float]:
    r, g, b = (int(hex_color[i : i + 2], 16) / 255 for i in (1, 3, 5))
    return colorsys.rgb_to_hsv(r, g, b)


def harmony_notes(color_ids: list[str]) -> list[str]:
    colors = store.get().colors
    hsv = [_hsv(colors[c].hex) for c in color_ids if c in colors]
    if len(hsv) < 2:
        return []
    notes: list[str] = []
    (h1, s1, v1), (h2, s2, v2) = hsv[0], hsv[1]
    hue_gap = min(abs(h1 - h2), 1 - abs(h1 - h2))
    if s1 > 0.5 and s2 > 0.5 and 0.08 < hue_gap < 0.3:
        notes.append("Hai màu đậm, gần nhau trên vòng màu dễ bị 'chỏi'. Thử hạ một màu xuống tông nhạt hơn.")
    if abs(v1 - v2) < 0.1 and abs(s1 - s2) < 0.1 and hue_gap < 0.05:
        notes.append("Hai màu gần như trùng nhau – chọn một màu tương phản hơn để có điểm nhấn.")
    if 0.45 < hue_gap and s1 > 0.3 and s2 > 0.3:
        notes.append("Cặp màu tương phản mạnh: rất nổi bật khi chụp ảnh, nên để màu nhạt hơn làm màu chính.")
    return notes
