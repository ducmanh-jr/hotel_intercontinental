# Biên bản kiểm tra bộ sơ đồ

Loại: workflow và sequence. Nội dung tác giả viết bằng tiếng Việt; viewer fallback tiếng Anh.

- Kiểm tra artifact: cả 9 sơ đồ đạt 9/9 showcase, 0 lỗi, 0 cảnh báo.
- Kiểm tra trình duyệt: bốn kích thước 1440×900, 1600×1000, 1920×1080, 2048×1320; ảnh sáng/tối ở hai đầu dải.
- Khả năng đọc chữ: cả 9 đạt. Toàn bộ ảnh chụp được tạo thành công.
- Khả năng nằm gọn màn hình: chỉ sơ đồ 07 đạt đầy đủ. Tám sơ đồ còn lại dài hơn chiều cao viewport và phải cuộn dọc; browser_evidence được giữ là failed, không đổi thành passed.
- Sửa bố cục: workflow 1 vòng; sequence 2 vòng. Không sửa HTML sau khi deliver.
- Kiểm tra cảm quan được ghi riêng trong visual-review.json sau khi xem ảnh; không suy ra từ kiểm tra tự động.

| Sơ đồ | Artifact | Browser evidence | SHA-256 nguồn | SHA-256 HTML |
|---|---|---|---|---|
| 01-tong-quan | 9/9, 0 lỗi/cảnh báo | failed: cuộn dọc | 66232dd1f70fd21f537b50c73896c91b8c641fba3b700576d72ab498f1d1a242 | 5938f687775d2184d71e4c50d08f58c62c866aec7ce5c2ffd7d35052e8c00d91 |
| 02-truy-cap | 9/9, 0 lỗi/cảnh báo | failed: cuộn dọc | 00bfa96ea655a6a6b60c407ce2477757c1c274bdd1137a83d3c87f6ceb325330 | 2deef96f79ba264eafd0a241ad7b29259c8451ae7183e94c587e64a77046ad73 |
| 03-tai-khoan-email | 9/9, 0 lỗi/cảnh báo | failed: cuộn dọc | 8367a74ce66c9df578fa6deb57f4d9f5f906e22cf29c68f4e564a81ecabc73c0 | 258c4348301f4fba531ef6f913eb1104d7da3af6c4bf4d7e294cebf6fa7d9189 |
| 04-tao-booking | 9/9, 0 lỗi/cảnh báo | failed: cuộn dọc | 84d552cd3f19f480579ebc586e96cb9368b5ea04418bfb587938f2f4d48b4eb1 | 06dcaad596a4fe3c456d0e6ead0e2a37f419a74ae4b2285e9497bcb8e5f1959a |
| 05-thanh-toan | 9/9, 0 lỗi/cảnh báo | failed: cuộn dọc | 8751412ed8dc5c9e7e050e4d7abe7a31f3dacc3dd23eafc081a8700f72541b60 | 05eee24b507cf67d24e96f6ced3dbe3383a2d2700c1e4f9d31669a3567e20640 |
| 06-huy-hoan | 9/9, 0 lỗi/cảnh báo | failed: cuộn dọc | 8e3f9172c48a50f863808e06e7d6f639f3a3cc047ccaec8c9ce058ffbb282461 | 79ea824fc4bb17717a070dcd96e3191a72ff7f37ad8404a8cdd3ffe5541cb9d8 |
| 07-van-hanh | 9/9, 0 lỗi/cảnh báo | passed | 3ad7eef4a54a2b5fc1d6a8b8116c87a409de561bf0b52ba7dd1f54f18d9d36ae | a24de2f7d32a3de44ca9f327fc0d4fb83b25e7858203af1f4f5266285b22ceca |
| 08-tai-anh | 9/9, 0 lỗi/cảnh báo | failed: cuộn dọc | 8682241c830674e327e6feaf4369e98bb0c832782c7f4330daa9b63fe079b568 | 81d04ddfd75f56098ea8fec4ed489e07357043a02b0c73073ddd3eb31e6f6143 |
| 09-trien-khai | 9/9, 0 lỗi/cảnh báo | failed: cuộn dọc | 95652817d72c5fcabeca9259beee642f5a147cd8dbad25ed497afb445b44a45b | beac40be244327534811e756657330720d1de46ce7876fbb5d74469efe4fbe55 |
