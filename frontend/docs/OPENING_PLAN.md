# Kế hoạch Opening → Cuốn sách

*Kế hoạch triển khai chuỗi mở đầu 10 screen và cú chuyển cảnh vào cuốn Việt Phục Du Ký, dựa trên file "Web Opening Story Script" và 10 ảnh screen + title page đội đã làm. Cập nhật 27/09/2026.*

## 0. Tóm tắt

- **Mục tiêu cảm xúc:** người xem đi từ "đọc câu chuyện của Tí" sang "cầm chính cuốn sổ trong truyện" mà không thấy chỗ nối. Cuốn sổ trong S08 phải là cùng một vật thể với cuốn sách trên bàn may ở trang chính.
- **Đã làm:** thay bìa sách của web bằng `public/page/title-page.png`; tên "Việt Phục Du Ký" là chữ thật đặt đúng vào ô nhãn thêu (font Playfair Display, màu chàm).
- **Cách làm:** một "Opening Player" đọc kịch bản từ `backend/content/opening.json` – đội sửa chữ, vị trí, nhịp mà không đụng code, giống cách đã làm với dữ liệu trang phục.
- **Thời lượng:** 70–90 giây nếu người xem tự bấm; chế độ `?pace=demo` khoảng 35 giây cho video nộp bài.
- **Cú chuyển quan trọng nhất:** T10 (chớp sáng → zoom ra bàn may → cuốn sách nằm giữa). Làm prototype T10 **trước tiên**, đúng như ghi chú trong kịch bản.
- **Nguyên tắc an toàn tiến độ:** mọi transition đều có bản dự phòng là crossfade 500 ms. Transition nào chưa xong vẫn chạy được, không chặn demo.

## 1. Ghép ảnh với kịch bản

Tên file ảnh đang lệch số với kịch bản (không có Screen-6, có Screen-11). Đề xuất đổi tên về `public/opening/s01.png … s10.png` cho dễ quản lý; bảng dưới là cách ghép hiện tại.

| Screen kịch bản | File hiện tại | Nội dung ảnh | Cần xử lý |
| --- | --- | --- | --- |
| S01 Ngày hội Sắc Việt | Screen-1.png | Lớp học, cô giáo chỉ poster, Tí–Tèo tiền cảnh phải | Poster không có chữ – tốt. Tên "Ngày hội Sắc Việt" đặt bằng HTML |
| S02 "Tại sao?" | Screen-2.png | Cùng lớp học, 3 bong bóng ý nghĩ (áo dài, nón lá, dải lụa), cut-in Tí | Khung cảnh trùng S01 → dùng được cú "match cut" |
| S03 Một Việt Nam mình chưa biết | Screen-3.png | Laptop, 6 card trang phục, 3 cut-in Tí | Card nào là trang phục nào cần B xác nhận để làm spotlight đúng tên |
| S04 Chiếc áo màu xanh | Screen-4.png | Đêm, đèn bàn, laptop áo dài xanh, cut-in mắt Tí | – |
| S05 Tiếng máy may | Screen-5.png | Bà may áo, Tí nhỏ, 2 cut-in | ✅ Đã tạo lại (29/09): bỏ khuy tết trên mọi áo; áo đỏ theo cấu trúc áo ngũ thân, Bà mặc áo cánh, Tí mặc sơ mi cổ bẻ. Chờ người phụ trách nội dung đối chiếu Research 6.2 |
| S06 "Chúng còn để nhớ" | Screen-7.png | Bà trẻ áo dài xanh, bà già cất áo vào hộp, Tí nhỏ; nửa phải là khoảng trống | Khoảng trống bên phải rất hợp để đặt 4 câu thoại |
| S07 Căn nhà cũ | Screen-8.png | Ba nhịp ngang: cổng → phòng may → hộp gỗ | Bố cục ngang → dùng camera pan thay cho parallax 3 lớp |
| S08 Việt Phục Du Ký | Screen-9.png | Tí cầm cuốn sổ, ô nhãn trống, cut-in chỉ thêu | ✅ Đã tạo lại (29/09): bìa khớp title-page, bỏ chùa mái cong; áo trên ma-nơ-canh và trong khung ảnh là áo dài, không khuy tết. Chờ người phụ trách nội dung xác nhận |
| S09 Những trang chưa viết xong | Screen-10.png | Sách mở: 4 phác thảo vùng + trang trống bên phải, sợi chỉ vàng | – |
| S10 Hành trình bắt đầu | Screen-11.png | Vòng xoáy giấy/vải, Tí cầm bookmark, làng hội Kinh Bắc | – |
| Bìa sách chính | page/title-page.png | Bìa vải chàm tách nền, ô nhãn trống | ✅ Đã gắn vào web |

**Phong cách:** các screen vẽ nhân vật hơi chibi, trong khi khối STYLE ở tab Art Bible ghi "not chibi". Cần sửa khối STYLE theo đúng các screen này để những ảnh tạo sau (bàn may, stamp, avatar Compass) cùng một giọng vẽ.

## 2. Kiến trúc kỹ thuật

### 2.1 Luồng trang

1. Người xem lần đầu vào `/` → **Opening Player** chạy S01 → S10.
2. Kết thúc S10 → T10 chuyển thẳng sang **Desk Scene** (bàn may + cuốn sách đóng) trên cùng trang, không đổi URL, không có màn hình loading.
3. Bấm cuốn sách → bìa mở → trang bản đồ (react-pageflip). Các trang truyện cũ trong flipbook bỏ đi vì câu chuyện đã nằm trong Opening.
4. Lần sau quay lại: `localStorage["vpdk-opening-seen"]` → vào thẳng Desk Scene; menu có "Xem lại mở đầu". `?opening=1` ép chạy lại, `?pace=demo` chạy nhịp nhanh để quay video.

### 2.2 Thành phần

| Component | Việc |
| --- | --- |
| `OpeningPlayer` | Máy trạng thái: screen hiện tại, beat hiện tại, pha (enter · beats · waiting · exit). Nhận input, gọi transition |
| `SceneImage` | `next/image` full màn hình, `object-cover`, điểm lấy nét (focal point) theo từng screen, lớp "camera" (scale, translate, blur) điều khiển bằng Framer Motion |
| `Caption` / `Bubble` | Hộp dẫn truyện và bong bóng thoại – chữ thật trong DOM, vị trí theo % của ảnh |
| `Transitions/*` | PushIn, Iris, GoldWash, ClothWipe, PaperFade, ZoomThrough, CoverOpen, FallDown, Flash – mỗi cái một file, có fallback crossfade |
| `ThreadProgress` | Thanh tiến trình là một sợi chỉ vàng chạy dọc đáy màn hình (motif sợi chỉ), ẩn ở S06 |
| `SkipButton`, `SoundToggle` | "Bỏ qua" góc trên phải từ S02; âm thanh mặc định tắt |
| `DeskScene` | Nền bàn may, cuốn sách đóng ở giữa, hiệu ứng hover nhấc bìa, sợi chỉ vàng làm điều hướng |
| `DebugGrid` (`?debug=1`) | Lưới % đè lên ảnh để đội chỉnh vị trí chữ trong opening.json cho chuẩn |

### 2.3 Dữ liệu `backend/content/opening.json`

Thay cho `comic.json`. Mỗi screen khai báo ảnh, camera, các beat (câu chữ) và cách thoát. Backend kiểm tra schema như các file khác; frontend lấy qua `/content/bootstrap`.

```json
{
  "id": "s06",
  "image": "/opening/s06.png",
  "mood": "memory",                      // present | memory (memory = lọc sepia + hạt phim)
  "focal": {"x": 30, "y": 50},           // điểm giữ trong khung khi màn hình dọc
  "camera": {"from": {"scale": 1, "x": 30, "y": 50}, "to": {"scale": 1.02}, "ms": 12000},
  "hide_progress": true,
  "beats": [
    {"kind": "speech", "speaker": "Tí", "text": "Sao bà giữ bộ này kỹ vậy?", "x": 62, "y": 56, "tail": "down-left", "delay": 600},
    {"kind": "speech", "speaker": "Bà", "text": "Vì nó là bộ bà trân trọng nhất.", "x": 62, "y": 66, "wait_click": true},
    {"kind": "narration", "style": "hand", "text": "Có những bộ quần áo không chỉ để mặc.", "x": 62, "y": 77, "delay": 1000},
    {"kind": "narration", "style": "hand-large", "text": "Chúng còn để nhớ.", "x": 62, "y": 85, "delay": 1200}
  ],
  "exit": {"type": "paper-fade", "ms": 1800, "sfx_out": "sewing-machine"}
}
```

### 2.4 Điều khiển và nhịp

- **Tiến:** click, Space, Enter, → , cuộn xuống (khóa 700 ms giữa hai lần), vuốt lên trên điện thoại.
- **Beat đang chạy mà bấm** → hiện ngay câu đó (như visual novel), không nhảy qua câu.
- **Hết beat** → mũi "›" nhỏ nhấp nháy góc phải dưới; bấm tiếp → transition thoát.
- **Lùi:** ←, cuộn lên → về screen trước bằng crossfade 400 ms, hiện sẵn toàn bộ chữ.
- **Bỏ qua / Esc** → không cắt cụt mà nhảy tới T10: vẫn có chớp sáng và cuốn sách đáp xuống bàn.
- **Tự chạy:** chỉ S10 và các đoạn transition tự chạy; còn lại người xem nắm nhịp.

### 2.5 Hiệu năng, màn hình, trợ năng

- **Ảnh:** 10 file PNG 3 MB → `next/image` tự xuất WebP/AVIF theo kích thước màn hình (còn khoảng 200–350 KB/ảnh). Tải trước 2 screen kế tiếp; screen đầu `priority`.
- **Chỉ dùng transform + opacity + filter** cho chuyển động (GPU), không animate width/height. Mục tiêu 60 fps trên laptop phổ thông.
- **Màn hình dọc (điện thoại):** ảnh vẫn phủ kín theo focal point; hộp chữ dồn thành một dải giấy ở 30% dưới màn hình; bong bóng thoại chuyển thành dòng "Tí: …" để không che mặt nhân vật.
- **prefers-reduced-motion:** tắt camera, parallax, hạt bay; mọi transition thành crossfade 400 ms.
- **Trợ năng:** chữ là DOM thật, vùng chữ `aria-live="polite"`, điều khiển được hoàn toàn bằng bàn phím, nút Bỏ qua luôn nhìn thấy.

## 3. Ngôn ngữ chữ trên màn hình

| Loại chữ | Kiểu | Dùng ở |
| --- | --- | --- |
| Dẫn truyện (hiện tại) | Dải giấy kem #F3EAD7 90%, viền mực 1.5px, xoay -0.6°, Be Vietnam Pro 18–22px | S01, S03, S04, S07, S09 |
| Thoại | Bong bóng trắng, viền mực 2px, đuôi chỉ về người nói, Patrick Hand 20–24px, tên người nói chữ nhỏ | Mọi screen có nhân vật nói |
| Ký ức | Viền nâu mềm, nền kem ngả vàng, Patrick Hand; ảnh có lớp sepia nhẹ + hạt phim + vignette | S05, S06 |
| Câu "chạm tim" | Patrick Hand cỡ lớn, không khung, hiện từng chữ | "Cậu nhớ đến bà.", "Chúng còn để nhớ." |
| Tên sách | Playfair Display 600, màu chàm #2F4A6D, trong ô nhãn – giống hệt bìa sách chính | S08, bìa sách trên bàn |
| Câu hỏi của bà | Chữ viết tay SVG, nét được "vẽ" dần | S09 |
| Câu kết | Playfair Display, ánh vàng #D9A43B, giữa màn hình | S10 |

## 4. Kịch bản chi tiết từng screen

Vị trí x, y là % theo ảnh 16:9 (điểm neo góc trên-trái của hộp chữ). Đây là vị trí đề xuất đã xem trên ảnh; chỉnh tinh bằng `?debug=1`. Thời gian tính từ lúc screen vào.

### S01 — Ngày hội Sắc Việt

**Ảnh:** Screen-1 · **Camera:** zoom 100% → 103% trong 8 s, tâm (62%, 50%)

| Thời điểm | Chữ | Kiểu · vị trí | Hiệu ứng kèm |
| --- | --- | --- | --- |
| 0.0 s | – | – | Ảnh hiện dần từ màu giấy kem (600 ms) |
| 0.5 s | – | Nhãn giấy "Ngày hội Sắc Việt" dán mép trên poster (52%, 11%) | Poster được "rọi" nhẹ: vùng (41–64%, 14–46%) sáng lên 10% |
| 1.2 s | Năm nay, mỗi đội sẽ lựa chọn một vùng văn hóa Việt Nam… | Dẫn truyện · (3%, 5%) rộng 34% | Hiện từng câu, cách 900 ms |
| 2.1 s | Tìm hiểu một loại trang phục truyền thống… | Nối tiếp cùng hộp |  |
| 3.0 s | Và đề xuất cách để người trẻ có thể mặc nó hôm nay. | Nối tiếp cùng hộp |  |
| click | Tí: "Áo dài thôi. Quá dễ!" | Bong bóng · (56%, 18%), đuôi xuống Tí | Bong bóng "nảy" 96% → 100% |

**Âm thanh:** tiếng lớp học xì xào rất nhỏ

**Thoát:** **T1 Push-in (1.1 s):** camera đẩy vào Tí–Tèo (100% → 118%, tâm 75%, 68%), đồng thời S02 hiện ở 106% → 100% cùng tâm. Vì hai ảnh cùng lớp học nên người xem thấy như máy quay tiến lại gần.

### S02 — "Tại sao?"

**Ảnh:** Screen-2 · **Camera:** đứng yên; chỉ rung nhẹ 1% ở câu cuối

| Thời điểm | Chữ | Kiểu · vị trí | Hiệu ứng kèm |
| --- | --- | --- | --- |
| 0.4 s | Tèo: "Tại sao lại là áo dài?" | Bong bóng · (74%, 40%), đuôi xuống Tèo |  |
| click | Tí: "Vì… đẹp?" | Bong bóng · (18%, 40%), đuôi về cut-in Tí |  |
| +0.8 s | Tèo: "Còn gì nữa?" | Bong bóng · (74%, 52%) | Giữ im 600 ms sau câu này |
| click | Tí: "…rất Việt Nam?" | Bong bóng · (18%, 52%) | Cut-in Tí phóng 1.03 và "giọt mồ hôi" nhỏ bằng DOM |

**Âm thanh:** tiếng "tưng" nhẹ ở câu cuối

**Thoát:** **T2 Zoom qua ý nghĩ (0.9 s):** camera lao vào ba bong bóng ý nghĩ (tâm 72%, 22%, 100% → 125%) và nhòe dần (blur 0 → 6px, sáng +15%); S03 hiện từ nhòe về nét, 108% → 100%, tâm vùng các card. Cảm giác: áo dài, nón lá "bay ra" thành các card trên laptop.

### S03 — Một Việt Nam mà mình chưa biết

**Ảnh:** Screen-3 · **Camera:** trôi rất chậm 100% → 102%

| Thời điểm | Chữ | Kiểu · vị trí | Hiệu ứng kèm |
| --- | --- | --- | --- |
| 0.3 s | Chỉ sau một lúc, hàng loạt cái tên xuất hiện… | Dẫn truyện · (62%, 80%) rộng 34% |  |
| 1.3 s | Áo tứ thân. Áo ngũ thân. Nhật Bình. Áo bà ba… | Nối tiếp; từng tên hiện cách 500 ms | Mỗi tên hiện thì card tương ứng được viền sáng mảnh (vị trí card do B xác nhận) |
| click | Tèo: "Bộ này của vùng nào?" | Bong bóng · (58%, 42%) | Spotlight dịch từ Tèo sang Tí |
| +0.8 s | Tí: "…không biết." | Bong bóng · (6%, 62%), đuôi về cut-in gãi đầu | Toàn ảnh giảm bão hòa còn 35%, trừ vòng tròn quanh laptop |

**Âm thanh:** tiếng gõ phím, card "sột" nhẹ

**Thoát:** **T3 Iris vào laptop (1.2 s):** một vòng tròn khép dần vào màn hình laptop (tâm 53%, 78%); S04 mở ra từ đúng màn hình laptop của nó (tâm 78%, 45%) rồi lan ra toàn khung. Chỉ còn chiếc áo dài xanh "sống sót" qua cú chuyển.

### S04 — Chiếc áo màu xanh

**Ảnh:** Screen-4 · **Camera:** zoom rất chậm 100% → 103% trong 10 s vào Tí (45%, 45%)

| Thời điểm | Chữ | Kiểu · vị trí | Hiệu ứng kèm |
| --- | --- | --- | --- |
| 0.6 s | Rồi Tí bất chợt im lặng. | Dẫn truyện · (3%, 5%) | Viền ảnh tối dần (vignette 0 → 35%) |
| 2.2 s | Một chiếc áo dài màu xanh thiên thanh xuất hiện trên màn hình. | Nối tiếp | Cut-in đôi mắt (64–100%, 72–100%) có ánh xanh "thở" nhẹ |
| +1.2 s | Cậu nhớ đến bà. | Câu chạm tim · (8%, 78%) | Từ mép khung, ánh vàng bắt đầu tràn vào (chưa phủ) |

**Âm thanh:** tiếng quạt đêm, tắt dần

**Thoát:** **T4 Ánh vàng ký ức (2.1 s):** ánh vàng #F3C969 tràn từ mép vào giữa, phủ kín ở 1.2 s; dưới lớp sáng đổi sang S05 đã bật bộ lọc ký ức (sepia 25%, hạt phim, vignette ấm); ánh vàng rút đi trong 0.9 s. Tiếng máy may bắt đầu nghe thấy khi ánh vàng rút.

### S05 — Tiếng máy may bên cửa sổ (ký ức)

**Ảnh:** Screen-5 · **Camera:** pan rất nhẹ trái → phải 2% trong 8 s

| Thời điểm | Chữ | Kiểu · vị trí | Hiệu ứng kèm |
| --- | --- | --- | --- |
| 0.8 s | Tí nhỏ: "Bà ơi…" | Bong bóng ký ức · (38%, 6%), đuôi xuống Tí |  |
| +0.9 s | "Cái này có phải áo dài không?" | Nối tiếp cùng bong bóng | Cut-in "Tí chỉ vào áo" được viền sáng |
| +1.4 s | Bà: "Không phải cái gì dài dài cũng là áo dài đâu con." | Bong bóng ký ức · (4%, 6%) rộng 36% | Chữ hiện chậm hơn (40 ms/ký tự); máy may dừng, im nửa nhịp |

**Âm thanh:** máy may "cạch—cạch—cạch" nhỏ, dừng sau câu bà

**Thoát:** **T5 Tà vải (1.0 s):** một dải lụa xanh thiên thanh (gradient + vân vải SVG, mép lượn sóng) quét từ trái sang phải; S06 lộ ra ngay sau mép vải. Dải lụa là cùng màu chiếc áo của bà – nối hai ký ức bằng chính chiếc áo.

### S06 — "Chúng còn để nhớ" (ký ức, screen giữ lâu nhất)

**Ảnh:** Screen-7 · **Camera:** trôi 100% → 102% trong 12 s, tâm (30%, 50%); ẩn thanh tiến trình

| Thời điểm | Chữ | Kiểu · vị trí | Hiệu ứng kèm |
| --- | --- | --- | --- |
| 0.6 s | Tí: "Sao bà giữ bộ này kỹ vậy?" | Bong bóng ký ức · (62%, 56%) | Bụi nắng: 10 hạt sáng mờ trôi chậm; vệt nắng từ cửa sổ "thở" 15% ↔ 25% |
| click | Bà: "Vì nó là bộ bà trân trọng nhất." | Bong bóng ký ức · (62%, 66%) |  |
| +1.0 s | Có những bộ quần áo không chỉ để mặc. | Chạm tim · (62%, 77%) |  |
| +1.2 s | Chúng còn để nhớ. | Chạm tim cỡ lớn · (62%, 85%) | Mũi "›" chỉ hiện sau khi câu này hiện đủ |

**Âm thanh:** chim sẻ ngoài cửa, rèm gió rất nhỏ; máy may im

**Thoát:** **T6 Trở về hiện tại (2.2 s):** ảnh ngả sepia rồi tan hẳn thành trang giấy kem (1.0 s); giữ trang giấy trống 0.4 s và một đường chỉ vàng tự khâu ngang giữa trang (0.8 s) – như dấu ngắt chương; S07 hiện lên không còn lọc ký ức.

### S07 — Căn nhà cũ

**Ảnh:** Screen-8 · **Camera:** ảnh phóng 135% để tràn ngang, máy quay pan qua 3 nhịp

| Thời điểm | Chữ | Kiểu · vị trí | Hiệu ứng kèm |
| --- | --- | --- | --- |
| 0.3 s | Chiều hôm đó, Tí và Tèo quay lại căn nhà cũ của bà. | Dẫn truyện · góc dưới-trái khung nhìn | Camera ở cổng (tâm 18%, 55%) |
| click | Mọi thứ dường như vẫn còn ở nguyên vị trí. | Dẫn truyện | Pan sang phòng may (tâm 48%, 45%) trong 1.2 s |
| click | Và dưới chiếc áo màu xanh… | Dẫn truyện | Pan + zoom 135% → 160% vào hộp gỗ, dừng ở góc bìa sổ (tâm 90%, 85%) |
| sau câu 3 | – | Vòng chỉ vàng mảnh nhấp nháy quanh góc bìa sổ | Con trỏ thành bàn tay khi rê vào; bấm góc sổ hoặc bất kỳ đâu |

**Âm thanh:** chuông xe đạp, cổng sắt kẽo kẹt, nắp hộp gỗ, vải sột soạt

**Thoát:** **T7 Zoom xuyên qua (1.3 s):** camera lao vào góc bìa sổ (160% → 320%, nhòe 0 → 8px); S08 hiện ở 112% → 100%, nhòe 8 → 0 – cùng một cuốn sổ, gần hơn.

### S08 — Việt Phục Du Ký

**Ảnh:** Screen-9 (nên tạo lại theo title-page) · **Camera:** đứng yên

| Thời điểm | Chữ | Kiểu · vị trí | Hiệu ứng kèm |
| --- | --- | --- | --- |
| 0.0–0.6 s | – | Chỉ có bìa, không chữ |  |
| 0.7 s | Việt Phục Du Ký | Tên sách · đặt vào ô nhãn trên bìa (~49–71%, 42–63%), xoay theo độ nghiêng của sổ | Hiện dần + mở rộng giãn chữ (letter-spacing 0.2em → 0.02em) |
| 1.5 s | – | – | Một vệt sáng tự nhiên lướt chéo qua bìa (1.2 s, hòa trộn soft-light) |
| 2.2 s | Cuốn sổ bà vẫn để trên bàn may ngày trước. | Dẫn truyện nhỏ · (4%, 86%) | Con trỏ bàn tay trên bìa; bấm = mở sách |

**Âm thanh:** tiếng vải bìa miết nhẹ

**Thoát:** **T8 Mở sách (2.8 s) – khoảnh khắc 3D:** (1) camera tiến vào bìa, nền tối 40% (0.5 s); (2) crossfade sang chính `title-page.png` đặt giữa màn hình, tên sách vẫn trong ô nhãn – khớp với bìa sách ở trang chính (0.5 s); (3) bìa xoay mở quanh gáy trái 0° → -165° (perspective 1800px, 1.4 s), bóng đổ lớn dần; phía sau lộ S09 đang thu từ 120% về 108%.

### S09 — Những trang bà chưa viết xong

**Ảnh:** Screen-10 · **Camera:** bắt đầu 125% ở trang trái (30%, 60%), sau đó pan sang trang trống

| Thời điểm | Chữ | Kiểu · vị trí | Hiệu ứng kèm |
| --- | --- | --- | --- |
| 0.4 s | Bà bắt đầu học may vì muốn làm ra những bộ quần áo đẹp. | Dẫn truyện ký ức · (3%, 84%) | Spotlight lần lượt 4 phác thảo: Kinh Bắc → Huế → Nam Bộ → Tây Bắc (mỗi cái 0.7 s) |
| click | Sau này bà mới hiểu… đẹp chỉ là một phần rất nhỏ. | Nối tiếp |  |
| click | Bà đã đi qua một phần của hành trình này. | Nối tiếp | Camera pan sang trang trống (tâm 78%, 55%, 130%) trong 1.6 s |
| +1.0 s | Phần còn lại… có lẽ sẽ dành cho người khác. | Nối tiếp |  |
| +1.2 s | Nếu là con, con sẽ mặc câu chuyện này như thế nào? | Chữ viết tay SVG giữa trang trống (66–95%, 40–70%) | Nét chữ được "vẽ" dần trong 2.2 s |
| sau câu hỏi | – | Bookmark lụa (DOM) trượt ra từ gáy sách (50%, 96%) | Tua rua đung đưa; chờ người xem bấm |

**Âm thanh:** lật giấy khẽ, bút sột soạt khi chữ hiện

**Thoát:** **T9 Bookmark rơi (1.2 s):** bookmark rơi xuống khỏi mép (xoay 8°), camera "đi theo" xuống (S09 dịch lên 6%, nhòe chuyển động); S10 trồi lên từ dưới (6% → 0) – mở ra đúng cảnh Tí đang cầm bookmark.

### S10 — Hành trình của con bắt đầu (tự chạy)

**Ảnh:** Screen-11 · **Camera:** lao chậm vào tâm vòng xoáy 100% → 106% trong 5 s (60%, 45%)

| Thời điểm | Chữ | Kiểu · vị trí | Hiệu ứng kèm |
| --- | --- | --- | --- |
| 0.3 s | – | Sợi chỉ vàng SVG vẽ theo vòng xoáy: từ bookmark (28%, 68%) → tâm → cổng làng (70%, 30%) | Nét vẽ dần 1.8 s, phát sáng mềm 4px, không neon |
| 0.5 s | – | 24 mảnh giấy/vải (DOM) bay theo quỹ đạo elip quanh (55%, 45%) | Tắt trên điện thoại và reduced-motion |
| 1.2 s | Hành trình của bà đã kết thúc. | Câu kết · (50%, 8%) căn giữa |  |
| 2.4 s | Hành trình của con bắt đầu từ đây. | Câu kết cỡ lớn · giữa màn hình | Chữ ánh vàng |
| 4.2 s | – | – | Tự chạy T10 |

**Âm thanh:** gió xoáy tăng dần, trống hội xa, chuông nhỏ ở đỉnh chớp sáng

**Thoát:** **T10 – xem mục 5.**

## 5. T10: Chớp sáng → Bàn may → Cuốn sách (làm prototype trước)

| Thời gian | Chuyện xảy ra | Cách làm |
| --- | --- | --- |
| 0–600 ms | Chớp sáng trắng-vàng phủ dần; S10 tiếp tục lao vào 106% → 125% | Lớp `radial-gradient(#fff, #F6E2A8, transparent)` opacity 0 → 1 |
| 600–750 ms | Màn hình trắng-vàng hoàn toàn | Dưới lớp sáng: gỡ Opening, dựng Desk Scene với cuốn sách phóng 160%, nhòe 6px |
| 750–2300 ms | Ánh sáng tan; máy quay lùi ra; cuốn sách "đáp" xuống giữa bàn may | Desk scale 160% → 100%, nhòe 6 → 0 (1.5 s, ease-out); bóng đổ sách đậm dần; 6 mảnh giấy từ S10 rơi nốt xuống bàn rồi mờ đi |
| 2300–3000 ms | Sợi chỉ vàng tự khâu dọc gáy và mép dưới sách; dòng "Chạm để mở sách" hiện dưới sách | SVG path stroke-dashoffset; chữ Patrick Hand |
| Hover | Bìa nhấc 4px, bóng sâu hơn, chỉ vàng ánh nhẹ | transform translateY(-4px), box-shadow |
| Click | Bìa mở → trang bản đồ + lời bà: "Muốn viết tiếp một câu chuyện, trước hết phải hiểu câu chuyện đã có." → nút "Chọn nơi con muốn bắt đầu." | react-pageflip lật trang bìa |

**Vì sao liền mạch:** cuốn sổ đi xuyên suốt S07 (góc bìa) → S08 (cận cảnh) → T8 (title-page xoay mở) → Desk (title-page đóng trên bàn). Cùng một ảnh bìa, cùng một kiểu chữ tên sách. Đây là lý do nên tạo lại S08 bằng title-page làm ảnh tham chiếu.

**Nền bàn may:** chưa có ảnh. Dùng prompt 5.1 trong tab Art Bible (bàn gỗ nhìn từ trên, trung tâm 60% trống). Trong lúc chờ, dùng nền gỗ bằng CSS để không chặn việc làm T10.

## 6. Bảng tổng hợp chuyển cảnh

| # | Từ → Đến | Tên | Thời lượng | Kỹ thuật | Dự phòng |
| --- | --- | --- | --- | --- | --- |
| T1 | S01 → S02 | Push-in | 1.1 s | scale + transform-origin, crossfade chồng 250 ms | crossfade |
| T2 | S02 → S03 | Zoom qua ý nghĩ | 0.9 s | scale + blur + brightness | crossfade |
| T3 | S03 → S04 | Iris vào laptop | 1.2 s | CSS mask radial-gradient animate bán kính | crossfade |
| T4 | S04 → S05 | Ánh vàng ký ức | 2.1 s | overlay radial-gradient + bật filter ký ức | fade qua vàng |
| T5 | S05 → S06 | Tà vải | 1.0 s | CSS mask SVG sóng + dải lụa DOM | crossfade |
| T6 | S06 → S07 | Về hiện tại | 2.2 s | fade sang giấy + SVG đường chỉ | fade qua giấy |
| T7 | S07 → S08 | Zoom xuyên qua | 1.3 s | scale lớn + blur | crossfade |
| T8 | S08 → S09 | Mở sách 3D | 2.8 s | rotateY + perspective trên title-page | crossfade |
| T9 | S09 → S10 | Bookmark rơi | 1.2 s | translateY + motion blur | crossfade |
| T10 | S10 → Bàn may | Chớp sáng | 3.0 s | overlay + zoom-out Desk Scene | fade trắng |

## 7. Âm thanh (tùy chọn, mặc định tắt)

| Screen | Âm thanh | Âm lượng |
| --- | --- | --- |
| S01–S02 | Lớp học xì xào (loop), "tưng" hài nhẹ | 0.15 / 0.3 |
| S03 | Gõ phím, card sột soạt | 0.2 |
| S04 | Quạt đêm (loop), tắt dần | 0.15 |
| S05 | Máy may cạch-cạch, dừng sau câu bà | 0.25 |
| S06 | Chim sẻ, rèm gió | 0.15 |
| S07 | Chuông xe đạp, cổng kẽo kẹt, nắp hộp gỗ | 0.3 |
| S08–S09 | Miết vải bìa, lật trang, bút sột soạt | 0.3 |
| S10 → T10 | Gió xoáy tăng dần, trống hội xa, chuông ở đỉnh chớp sáng | 0.2 → 0.4 |
| Bàn may | Tiếng lật bìa khi mở sách | 0.3 |

Nguồn: Pixabay Sound Effects hoặc Freesound (chỉ lấy CC0 / giấy phép cho phép, ghi nguồn trong README). Định dạng `.mp3` ≤ 100 KB mỗi file, đặt ở `public/sfx/`.

## 8. Các bước triển khai

| Giai đoạn | Việc | Người | Thời gian | Xong khi |
| --- | --- | --- | --- | --- |
| 0. Chuẩn bị | Đổi tên ảnh về `public/opening/s01…s10.png`; viết `opening.json` (chữ + vị trí từ Mục 4); xác nhận card S03; kiểm tra áo ở S05; tạo lại S08 theo title-page; tạo nền bàn may; sửa khối STYLE của Art Bible theo phong cách screen; tìm SFX | B | 0.5–1 ngày | `check_content` không lỗi, đủ ảnh |
| 1. Prototype T10 | Desk Scene (nền CSS tạm) + cuốn sách title-page đáp xuống + chớp sáng từ S10 | A | 0.5 ngày | Cả đội xem và đồng ý "đây là cảm giác mình muốn" |
| 2. Engine | OpeningPlayer, beat engine, điều khiển, Bỏ qua, ThreadProgress, tải trước ảnh, reduced-motion, `?debug=1`, `?pace=demo` | A | 1 ngày | S01–S10 chạy bằng crossfade từ đầu đến cuối |
| 3. Transitions nhóm 1 | T1 push-in, T2 zoom ý nghĩ, T3 iris, T4 ánh vàng + lọc ký ức | A | 0.5 ngày | Đạt 60 fps trên laptop demo |
| 4. Transitions nhóm 2 | T5 tà vải, T6 về hiện tại, S07 pan + điểm bấm, T7 zoom xuyên | A | 0.5 ngày |  |
| 5. Cao trào | S08 tên sách + vệt sáng, T8 mở sách 3D, S09 spotlight + chữ viết tay + bookmark, T9, S10 sợi chỉ + mảnh giấy, nối vào T10 | A | 1 ngày | Chạy trọn S01 → cuốn sách trên bàn không giật |
| 6. Hoàn thiện | Màn hình dọc, âm thanh, nhớ "đã xem", menu "Xem lại mở đầu", chỉnh nhịp, Lighthouse | A + B | 0.5–1 ngày | Đạt tiêu chí Mục 9 |

**Đặt vào timeline chung:** Opening thay cho "4 trang truyện P0" cũ. Giai đoạn 0–2 cần xong trước **3/10** (lúc đó Opening chạy được bằng crossfade – đủ để demo). Giai đoạn 3–5 làm 4/10–6/10 song song với F1–F7; giai đoạn 6 trước feature freeze tối **7/10**. Vì mỗi transition đều có dự phòng crossfade, trễ ở đâu thì chỉ mất độ đẹp ở chỗ đó, không mất tính năng.

## 9. Tiêu chí hoàn thành

- Chạy trọn S01 → S10 → bàn may → mở sách trên laptop demo, không giật, không màn hình trắng chờ tải.
- Screen đầu hiện trong < 1.5 s; tổng dung lượng ảnh tải cho Opening < 4 MB.
- Mọi chữ là DOM thật, đúng dấu; không có chữ do AI vẽ trong ảnh.
- "Bỏ qua" hoạt động từ S02 và vẫn có cú đáp sách T10.
- Người quay lại vào thẳng bàn may; "Xem lại mở đầu" chạy lại được.
- Reduced-motion chỉ còn crossfade; điện thoại dọc đọc được chữ, không che mặt nhân vật.
- Đã đối chiếu văn hóa: áo ở S05, bìa S08, card S03.
- Bản `?pace=demo` ≤ 40 s để quay video.

## 10. Rủi ro và cách tránh

| Rủi ro | Cách tránh |
| --- | --- |
| react-pageflip không hợp với hiệu ứng 3D mở bìa | Tự làm cú mở bìa ở T8 và ở bàn may bằng CSS 3D; react-pageflip chỉ dùng cho các trang bên trong |
| Máy yếu bị giật ở S10 (mảnh giấy bay) | Giới hạn 24 mảnh, tắt trên điện thoại và reduced-motion, chỉ animate transform |
| Bìa S08 khác bìa title-page | Tạo lại S08 với title-page làm ảnh tham chiếu; tạm thời T7/T8 có nhòe che chỗ khác |
| Vị trí chữ lệch trên màn hình khác tỉ lệ | Neo chữ theo % ảnh + focal point; chế độ dọc dồn chữ xuống dải dưới |
| Hết thời gian | Làm theo thứ tự Mục 8; mọi transition có dự phòng crossfade |

## 11. Cần đội quyết

1. Tạo lại S08 dùng title-page làm tham chiếu? (đề xuất: **có**)
2. Áo đỏ trong cut-in S05: giữ sau khi đối chiếu, hay tạo lại?
3. Bật âm thanh (mặc định tắt, có nút) hay bỏ hẳn cho gọn?
4. Sửa khối STYLE trong Art Bible theo phong cách chibi vừa phải của các screen? (đề xuất: **có**)
5. Cho phép mình bắt đầu từ Giai đoạn 1 (prototype T10) ngay?

