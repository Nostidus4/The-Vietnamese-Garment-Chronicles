# Việt Phục Du Ký

> Hiểu để mặc đúng – Sáng tạo để mặc theo cách của mình.

Việt Phục Du Ký là web app tương tác dạng sách lật, đưa người dùng đi qua các vùng văn hóa Việt Nam, tìm hiểu trang phục truyền thống, tự phối đồ bằng **Cultural Compass** và thử trang phục với Gemini.

## Tính năng chính

- Truyện mở đầu và hành trình khám phá trên bản đồ Việt Nam.
- Nội dung trang phục, phụ kiện, vùng miền và nguồn tham khảo được quản lý bằng JSON.
- Cultural Compass kiểm tra lựa chọn trước khi gửi yêu cầu tới AI.
- Thử trang phục bằng Gemini; ứng dụng vẫn chạy khi không có API key.
- Quiz, gợi ý thời tiết, danh sách cửa hàng và nhật ký Du Ký trên trình duyệt.
- API FastAPI có tài liệu Swagger tại `http://localhost:8000/docs`.

## Công nghệ

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion.
- Backend: FastAPI, Pydantic, Google Gen AI.
- Vận hành local: Docker Compose.

## Chạy nhanh bằng Docker Compose

Yêu cầu: Docker Desktop hoặc Docker Engine có Docker Compose.

```bash
cp backend/.env.example .env
docker compose up --build
```

Sau khi cả hai container ở trạng thái healthy:

- Web: http://localhost:3000
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health check: http://localhost:8000/health

Nhấn `Ctrl+C` để dừng, sau đó chạy:

```bash
docker compose down
```

Chạy nền hoặc xem log:

```bash
docker compose up --build -d
docker compose logs -f
```

### Cấu hình môi trường

File `.env` ở thư mục gốc được Docker Compose tự động đọc và đã nằm trong `.gitignore`.

| Biến | Mặc định | Mô tả |
|---|---|---|
| `GEMINI_API_KEY` | rỗng | API key dùng cho tính năng AI |
| `GEMINI_IMAGE_MODEL` | `gemini-2.5-flash-image` | Model tạo ảnh |
| `GEMINI_TEXT_MODEL` | `gemini-2.5-flash` | Model trả lời văn bản |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL API mà trình duyệt truy cập; được nhúng lúc build frontend |
| `NEXT_PUBLIC_SUPABASE_URL` | URL dự án Supabase | URL Supabase cho frontend; được nhúng lúc build |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key của dự án | Khóa công khai Supabase cho frontend; được nhúng lúc build |
| `CORS_ORIGINS` | `http://localhost:3000` | Danh sách origin, phân cách bằng dấu phẩy |
| `ADMIN_TOKEN` | rỗng | Bật endpoint `POST /admin/reload` |
| `TRYON_PER_MINUTE` | `6` | Giới hạn số lần thử đồ mỗi phút |
| `MAX_UPLOAD_MB` | `8` | Dung lượng ảnh tải lên tối đa |
| `FRONTEND_PORT` | `3000` | Cổng frontend trên máy host |
| `BACKEND_PORT` | `8000` | Cổng backend trên máy host |

Nếu đổi `NEXT_PUBLIC_API_URL`, cần build lại frontend:

```bash
docker compose build frontend
docker compose up -d
```

Không có `GEMINI_API_KEY`, phần nội dung và Cultural Compass vẫn hoạt động. Try-on dùng ảnh fallback nếu ảnh tương ứng đã được thêm vào `backend/content/media/fallback/`.

## Chạy ở máy để phát triển

### Backend

Yêu cầu Python 3.11 trở lên.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --reload-include '*.json' --port 8000
```

### Frontend

Yêu cầu Node.js 20.9 trở lên.

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Cấu hình Supabase cho phát triển local nằm trong `frontend/.env.local` (không commit). Chạy `npm install` trong `frontend/` khi thêm package mới. Ứng dụng dùng Next.js 16 nên session refresh nằm ở `frontend/src/proxy.ts`.

## Pre-commit

Cài và bật hook một lần sau khi đã tạo môi trường backend và cài package frontend:

```bash
python3 -m pip install pre-commit
pre-commit install
pre-commit run --all-files
```

File [.pre-commit-config.yaml](.pre-commit-config.yaml) tự động kiểm tra khoảng trắng, test backend, dữ liệu văn hóa, ESLint frontend và cấu hình Docker Compose tùy theo file được staged.

## Kiểm tra thủ công trước khi push

```bash
cd backend
source .venv/bin/activate
pytest -q
python -m scripts.check_content

cd ../frontend
npm run lint
npm run build

cd ..
docker compose config
docker compose up --build -d
docker compose ps
docker compose down
```

## Cấu trúc dự án

```text
.
├── compose.yaml             # Chạy toàn bộ ứng dụng
├── backend/
│   ├── app/                 # FastAPI, router và service
│   ├── content/             # Dữ liệu văn hóa và media
│   ├── docs/                # Tài liệu API, content và hành trình vùng
│   ├── scripts/             # Kiểm tra nội dung, tạo fallback
│   └── tests/               # Test backend
├── frontend/
│   ├── docs/                # Art Bible, opening và kế hoạch frontend
│   ├── public/              # Tài nguyên tĩnh
│   └── src/
│       ├── app/             # Route Next.js
│       ├── components/      # Giao diện sách, chương và opening
│       └── lib/             # API client, type và local storage
```

Tài liệu chi tiết:

- [Backend và cách nhập dữ liệu](backend/docs/BACKEND.md)
- [Kế hoạch opening](frontend/docs/OPENING_PLAN.md)
- [Art Bible và prompt hình ảnh](frontend/docs/ART_PROMPTS.md)
- [Phân chia công việc](frontend/docs/TASKS.md)

Dữ liệu chính nằm trong `backend/content/`.

## Quy ước nội dung

- Luật văn hóa được kiểm tra trước khi gọi Gemini.
- Bốn trạng thái Compass: `fit`, `adapted`, `review`, `distorted`.
- Dữ kiện văn hóa phải trỏ tới nguồn trong `backend/content/sources.json`.
- Bản đồ phải thể hiện Hoàng Sa và Trường Sa.
- Ảnh người dùng chỉ được xử lý trong bộ nhớ, không lưu trên server.

## Mở và kiểm tra đoạn opening

| URL | Tác dụng |
|---|---|
| `/?opening=1` | Chạy lại opening |
| `/?opening=1&start=s06` | Bắt đầu từ một scene cụ thể |
| `/?opening=1&debug=1` | Hiện lưới hỗ trợ chỉnh vị trí chữ |
| `/?opening=1&pace=demo` | Chạy nhanh để quay demo |
| `/?opening=1&pace=slow` | Chạy chậm để kiểm tra chuyển cảnh |

Điều khiển bằng click, `Space`, phím mũi tên hoặc cuộn; nhấn `Esc` để bỏ qua.

## Triển khai

- Frontend: có thể triển khai trên Vercel với root directory là `frontend` và biến `NEXT_PUBLIC_API_URL` trỏ tới backend public.
- Backend: có thể triển khai trên Render hoặc Railway bằng lệnh `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Giữ backend Render luôn thức:** workflow `.github/workflows/keep-awake.yml` ping `/health` mỗi 10 phút.
  - Bật: GitHub → Settings → Secrets and variables → Actions → **Variables** → thêm `BACKEND_URL` = URL Render (không có `/` ở cuối). Có thể bấm "Run workflow" để thử ngay.
  - Tắt: xóa biến `BACKEND_URL`, hoặc vào tab Actions → "Keep backend awake" → Disable workflow.
  - Frontend vẫn tự xử lý khi máy chủ đang ngủ: sau 3 giây không có phản hồi sẽ hiện màn "Đang đánh thức máy chủ…".
- Thiết lập `CORS_ORIGINS` thành URL frontend thật và gọi `/health` trước buổi demo nếu dịch vụ có chế độ ngủ.
