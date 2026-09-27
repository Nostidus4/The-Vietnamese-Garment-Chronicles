# Chia việc – 27/9 → 10/10

**A = Frontend (Next.js)** · **B = Backend (FastAPI) + nội dung + AI + pitch**

Mỗi người làm trên branch riêng (`feat/a-...`, `feat/b-...`), mở Pull Request vào `main`, người kia review nhanh. Mỗi tối chạy thử happy path 10 phút.

## Đã có sẵn trong repo (khung chạy được)

- [x] Flipbook: bìa → 4 trang truyện (placeholder) → trang bản đồ → trang cuối; nút "Bỏ qua truyện"
- [x] Trang bản đồ: vùng hover/click, chữ viết tay hiện dần, Tây Bắc khóa, có Hoàng Sa/Trường Sa (bản đồ **tạm**)
- [x] Chapter: chọn trang phục (Huế có 2), Story Card + Style Freedom Map, Builder (dịp, vibe, màu, phụ kiện)
- [x] Cultural Compass 4 trạng thái chạy thật qua API + 11 test
- [x] Try-on: gọi `/tryon`, look ⛔ tự dựng phương án thay thế, fallback khi không có key
- [x] Du Ký của tôi: lưu localStorage, thêm ảnh mặc thật, xuất PNG

## A – Frontend

| Hạn | Việc | File chính |
|---|---|---|
| 28/9 | Deploy Vercel; chỉnh khung sách đẹp trên laptop + điện thoại | `components/book/Flipbook.tsx` |
| 1/10 | Ghép ảnh truyện thật + chỉnh vị trí bong bóng thoại | `data/comic.ts`, `ComicPage.tsx` |
| 1/10 | Thay bản đồ tạm bằng SVG thật do B cung cấp, giữ id vùng | `VietnamMap.tsx` |
| 3/10 | **P0 xong**: Compass UI đẹp (Tí/Tèo có avatar), try-on có loading, preview ảnh | `components/chapter/*` |
| 3/10 | Du Ký: chọn trang phục + dịp khi thêm ảnh thật; thẻ văn hóa đầy đủ (tên, thời kỳ, nguồn) | `components/duky/DuKyView.tsx` |
| 5/10 | F1 So sánh 2–3 look · F2 Kiểm tra màu (hiển thị `harmony_notes`) · F3 Style Freedom Map dạng hình | mới |
| 6/10 | F5 Mini-game "Việt hay không?" · F7 Danh bạ thuê/may · stamp mỗi chapter | mới |
| 7/10 | P2 (F4 thời tiết, F6 hướng dẫn mặc, F8 Hỏi Tèo UI) · **feature freeze tối** | mới |
| 8/10 | Sửa lỗi, responsive, test trên điện thoại | – |

## B – Backend, nội dung, AI, pitch

| Hạn | Việc | File chính |
|---|---|---|
| 28/9 | Deploy Render; điền `GEMINI_API_KEY`; character sheet Tí/Tèo/bà | `backend/.env`, `public/comic/` |
| 29/9 | Đối chiếu dữ liệu 4 trang phục với Research, gắn `source_id`, đổi `verified` → `true` | `data/garments.json` |
| 1/10 | Ảnh mẫu chuẩn mỗi trang phục (`data/ref/<id>.png`); 4 trang truyện đầu | `data/ref/`, `public/comic/` |
| 1/10 | SVG bản đồ Việt Nam chuẩn **có Hoàng Sa, Trường Sa** | giao cho A |
| 3/10 | Test prompt try-on ~20 tổ hợp/trang phục, lưu phiên bản prompt tốt nhất | `app/gemini.py` |
| 3/10 | Avatar mặc định (`data/avatars/default.png`) + fallback gallery (`data/fallback/<id>.png`) | `data/` |
| 5/10 | Thêm rule mới nếu cần (luôn kèm test); dữ liệu quiz F5; 5–10 tiệm cho F7 | `data/rules.json`, `tests/` |
| 6/10 | 4 trang truyện còn lại (đổi `SHOW_UP_TO` thành `"P1"`) | `Flipbook.tsx` |
| 7/10 | `/ask` Hỏi Tèo: test câu hỏi ngoài dữ liệu phải bị từ chối | `app/gemini.py` |
| 8/10 | Quay video 3 phút, dán Form 1–7, chuẩn bị 4 URL | – |

## Quy ước

- Không commit `.env`, ảnh cá nhân, API key.
- Đổi luật Compass → thêm test trong `backend/tests/test_compass.py`.
- Lời thoại và dữ kiện văn hóa phải đối chiếu research trước khi merge.
