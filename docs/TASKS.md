# Chia việc – 27/9 → 10/10

**A = Frontend (Next.js)** · **B = Backend (FastAPI) + nội dung + AI + pitch**

Mỗi người làm trên branch riêng (`feat/a-...`, `feat/b-...`), mở Pull Request vào `main`, người kia review nhanh. Mỗi tối chạy thử happy path 10 phút.

## Đã có sẵn trong repo (khung chạy được)

- [x] Flipbook: bìa → 4 trang truyện (placeholder) → trang bản đồ → trang cuối; nút "Bỏ qua truyện"
- [x] Trang bản đồ: vùng hover/click, chữ viết tay hiện dần, Tây Bắc khóa, có Hoàng Sa/Trường Sa (bản đồ **tạm**)
- [x] Chapter: chọn trang phục (Huế có 2), Story Card + Style Freedom Map, Builder (dịp, vibe, màu, phụ kiện)
- [x] **Backend hoàn chỉnh** (xem docs/BACKEND.md): Compass 4 trạng thái, compare (F1), phối màu (F2), try-on Nano Banana có cache + giới hạn tốc độ + fallback, Hỏi Tèo (F8), quiz (F5), danh bạ (F7), thời tiết (F4), báo cáo dữ liệu – 38 test
- [x] Dữ liệu mẫu: 4 trang phục, 12 phụ kiện, 71 nguồn từ Research, 8 trang truyện, 1 tiệm, 2 câu quiz
- [x] Du Ký của tôi: lưu localStorage, thêm ảnh mặc thật (chọn trang phục + dịp), thẻ văn hóa, xuất PNG

## A – Frontend

| Hạn | Việc | File chính |
|---|---|---|
| 28/9 | Deploy Vercel; chỉnh khung sách đẹp trên laptop + điện thoại | `components/book/Flipbook.tsx` |
| 1/10 | Chỉnh vị trí bong bóng thoại khi đã có ảnh truyện thật | `backend/content/comic.json`, `ComicPage.tsx` |
| 1/10 | Thay bản đồ tạm bằng SVG thật do B cung cấp, giữ id vùng | `VietnamMap.tsx` |
| 3/10 | **P0 xong**: Compass UI đẹp (Tí/Tèo có avatar), try-on có loading, preview ảnh | `components/chapter/*` |
| 3/10 | Du Ký: làm đẹp thẻ văn hóa, dấu "Mặc đúng", stamp | `components/duky/DuKyView.tsx` |
| 5/10 | UI cho F1 (`compareLooks`) · F2 (`harmony_notes` đã có) · F3 Style Freedom Map dạng hình | API đã sẵn trong `lib/api.ts` |
| 6/10 | UI cho F5 (`getQuiz`, `answerQuiz`) · F7 (`getShops`) | API đã sẵn |
| 7/10 | UI cho F4 (`getWeather`), F6 (`wearing_steps`), F8 (`askTeo`) · **feature freeze tối** | API đã sẵn |
| 8/10 | Sửa lỗi, responsive, test trên điện thoại | – |

## B – Nội dung, AI, pitch (backend đã xong – chủ yếu là NHẬP DỮ LIỆU)

Mọi việc dưới đây chỉ sửa trong `backend/content/`. Sau mỗi lần sửa: `python -m scripts.check_content`.

| Hạn | Việc | File chính |
|---|---|---|
| 28/9 | Deploy Render; điền `GEMINI_API_KEY`; character sheet Tí/Tèo/bà | `backend/.env` |
| 29/9 | Đối chiếu 4 trang phục + phụ kiện với Research, bổ sung `facts`, đổi `verified` → `true` | `content/garments/*.json`, `accessories.json` |
| 1/10 | Ảnh mẫu chuẩn mỗi trang phục; 4 trang truyện đầu | `content/media/ref/`, `content/media/comic/` |
| 1/10 | SVG bản đồ Việt Nam chuẩn **có Hoàng Sa, Trường Sa** | giao cho A |
| 3/10 | Avatar mặc định; test prompt try-on ~20 tổ hợp/trang phục; chạy `scripts.pregenerate_fallbacks` | `content/media/avatars/`, `app/services/tryon.py` |
| 5/10 | Ảnh + câu hỏi quiz (≥ 8 câu); 5–10 tiệm đã kiểm tra | `quiz.json`, `shops.json` |
| 6/10 | 4 trang truyện còn lại (đổi `SHOW_UP_TO` thành `"P1"` trong `Flipbook.tsx`); stamp 3 vùng | `content/media/comic/`, `media/stamps/` |
| 7/10 | `wearing_steps` cho F6; hỏi thử Tèo 10 câu ngoài dữ liệu → phải từ chối | `content/garments/*.json` |
| 8/10 | Quay video 3 phút, dán Form 1–7, chuẩn bị 4 URL | – |

## Quy ước

- Không commit `.env`, ảnh cá nhân, API key.
- Đổi luật Compass → thêm test trong `backend/tests/test_compass.py`. Thêm dữ liệu thì không cần viết test: `check_content` + `test_content.py` đã kiểm tra.
- Lời thoại và dữ kiện văn hóa phải đối chiếu research trước khi merge.
