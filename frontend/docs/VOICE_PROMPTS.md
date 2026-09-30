# Prompt giọng đọc – Opening

*Sinh tự động từ `backend/content/voices.json` và `backend/content/opening.json`. Model: `gemini-3.8-flash-tts`. 6 giọng, 36 câu.*

## 1. Quy trình

1. Mở **Google AI Studio → Generate speech** (aistudio.google.com/generate-speech), chọn model **gemini-3.8-flash-tts**, rồi mở phần **tạo giọng từ mô tả** (voice design).
2. Dán nguyên văn **prompt thiết kế giọng** của nhân vật (mục 3) vào ô mô tả giọng.
3. Dán **câu thử** của nhân vật vào ô văn bản, bấm tạo, nghe. Tạo 3–4 lần, nghe cả 4 bản, giữ bản ưng nhất.
4. Khi đã ưng, **lưu giọng** để có mã dạng `voice_…` (mã lưu dạng stateful dùng được 1 năm).
5. Dán mã vào trường `voice_id` của nhân vật đó trong `backend/content/voices.json`.
6. Làm đủ 6 giọng, rồi chạy `python -m scripts.generate_voices --audition` để nghe lại 6 câu thử bằng đúng mã vừa lưu (file ở `frontend/public/opening/voice/_audition/`, không đưa lên git).
7. Ổn thì chạy `python -m scripts.generate_voices` để tạo 36 câu. Câu nào đọc chưa hay: sửa `delivery` (hoặc thêm `say`) trong `opening.json`, rồi chạy lại riêng screen đó với `--screen s05 --force`.
8. Chạy `python -m scripts.check_content`: không còn cảnh báo "no voice-over yet" là đủ.

## 2. Sáu giọng

| Mã | Nhân vật | Là ai | Giọng dự phòng |
| --- | --- | --- | --- |
| `narrator` | Người dẫn truyện | Nam ~40 tuổi, trầm ấm, kể chậm như phim tài liệu gia đình. Đọc toàn bộ phần dẫn truyện trước cuốn sách. | Charon |
| `co-giao` | Cô giáo | Nữ ~28 tuổi, tươi, rõ, đang giới thiệu dự án cho cả lớp. Chỉ đọc 3 câu ở S01. | Zephyr |
| `ti` | Tí | Nam ~13 tuổi, chưa vỡ giọng hẳn; nhanh, hào hứng, hơi "chảnh", chùng xuống khi lúng túng. | Puck |
| `teo` | Tèo | Nam ~13 tuổi, đeo kính; chậm hơn, điềm tĩnh, hay hỏi, hơi hóm. | Iapetus |
| `ti-nho` | Tí lúc bé | Bé trai ~6 tuổi, trong trẻo, rụt rè, tò mò. Nếu nghe giả, dùng giọng Tí và cách đọc "lighter, younger". | Leda |
| `ba` | Bà | Nữ ~75 tuổi, người Kinh Bắc; ấm, chậm, hơi khàn vì tuổi nhưng vẫn rõ. Đọc S05, S06, S09, S10. | Sulafat |

## 3. Prompt thiết kế giọng (dán vào AI Studio)

### Người dẫn truyện (`narrator`)

**Prompt thiết kế giọng:**

```
A Vietnamese man in his early forties, native speaker with a standard Northern Vietnamese (Hà Nội) accent. A warm, deep baritone with a soft, slightly breathy texture, like the narrator of a gentle documentary or a family film. He speaks unhurriedly and clearly, with natural pauses between phrases, and a faint smile in his voice. Calm, trustworthy, a little nostalgic, never theatrical or announcer-like. Close, intimate microphone, quiet room, no music, no reverb.
```

**Câu thử:**

```
Chiều hôm đó, Tí và Tèo quay lại căn nhà cũ của bà. Mọi thứ dường như vẫn còn ở nguyên vị trí.
```

### Cô giáo (`co-giao`)

**Prompt thiết kế giọng:**

```
A Vietnamese woman about 28 years old, a friendly secondary-school teacher, native speaker with a standard Northern Vietnamese (Hà Nội) accent. Bright, clear and lively mid-range voice, speaking to a whole class with gentle enthusiasm, as if announcing an exciting school project. Well-articulated, energetic but kind, smiling. Recorded as if in a quiet classroom, no echo, no background noise.
```

**Câu thử:**

```
Năm nay, mỗi đội sẽ lựa chọn một vùng văn hóa Việt Nam, tìm hiểu một loại trang phục truyền thống.
```

### Tí (`ti`)

**Prompt thiết kế giọng:**

```
A Vietnamese boy about 13 years old, a secondary-school student, native speaker with a Northern Vietnamese (Hà Nội) accent. His voice has not fully broken yet: light, youthful, slightly higher than an adult man. Quick, playful and full of energy, a bit cheeky and overconfident, but his voice drops and turns hesitant when he is unsure. Natural everyday speech, not a cartoon voice. Clean recording, no background noise.
```

**Câu thử:**

```
Áo dài thôi. Quá dễ! … Ơ, nhưng mà… bộ này của vùng nào nhỉ?
```

### Tèo (`teo`)

**Prompt thiết kế giọng:**

```
A Vietnamese boy about 13 years old, Tí's best friend, a thoughtful student who wears glasses, native speaker with a Northern Vietnamese (Hà Nội) accent. Young teen voice, a little lower and softer than an excited kid. He speaks more slowly and calmly, curious and polite, asking questions that make others think, with a gentle, slightly amused tone. Natural, not a cartoon voice. Clean recording, no background noise.
```

**Câu thử:**

```
Tại sao lại là áo dài? Còn gì nữa không?
```

### Tí lúc bé (`ti-nho`)

**Prompt thiết kế giọng:**

```
A small Vietnamese boy about 6 years old, native speaker with a Northern Vietnamese (Hà Nội) accent. A small, high, clear child's voice, innocent and curious, speaking softly to his grandmother in a memory. Slightly slow, a little shy, with the natural rhythm of a real young child, not an adult imitating a child and not a cartoon. Soft, warm recording, no background noise.
```

**Câu thử:**

```
Bà ơi… Cái này có phải áo dài không?
```

### Bà (`ba`)

**Prompt thiết kế giọng:**

```
An elderly Vietnamese woman about 75 years old, a grandmother and retired seamstress from the Kinh Bắc region, native speaker with a soft Northern Vietnamese (Hà Nội / Bắc Ninh) accent. Warm, gentle and loving, with a slightly husky, aged texture but still clear. She speaks slowly and tenderly, as if talking to her grandchild beside her, with a quiet smile and a touch of nostalgia; wise, never preachy. Intimate close microphone, quiet room, no music, no reverb.
```

**Câu thử:**

```
Không phải cái gì dài dài cũng là áo dài đâu con. Hành trình của con bắt đầu từ đây.
```

## 4. Từng câu trong Opening

| File | Giọng | Lời đọc | Cách đọc (`delivery`) |
| --- | --- | --- | --- |
| s01-00.mp3 | Cô giáo | Năm nay, mỗi đội sẽ lựa chọn một vùng văn hóa Việt Nam… | Bright and enthusiastic, announcing a new school project to the whole class. |
| s01-01.mp3 | Cô giáo | Tìm hiểu một loại trang phục truyền thống… | Continuing the announcement, clear and encouraging, a small pause at the ellipsis. |
| s01-02.mp3 | Cô giáo | Và đề xuất cách để người trẻ có thể mặc nó hôm nay. | Warm and inspiring, finishing the announcement with a smile. |
| s01-03.mp3 | Tí | Áo dài thôi. Quá dễ! | Instantly, cocky and overconfident, a little show-off, quick. |
| s02-00.mp3 | Tèo | Tại sao lại là áo dài? | Calm and curious, a genuine question, slightly amused. |
| s02-01.mp3 | Tí | Vì… đẹp? | Caught off guard: hesitate at the ellipsis, then say "đẹp" as an unsure guess. |
| s02-02.mp3 | Tèo | Còn gì nữa? | Gently pushing further, patient, curious. |
| s02-03.mp3 | Tí | …rất Việt Nam? | Unsure and trailing, almost to himself, questioning intonation. |
| s03-00.mp3 | Người dẫn truyện | Chỉ sau một lúc, hàng loạt cái tên xuất hiện… | Rising wonder, as a flood of new names appears on a screen. |
| s03-01.mp3 | Người dẫn truyện | Áo tứ thân. | Say only the name, clearly, like reading a label; slight wonder. |
| s03-02.mp3 | Người dẫn truyện | Áo ngũ thân. | Say only the name, clearly, a beat faster. |
| s03-03.mp3 | Người dẫn truyện | Nhật Bình. | Say only the name, clearly, a beat faster. |
| s03-04.mp3 | Người dẫn truyện | Áo bà ba… | Say only the name, trailing off as the list keeps going. |
| s03-05.mp3 | Tèo | Bộ này của vùng nào? | Pointing at the screen, curious and a little teasing. |
| s03-06.mp3 | Tí | …không biết. | Small and embarrassed, quiet admission after a pause. |
| s04-00.mp3 | Người dẫn truyện | Rồi Tí bất chợt im lặng. | Quieter, slower, the mood suddenly turns still. |
| s04-01.mp3 | Người dẫn truyện | Một chiếc áo dài màu xanh thiên thanh xuất hiện trên màn hình. | Soft and tender, almost a whisper of memory. |
| s04-02.mp3 | Người dẫn truyện | Cậu nhớ đến bà. | Very soft and slow, full of feeling, a gentle pause before "bà". |
| s05-00.mp3 | Tí lúc bé | Bà ơi… | A small child calling his grandmother softly, curious. |
| s05-01.mp3 | Tí lúc bé | Cái này có phải áo dài không? | Innocent question, pointing at a long garment, wide-eyed. |
| s05-02.mp3 | Bà | Không phải cái gì dài dài cũng là áo dài đâu con. | Tender and amused, gently correcting her little grandchild with a smile. |
| s06-00.mp3 | Tí | Sao bà giữ bộ này kỹ vậy? | Soft and curious, a child who noticed something special. |
| s06-01.mp3 | Bà | Vì nó là bộ bà trân trọng nhất. | Slow, warm, a little emotional, a quiet smile. |
| s06-02.mp3 | Người dẫn truyện | Có những bộ quần áo không chỉ để mặc. | Reflective and slow, letting the idea sink in. |
| s06-03.mp3 | Người dẫn truyện | Chúng còn để nhớ. | Very soft, almost whispered, heartfelt; the last word lingers. |
| s07-00.mp3 | Người dẫn truyện | Chiều hôm đó, Tí và Tèo quay lại căn nhà cũ của bà. | Calm storytelling, a new chapter beginning, gentle. |
| s07-01.mp3 | Người dẫn truyện | Mọi thứ dường như vẫn còn ở nguyên vị trí. | Hushed, looking around an old quiet house. |
| s07-02.mp3 | Người dẫn truyện | Và dưới chiếc áo màu xanh… | Building suspense, slow, trailing off at the ellipsis. |
| s08-02.mp3 | Người dẫn truyện | Cuốn sổ bà vẫn để trên bàn may ngày trước. | Soft and reverent, like finding a treasure. |
| s09-00.mp3 | Bà | Bà bắt đầu học may vì muốn làm ra những bộ quần áo đẹp. | Reading her own old diary aloud, warm and nostalgic. |
| s09-01.mp3 | Bà | Sau này bà mới hiểu… đẹp chỉ là một phần rất nhỏ. | Thoughtful, a real pause at the ellipsis, wise and gentle. |
| s09-02.mp3 | Bà | Bà đã đi qua một phần của hành trình này. | Peaceful, accepting, slow. |
| s09-03.mp3 | Bà | Phần còn lại… có lẽ sẽ dành cho người khác. | Hopeful and tender, a pause at the ellipsis, as if looking at the listener. |
| s09-04.mp3 | Bà | Nếu là con, con sẽ mặc câu chuyện này như thế nào? | Speaking directly to the listener as her grandchild, a warm, open question. |
| s10-00.mp3 | Bà | Hành trình của bà đã kết thúc. | Serene and gentle, saying goodbye with a smile. |
| s10-01.mp3 | Bà | Hành trình của con bắt đầu từ đây. | Warm, clear and encouraging, a blessing to the listener; slightly stronger. |

## 5. Mẹo

- **Chưa có mã giọng vẫn chạy được:** script dùng giọng dựng sẵn ở trường `fallback` (Charon, Zephyr…), đủ để nghe thử nhịp trước.
- **Chỉnh cảm xúc một câu:** sửa `delivery` (tiếng Anh ngắn, ví dụ "very soft, almost whispered"). Thêm khoảng lặng bằng dấu "…" hoặc thẻ `<short pause>` trong `say`.
- **Chữ trên màn hình khác lời đọc:** thêm `say`, chữ hiển thị giữ nguyên `text`.
- **Giọng vùng miền:** prompt đã ghi giọng Bắc (Hà Nội). Nếu model đọc lẫn giọng khác, thêm câu "Strictly Northern Vietnamese pronunciation, never Southern" vào prompt thiết kế rồi tạo lại.
- **Tí lúc bé:** giọng trẻ em hay bị giả. Nếu nghe không tự nhiên, xóa `voice_id` của `ti-nho` và đặt `fallback` là mã giọng của Tí; trong `opening.json` ghi delivery "lighter, higher and younger, like a small child".
- **Minh bạch:** màn chọn đầu opening ghi "Giọng đọc được tạo bằng Gemini TTS". Lưu cả prompt lẫn bản đã chọn vào tab Tổng hợp Prompt để làm bằng chứng cho Form 7.
