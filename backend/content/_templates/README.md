Mẫu để copy khi thêm dữ liệu. Thư mục này KHÔNG được server đọc.
- Trang phục mới: copy garment.json vào content/garments/<id>.json (tên file = id), thêm id vào regions.json.
- Phụ kiện / tiệm / câu quiz / nguồn: copy một object vào mảng tương ứng trong file cùng tên.
Chạy `python -m scripts.check_content` sau mỗi lần sửa.

## Cách viết (thống nhất từ #59)

**Xưng hô**

| Ai nói | Xưng | Gọi người đọc | Ví dụ |
|---|---|---|---|
| Bà (nhật ký, lời bên lề, thư) | Bà; “tôi” khi Bà năm hai mươi tuổi viết nhật ký | con | “Con đoán thử xem…” |
| Tí (nhân vật chính, nét chì bên lề) | mình | (không gọi) | “Giờ mình mới biết nó bắt đầu từ đâu.” |
| Tèo (bạn đồng hành, lời Tèo chấm, Hỏi Tèo) | tớ | bạn | “Thấy ghim đỏ là có ghi chú của tớ.” |
| Giao diện (nút, nhãn, thông báo) | (không xưng) | con | “Du Ký của con”, “Con hiểu…” |

**Chữ**
- Bỏ dấu kiểu mới: họa, hòa, hóa, thủy, hủy (không viết hoạ, hoà, hoá, thuỷ, huỷ).
- Ngoặc kép cong “…”, không dùng "…" hay '…' trong chữ người đọc thấy; không dùng “??”.
- Tên vùng: Bắc Bộ, Trung Bộ, Nam Bộ, Tây Bắc, Tây Nguyên.
- Mức độ của từng phần áo: **Giữ / Cân nhắc / Được đổi**.
- Nhãn Compass hiện cho người đọc bằng tiếng Việt: Đúng chuẩn / Cách tân / Lấy cảm hứng (trong dữ liệu vẫn là Authentic / Adapted / Inspired).
- Không “look”: dùng “bộ phối”, “bộ này”.
- Tháng: chữ cho âm lịch (“Rằm tháng Tám âm lịch”, “tháng Chạp”), số cho dương lịch (“tháng 9 đến tháng 12”). Ngày không đệm số 0: 1/7/2025.
- Mỗi thứ một tên (#114): **Sổ của Bà** (cuốn sổ của Bà, không “sổ tay của Bà”, “nhật ký của Bà”; “nhật ký” chỉ là từng trang Bà viết), **Tủ áo của Bà** (không “phòng thử đồ”), **Du Ký** (sổ của con), **Trang đã mặc** / **Chuẩn bị đi sự kiện** (hai loại trang Du Ký), **Tèo chấm** (Compass, không để chữ “Compass” cho người đọc thấy), tem **Đã đến · Đã hiểu · Đã mặc** gọi theo chương (Huế, Bắc Ninh, Cần Thơ), không theo vùng.
- **Việt Phục Du Ký** viết hoa là tên sản phẩm; **Việt phục** là danh từ chung.
- Giữ “link”, “email” (người đọc trẻ quen hơn “liên kết”, “thư điện tử”); không viết “đường link”.

`check_content` báo lỗi khi gặp kiểu bỏ dấu cũ, “??” hay ngoặc kép thẳng trong chữ hiển thị.
