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
AVOID: any text, letters, numbers, captions, logos or watermarks; Chinese, Japanese or Korean traditional clothing, hairstyles or architecture (no hanfu cross collars, no kimono or obi, no hanbok, no pagoda roofs with upturned Chinese-style eaves unless specified); 3D render look; photorealism; neon colors; heavy black outlines; cluttered backgrounds.
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

Character turnaround sheet of TÍ, a 13-year-old Vietnamese lower-secondary-school boy wearing a red Young Pioneer scarf, on a plain cream background.
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

Character turnaround sheet of TÈO, a 13-year-old Vietnamese lower-secondary-school boy wearing a red Young Pioneer scarf, best friend of Tí, on a plain cream background.
Show: front, three-quarter and side view (full body), plus 4 head close-ups: thoughtful, gently skeptical (one eyebrow up), explaining with a finger raised, warm smile.
Look: a bit taller than Tí, neat short black hair parted to the side, round thin-framed glasses, calm eyes, light-medium skin.
Outfit: same Vietnamese school uniform (white short-sleeved shirt, navy trousers), a small cloth notebook always in hand, a pen clipped to the shirt pocket.
Personality in pose: calm, upright, observant.
Keep proportions and outfit identical across all views.
```

*Đã chốt (28/09/2026):* Tí và Tèo là hai bạn nam khoảng 13 tuổi, học cấp 2, đeo khăn quàng đỏ, đúng như 10 screen opening; giọng đọc cũng theo tuổi này (xem `VOICE_PROMPTS.md`).

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
Center area: a plain embroidered rectangular label frame left EMPTY for the title (no text).
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

