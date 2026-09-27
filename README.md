# Việt Phục Du Ký – The Vietnamese Garment Chronicles

> "Hiểu để mặc đúng – Sáng tạo để mặc theo cách của mình."

Web app dạng quyển sách lật giúp người trẻ tự phối Việt phục mà không làm sai lệch văn hóa. Người dùng mở đầu bằng vài trang truyện tranh về Tí, Tèo và cuốn sổ của bà, lật tới bản đồ Việt Nam, chọn vùng, phối đồ với **Cultural Compass** (luật văn hóa có nguồn) rồi thử lên người bằng **Gemini (Nano Banana)**.

Tài liệu sản phẩm đầy đủ: Google Doc của đội (tab Hồ sơ nộp bài, MVP & Kế hoạch, Cultural Compass & Dữ liệu, Kịch bản truyện tranh).

## Cấu trúc

```
frontend/   Next.js 16 + Tailwind 4 + react-pageflip + framer-motion (chỉ giao diện, không giữ dữ liệu)
  src/app/                  trang: / (sách), /chapter/[id], /du-ky
  src/components/book/      flipbook, trang truyện, bản đồ, chữ viết tay
  src/components/chapter/   Story Card, Builder, Compass, Try-on
  src/lib/                  gọi API, kiểu dữ liệu, Du Ký (localStorage)
backend/    FastAPI
  app/services/             compass, try-on, Hỏi Tèo, thời tiết, phối màu
  app/routers/              các endpoint
  app/content/              đọc + kiểm tra dữ liệu
  content/                  ← TOÀN BỘ DỮ LIỆU (đội chỉ cần sửa ở đây)
  scripts/                  check_content, pregenerate_fallbacks
  tests/                    38 test
docs/BACKEND.md             kiến trúc, API, CÁCH NHẬP DỮ LIỆU
docs/TASKS.md               chia việc cho 2 người theo timeline
```

## Chạy ở máy

**Backend** (cổng 8000):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # điền GEMINI_API_KEY
uvicorn app.main:app --reload --reload-include '*.json' --port 8000
pytest -q                     # 38 test phải xanh
python -m scripts.check_content   # báo dữ liệu còn thiếu gì
```

**Frontend** (cổng 3000):

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Không có `GEMINI_API_KEY` thì app vẫn chạy: try-on trả về ảnh trong `backend/content/media/fallback/<garment_id>.png`.

**Muốn thêm/sửa nội dung?** Đọc [docs/BACKEND.md](docs/BACKEND.md) mục 4 – chỉ cần sửa file JSON trong `backend/content/`.

## Nguyên tắc

- **Luật quyết định, Gemini thể hiện.** Compass chạy trước mọi lệnh gọi AI; look ⛔ không bao giờ được gửi sang Nano Banana, hệ thống dựng phương án thay thế.
- 4 trạng thái Compass: `fit` (Authentic) · `adapted` (Adapted) · `review` (Inspired) · `distorted` (không vào Du Ký).
- Mọi dữ kiện văn hóa trong `backend/content` phải có nguồn trong `sources.json` và được đổi `"verified": true` sau khi đối chiếu Research.
- Bản đồ phải có **Hoàng Sa và Trường Sa**.
- Ảnh người dùng chỉ xử lý trong bộ nhớ, không lưu trên server.

## Triển khai

- Frontend: Vercel, root `frontend`, biến `NEXT_PUBLIC_API_URL`.
- Backend: Render hoặc Railway, lệnh `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, biến `GEMINI_API_KEY`, `CORS_ORIGINS` = URL Vercel. Gọi `/health` trước khi demo để đánh thức server.
