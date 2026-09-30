# Bốn chương tiếp theo – kịch bản và trò chơi

> **Đã đưa vào sổ (01/10):** nội dung ở `backend/content/regions/{bac-bo,nam-bo,tay-bac,tay-nguyen}.json`, trò chơi ở `frontend/src/components/book/Games.tsx`, prompt tranh ở `ART_PROMPTS.md` mục 14. Khác với bản thảo: Kinh Bắc là **quê Bà** (theo nội dung đã có), nên Bà 18 tuổi đi hội với chị họ; bỏ trò thắt khăn mỏ quạ và trò nhận tiếng đàn (cần âm thanh có giấy phép); Sơn La và Đắk Lắk là **bản nháp** (`status: draft`), chỉ đọc được ở `?draft=1` hoặc máy dev.

> Viết theo khuôn chương Huế (`HUE_CHAPTER.md`): mỗi điểm dừng là một trang đôi, trái là **Bà** (ký ức, tranh minh họa), phải là **Hôm nay** (Tí đi lại, ảnh thật có giấy phép).
> **Mỗi chương có một trò chơi chính riêng**, gắn với chính cách người ở đó làm và mặc, không lặp lại trò nào. Mỗi chương kết bằng **một bưu thiếp**. Đủ 5 bưu thiếp thì mở được **lá thư cuối** của Bà.
> Chi tiết có dấu ⚑ cần tìm nguồn trước khi đánh `verified`.

| Miền | Tỉnh | Chương | Trang phục | Trò chơi chính |
|---|---|---|---|---|
| Miền Trung | Huế | Mùa mưa năm hai mươi tuổi *(đã làm)* | áo ngũ thân, áo dài | Soi nón bài thơ |
| Bắc Bộ | **Bắc Ninh** | Hội xuân bên sông Cầu | áo tứ thân, nón quai thao, khăn mỏ quạ | **In tranh Đông Hồ** + **Hát đối quan họ** |
| Nam Bộ | **Cần Thơ** | Mùa nước nổi | áo bà ba, khăn rằn | **Đoán cây bẹo ở chợ nổi** |
| Tây Bắc | **Sơn La** | Tiếng khèn bên suối | áo cóm, váy, khăn piêu của người Thái ⚑ | **Cài hàng khuy bạc** + **Vòng xòe** |
| Tây Nguyên | **Đắk Lắk** | Đêm cồng chiêng | trang phục thổ cẩm Ê Đê ⚑ | **Đánh cồng theo nhịp** + **Dệt hoa văn** |

---

## Nguyên tắc cho Tây Bắc và Tây Nguyên (đọc trước)

Hai vùng này đang khóa có chủ ý (`lock_note`): trang phục các dân tộc cần **chính cộng đồng cùng viết và thẩm định**. Đề xuất:

- **Bà không tự kể thay người Thái hay người Ê Đê.** Bà chỉ là khách. Kiến thức trong chương đến từ **một người bạn của Bà là người trong cộng đồng**: chị Lò Thị Mai ở Sơn La và anh Y Blăk ở Đắk Lắk (tên hư cấu, cần người trong cộng đồng góp ý cách đặt tên). Bà chép lại lời họ, có ghi "lời chị Mai kể".
- **Mọi mục trang phục, nghi lễ, hoa văn đánh `community_review: true`.** Trên trang thật, những mục này ẩn cho tới khi có người trong cộng đồng duyệt. Bản nháp xem được bằng `?draft=1`.
- **Chưa mở thử đồ AI** cho hai bộ trang phục này. Trang "Mặc" chỉ kể và chỉ phần cần giữ; nút thử đồ để "đang cùng cộng đồng hoàn thiện".
- Tìm **1 người duyệt cho mỗi chương** (sinh viên hoặc thầy cô là người Thái hoặc Ê Đê, bảo tàng tỉnh). Ghi tên người duyệt vào nguồn nếu họ đồng ý.

---

## 1. Bắc Bộ · Bắc Ninh: "Hội xuân bên sông Cầu"

**Trang mở miền:** *"Gió đưa cành trúc la đà / Tiếng chuông Trấn Vũ, canh gà Thọ Xương"* (đang có).
**Trang tựa chương:** *"Người ơi người ở đừng về"* ⚑ (câu hát quan họ quen thuộc, chỉ dẫn một câu, không chép cả bài).
**Dòng của Bà:** "Ở Kinh Bắc, người ta không nói 'tạm biệt', người ta hát."

**Sợi chỉ đỏ:** Bà mười tám tuổi, trước chuyến đi Huế, theo cô bạn thân người Bắc Ninh về ăn hội Lim. Bà được cho mượn bộ áo tứ thân, và **bị một liền anh hát đối mà Bà không biết đáp**. Cả chương là hành trình Bà học đáp câu hát ấy.

| # | Điểm dừng | Giờ | Bà (ký ức) | Hôm nay (Tí) | Tương tác |
|---|---|---|---|---|---|
| 1 | Bến sông Cầu | sáng sớm | Sương trên sông, thuyền đưa khách sang hội; cô bạn buộc cho Bà chiếc khăn mỏ quạ | Ảnh sông Cầu; mẹo đi hội Lim | **Thắt khăn mỏ quạ**: kéo 3 bước gấp khăn, sai thì khăn tuột ra |
| 2 | Làng tranh Đông Hồ | buổi sáng | Bà xem nghệ nhân in tranh "Đám cưới chuột", tay dính màu đỏ sỏi son | Ảnh làng tranh; giấy dó quét vỏ điệp | **In tranh Đông Hồ** (trò chính) |
| 3 | Hội Lim, đồi Lim | trưa | Mặc áo tứ thân mượn: yếm đào, thắt lưng xanh, nón quai thao. Liền anh hát, Bà đứng đờ người | Ảnh hội Lim; không khí hát trên thuyền | **Hát đối quan họ** (trò chính) |
| 4 | Nhà chứa quan họ | chiều | Liền chị dạy Bà "ăn trầu, hát canh", lối "vang, rền, nền, nảy" ⚑ | Ảnh nhà chứa; nghe một làn điệu | Nghe và chọn đoạn "vang" với đoạn "nảy" |
| 5 | Chia tay bên cổng làng | tối | Bà hát được câu đáp. Liền anh cười, hát "Người ơi người ở đừng về" | Hôm nay: Tí thử hát, cả nhóm cười | Nhận **bưu thiếp Bắc Ninh** |

**Trò chính 1: In tranh Đông Hồ** (điểm 2)
- Tờ giấy dó trắng. Người đọc chọn **4 bản khắc màu theo đúng thứ tự** rồi "ấn" từng bản: màu nhạt trước, **nét đen sau cùng** ⚑.
- Màu lấy từ thiên nhiên: đỏ từ sỏi son, vàng hoa hòe, xanh lá chàm, đen than lá tre ⚑, trắng vỏ điệp.
- In sai thứ tự thì màu đè lem. Tèo giải thích vì sao phải in nét đen cuối.
- Xong thì tờ tranh "Đám cưới chuột" (vẽ lại bằng SVG, không dùng tranh gốc) bay vào sổ làm kỷ vật.

**Trò chính 2: Hát đối quan họ** (điểm 3)
- Liền anh hát một câu (chữ hiện dần theo nhịp; có giọng đọc nếu bật voice). Người đọc chọn **câu đáp đúng lề lối** trong 3 câu: phải đáp **cùng giọng, cùng ý**, không được đáp lạc giọng.
- 3 lượt, mỗi lượt đúng thì chiếc nón quai thao gật nhẹ.
- Học được: quan họ là hát đối đáp giữa hai bên nam nữ, không phải hát đơn ⚑.

**Mặc:** áo tứ thân (đang có trang). Thêm phần **"liền anh, liền chị mặc gì"**: liền anh áo the, khăn xếp, ô đen; liền chị áo mớ ba mớ bảy, yếm, khăn mỏ quạ, nón quai thao ⚑.

**Lễ hội:** Hội Lim (13 tháng Giêng âm lịch ⚑) · Hội làng tranh Đông Hồ ⚑ · Hội đền Đô (15 tháng Ba âm lịch ⚑).

**Bà hỏi con:**
- Trước khi đọc: "Vì sao áo tứ thân có thắt lưng buộc ra ngoài?"
- Sau khi đọc (3 câu): quan họ là hát một mình hay hát đối? · Trong tranh Đông Hồ, màu nào in sau cùng? · Nón quai thao khác nón lá ở chỗ nào?

**Bưu thiếp:** *"Con à, câu đáp năm ấy Bà hát lạc mất một chữ, mà cả hội vẫn vỗ tay. Người Kinh Bắc thương người biết đáp lời, chứ không cần hát hay."*

**Ảnh thật cần tìm:** sông Cầu, làng Đông Hồ, hội Lim, nhà chứa quan họ.
**Tranh minh họa:** bến sông, nghệ nhân in tranh, Bà mặc áo tứ thân trên đồi Lim, chia tay ở cổng làng.

---

## 2. Nam Bộ · Cần Thơ: "Mùa nước nổi"

**Trang tựa:** *"Cần Thơ gạo trắng nước trong / Ai đi đến đó lòng không muốn về"* ⚑ (ca dao).
**Dòng của Bà:** "Ở miền Tây, nước lên thì người ta không sợ, người ta đi chợ."

**Sợi chỉ đỏ:** Sau khi ở lại Huế nhiều năm, Bà và Ông đi thăm người em họ của Ông ở Cần Thơ. Bà được **một bà cụ trên ghe dạy mặc áo bà ba cho gọn**, rồi chính Bà may lại chiếc áo ấy cho mẹ chồng.

| # | Điểm dừng | Giờ | Bà | Hôm nay | Tương tác |
|---|---|---|---|---|---|
| 1 | Bến Ninh Kiều | chiều tối | Gió sông, đèn chợ đêm, lần đầu nghe giọng miền Tây gọi "bà con ơi" | Ảnh bến Ninh Kiều | |
| 2 | Chợ nổi Cái Răng | rạng sáng | Ghe nào cũng treo một cây sào, không ai rao | Ảnh chợ nổi | **Đoán cây bẹo** (trò chính) |
| 3 | Trên ghe bà cụ | buổi sáng | Bà cụ chỉ Bà: áo bà ba xẻ tà, không cổ, dễ cúi dễ chèo; khăn rằn quàng cổ, chít đầu hay che nắng | Mẹo mặc bà ba đi tour sông nước | **Xếp đồ đi ghe** |
| 4 | Vườn trái cây, mùa nước nổi | trưa | Nước lên tận gốc cây, người ta bơi xuồng đi hái | Ảnh vườn, mùa nước nổi (tháng 8–11 ⚑) | |
| 5 | Đêm đờn ca tài tử | tối | Ông em họ đờn kìm, cô hàng xóm ca vọng cổ; Bà nghe mà khóc | Ảnh đờn ca tài tử | **Nhận tiếng đàn** |
| 6 | Chia tay | sáng | Bà may lại chiếc áo bà ba, gửi về Huế | | Nhận **bưu thiếp Cần Thơ** |

**Trò chính: Đoán cây bẹo** (điểm 2)
- Mặt sông có 6 chiếc ghe. Mỗi ghe treo một món lên cây sào ("cây bẹo"): trái khóm, bí đao, khoai lang, chùm chôm chôm… Người đọc kéo biển "ghe này bán gì?" vào đúng ghe.
- Có một **ghe treo cái áo** ⚑ (ghe bán luôn cả ghe). Đây là câu đố vui cuối, Tèo giải thích.
- Đúng hết thì ghe bà cụ ghé lại, mở ra điểm 3.

**Trò phụ:**
- **Xếp đồ đi ghe:** chọn 4 món cho một ngày trên sông trong 8 món. Đúng là áo bà ba, khăn rằn, nón lá, dép. Sai là áo dài tà dài, giày cao gót… mỗi món sai có một câu giải thích vui của Tí.
- **Nhận tiếng đàn:** nghe 3 tiếng (đàn kìm, đàn tranh, song lang) và nối với hình. Cần file âm thanh có giấy phép ⚑; nếu không có thì bỏ trò này.

**Mặc:** áo bà ba (đang có). Thêm **"khăn rằn quấn 3 kiểu"**: vắt vai, chít đầu, che mặt khi nắng.

**Lễ hội:** Chợ nổi quanh năm · Lễ hội bánh dân gian Nam Bộ ⚑ · Đờn ca tài tử (UNESCO 2013 ⚑).

**Bà hỏi con:**
- Trước khi đọc: "Vì sao áo bà ba lại ngắn và xẻ tà?"
- Sau khi đọc: cây bẹo dùng để làm gì? · Khăn rằn có mấy cách dùng? · Mùa nước nổi thường vào những tháng nào?

**Bưu thiếp:** *"Con à, bà cụ trên ghe bảo: áo đẹp là áo làm được việc. Bà mặc bà ba đi chợ nổi, thấy mình như người ở đó từ lâu."*

---

## 3. Tây Bắc · Sơn La: "Tiếng khèn bên suối" (`community_review`)

**Trang tựa:** một câu dân ca Thái, lấy qua người trong cộng đồng ⚑. Chưa có thì dùng dòng của Bà.
**Dòng của Bà:** "Bà chưa từng đến Tây Bắc. Những trang này là lời chị Mai kể, Bà chỉ chép lại."

**Sợi chỉ đỏ:** Chị Mai, người Thái ở Sơn La, học may cùng xưởng với Bà ngày trẻ. Chị hay thêu **khăn piêu** trong giờ nghỉ, và hứa một ngày sẽ đưa Bà về bản. Bà không kịp đi. Nay Tí mang cuốn sổ lên Sơn La, **tìm con gái chị Mai** và trao lại lá thư Bà chưa gửi.

| # | Điểm dừng | Bà (lời chị Mai) | Hôm nay (Tí đi thật) | Tương tác |
|---|---|---|---|---|
| 1 | Đèo, sương sớm | Thư chị Mai tả đường về bản | Ảnh ruộng bậc thang, sương | |
| 2 | Nhà sàn bên suối | Chị kể phụ nữ Thái mặc áo cóm ngắn bó, hàng khuy bạc ⚑ | Tí gặp con gái chị Mai | **Cài hàng khuy bạc** (trò chính) |
| 3 | Khung thêu khăn piêu | Chị thêu khăn piêu làm quà; hoa văn ở góc khăn ⚑ | Ảnh khăn piêu (xin phép nghệ nhân) | **Thêu góc khăn** |
| 4 | Đêm xòe | "Không có xòe thì ngô không ra bắp" ⚑ | Tí được kéo vào vòng xòe | **Vòng xòe** (trò chính) |
| 5 | Trao thư | | Con gái chị Mai đọc lá thư Bà | Nhận **bưu thiếp Sơn La** (do con gái chị Mai gửi Bà) |

**Trò chính 1: Cài hàng khuy bạc**
- Áo cóm vẽ phẳng, hàng khuy để trống. Người đọc kéo từng đôi khuy bạc (hình bướm, ve, nhện… ⚑ **cần người trong cộng đồng xác nhận**) vào đúng chỗ, cài từ trên xuống.
- Cài xong, áo "khép" lại và bóng lên ánh bạc.
- Tèo và con gái chị Mai kể ý nghĩa, chỉ khi đã được duyệt.

**Trò chính 2: Vòng xòe**
- Vòng người nắm tay quanh đống lửa, nhịp trống đều. Người đọc chạm đúng nhịp để bước theo (một trò nhịp điệu đơn giản, 20 giây).
- Đủ nhịp thì vòng mở ra, một người trong vòng chìa tay mời Tí vào.
- Học được: nghệ thuật Xòe Thái được UNESCO ghi danh (2021 ⚑).

**Trò phụ: Thêu góc khăn** (nối điểm theo mẫu). Chỉ dùng mẫu được cộng đồng cho phép công bố.

**Bà hỏi con:** chỉ có sau khi được duyệt.

**Bưu thiếp (lời con gái chị Mai):** *"Cháu chào bà. Mẹ cháu vẫn giữ tấm ảnh hai người ở xưởng may. Lá thư bà gửi, cháu đọc cho mẹ nghe bên bếp lửa. Khi nào bà lên, bản cháu vẫn đợi."*

---

## 4. Tây Nguyên · Đắk Lắk: "Đêm cồng chiêng" (`community_review`)

**Trang tựa:** một câu trong sử thi hoặc lời nói của người Ê Đê, lấy qua người trong cộng đồng ⚑.
**Dòng của Bà:** "Ông con từng làm việc ở Buôn Ma Thuột. Ông kể nhiều nhất về một đêm cồng chiêng."

**Sợi chỉ đỏ:** Ông thời trẻ làm ở Buôn Ma Thuột, ở nhờ nhà dài của gia đình anh Y Blăk. Trước khi về, **Ông được tặng một tấm thổ cẩm**, mà Bà đến giờ vẫn chưa biết hoa văn trên đó nghĩa là gì. Tí lên Đắk Lắk để hỏi.

| # | Điểm dừng | Ký ức (Ông kể, Bà chép) | Hôm nay | Tương tác |
|---|---|---|---|---|
| 1 | Đồi cà phê, mùa khô | Bụi đỏ, nắng gió cao nguyên | Ảnh đồi cà phê | |
| 2 | Nhà dài | Cầu thang có khắc hình ngực và trăng ⚑; nhà càng dài thì gia đình càng đông ⚑ | Ảnh nhà dài (bảo tàng hoặc buôn du lịch có phép) | **Đếm gian nhà dài** (câu đố) |
| 3 | Khung dệt | Chị nhà dệt thổ cẩm; mỗi dải hoa văn có tên ⚑ | Ảnh dệt thổ cẩm | **Dệt hoa văn** (trò chính) |
| 4 | Đêm cồng chiêng | Cả buôn quây quanh bếp lửa; mỗi chiếc chiêng một âm, không ai đánh một mình ⚑ | Tí nghe cồng chiêng ở lễ hội | **Đánh cồng theo nhịp** (trò chính) |
| 5 | Tấm thổ cẩm | | Nghệ nhân đọc hoa văn trên tấm thổ cẩm của Ông | Nhận **bưu thiếp Đắk Lắk** |

**Trò chính 1: Đánh cồng theo nhịp** (trò nhớ chuỗi)
- 6 chiếc chiêng treo thành hàng, mỗi chiếc một âm. Nghệ nhân đánh một chuỗi ngắn, người đọc đánh lại đúng thứ tự. Mỗi lượt dài thêm một nốt.
- Thông điệp: **không chiếc nào tự làm nên bài**, phải đánh cùng nhau.
- Cần file âm thanh chiêng có giấy phép ⚑; tạm thời dùng âm tổng hợp nghe giống chiêng.
- Học được: Không gian văn hóa Cồng chiêng Tây Nguyên được UNESCO công nhận (2005 ⚑).

**Trò chính 2: Dệt hoa văn**
- Khung dệt có 5 hàng. Người đọc chọn màu sợi cho mỗi hàng theo "lời kể" (ví dụ nền chàm đen, sọc đỏ ⚑). Khi đủ 5 hàng, tấm vải hiện ra và nghệ nhân nói tên dải hoa văn.
- **Chỉ dùng hoa văn và ý nghĩa đã được cộng đồng duyệt.**

**Trò phụ: Đếm gian nhà dài.** Câu đố hình: đếm số bếp lửa để đoán số gia đình trong nhà ⚑.

**Bưu thiếp (lời anh Y Blăk viết cho Ông):** *"Chiêng nhà mình vẫn đánh mỗi mùa lúa mới. Tấm vải ấy, hoa văn giữa là con đường về buôn."* ⚑ (ý nghĩa hoa văn phải do cộng đồng xác nhận).

---

## 5. Tem và bưu thiếp (dùng chung cho mọi chương)

- **Mỗi điểm dừng một con tem riêng** (hình minh họa nhỏ, ví dụ "Ga Huế", "Chợ nổi"). Tem đóng lên trang Bà khi người đọc lật tới điểm đó. Trong tủ tem, mỗi chương là một hàng tem.
- **Mỗi chương một bưu thiếp** ở phong thư cuối chương. Trong Du Ký có **"Hộp thư của Bà"**: bấm một bưu thiếp thì nó bay ra khỏi phong bì, lật mặt, và **lời Bà tự viết lại từng chữ bằng mực** như đang viết. Có thể bật giọng Bà đọc khi đã có voice.
- **Đủ 5 bưu thiếp:** mở **lá thư cuối** của Bà. Bà kể vì sao để trống những trang cuối, và mời con viết chương của riêng mình (nối sang Du Ký và mục "Viết một chương").

## 6. Thứ tự làm đề xuất (trước feature freeze 7/10)
1. **Hộp thư của Bà + hiệu ứng đọc lại thư** (làm ngay, dùng được với bưu thiếp Huế).
2. **Bắc Ninh** và **Cần Thơ**: nội dung đã có nguồn một phần, trò chơi không cần âm thanh. Làm 2 chương này trước.
3. **Sơn La** và **Đắk Lắk**: làm khung trò chơi và bản nháp `community_review`, rồi song song tìm người duyệt. Chưa duyệt thì chưa bật trên web thật.


## Cập nhật 01/10: mở Sơn La và Đắk Lắk

- Hai chương đã **mở cho mọi người đọc**, đầu chương có dòng "đang chờ người ở đó đọc lại và góp ý". Thử đồ AI cho hai bộ trang phục vẫn **khóa** (vùng giữ `status: locked`).
- Nội dung đã rà theo nguồn (thêm vào `sources.json`): UNESCO (Xòe Thái 2021, Cồng chiêng 2005/2008), Heritage – Vietnam Airlines (áo cóm, cúc bạc số lẻ, cổ áo Thái Đen/Thái Trắng, váy xỉn, tằng cẩu), Báo Lào Cai (khăn piêu), Báo Văn Hóa (Xên lẩu nó, Tết Xíp xí, thổ cẩm Ê Đê), Nhân Dân (thổ cẩm, kpin, kteh), Tuổi Trẻ (cầu thang nhà dài, bài của TS. Hồ Tường), VnBusiness (lễ cúng bến nước), LSVN (Lễ hội Cà phê Buôn Ma Thuột 2025).
- **Sửa theo nguồn:** chi tiết "cầu thang có hình bầu ngực và trăng" chỉ đúng với cầu thang tấm ván của nhà khá giả; cầu thang chính là một thân cây có số nấc lẻ. Bỏ câu "Lễ hội cà phê hai năm một lần" (chưa xác nhận được). Bỏ mô tả "áo nữ màu trắng" (của người Mạ, không phải Ê Đê).
- **Thêm:** trang phục `ao-com`, `tho-cam-e-de`; trang Mặc; "Bà hỏi con" (4 câu mỗi chương, đều có nguồn); điểm dừng Lễ hội (Xên lẩu nó, Tết Xíp xí; lễ cúng bến nước, Lễ hội Cà phê); 8 thuật ngữ cho Tèo; trò cài cúc bạc giờ có 7 cúc (số lẻ) và trò dệt dùng đúng ý nghĩa màu.
- **Vẫn cần người trong cộng đồng đọc:** tên gọi, lời kể của chị Mai và anh Y Blăk (nhân vật hư cấu), ý nghĩa từng dải hoa văn.
