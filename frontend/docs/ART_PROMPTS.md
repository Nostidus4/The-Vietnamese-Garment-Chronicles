# Việt Phục Du Ký – Art Bible (prompt hình ảnh)

*Bộ prompt cho Nano Banana (Gemini image) để tạo nhân vật, logo, bìa sách, bối cảnh trang web, stamp và 8 trang truyện. Prompt viết bằng tiếng Anh vì model hiểu chính xác hơn; giải thích bằng tiếng Việt. Cập nhật 27/09/2026.*

**Ký hiệu:** trong các prompt, `{STYLE}` và `{AVOID}` nghĩa là dán nguyên văn hai khối ở Mục 1 vào đúng chỗ đó. Chữ trong ngoặc nhọn khác như `{REGION}` là chỗ cần thay.

## 0. Quy trình dùng (đọc trước)

1. **Làm đúng thứ tự:** Style Bible → character sheet (Tí, Tèo, Bà) → logo → bìa & giấy → bối cảnh → trang truyện. Mọi ảnh sau đều gửi kèm ảnh character sheet và ảnh "style anchor" đã chọn làm ảnh tham chiếu.
2. **Mỗi prompt = khối STYLE + khối AVOID + phần riêng.** Copy nguyên văn hai khối ở Mục 1 lên đầu mỗi prompt.
3. **Không để AI viết chữ.** Model hay viết sai tiếng Việt có dấu. Mọi chữ (tên sách, lời thoại, tên vùng) do web hiển thị bằng HTML hoặc gõ trong Figma/Canva.
4. **Không để AI vẽ bản đồ Việt Nam.** Bản đồ luôn là SVG chuẩn có Hoàng Sa, Trường Sa, đặt đè lên ảnh nền. Ảnh nền chỉ để trống chỗ cho bản đồ.
5. **Chọn tỉ lệ khung** trong Gemini (AI Studio: Aspect ratio) đúng như ghi ở từng prompt.
6. **Mỗi ảnh tạo 3–4 bản, chọn 1.** Muốn sửa nhỏ thì dùng lệnh sửa: "Keep everything the same, only change …" thay vì tạo lại từ đầu.
7. **Lưu đúng tên file và thư mục** như bảng ở Mục 10, rồi chạy `python -m scripts.check_content`.
8. **Lưu prompt + bản được chọn vào tab Tổng hợp Prompt** – đây là bằng chứng cho Form 7 (quy trình prompting).

## 1. Style Bible – khối dán đầu mọi prompt

Đây là "giọng vẽ" chung của cả sản phẩm: truyện tranh màu hiện đại nhưng bảng màu và chất liệu gợi tranh Đông Hồ, giấy dó – trẻ trung mà không mượn phong cách manga Nhật (tránh mâu thuẫn với thông điệp chống Fusion).

```
STYLE — Việt Phục Du Ký:
Modern full-color comic illustration for a Vietnamese storybook. Clean, confident ink linework (medium weight, slightly tapered), soft cel shading with a light watercolor wash. Warm, natural palette inspired by Đông Hồ folk woodblock prints: điệp-shell cream (#F3EAD7), earthy red (#B5452E), indigo (#2F4A6D), leaf green (#5E7F4A), turmeric yellow (#D9A43B), soot brown-black (#2B2118). Subtle hand-made dó-paper fiber texture over the whole image. Warm late-afternoon light, gentle and nostalgic. Characters are expressive but realistic in proportion (about 6.5 heads tall), not chibi, not anime big-eye style.
```

```
AVOID: any text, letters, numbers, captions, logos or watermarks; Chinese, Japanese or Korean traditional clothing, hairstyles or architecture (no hanfu cross collars, no kimono or obi, no hanbok, no pagoda roofs with upturned Chinese-style eaves unless specified; no Chinese frog buttons or knotted "pankou" closures; no Chinese mandarin-collar jackets or qipao styling; no Japanese seigaiha overlapping-semicircle wave pattern); 3D render look; photorealism; neon colors; heavy black outlines; cluttered backgrounds.
```

| Màu | Mã | Dùng cho |
| --- | --- | --- |
| Kem vỏ điệp | #F3EAD7 | Nền giấy, trang sách |
| Đỏ son đất | #B5452E | Điểm nhấn, stamp, cảnh báo ⛔ |
| Chàm | #2F4A6D | Chữ tiêu đề, viền, bóng đổ |
| Lục lá | #5E7F4A | Thiên nhiên, trạng thái ✅ |
| Vàng nghệ | #D9A43B | Ánh sáng, chỉ vàng, highlight |
| Nâu mực | #2B2118 | Nét vẽ, chữ nội dung |

Frontend nên dùng đúng 6 mã màu này trong `globals.css` để ảnh và giao diện ăn khớp.

## 2. Nhân vật – character sheet

Tạo trước tiên. Bản được chọn là "ảnh tham chiếu nhân vật" gửi kèm mọi prompt sau. Tỉ lệ **16:9**, nền trơn kem để dễ tách. Lưu ở `content/media/characters/` (không hiển thị trên web, chỉ dùng làm tham chiếu).

### 2.1 Tí

Tỉ lệ 16:9 · file: characters/ti-sheet.png

```
{STYLE}
{AVOID}

Character turnaround sheet of TÍ, a 17-year-old Vietnamese high-school boy, on a plain cream background.
Show: front view, three-quarter view, side view (full body), plus 4 head close-ups with expressions: excited grin, confused, surprised, proud.
Look: slim, medium height, warm tan skin, short messy black hair with a cowlick, bright curious eyes, quick expressive eyebrows.
Outfit: Vietnamese school uniform — white short-sleeved shirt, navy trousers, white sneakers, a faded red backpack with a small keychain.
Personality in pose: energetic, leaning forward, hands always moving.
Keep proportions and outfit identical across all views.
```

### 2.2 Tèo

Tỉ lệ 16:9 · file: characters/teo-sheet.png

```
{STYLE}
{AVOID}

Character turnaround sheet of TÈO, a 17-year-old Vietnamese high-school boy, best friend of Tí, on a plain cream background.
Show: front, three-quarter and side view (full body), plus 4 head close-ups: thoughtful, gently skeptical (one eyebrow up), explaining with a finger raised, warm smile.
Look: a bit taller than Tí, neat short black hair parted to the side, round thin-framed glasses, calm eyes, light-medium skin.
Outfit: same Vietnamese school uniform (white short-sleeved shirt, navy trousers), a small cloth notebook always in hand, a pen clipped to the shirt pocket.
Personality in pose: calm, upright, observant.
Keep proportions and outfit identical across all views.
```

*Tuỳ chọn:* nếu đội muốn một cặp nam–nữ (hợp với các trang phục nữ như áo tứ thân), đổi Tèo thành "a 17-year-old Vietnamese high-school girl, neat shoulder-length black hair, round glasses, school uniform white áo dài on Mondays" và giữ các phần còn lại. Chốt một lần rồi dùng xuyên suốt.

### 2.3 Bà (hai độ tuổi)

Tỉ lệ 16:9 · file: characters/ba-sheet.png

```
{STYLE}
{AVOID}

Character sheet of BÀ, Tí's grandmother, a Vietnamese seamstress, shown at two ages side by side on a plain cream background.
LEFT — young Bà, about 22, in the 1970s: slender, long black hair in a low bun, gentle confident smile, wearing a sky-blue (xanh thiên thanh) Vietnamese áo dài with a small embroidered flower sprig near one cuff, white trousers. Two long flaps front and back, side slits from the waist, standing collar — accurate modern Vietnamese áo dài.
RIGHT — elderly Bà, about 75: grey hair in a neat bun, kind wrinkled eyes, reading glasses on a cord, simple brown áo bà ba blouse and dark trousers, a yellow cloth measuring tape around her neck.
Front and three-quarter views for each age, plus one close-up of elderly Bà smiling softly.
```

### 2.4 Cô giáo

Tỉ lệ 16:9 · file: characters/co-giao-sheet.png

```
{STYLE}
{AVOID}

Character sheet of a Vietnamese high-school literature teacher, about 35, on a plain cream background: warm but serious face, black hair tied back, wearing a plain pale-lilac Vietnamese áo dài (two long flaps, side slits, standing collar) over white trousers. Front and three-quarter view, plus a close-up holding up a rolled poster.
```

### 2.5 Avatar Tí & Tèo cho Compass

Tỉ lệ 1:1 · gửi kèm sheet 2.1 + 2.2 · file: frontend/public/ui/ti-*.png, teo-*.png

```
{STYLE}
{AVOID}

Using the attached character sheets, draw a 2×4 grid of round bust portraits (head and shoulders, cream circle background):
Row 1 — TÍ: happy thumbs-up (for ✅), excited sparkle (for ✨), unsure scratching head (for ⚠️), wincing with hands raised "oops" (for ⛔).
Row 2 — TÈO: nodding smile (✅), impressed (✨), thoughtful finger on chin (⚠️), serious gentle warning with index finger up (⛔).
Same size and framing for all 8 so they can be cut into separate icons.
```

## 3. Logo

Tạo **biểu tượng (emblem) không có chữ** bằng AI, rồi ghép chữ "Việt Phục Du Ký" trong Canva/Figma bằng font có tiếng Việt (gợi ý: *Patrick Hand* cho giọng viết tay, hoặc *Playfair Display* cho giọng sách cổ). Không dùng hình bản đồ Việt Nam trong logo – rất khó vẽ đúng và đủ Hoàng Sa, Trường Sa ở kích thước nhỏ.

### 3.1 Emblem

Tỉ lệ 1:1 · file: frontend/public/brand/emblem.png

```
{STYLE}
{AVOID}

A simple, iconic emblem for a Vietnamese storybook app, centered on a flat cream background, generous empty margin.
Concept: an open cloth-bound notebook seen from the front; a sewing needle rises from its pages trailing a single golden thread; the thread curls upward and forms the flowing silhouette of an áo dài flap in the wind.
Flat shapes, two to three colors only (indigo #2F4A6D, turmeric gold #D9A43B, earthy red #B5452E accent), bold readable at 32 px, no gradients, no tiny details.
```

### 3.2 Biến thể dấu mộc (stamp logo)

Tỉ lệ 1:1 · file: frontend/public/brand/seal.png

```
{STYLE}
{AVOID}

The same needle-and-thread-áo-dài emblem redrawn as a traditional red ink seal stamp (con dấu): square seal with rounded corners, earthy red #B5452E ink on cream paper, slightly uneven hand-pressed edges and ink texture, emblem in negative space inside. No characters or letters.
```

**Favicon:** thu nhỏ emblem 3.1 về 512×512 rồi dùng realfavicongenerator.net để xuất `favicon.ico` – đặt vào `frontend/src/app/`.

## 4. Bìa sách và giấy

### 4.1 Bìa trước quyển "Việt Phục Du Ký"

Tỉ lệ 3:4 · file: frontend/public/book/cover.png

```
{STYLE}
{AVOID}

Front cover of an old hand-made seamstress's notebook, seen straight on, filling the frame.
Cover material: faded indigo linen cloth, slightly worn corners, a few loose threads.
Decoration: delicate gold-thread embroidery border of small lotus leaves, sewing scissors and a spool of thread; a small sky-blue fabric swatch stitched onto the lower right corner.
Center area: a plain embroidered rectangular label frame left EMPTY for the title (no text, no wave or other pattern inside the label).
A cream ribbon bookmark hangs from the bottom edge. Soft warm light from the upper left.
```

### 4.2 Bìa sau

Tỉ lệ 3:4 · file: frontend/public/book/back.png

```
{STYLE}
{AVOID}

Back cover of the same indigo linen notebook (match the attached front cover exactly): plain, a small gold-thread embroidered needle-and-thread emblem centered near the bottom, subtle wear on the edges.
```

### 4.3 Giấy trang sách (tile lặp)

Tỉ lệ 1:1 · file: frontend/public/book/paper.png

```
Seamless tileable texture of handmade Vietnamese dó paper, warm cream (#F3EAD7), visible soft plant fibers and tiny flecks, very low contrast so text stays readable, even lighting, no shadows, no objects, no text. Must tile seamlessly on all edges.
```

### 4.4 Trang lót (endpaper)

Tỉ lệ 3:4 · file: frontend/public/book/endpaper.png

```
{STYLE}
{AVOID}

Endpaper pattern for the inside cover: repeating pattern on cream paper of tailor's tools drawn in thin indigo lines — thread spools, needles, tailor's chalk, measuring tape curls, pinned fabric swatches, tiny nón lá and folding fans. Evenly spaced, calm, decorative, not busy.
```

### 4.5 Bookmark thêu (cho trang truyện 7)

Tỉ lệ 1:3 · file: content/media/comic/bookmark.png

```
{STYLE}
{AVOID}

A long fabric bookmark lying flat, cream silk with an embroidered border of multicolored threads (red, indigo, gold, green), a tassel at the bottom. The central area is left as plain embroidered background with a faint glow — no map, no text. (The Vietnam map is added later as an overlay.)
```

Bản đồ thêu trên bookmark: web chồng SVG bản đồ chuẩn (có Hoàng Sa, Trường Sa) với nét dạng đường chỉ lên vùng trống này.

## 5. Bối cảnh trang web

### 5.1 Bàn may của bà – nền chính trang chủ

Tỉ lệ 16:9 (xuất 2560×1440) · file: frontend/public/scene/desk.png

```
{STYLE}
{AVOID}

Top-down view of Bà's old wooden sewing table by a window, late afternoon sun casting long warm light and the soft shadow of window bars.
Around the EDGES only: a vintage black sewing machine in the upper-left corner, spools of colored thread, a tin of tailor's chalk, scissors, a yellow measuring tape curling across the corner, pinned fabric swatches (indigo, sky-blue silk, brown linen), a small cup of trà on a saucer, a folded nón lá, a few old family photos half-hidden under a swatch.
The CENTER 60% of the table must be clear, calm wood surface with nothing on it (the interactive book is placed there).
Cozy, nostalgic, inviting; slight vignette at the edges.
```

Frontend: đặt ảnh này làm nền `body`, cuốn sách nằm giữa. Trên điện thoại thì cắt lấy phần giữa.

### 5.2 Nền trang bản đồ (hai trang sách mở)

Tỉ lệ 3:2 · file: frontend/public/book/map-spread.png

```
{STYLE}
{AVOID}

An open notebook, two facing pages, seen from above, filling the frame. Aged cream dó paper with a soft gutter shadow in the middle.
LEFT page: almost empty — a faint pencil grid, a small hand-drawn compass rose in the lower-left corner, a few tiny sketched waves in the right margin and a small wind-rose; the large central area stays EMPTY (a map is placed there later).
RIGHT page: faint ruled lines like a diary, a pressed flower and a small fabric swatch taped in the top corner, the rest EMPTY for handwritten text.
No map, no coastline, no islands, no text.
```

**Bốn tranh nhỏ khi rê chuột vào vùng** (hiện ở trang phải, phía trên chữ viết tay). Tỉ lệ 4:3, viền như ảnh dán trong sổ. File: `frontend/public/regions/<region-id>.png`.

### 5.3 Bắc Bộ / Kinh Bắc

Tỉ lệ 4:3 · file: regions/bac-bo.png

```
{STYLE}
{AVOID}

Small vignette illustration, like a photo taped into a notebook with a torn-paper edge: a spring village festival in the Red River Delta — a calm pond with a wooden boat, young women in brown áo tứ thân with nón quai thao singing quan họ on the boat, a banyan tree and a village communal gate (Vietnamese đình style with curved but low, heavy tiled roofs), soft spring haze.
```

### 5.4 Huế

Tỉ lệ 4:3 · file: regions/hue.png

```
{STYLE}
{AVOID}

Small vignette illustration with a torn-paper edge: the Perfume River (sông Hương) in Huế at dusk, a simple wooden sampan with a woman in a purple áo dài and nón lá, soft purple-gold sky, the gentle outline of a steel truss bridge in the distance, pine-covered hills. Calm, poetic.
```

### 5.5 Nam Bộ

Tỉ lệ 4:3 · file: regions/nam-bo.png

```
{STYLE}
{AVOID}

Small vignette illustration with a torn-paper edge: a Mekong Delta canal, coconut palms, a small floating market boat loaded with fruit, a woman rowing in a black áo bà ba with a checkered khăn rằn scarf and nón lá, bright humid sunlight, reflections on brown water.
```

### 5.6 Tây Bắc (chương khóa)

Tỉ lệ 4:3 · file: regions/tay-bac.png

```
{STYLE}
{AVOID}

Small vignette illustration with a torn-paper edge, deliberately soft and unfinished like a pencil sketch with only light watercolor: misty terraced rice fields on mountain slopes at dawn, a few stilt houses in the distance. NO people and NO clothing (this chapter is being co-created with the communities and will be illustrated with them). A small closed brass padlock drawn on a thread in the corner.
```

Vì sao Tây Bắc không vẽ người: trang phục các dân tộc thiểu số chưa được cộng đồng thẩm định (Research Mục 27). Vẽ cảnh không có người giữ đúng thông điệp "đang đồng tạo cùng cộng đồng".

### 5.7 Banner đầu chương (x3)

Tỉ lệ 21:9 · file: frontend/public/regions/<id>-banner.png

```
{STYLE}
{AVOID}

Wide panoramic banner, painted on cream dó paper with soft edges fading to paper color at the bottom, for the chapter "{REGION}".
{REGION SCENE: dùng lại mô tả cảnh của 5.3 / 5.4 / 5.5 nhưng rộng hơn, không có người ở tiền cảnh}.
Leave the left third calm and empty (the chapter title is placed there as text).
```

### 5.8 Nền trang "Du Ký của tôi"

Tỉ lệ 16:9 · file: frontend/public/scene/duky.png

```
{STYLE}
{AVOID}

A corkboard-like wall made of woven bamboo above the same wooden sewing table, with a few empty photo corners, washi-tape strips and small clothespins on a string — all EMPTY (user photos are placed on top by the web app). Warm evening lamplight, cozy.
```

## 6. Stamp và mảnh ký ức

### 6.1 Culture Stamp (x3 + khóa)

Tỉ lệ 1:1 · file: content/media/stamps/<region-id>.png

```
{STYLE}
{AVOID}

A round postal-style culture stamp with a perforated edge, printed in two inks (earthy red #B5452E and indigo #2F4A6D) on cream paper, slightly misaligned print for a hand-made feel.
Center motif for {REGION}:
– bac-bo: a nón quai thao above gentle water ripples
– hue: a nón lá and a single áo dài flap flowing in the wind above river waves
– nam-bo: a coconut palm leaf and a small rowing boat
No text, no numbers.
```

Bản khóa (Tây Bắc): cùng khung tem nhưng in mờ màu xám, giữa là ổ khóa nhỏ – file `stamps/tay-bac-locked.png`.

### 6.2 Mảnh ký ức: ảnh bà thời trẻ

Tỉ lệ 3:4 · gửi kèm sheet 2.3 · file: content/media/comic/memory-photo.png

```
Faded 1970s-style photograph (sepia with slight color tint, soft grain, white scalloped border, a corner held by old photo tape): young Bà from the attached sheet standing beside a black sewing machine, wearing her sky-blue áo dài with the small embroidered flower near the cuff, shy proud smile. Photorealistic vintage photo look for this image only (it is a photo inside the storybook). No text.
```

## 7. Trang truyện (8 trang)

Tỉ lệ **3:4** (khớp khung sách 420×560). Luôn gửi kèm: character sheet của nhân vật có mặt + ảnh bìa 4.1 (khi cuốn sổ xuất hiện). Mỗi trang chừa **khoảng trống cho bong bóng thoại** đúng vị trí trong `backend/content/comic.json` (x, y là %). File: `content/media/comic/page-N.png`.

### Trang 1 – Đề bài (P0)

Tỉ lệ 3:4 · gửi kèm character sheet + ảnh liên quan

```
{STYLE}
{AVOID}

Use the attached character sheets; keep faces, hair, glasses and outfits identical.
Vertical comic page, 3 panels.
Panel 1 (top, wide): a bright Vietnamese high-school classroom, wooden desks, a teacher (attached sheet) holding up a colorful rolled-out poster decorated with áo dài and nón lá drawings (no readable text on the poster). Empty space at top-left for a speech bubble.
Panel 2 (middle right): close-up of TÍ grinning, pointing confidently. Empty space in the middle for a speech bubble.
Panel 3 (bottom): TÈO turning to Tí with one eyebrow raised, notebook in hand. Empty space at bottom-left.
All speech-bubble areas are plain background — do not draw bubbles or any text.
```

### Trang 2 – Biết ít quá (P0)

Tỉ lệ 3:4 · gửi kèm character sheet + ảnh liên quan

```
{STYLE}
{AVOID}

Use the attached character sheets; keep faces, hair, glasses and outfits identical.
Vertical comic page, 3 panels.
Panel 1: evening, TÍ and TÈO at a desk in front of a laptop whose screen shows a grid of small traditional Vietnamese garment photos (áo tứ thân, áo ngũ thân, áo dài, áo bà ba — accurate, no foreign costumes). Empty space top-left.
Panel 2: TÍ shrugging awkwardly with a nervous smile. Empty space top-right.
Panel 3: TÍ alone, quiet, chin on hands, looking at the screen, soft lamp light; the screen now shows one sky-blue áo dài. Empty space at the bottom.
All speech-bubble areas are plain background — do not draw bubbles or any text.
```

### Trang 3 – Ký ức (P0)

Tỉ lệ 3:4 · gửi kèm character sheet + ảnh liên quan

```
{STYLE}
{AVOID}

Use the attached character sheets; keep faces, hair, glasses and outfits identical.
Vertical comic page, warm sepia-tinted flashback (softer lines, golden light).
Panel 1 (large): Bà's old house, the sewing machine by the window, young TÍ (about 6 years old, same features) standing beside elderly BÀ who is finishing a high-collared robe with five panels and buttons running down one side (an áo ngũ thân). Empty space at upper right for a bubble.
Panel 2 (bottom): close-up of BÀ smiling gently, glasses on the tip of her nose, needle in hand. Empty space on the left for a bubble.
All speech-bubble areas are plain background — do not draw bubbles or any text.
```

### Trang 4 – Cuốn sổ (P0)

Tỉ lệ 3:4 · gửi kèm character sheet + ảnh liên quan

```
{STYLE}
{AVOID}

Use the attached character sheets; keep faces, hair, glasses and outfits identical.
Vertical comic page, 3 panels, present day.
Panel 1: TÍ and TÈO pushing open the gate of an old house, faded bougainvillea on the fence.
Panel 2: kneeling under the sewing table, opening a long wooden box: inside, the folded sky-blue áo dài, a measuring tape, old photos and a notebook with an indigo linen cover (match the attached cover image).
Panel 3 (large, bottom): close-up of the notebook opened on its first page, elderly handwriting lines drawn as illegible squiggles (no real letters), a faint golden glow rising from the pages. Empty space at the bottom-left for a caption box.
All speech-bubble areas are plain background — do not draw bubbles or any text.
```

### Trang 5 – Bà thời trẻ (P1)

Tỉ lệ 3:4 · gửi kèm character sheet + ảnh liên quan

```
{STYLE}
{AVOID}

Use the attached character sheets; keep faces, hair, glasses and outfits identical.
Vertical comic page, 2 panels.
Panel 1: TÍ holding the faded photo (use the attached memory photo) — the photo is large and central.
Panel 2: TÍ's face softening, TÈO beside him quiet. Empty space along the bottom for a caption.
All speech-bubble areas are plain background — do not draw bubbles or any text.
```

### Trang 6 – Những trang còn trống (P1)

Tỉ lệ 3:4 · gửi kèm character sheet + ảnh liên quan

```
{STYLE}
{AVOID}

Use the attached character sheets; keep faces, hair, glasses and outfits identical.
Vertical comic page, 1 large panel with inset details.
The notebook spread across the table showing sketchbook pages: small pencil-and-watercolor studies of an áo tứ thân (Kinh Bắc), an áo ngũ thân (Huế), an áo bà ba (Nam Bộ), and misty mountains with no people (Tây Bắc), fabric swatches pinned beside them; toward the last pages the paper is blank. TÍ and TÈO lean over it from the top edge. Empty space at the bottom for a caption.
All speech-bubble areas are plain background — do not draw bubbles or any text.
```

### Trang 7 – Bookmark phát sáng (P1)

Tỉ lệ 3:4 · gửi kèm character sheet + ảnh liên quan

```
{STYLE}
{AVOID}

Use the attached character sheets; keep faces, hair, glasses and outfits identical.
Vertical comic page, 2 panels.
Panel 1: the embroidered bookmark (attached) slipping out from between the pages, falling in slow motion.
Panel 2 (large): TÍ placing the bookmark back into the book; the embroidered threads glow gold, the sketches on the pages bloom into full color, a faint sound of festival drums shown as soft rippling lines. Empty space at the bottom for a caption.
All speech-bubble areas are plain background — do not draw bubbles or any text.
```

### Trang 8 – Bị cuốn vào sách (P1)

Tỉ lệ 3:4 · gửi kèm character sheet + ảnh liên quan

```
{STYLE}
{AVOID}

Use the attached character sheets; keep faces, hair, glasses and outfits identical.
Vertical comic page, 1 dramatic full-page panel.
A gust of wind bursting from the open notebook, fabric swatches and pages swirling in a spiral of warm light, TÍ and TÈO being gently pulled into the pages, hair and shirts fluttering, expressions of wonder rather than fear. At the far end of the spiral, a glimpse of a Red River Delta village festival. Empty space at the bottom for a caption.
All speech-bubble areas are plain background — do not draw bubbles or any text.
```

## 8. Avatar thử đồ (ảnh thật)

Avatar là người **giả lập do AI tạo**, không phải người thật, dùng làm "người mẫu" khi người dùng không tải ảnh. Cần ảnh chân thực để Nano Banana thay đồ tự nhiên. Tỉ lệ **3:4**. File: `content/media/avatars/default.png` (bắt buộc), thêm `avatar-2.png` nếu muốn.

### 8.1 Avatar mặc định

Tỉ lệ 3:4 · ảnh chân thực (KHÔNG dùng khối STYLE)

```
Photorealistic full-body studio photo of a fictional young Vietnamese adult, about 20, standing straight facing the camera, relaxed arms slightly away from the body, neutral friendly expression.
Wearing a plain fitted white T-shirt and light grey straight trousers, barefoot or plain white sneakers, hair tied back so the neck and collar area are visible.
Plain light-grey seamless studio background, soft even lighting, no shadows on the wall, whole body in frame with margin above head and below feet. No accessories, no logos, no text.
```

Tạo một avatar nam và một avatar nữ nếu kịp; giữ cùng tư thế, cùng nền để kết quả thử đồ đồng đều.

## 9. Ảnh mẫu chuẩn trang phục (ref)

Đây là ảnh **quan trọng nhất cho độ chính xác văn hóa** – Nano Banana nhìn vào đây để vẽ đúng cổ áo, số thân, đường xẻ. Ưu tiên theo thứ tự:

1. **Ảnh thật** từ nguồn uy tín (bảo tàng, thương hiệu phục dựng) – xin phép, ghi nguồn vào `sources.json`.
2. **Ảnh đội tự chụp** bộ đồ thuê ở tiệm (danh bạ F7).
3. **Ảnh AI** chỉ khi không có hai cách trên – dùng prompt dưới, rồi đối chiếu từng chi tiết với Research Mục 6 và 19.1 trước khi dùng.

### 9.1 Ảnh mẫu (chỉ khi không có ảnh thật)

Tỉ lệ 3:4 · file: content/media/ref/<garment-id>.png

```
Flat, catalogue-style photo of a single {GARMENT NAME} on an invisible mannequin, front view, plain white background, even lighting.
Structure that MUST be correct: {must_keep từ file garments/<id>.json}.
Must NOT include: {must_avoid từ file garments/<id>.json}; any Chinese, Japanese or Korean traditional elements.
Color: {màu mặc định}. No person, no accessories, no text.
```

## 10. Danh sách file và nơi đặt

| Ảnh | Tỉ lệ | Đường dẫn trong repo | Ưu tiên |
| --- | --- | --- | --- |
| Character sheet Tí, Tèo, Bà, Cô giáo | 16:9 | backend/content/media/characters/ | P0 – làm đầu tiên |
| Avatar Tí/Tèo cho Compass (8 icon) | 1:1 | frontend/public/ui/ | P0 |
| Emblem + seal | 1:1 | frontend/public/brand/ | P0 |
| Bìa trước, bìa sau, giấy, trang lót | 3:4 / 1:1 | frontend/public/book/ | P0 |
| Bàn may của bà (nền trang chủ) | 16:9 | frontend/public/scene/desk.png | P0 |
| Nền trang bản đồ | 3:2 | frontend/public/book/map-spread.png | P0 |
| 4 tranh vùng | 4:3 | frontend/public/regions/ | P0 |
| Trang truyện 1–4 | 3:4 | backend/content/media/comic/ | P0 |
| Avatar thử đồ | 3:4 | backend/content/media/avatars/default.png | P0 |
| Ảnh mẫu chuẩn 4 trang phục | 3:4 | backend/content/media/ref/ | P0 |
| Trang truyện 5–8, bookmark, ảnh ký ức | 3:4 / 1:3 | backend/content/media/comic/ | P1 |
| Stamp 3 vùng + khóa | 1:1 | backend/content/media/stamps/ | P1 |
| Banner chương, nền Du Ký | 21:9 / 16:9 | frontend/public/regions/, scene/ | P1 |

## 11. Checklist duyệt từng ảnh

- Không có chữ, số, logo, watermark nào trong ảnh.
- Nhân vật giống character sheet: mặt, tóc, kính, đồng phục.
- Trang phục đúng cấu trúc: áo dài có hai tà và xẻ tà; áo ngũ thân có năm thân, cổ đứng; áo tứ thân mặc ngoài yếm.
- Không có yếu tố Trung/Nhật/Hàn: cổ chéo hanfu, obi, nơ jeogori, mái chùa kiểu Trung Quốc.
- Không có bản đồ Việt Nam do AI vẽ.
- Tây Bắc không có người và trang phục.
- Màu nằm trong bảng màu Mục 1; chỗ trống cho chữ và bong bóng thoại đúng vị trí.
- Đã lưu prompt + ảnh được chọn vào tab Tổng hợp Prompt.

## 12. Tạo lại ảnh Opening S05 và S08 (ticket #7)

Hai ảnh hiện tại có yếu tố Trung Hoa, mâu thuẫn với chính thông điệp của app:
- `s05.png`: áo đỏ trên ma-nơ-canh và áo đang may có **khuy tết kiểu áo Tàu** (frog buttons). Áo của Bà và của Tí cũng dùng kiểu khuy này.
- `s08.png`: góc bìa sổ có **chùa mái cong kiểu Trung Hoa**; áo xanh trên ma-nơ-canh phía sau cũng có khuy tết; bìa sổ khác bố cục `title-page.png`.

**Quy trình:**
1. Dán `{STYLE}` và `{AVOID}` (đã bổ sung frog buttons và mái cong) lên đầu prompt.
2. Đính kèm ảnh tham chiếu:
   - S05: ảnh hiện tại (giữ bố cục).
   - S08: ảnh hiện tại **và** `frontend/public/page/title-page.png` (để bìa khớp cuốn sách trên bàn).
3. Chọn khung 16:9, xuất đúng **1672×941**.
4. Người phụ trách nội dung soát theo checklist bên dưới và đối chiếu Research 6.2 trước khi thay file.
5. Thay `frontend/public/opening/s05.png`, `s08.png`, rồi bỏ ⚠️ của S05 và S08 trong bảng ở `OPENING_PLAN.md`.

### 12.1 S05 — Tiếng máy may bên cửa sổ (ký ức)

```
{STYLE}
{AVOID}
Recreate the attached scene with the same composition, characters, lighting and memory mood (soft sepia, film grain).
Keep: the grandmother (Bà) sewing at an old treadle sewing machine by the window, little Tí beside her, the two cut-in panels.
Change ONLY the garments so they are correctly Vietnamese:
- The red garment on the dress form and the one being sewn: a Vietnamese áo ngũ thân (five-panel tunic) with a low
  standing collar, the front panel closing diagonally to the RIGHT side with a few small round cloth-covered buttons,
  knee length, side slits, worn over wide trousers. No knotted frog buttons, no mandarin-collar jacket, no qipao cut.
- Bà wears a simple Vietnamese áo bà ba or áo dài with small plain buttons; Tí wears a plain modern shirt.
No text anywhere.
```

**Checklist soát S05:**
- [ ] Không còn khuy tết / khuy nút thắt kiểu Tàu trên mọi áo trong ảnh (ma-nơ-canh, áo đang may, Bà, Tí).
- [ ] Áo trên ma-nơ-canh có cấu trúc áo ngũ thân: cổ đứng thấp, vạt cài chéo sang phải, xẻ tà, dài qua gối.
- [ ] Bố cục, nhân vật, hai khung cut-in giữ như cũ (chuyển cảnh T4, T5 không đổi).

### 12.2 S08 — Việt Phục Du Ký

```
{STYLE}
{AVOID}
Recreate the attached scene with the same composition: Tí holding an old embroidered notebook, a cut-in of golden thread.
The notebook cover must match the second reference image (title page) exactly: indigo fabric, the same embroidered
lotus-and-cloud border, the same empty cream label in the same place. The label stays EMPTY (the title is added in HTML):
plain cream paper inside the gold frame, no wave band or other pattern.
Remove the curved-roof pagoda: if the corner needs a motif, use lotus leaves or a Vietnamese village communal-house
roof with gently curved Vietnamese eaves, or leave it plain.
The blue garment on the dress form in the background: a Vietnamese áo dài with small plain buttons, no frog buttons.
No text anywhere.
```

**Checklist soát S08:**
- [ ] Bìa sổ khớp `title-page.png` (màu chàm, hoa văn viền, vị trí ô nhãn), ô nhãn để trống, không có dải sóng.
- [ ] Không còn chùa mái cong kiểu Trung Hoa hay họa tiết Trung Hoa khác.
- [ ] Áo trên ma-nơ-canh phía sau không có khuy tết.
- [ ] Chuyển cảnh T7 (zoom vào góc bìa S07 → S08) và T8 (bìa xoay mở) chạy không giật: xem `/?opening=1&start=s07`.

### 12.3 Vòng soát 2 (30/09)

- **Dải sóng trong ô nhãn** (`title-page.png` và `s08.png`) giống sóng seigaiha của Nhật nên đã bỏ. Không tạo lại bằng AI vì bản AI làm lệch khung nhãn và mất nền trong suốt của bìa. Thay vào đó, dải sóng được phủ bằng giấy kem lấy từ phía trên ô nhãn trong chính ảnh gốc, nên phần còn lại giữ nguyên từng pixel và vị trí ô nhãn trong `BookCover.tsx` không đổi. AVOID đã thêm seigaiha.
- **Vạt áo đỏ ở cut-in S05:** giữ nguyên. Ma-nơ-canh quay nghiêng ba phần tư và tay Tí che sườn phải, nên đoạn khuy chạy thẳng xuống là đường sườn nhìn nghiêng, không phải đường cài giữa ngực. Đã thử sửa bằng Nano Banana (6 bản), không bản nào rõ hơn ảnh gốc. Nếu cần vẽ lại, cho ma-nơ-canh quay thẳng mặt để thấy vạt đi tới nách phải.

## 13. Chương Huế – "Mùa mưa năm hai mươi tuổi" (30/09)

Tranh cho các trang nhật ký của Bà trong chương Huế (cốt truyện: `docs/HUE_CHAPTER.md`). Đây là **ký ức của Bà**: Huế những năm 1970, nên không có xe máy đời mới, biển hiệu, điện thoại hay khách du lịch hiện đại. Ảnh **"Hôm nay" của Tí là ảnh thật** (Wikimedia Commons, có ghi tác giả và giấy phép), không tạo bằng AI.

**Chung cho cả mục:**
- Gửi kèm ảnh tham chiếu `characters/ba-sheet.png` (Bà trẻ, bên trái) và `characters/ong-sheet.png` (mục 13.0).
- Thêm khối **MEMORY** ngay sau `{STYLE}` để cả chương có chung một ánh màu ký ức:

```
MEMORY: this is a remembered scene from the 1970s. Slightly faded warm palette, soft edges, gentle film-like grain, a thin cream vignette at the borders. Period details only: bicycles, cyclos, wooden sampans, tiled roofs, conical hats; no modern cars, scooters, phones, plastic signs or tourists.
```

- Tỉ lệ **4:3** cho tranh dán trong trang nhật ký (trừ khi ghi khác). Lưu ở `frontend/public/regions/hue/` (đúng tên file trong bảng 13.11, web tự hiện khi có file).
- Không vẽ chữ, không vẽ bản đồ (bản đồ lộ trình Huế là SVG do web vẽ).

### 13.0 Ông thời trẻ và mẹ Ông (character sheet)

Tỉ lệ 16:9 · file: characters/ong-sheet.png

```
{STYLE}
{AVOID}

Character sheet on a plain cream background, two people side by side.
LEFT — ÔNG, Tí's grandfather as a young man of about 24 in 1970s Huế: slim, a little too thin, short neat black hair, kind shy smile, thoughtful eyes. Wearing a plain white short-sleeved shirt tucked into dark trousers, leather sandals; in a second pose, a black áo ngũ thân (five-panel robe with a standing collar and buttons down the right side) with a black khăn đóng turban. Front and three-quarter views, plus a close-up laughing.
RIGHT — his MOTHER, about 50: small, upright, hair in a low bun, calm reserved face that looks strict but has warm eyes. Wearing a dark purple (tím Huế) áo dài with a standing collar, simple jade bangle. Front and three-quarter views, plus a close-up with a faint, rare smile.
Keep faces, proportions and clothing identical across views.
```

### 13.1 Ga Huế, một chiều mưa

file: hue/h01-ga-hue.png

```
{STYLE}
MEMORY
{AVOID}

Evening drizzle at an old colonial-era railway station in Huế: a long low building with pale yellow walls and a tiled roof, lamps just lit, wet platform reflecting warm light. Young Bà (attached sheet, left) in her sky-blue áo dài under a dark wool jacket, holding a small cloth bag, looking up at the rain with nervous hope. Young Ông (attached sheet) beside her, taking her bag, holding a black umbrella over both of them. Soft blue dusk, fine slanting rain lines, puddles. Quiet, tender, a little anxious.
```

### 13.2 Sáng sớm trên sông Hương

file: hue/h02-song-huong-som.png

```
{STYLE}
MEMORY
{AVOID}

Dawn on the Perfume River in Huế: silver-grey mist over still water, a small wooden sampan with a curved rattan canopy, an old woman rowing standing at the stern. Young Bà sits in the boat in her sky-blue áo dài, a plain conical hat on her lap; young Ông sits opposite, pointing toward a long steel bridge with six repeated arched spans faintly visible through the mist. Water so calm it mirrors the boat. Pale gold light just touching the mist. Hushed, dreamy.
```

### 13.3 Nón bài thơ soi nắng (2 ảnh cho hiệu ứng "soi lên nắng")

Ảnh A · tỉ lệ 1:1 · file: hue/h03a-non-la.png

```
{STYLE}
{AVOID}

A single Vietnamese conical hat (nón lá) seen from below against a bright sky, filling most of the square frame, centered. Fine palm-leaf ribs radiating from the tip, delicate thread rings, warm translucent cream-green leaf color glowing with sunlight behind it. Plain soft sky background. Nothing else in the image.
```

Ảnh B · tỉ lệ 1:1 · nền trắng (web tự tách nền) · file: hue/h03b-non-an.png

```
{STYLE}
{AVOID}

Delicate silhouette paper-cut in dark indigo on a plain white background, designed to be layered inside a conical hat seen from below: a small steel bridge with six arched spans over a river, two swallows flying above, and a sprig of bamboo on the left, all arranged in a ring around the center like a hidden picture between the hat's leaves. Thin, elegant shapes, lots of empty space, no text.
```

*Web xếp ảnh B chồng dưới ảnh A. Khi người đọc rê chuột hoặc chạm để "soi lên nắng", ảnh A sáng dần lên và hình cây cầu hiện ra. Câu thơ viết tay do web hiển thị, không để AI viết chữ.*

### 13.4 Trưa nắng trong Đại Nội

file: hue/h04-ngo-mon.png

```
{STYLE}
MEMORY
{AVOID}

Harsh midday sun inside the Imperial City of Huế: the Noon Gate (Ngọ Môn) behind — a massive stone base with three arched gateways and a two-tiered wooden pavilion on top with Vietnamese-style gently curved yellow-tiled roofs. In the foreground young Bà in a slightly too-large borrowed white áo dài, holding up one flap so it doesn't drag, squinting in the sun; young Ông beside her, completely absorbed, listening to music from a side hall, a closed black umbrella forgotten in his hand. Short strong shadows, heat shimmer, a few frangipani trees.
```

### 13.5 Bữa cơm ra mắt mẹ

file: hue/h05-mam-com.png

```
{STYLE}
MEMORY
{AVOID}

Interior of an old Huế garden house (nhà rường) with dark wooden columns, a low table with a family meal: many tiny dishes neatly arranged like a still life. Young Bà sits stiffly at the table, a small rice bowl just fallen and rolling on the floor, her face frozen in embarrassment. Ông's mother (attached sheet, purple áo dài) is rising calmly from her seat, holding out a new bowl, her face gentle. Other family members pause with chopsticks in the air. Soft rainy daylight from an open door, a garden with areca palms outside. The moment just before kindness.
```

### 13.6 Chiều ở chùa Thiên Mụ

tỉ lệ 3:4 · file: hue/h06-thien-mu.png

```
{STYLE}
MEMORY
{AVOID}

Late afternoon on the hill of Thiên Mụ pagoda above the Perfume River: the tall seven-tiered octagonal brick tower (Phước Duyên) in warm light, pine trees, stone steps. Young Ông and young Bà stand at the edge of the hill looking at the river, not at each other, a small distance between them. Orange and lavender sky, the river bending away into soft hills, a sampan far below. Faint circular ripples in the air suggest the sound of a bronze bell. Still, full of a question not yet answered.
```

### 13.7 Đêm thả hoa đăng

file: hue/h07-hoa-dang.png

```
{STYLE}
MEMORY
{AVOID}

Night on the Perfume River during a lantern-floating festival: hundreds of small paper lotus lanterns with candles drifting on dark water, their reflections trembling. On the stone steps of the river bank, Ông's mother gently hands young Bà a lantern; Bà kneels to set it on the water next to the mother's own lantern. Young Ông stands behind them, smiling. Warm candle glow on faces, deep indigo night, distant boats with lights. Quiet and sacred, not a crowded party.
```

### 13.8 Chiếc rương và áo ngũ thân

tỉ lệ 3:4 · file: hue/h08-ruong-ao.png

```
{STYLE}
MEMORY
{AVOID}

Close, intimate scene: an old dark-wood chest with brass corners opened on a woven mat. Ông's mother's hands (older, with a jade bangle) lift out a folded áo ngũ thân in faded deep blue silk — five-panel robe with a standing collar and small cloth buttons running down the right side — and offer it to young Bà's open hands. Only hands, the robe and the chest are in focus; faces out of frame. Soft window light, dust in the air, a sprig of dried flowers in the chest. Tender, like a blessing.
```

### 13.9 Bưu thiếp Huế (cuối chương)

tỉ lệ 3:2 · file: hue/h09-buu-thiep.png

```
{STYLE}
{AVOID}

The picture side of an old illustrated postcard of Huế, as if painted by hand in the 1970s: the Perfume River at sunset with a six-span steel bridge, a sampan, the tower of Thiên Mụ pagoda small on a far hill, a girl in a purple áo dài with a conical hat walking along the bank. Slightly worn postcard edges, a tiny stamp-sized blank square at top right. No text anywhere.
```

### 13.10 Trang mở miền: Miền Trung

tỉ lệ 21:9 · file: hue/h10-mien-trung.png

```
{STYLE}
{AVOID}

Wide panoramic vignette of central Vietnam's narrow land: on the left green mountains of the Trường Sơn range, on the right the blue sea with small fishing boats, and a thin ribbon of rice fields, villages and a winding road between them. Dunes, casuarina trees, a lighthouse far away. Painted like the header of a hand-made atlas page, soft edges fading into cream paper at the top and bottom. No map outlines, no text.
```

### 13.11 Bảng file chương Huế

| Ảnh | Tỉ lệ | File (trong `frontend/public/regions/`) | Dùng ở |
| --- | --- | --- | --- |
| Ông và mẹ Ông | 16:9 | `backend/content/media/characters/ong-sheet.png` | tham chiếu (không hiển thị) |
| Ga Huế chiều mưa | 4:3 | hue/h01-ga-hue.png | Điểm 1 |
| Sông Hương buổi sớm | 4:3 | hue/h02-song-huong-som.png | Điểm 2 |
| Nón lá + hình ẩn | 1:1 ×2 | hue/h03a-non-la.png, hue/h03b-non-an.png | Điểm 2 (tương tác) |
| Ngọ Môn trưa nắng | 4:3 | hue/h04-ngo-mon.png | Điểm 3 |
| Mâm cơm ra mắt | 4:3 | hue/h05-mam-com.png | Điểm 5 |
| Chùa Thiên Mụ | 3:4 | hue/h06-thien-mu.png | Điểm 4 |
| Đêm hoa đăng | 4:3 | hue/h07-hoa-dang.png | Điểm 6 |
| Rương và áo ngũ thân | 3:4 | hue/h08-ruong-ao.png | Trang Mặc (dự phòng, chưa gắn) |
| Bưu thiếp Huế | 3:2 | hue/h09-buu-thiep.png | Phong thư cuối chương |
| Miền Trung | 21:9 | hue/h10-mien-trung.png | Trang mở miền (dự phòng, chưa gắn) |

Tạo xong chạy `python -m scripts.check_content`. Nhớ chép prompt và bản được chọn vào tab Tổng hợp Prompt (Form 7).

## 14. Bốn chương mới: Bắc Ninh, Cần Thơ, Sơn La, Đắk Lắk (01/10)

Cốt truyện ở `docs/CHAPTERS_4.md`, nội dung chạy ở `backend/content/regions/*.json`. Dùng chung khối `{STYLE}`, `MEMORY` (mục 13) và `{AVOID}`. Tỉ lệ **4:3** cho tranh trong trang nhật ký, **3:2** cho bưu thiếp. Lưu ở `frontend/public/regions/<miền>/` đúng tên file; web tự hiện khi có file.

**Bắc Ninh** là quê Bà, năm Bà 18 tuổi (tham chiếu `ba-sheet.png`, bên trái, nhưng trẻ hơn một chút, mặc áo tứ thân). **Cần Thơ** là Bà và Ông đã có gia đình, khoảng 30 tuổi.

> **Sơn La và Đắk Lắk đang chờ cộng đồng duyệt.** Chỉ vẽ **phong cảnh, nhà cửa, đồ vật, đôi tay**; **không vẽ cận trang phục, hoa văn hay khuôn mặt người Thái, người Ê Đê** cho tới khi có người trong cộng đồng xem và góp ý. Các ô này để `no_people: true`.

### 14.1 Bắc Ninh: "Hội xuân bên sông Cầu"

| File | Prompt (phần riêng, sau STYLE + MEMORY + AVOID) |
| --- | --- |
| bac-bo/b01-ben-song.png | Early spring dawn, fine drizzle over the Cầu river in the Red River Delta, a wooden ferry boat full of villagers in brown and indigo clothes heading to a festival. On the bank an older cousin ties a black khăn mỏ quạ headscarf (two pointed ends like a crow's beak) on young Bà's head; Bà, 18, in a brown áo tứ thân with a green sash. Misty bamboo, soft grey-green light. |
| bac-bo/b02-dong-ho.png | A courtyard in Đông Hồ painting village: sheets of shimmering điệp paper drying on bamboo racks, an old craftsman in a brown shirt guiding young Bà as she presses a carved wooden block onto paper; small bowls of natural red, yellow, green and black pigment on a low table. Warm morning light, red pigment on Bà's fingertips. |
| bac-bo/b03-doi-lim.png | Lim hill at the spring festival, midday: a young liền anh in a black áo the, khăn xếp turban and a black umbrella offers a betel quid with both hands; young Bà in áo tứ thân, red yếm, green sash and a wide flat nón quai thao with long silk fringes stands frozen and shy, eyes down. A crowd watches, a communal house (đình) roof behind with low heavy Vietnamese-style curved tiles. |
| bac-bo/b04-nha-chua.png | Inside a wooden house where quan họ singers gather: a woven mat, a tray of betel and cups of tea, an older liền chị in áo mớ ba mớ bảy and khăn mỏ quạ teaching young Bà a song, hands gently keeping time; Bà concentrating, lips parted. Soft afternoon light through wooden doors. |
| bac-bo/b05-cong-lang.png | Evening at a village gate with paper lanterns, liền anh and liền chị groups facing each other singing farewell, young Bà singing bravely for the first time, her cousin smiling beside her. Warm lantern glow, blue dusk. |
| bac-bo/b09-buu-thiep.png | Picture side of an old hand-painted postcard: Lim hill in spring with a boat on the river, a girl in a nón quai thao and áo tứ thân, blossoms. Worn edges, small blank square at top right, no text. (3:2) |

### 14.2 Cần Thơ: "Mùa nước nổi"

| File | Prompt |
| --- | --- |
| nam-bo/n01-ninh-kieu.png | Evening at a Mekong riverside wharf in the 1980s: small boats with oil lamps, a busy waterfront, Bà (about 30, simple blouse) and Ông stepping off after a long bus-and-ferry journey, a local woman waving them to come eat. Warm lamps on dark brown water. |
| nam-bo/n02-cho-noi.png | Dawn at a floating market on a wide brown Mekong river: dozens of wooden boats, each with a tall pole (cây bẹo) hung with what it sells — a pineapple, a winter melon, sweet potatoes, coconuts; Ông in a small canoe pointing up at the poles, Bà looking amazed. Pink-gold sunrise, mist. |
| nam-bo/n03-ghe-ba-cu.png | On a wooden boat loaded with pineapples, an old Mekong woman in a dark áo bà ba (short, side slits, no standing collar) wraps a black-and-white checked khăn rằn scarf around young Bà's head against the sun; a teapot and small cups on the deck. Bright morning, river glitter. |
| nam-bo/n04-nuoc-noi.png | Flood season in the Mekong delta: fields turned into a silver lake, water up to the tree trunks, a canoe gliding past yellow điên điển flowers, a stilt house in the distance. Noon light, calm. |
| nam-bo/n05-don-ca.png | Night under the eaves of a Mekong house: a man playing a moon-shaped đàn kìm, a woman singing, a zither (đàn tranh) on a mat, a teapot, a single lamp; Bà listening with tears in her eyes. Intimate, warm, no stage. |
| nam-bo/n06-le-hoi.png | A procession of people with incense climbing a small mountain (núi Sam) at dawn, festival flags, soft haze; seen from behind, faces not in focus. |
| nam-bo/n09-buu-thiep.png | Picture side of an old hand-painted postcard: a floating market at sunrise, a boat with a pole hung with a pineapple, a woman in áo bà ba and khăn rằn rowing. Worn edges, blank stamp square, no text. (3:2) |

### 14.3 Sơn La: "Tiếng khèn bên suối" (chờ cộng đồng duyệt, không vẽ người cận cảnh)

| File | Prompt |
| --- | --- |
| tay-bac/t01-deo-suong.png | A mountain pass in northwest Vietnam at dawn, thick fog opening onto a valley of golden terraced rice fields, a winding road. No people. |
| tay-bac/t02-nha-san.png | A wooden stilt house beside a clear stream in a Tây Bắc valley, a loom visible under the raised floor, bamboo and banana trees. No people, no costume detail. |
| tay-bac/t03-dem-xoe.png | Night in a village yard: a bonfire, a ring of people seen as warm silhouettes holding hands around it, stars above the mountains. Silhouettes only, no faces or costume detail. |
| tay-bac/t04-trao-thu.png | Close-up of two hands passing an old folded letter beside a kitchen fire in a stilt house, a teapot, smoke curling up. Hands only. |
| tay-bac/t09-buu-thiep.png | Picture side of an old hand-painted postcard: terraced rice fields and a stilt house by a stream in the mountains. Landscape only, no people, blank stamp square, no text. (3:2) |

### 14.4 Đắk Lắk: "Đêm cồng chiêng" (chờ cộng đồng duyệt, không vẽ người cận cảnh)

| File | Prompt |
| --- | --- |
| tay-nguyen/d01-doi-ca-phe.png | Central Highlands in the dry season: rolling hills of coffee bushes in white bloom, red earth road, big blue sky. No people. |
| tay-nguyen/d02-nha-dai.png | A very long wooden house on stilts in a Central Highlands village, a notched log staircase leading up to the veranda, morning light. No people. |
| tay-nguyen/d03-khung-det.png | Close-up of hands at a backstrap loom under the eaves of a long house, the woven band shown only as soft blurred colours (dark, red, light), no readable pattern. Hands only. |
| tay-nguyen/d04-cong-chieng.png | Night, a ring of people as warm silhouettes around a fire, bronze gongs glinting in the firelight. Silhouettes only, no faces or costume detail. |
| tay-nguyen/d09-buu-thiep.png | Picture side of an old hand-painted postcard: coffee hills in bloom and a long house under a big sky. Landscape only, blank stamp square, no text. (3:2) |

Tạo xong chạy `python -m scripts.check_content`, rồi chép prompt và bản được chọn vào tab Tổng hợp Prompt (Form 7).
