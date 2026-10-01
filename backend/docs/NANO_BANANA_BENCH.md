# Đo Nano Banana

Chạy lúc 2026-09-29 15:45 bằng `python -m scripts.bench_tryon --runs 8 --burst 4`.
Model `gemini-2.5-flash-image`, timeout 60s, avatar mặc định, ảnh ref: có.

## Gọi lần lượt (8 lần)

- Thành công: 8/8
- Độ trễ (chỉ lần thành công): min 11.5s · trung vị 12.1s · p95 16.8s · max 18.2s

## Gọi cùng lúc (4 lần, tổng 17.7s)

- Thành công: 4/4
- Độ trễ (chỉ lần thành công): min 11.8s · trung vị 13.1s · p95 16.9s · max 17.6s

## Chi tiết

| Kiểu | Trang phục | Thời gian | Kết quả |
|---|---|---|---|
| lần lượt | ao-ba-ba | 12.0s | ok |
| lần lượt | ao-dai | 12.0s | ok |
| lần lượt | ao-ngu-than | 12.0s | ok |
| lần lượt | ao-tu-than | 12.2s | ok |
| lần lượt | ao-ba-ba | 14.3s | ok |
| lần lượt | ao-dai | 11.5s | ok |
| lần lượt | ao-ngu-than | 18.2s | ok |
| lần lượt | ao-tu-than | 13.5s | ok |
| cùng lúc | ao-ba-ba | 11.8s | ok |
| cùng lúc | ao-dai | 13.2s | ok |
| cùng lúc | ao-ngu-than | 12.9s | ok |
| cùng lúc | ao-tu-than | 17.6s | ok |

Quota còn lại không đọc được qua API; xem giới hạn RPM/RPD theo tier ở Google AI Studio → Usage & Billing.
