# Backend – Việt Phục Du Ký

Backend được thiết kế để **sau này đội chỉ cần nhập dữ liệu**: toàn bộ nội dung nằm trong `backend/content/` dạng JSON, code không phải sửa. Server tự kiểm tra dữ liệu khi khởi động và chỉ ra chính xác chỗ sai.

## 1. Kiến trúc

```
Next.js ──HTTP──▶ FastAPI
                   ├─ routers/        content · styling · extras · admin
                   ├─ services/
                   │   ├─ compass.py    luật văn hóa → 4 trạng thái (nguồn sự thật duy nhất)
                   │   ├─ harmony.py    F2 gợi ý phối màu (không đổi trạng thái)
                   │   ├─ tryon.py      Compass → prompt từ dữ liệu → Nano Banana → fallback
                   │   ├─ ask.py        F8 Hỏi Tèo: chỉ trả lời từ dữ liệu, lọc nguồn bịa
                   │   ├─ weather.py    F4 Open-Meteo, cache 30 phút
                   │   └─ gemini_client.py  mọi lệnh gọi Gemini (dễ mock khi test)
                   └─ content/store.py  đọc + kiểm tra toàn bộ content/ khi khởi động
content/  ← ĐỘI CHỈ SỬA Ở ĐÂY
```

**Nguyên tắc:** luật quyết định, Gemini thể hiện. Compass luôn chạy trước; look ⛔ không bao giờ được gửi sang Nano Banana – hệ thống tự thay/bỏ món gây sai lệch rồi dựng phương án thay thế.

## 2. Compass – cách luật chạy

| Tình huống | Loại rule | Trạng thái | Nhãn |
|---|---|---|---|
| Phụ kiện `kind: traditional-foreign` | fusion | ⛔ distorted | – |
| Phụ kiện `kind: restricted` hoặc màu `restricted: true` | restricted | ⛔ distorted | – |
| Đổi zone `level: keep` | core | ⛔ distorted | – |
| Đổi zone `level: caution` | caution | ⚠️ review | Inspired |
| Phụ kiện/trang phục không có dịp đang chọn trong `occasions` | occasion | ⚠️ review | Inspired |
| Phụ kiện `kind: modern`, màu khác màu mặc định, đổi zone `free` | flexible | ✨ adapted | Adapted |
| Không có gì ở trên | – | ✅ fit | Authentic |

Nhiều rule cùng kích hoạt → trạng thái nặng nhất thắng, và được xếp đầu `triggers`. Lời thoại lấy từ `rules.json`; phụ kiện có `message` riêng sẽ ghi đè. Phụ kiện bị từ chối có `alternative` thì được thay bằng món đó.

→ **Thêm phụ kiện nước ngoài mới chỉ cần đặt `kind: "traditional-foreign"`**, không cần viết rule.

## 3. API

Tài liệu tương tác: chạy server rồi mở `http://localhost:8000/docs`.

| Method | Path | Dùng cho |
|---|---|---|
| GET | `/health` | Kiểm tra server, có Gemini chưa, số cảnh báo dữ liệu |
| GET | `/content/bootstrap` | **Một lần gọi lấy hết**: vùng, trang phục, dịp, màu, phụ kiện, nguồn, truyện |
| GET | `/regions`, `/regions/{id}` | Vùng + chi tiết trang phục |
| GET | `/garments`, `/garments/{id}` | Trang phục + chi tiết phụ kiện, nguồn |
| GET | `/occasions`, `/sources`, `/comic` | Danh sách riêng lẻ |
| POST | `/compass` | Chấm một look → `state`, `label`, `triggers`, `harmony_notes`, `alternative` |
| POST | `/compass/compare` | F1: so sánh 2–3 look |
| POST | `/tryon` | multipart: `selection` (JSON), `photo` (tùy chọn) hoặc `avatar_id` |
| POST | `/ask` | F8 Hỏi Tèo `{garment_id, question}` |
| GET | `/quiz?count=5` | F5: câu hỏi (không kèm đáp án) |
| POST | `/quiz/answer` | F5: chấm `{id, answer}` |
| GET | `/shops?city=&garment_id=&service=` | F7: danh bạ, tiệm đã kiểm chứng lên trước |
| GET | `/weather/{region_id}` | F4: nhiệt độ + gợi ý khi trời nóng |
| GET | `/admin/content-report` | Danh sách lỗi/cảnh báo dữ liệu + thống kê |
| POST | `/admin/reload` | Nạp lại dữ liệu không cần restart (cần `ADMIN_TOKEN`) |
| GET | `/media/...` | Ảnh trong `content/media` |

Selection gửi lên Compass/try-on:

```json
{"garment_id": "ao-ngu-than", "occasion_id": "di-tich", "vibe": "modern",
 "colors": ["tim-hue"], "accessories": ["sneakers-trang"],
 "modifications": [{"zone": "chất liệu", "change": "linen"}]}
```

Id không có trong lựa chọn của trang phục → HTTP 422 kèm câu báo lỗi tiếng Việt.

**Try-on:** giới hạn `TRYON_PER_MINUTE` lần/phút mỗi máy (429 nếu vượt), ảnh ≤ `MAX_UPLOAD_MB`, chỉ nhận `image/*`. Ảnh người dùng chỉ nằm trong bộ nhớ; ảnh dựng từ avatar được cache để demo nhanh và tiết kiệm quota. Không có API key hoặc Gemini lỗi → trả `fallback_url` (`/media/fallback/<garment_id>.png`).

## 4. Cách nhập dữ liệu (việc của đội sau này)

```
backend/content/
├── sources.json        71 nguồn từ Research (ref-01…ref-66 + research-*)
├── garments/<id>.json  MỖI TRANG PHỤC MỘT FILE (tên file = id)
├── accessories.json    phụ kiện + kind + lời thoại riêng
├── colors.json         màu + mã hex (+ restricted)
├── occasions.json      5 dịp + mô tả nền cho try-on
├── regions.json        vùng, trạng thái mở/khóa, chữ viết tay trên bản đồ
├── rules.json          lời thoại chung cho 6 loại rule
├── quiz.json           câu hỏi "Việt hay không?"
├── shops.json          danh bạ thuê/may
├── comic.json          8 trang truyện + bong bóng thoại
├── _templates/         MẪU để copy (server không đọc)
└── media/              ref/ avatars/ fallback/ comic/ quiz/ shops/ stamps/
```

**Quy trình mỗi lần nhập:**

1. Copy mẫu trong `content/_templates/`, điền thông tin. Mọi dữ kiện văn hóa (`facts`) phải có `sources`.
2. Đặt ảnh vào đúng thư mục trong `content/media/` (PNG).
3. Chạy kiểm tra:
   ```bash
   cd backend && source .venv/bin/activate
   python -m scripts.check_content
   ```
   ❌ lỗi = phải sửa (server sẽ không chạy). ⚠️ cảnh báo = việc còn thiếu (thiếu ảnh, chưa kiểm chứng).
4. Sau khi đối chiếu với Research, đổi `"verified": true`.
5. `pytest -q` phải xanh, rồi commit.

**Ví dụ thêm trang phục mới** (`áo tấc` ở Huế):
1. Copy `_templates/garment.json` → `garments/ao-tac.json`, đặt `"id": "ao-tac"`, `"region": "hue"`.
2. Thêm `"ao-tac"` vào mảng `garments` của vùng `hue` trong `regions.json`.
3. Đặt ảnh chuẩn `media/ref/ao-tac.png`, chạy `check_content`.

**Ảnh cần chuẩn bị (hiện đang thiếu – xem `check_content`):**

| Thư mục | File | Dùng cho |
|---|---|---|
| `media/ref/` | `<garment_id>.png` | Ảnh mẫu chuẩn gửi kèm Nano Banana (quan trọng nhất cho độ chính xác) |
| `media/avatars/` | `default.png` | Thử đồ khi người dùng không tải ảnh |
| `media/fallback/` | `<garment_id>.png` | Hiện khi không gọi được Gemini – tạo bằng `python -m scripts.pregenerate_fallbacks` |
| `media/comic/` | `page-1.png` … `page-8.png` | Trang truyện (không có chữ trong ảnh) |
| `media/quiz/` | theo `quiz.json` | Mini-game |
| `media/stamps/` | `<region_id>.png` | Culture Stamp mỗi chapter |

## 5. Chạy, test, triển khai

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                       # điền GEMINI_API_KEY
uvicorn app.main:app --reload --reload-include '*.json' --port 8000
pytest -q                                  # 38 test
```

`--reload-include '*.json'` giúp server tự nạp lại khi sửa dữ liệu lúc phát triển.

**Render:** root `backend`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, biến môi trường như `.env.example` (`CORS_ORIGINS` = URL Vercel). Dữ liệu nằm trong repo nên mỗi lần deploy là có dữ liệu mới nhất (ổ đĩa của Render free bị xóa khi deploy, vì vậy **không** lưu dữ liệu qua API).

## 6. Test bao phủ những gì

- `test_compass.py`: đủ 4 trạng thái, ghi đè lời thoại, thay thế phụ kiện, selection không hợp lệ → lỗi.
- `test_content.py`: dữ liệu thật không lỗi; gõ sai tên trường, id không tồn tại, tên file ≠ id, JSON hỏng đều bị bắt.
- `test_api.py`: mọi endpoint; try-on ⛔ dựng phương án thay thế, từ chối file không phải ảnh, giới hạn tốc độ; Hỏi Tèo bỏ nguồn bịa; quiz không lộ đáp án. Gemini được giả lập, test không tốn quota.
