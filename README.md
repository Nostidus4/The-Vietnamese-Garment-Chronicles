# Việt Phục Du Ký – The Vietnamese Garment Chronicles

> "Hiểu để mặc đúng – Sáng tạo để mặc theo cách của mình."

Web app dạng quyển sách lật giúp người trẻ tự phối Việt phục mà không làm sai lệch văn hóa. Người dùng mở đầu bằng vài trang truyện tranh về Tí, Tèo và cuốn sổ của bà, lật tới bản đồ Việt Nam, chọn vùng, phối đồ với **Cultural Compass** (luật văn hóa có nguồn) rồi thử lên người bằng **Gemini (Nano Banana)**.

Tài liệu sản phẩm đầy đủ: Google Doc của đội (tab Hồ sơ nộp bài, MVP & Kế hoạch, Cultural Compass & Dữ liệu, Kịch bản truyện tranh).

## Cấu trúc

```
frontend/   Next.js 16 + Tailwind 4 + react-pageflip + framer-motion
  src/app/                  trang: / (sách), /chapter/[id], /du-ky
  src/components/book/      flipbook, trang truyện, bản đồ, chữ viết tay
  src/components/chapter/   Story Card, Builder, Compass, Try-on
  src/data/                 kịch bản truyện tranh, chữ viết tay theo vùng
  public/comic/             ảnh trang truyện (Nano Banana, không có chữ)
backend/    FastAPI
  app/compass.py            Cultural Compass – nguồn sự thật duy nhất
  app/gemini.py             mọi lệnh gọi Gemini (try-on, Hỏi Tèo)
  data/*.json               trang phục, luật, dịp, vùng
  data/ref, avatars, fallback   ảnh mẫu chuẩn, avatar, ảnh dự phòng
  tests/                    test cho Compass
docs/TASKS.md               chia việc cho 2 người theo timeline
```

## Chạy ở máy

**Backend** (cổng 8000):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # điền GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
pytest -q                     # 11 test Compass phải xanh
```

**Frontend** (cổng 3000):

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Không có `GEMINI_API_KEY` thì app vẫn chạy: try-on trả về ảnh trong `backend/data/fallback/<garment_id>.png`.

## Nguyên tắc

- **Luật quyết định, Gemini thể hiện.** Compass chạy trước mọi lệnh gọi AI; look ⛔ không bao giờ được gửi sang Nano Banana, hệ thống dựng phương án thay thế.
- 4 trạng thái Compass: `fit` (Authentic) · `adapted` (Adapted) · `review` (Inspired) · `distorted` (không vào Du Ký).
- Mọi dữ kiện văn hóa trong `backend/data` phải có `source_id` trỏ về Research Report trước khi demo (hiện đang `"verified": false`).
- Bản đồ phải có **Hoàng Sa và Trường Sa**.
- Ảnh người dùng chỉ xử lý trong bộ nhớ, không lưu trên server.

## Triển khai

- Frontend: Vercel, root `frontend`, biến `NEXT_PUBLIC_API_URL`.
- Backend: Render hoặc Railway, lệnh `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, biến `GEMINI_API_KEY`, `CORS_ORIGINS` = URL Vercel. Gọi `/health` trước khi demo để đánh thức server.
