Mẫu để copy khi thêm dữ liệu. Thư mục này KHÔNG được server đọc.
- Trang phục mới: copy garment.json vào content/garments/<id>.json (tên file = id), thêm id vào regions.json.
- Phụ kiện / tiệm / câu quiz / nguồn: copy một object vào mảng tương ứng trong file cùng tên.
Chạy `python -m scripts.check_content` sau mỗi lần sửa.

## Cách viết (thống nhất từ #59)

**Xưng hô**

| Ai nói | Xưng | Gọi người đọc | Ví dụ |
|---|---|---|---|
| Bà (nhật ký, lời bên lề, thư) | Bà; “tôi” khi Bà năm hai mươi tuổi viết nhật ký | con | “Con đoán thử xem…” |
| Tí, Tèo (bạn đồng hành, lời Compass) | tớ, mình | bạn | “Thấy ghim đỏ là có ghi chú của tớ.” |
| Giao diện (nút, nhãn, thông báo) | (không xưng) | con | “Du Ký của con”, “Con hiểu…” |

**Chữ**
- Bỏ dấu kiểu mới: họa, hòa, hóa, thủy, hủy (không viết hoạ, hoà, hoá, thuỷ, huỷ).
- Ngoặc kép cong “…”, không dùng "…" hay '…' trong chữ người đọc thấy; không dùng “??”.
- Tên vùng: Bắc Bộ, Trung Bộ, Nam Bộ, Tây Bắc, Tây Nguyên.
- Mức độ của từng phần áo: **Giữ / Cân nhắc / Được đổi**.
- Nhãn Compass hiện cho người đọc bằng tiếng Việt: Đúng chuẩn / Cách tân / Lấy cảm hứng (trong dữ liệu vẫn là Authentic / Adapted / Inspired).
- Không “look”: dùng “bộ phối”, “bộ này”.

`check_content` báo lỗi khi gặp kiểu bỏ dấu cũ, “??” hay ngoặc kép thẳng trong chữ hiển thị.
