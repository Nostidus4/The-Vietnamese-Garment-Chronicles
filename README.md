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
| `GEMINI_TEXT_MODEL` | `gemini-3.8-flash` | Model trả lời văn bản |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL API mà trình duyệt truy cập; được nhúng lúc build frontend |
| `NEXT_PUBLIC_SUPABASE_URL` | URL dự án Supabase | URL Supabase cho frontend; được nhúng lúc build |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key của dự án | Khóa công khai Supabase cho frontend; được nhúng lúc build |
| `CORS_ORIGINS` | `http://localhost:3000` | Danh sách origin, phân cách bằng dấu phẩy |
| `ADMIN_TOKEN` | rỗng | Bật endpoint `POST /admin/reload` |
| `TRYON_PER_MINUTE` | `6` | Giới hạn số lần thử đồ mỗi phút |
| `MAX_UPLOAD_MB` | `8` | Dung lượng ảnh tải lên tối đa |
| `GEMINI_IMAGE_TIMEOUT_S` | `60` | Quá thời gian này thì bỏ lời gọi Nano Banana, dùng ảnh dự phòng |
| `GEMINI_TEXT_TIMEOUT_S` | `20` | Quá thời gian này thì Hỏi Tèo trả câu từ chối |
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

## Viết một chương cho tỉnh của bạn

Sổ của Bà chia theo **miền**, mỗi miền có **một chương cho mỗi tỉnh**. Tỉnh chưa có chương vẫn hiện trong mục lục của miền, ghi "đang chờ người viết" và dẫn tới mục này. Hiện mỗi miền mở được một chương; chương mẫu là **Huế** (`backend/content/regions/hue.json`, cốt truyện ở `frontend/docs/HUE_CHAPTER.md`).

Một chương được viết như **một chuyến đi cùng Bà**. Mỗi điểm dừng (`stops`) là một trang đôi:

| Trang trái: Bà (ký ức) | Trang phải: "Hôm nay" (Tí đi lại) |
|---|---|
| `date`, `entry` (Bà năm hai mươi tuổi, xưng "tôi", không ghi năm) | `today.title`, `today.text` (Tí xưng "mình", kể cảm giác khi đến) |
| `margin` (Bà bây giờ, viết cho "con"), `ti` (bút chì của Tí) | `today.tips` (tối đa 3 mẹo đi) |
| `frame`: tranh minh họa ký ức (prompt ghi trong `frontend/docs/ART_PROMPTS.md`) | `today.photo`: **ảnh thật**, ghi `credit`, `license`, `source_url` |
| `teo`: dữ kiện có nguồn (chỉ hiện khi `verified: true`) | điểm dừng có `festivals` thì trang phải là bảng lễ hội |

Các bước:

1. Trong `backend/content/regions.json`, đổi tỉnh đó trong `chapters` của miền thành `"status": "open"` và thêm `title`. Mỗi miền hiện chỉ mở được một chương.
2. Tạo `backend/content/regions/<id-miền>.json` theo mẫu `hue.json`: `chapter` (câu ca dao hoặc thơ, dòng của Bà), 4–7 `stops`, `wear` (trang phục), `check` (Bà hỏi con), `own`, `letter` (bưu thiếp cuối chương).
3. **Ảnh thật** chỉ lấy ảnh có giấy phép cho phép dùng lại (Wikimedia Commons: CC BY, CC BY-SA, Public domain), lưu ở `frontend/public/regions/<miền>/photos/`, ghi đủ tác giả và giấy phép. **Tranh ký ức** tạo bằng AI theo `ART_PROMPTS.md`, lưu ở `frontend/public/regions/<miền>/`. Thêm ảnh xong thì chạy `npm run images` trong `frontend/`: script chuyển ảnh gốc sang `frontend/originals/` (không deploy) và để lại trong `public/` bản cạnh dài tối đa 1000px, giữ nguyên tên file (#64). `npm test` báo lỗi nếu còn ảnh chưa thu nhỏ.
4. **Từ khó** trong lời Bà thì đánh dấu `[[chữ hiển thị|id-thuật-ngữ]]` và thêm vào `backend/content/glossary.json`. Người đọc bấm vào sẽ hiện ghi chú của Tèo. Mỗi trang tối đa 2–3 từ.
5. Chạy `python -m scripts.check_content` (không được có lỗi), rồi mở `/?draft=1` để xem cả những ghi chú chưa kiểm chứng.

Ghi chú của Tèo và thuật ngữ chỉ hiện trên trang thật khi `verified: true` và có nguồn trong `sources.json`.

## Nhạc nền

- Đặt file ở `frontend/public/audio/ambient.mp3` và build/chạy với `NEXT_PUBLIC_AMBIENT=1` (ví dụ ghi vào `frontend/.env.local`). Có cờ thì nút **🔊 Nhạc** hiện trên thanh menu; không có cờ thì nút ẩn và trang không tải file nhạc (trước đây trang dò file và bị 404 ở mọi trang, #64).
- Nhạc phát sau cú bấm đầu tiên, lặp lại, tự nhỏ lại khi giọng đọc của phần mở đầu đang nói.
- Chuẩn bị file (âm lượng nền, làm mờ đầu cuối để lặp êm, bỏ ảnh bìa):
  ```bash
  ffmpeg -i "ban-goc.mp3" -map 0:a -af "loudnorm=I=-20:TP=-2:LRA=11,afade=t=in:st=0:d=2.5,afade=t=out:st=<dài-4.5>:d=4.5" -b:a 112k -map_metadata -1 frontend/public/audio/ambient.mp3
  ```
- **Bản quyền:** chỉ commit nhạc có giấy phép cho phép dùng trên website và phát tán file (ví dụ CC0, Pixabay Music), và ghi nguồn. Nhạc Artlist ("Licensed for video") chỉ dùng trong video demo, nên `ambient.mp3` hiện đang được `.gitignore` để không bị commit hay deploy.

## Mở và kiểm tra đoạn opening

| URL | Tác dụng |
|---|---|
| `/?opening=1` | Chạy lại opening |
| `/?opening=1&start=s06` | Bắt đầu từ một scene cụ thể |
| `/?opening=1&debug=1` | Hiện lưới hỗ trợ chỉnh vị trí chữ |
| `/?opening=1&pace=demo` | Chạy nhanh để quay demo |
| `/?opening=1&pace=slow` | Chạy chậm để kiểm tra chuyển cảnh |

Điều khiển bằng click, `Space`, phím mũi tên hoặc cuộn; nhấn `Esc` để bỏ qua.

## Web tĩnh trên GitHub Pages

- Địa chỉ: **https://nostidus4.github.io/The-Vietnamese-Garment-Chronicles/**
- Workflow `.github/workflows/pages.yml` tự build và deploy mỗi lần push vào `main`. Muốn deploy một nhánh khác để xem trước: tab **Actions → Deploy to GitHub Pages → Run workflow**, chọn nhánh.
- Nội dung sổ được xuất từ `backend/content` lúc build (`python -m scripts.export_bootstrap`), nên **đọc sổ, trò chơi, tem, bưu thiếp, Du Ký chạy được mà không cần máy chủ**.
- Compass, thử đồ AI, Hỏi Tèo, thời tiết, cửa hàng, link chia sẻ cần backend. Khi có backend trên Render:
  1. **Settings → Secrets and variables → Actions → Variables**: thêm `API_URL` = URL Render (không có `/` ở cuối).
  2. Trên Render, thêm `https://nostidus4.github.io` vào `CORS_ORIGINS`.
  3. Chạy lại workflow (các biến `NEXT_PUBLIC_*` được nhúng lúc build).
- Build thử trên máy giống hệt Pages:
  ```bash
  cd backend && python -m scripts.export_bootstrap ../frontend/public/bootstrap.json
  cd ../frontend && GITHUB_PAGES=1 NEXT_PUBLIC_BASE_PATH=/The-Vietnamese-Garment-Chronicles NEXT_PUBLIC_API_URL= npx next build   # ra thư mục out/
  ```
- Viết code: ảnh, audio và link `<a>` trỏ vào file trong `public/` phải đi qua `asset()` (`src/lib/base.ts`) để có tiền tố `/The-Vietnamese-Garment-Chronicles` trên Pages. `<Link>` và `router.push` thì Next tự thêm.

## Triển khai

- **Frontend trên Vercel** (miễn phí, repo vẫn private):
  1. Vào [vercel.com](https://vercel.com) → **Continue with GitHub** → cho phép Vercel đọc repo `The-Vietnamese-Garment-Chronicles` (chỉ chọn repo này).
  2. **Add New… → Project → Import** repo này.
  3. **Root Directory:** `frontend`. Framework tự nhận là Next.js; Build Command và Output để mặc định.
  4. **Environment Variables** (áp cho Production và Preview):
     | Tên | Giá trị |
     |---|---|
     | `NEXT_PUBLIC_API_URL` | URL backend trên Render, ví dụ `https://<ten-service>.onrender.com` (không có `/` ở cuối) |
     | `NEXT_PUBLIC_SUPABASE_URL` | như trong `frontend/.env.example` |
     | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | như trong `frontend/.env.example` (key công khai, không phải service key) |
  5. **Deploy.** Mỗi lần merge vào `main` Vercel tự deploy bản chính; mỗi PR có một link xem thử riêng.
  6. **Sau khi có địa chỉ Vercel** (ví dụ `https://viet-phuc-du-ky.vercel.app`):
     - Render → backend → Environment: thêm địa chỉ đó vào `CORS_ORIGINS` (nhiều địa chỉ cách nhau bằng dấu phẩy, không có `/` ở cuối), rồi deploy lại backend.
     - Supabase → Authentication → URL Configuration: đặt **Site URL** là địa chỉ Vercel và thêm `https://<địa-chỉ-vercel>/du-ky` vào **Redirect URLs** (để link đăng nhập "Lưu sổ lên mây" quay về đúng trang).
  - Biến `NEXT_PUBLIC_*` được nhúng lúc build: đổi giá trị thì phải **Redeploy** mới có tác dụng.
- Backend: có thể triển khai trên Render hoặc Railway bằng lệnh `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Sự kiện ẩn danh cho phần Impact (`POST /events`):**
  1. Supabase → SQL Editor → chạy `backend/supabase/events.sql` (tạo bảng `events`, bật RLS, không có policy nên key công khai không đọc/ghi được).
  2. Thêm `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` vào biến môi trường của backend trên Render (và `backend/.env` nếu muốn thử local với Supabase).
  3. Xem số liệu: `python -m scripts.event_stats` (tỉ lệ chọn đúng dịp, điểm quiz trước/sau, tỉ lệ look ⚠️/⛔ được sửa). Thêm `--json` để lấy số thô.
  - Không cấu hình Supabase thì sự kiện ghi vào `backend/data/events.jsonl` (không commit), chỉ để thử local.
  - Không lưu IP; nếu muốn log của Render cũng không có IP, chạy uvicorn với `--no-access-log`.
- **Giữ backend Render luôn thức:** workflow `.github/workflows/keep-awake.yml` ping `/health` mỗi 10 phút.
  - Bật: GitHub → Settings → Secrets and variables → Actions → **Variables** → thêm `BACKEND_URL` = URL Render (không có `/` ở cuối). Có thể bấm "Run workflow" để thử ngay.
  - Tắt: xóa biến `BACKEND_URL`, hoặc vào tab Actions → "Keep backend awake" → Disable workflow.
  - Frontend vẫn tự xử lý khi máy chủ đang ngủ: sau 3 giây không có phản hồi sẽ hiện màn "Đang đánh thức máy chủ…".
- Thiết lập `CORS_ORIGINS` thành URL frontend thật và gọi `/health` trước buổi demo nếu dịch vụ có chế độ ngủ.
