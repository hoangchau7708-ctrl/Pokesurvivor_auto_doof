# Sự kiện · 3.0.0

Đối chiếu dữ liệu và bộ vẽ công khai của Doofcraft ngày 26/10/2026. Tool chỉ quan sát canvas/DOM hiển thị; không đọc trạng thái trận ẩn hoặc gọi API game.

| Sự kiện | Dấu hiệu | Cách tương tác gốc | Cách xử lý |
| --- | --- | --- | --- |
| Trick-or-treat | HUD cam, dấu ?, vòng cam | Trong bán kính 44 + bán kính người chơi, giữ khoảng 1 giây | Theo HUD rồi dấu thế giới, giữ vị trí, chờ dấu mất/đổi trạng thái |
| Free the caged Pokémon | HUD nhiệm vụ + lồng có sprite NPC + vòng xanh | Trong 56 + bán kính người chơi, khoảng 6 giây | Loại NPC khỏi mục tiêu địch, đứng mở; ưu tiên né đòn khi cần |
| Light the lanterns | HUD + đèn chưa sáng + vòng vàng | Trong 48 + bán kính người chơi, khoảng 1,5 giây | Đi tới từng đèn chưa thắp, chờ hình vẽ game đổi |
| Escort the lost Pokémon | NPC có quầng xanh, ! khi chờ; đích vòng xanh nét đứt; HUD xanh | Chạm NPC rồi dẫn về; NPC có thể bị quái đánh, nhiệm vụ hết hạn | Tiếp cận, dẫn, quay lại khi NPC cách hơn 100 đơn vị, đứng chờ vào đích |

Khoảng thời gian là quy tắc của game đã đối chiếu, không được dùng để tự tuyên bố hoàn thành. Nếu không thấy tiến độ trong thời gian chờ dài, tạm bỏ mục tiêu để tránh kẹt. Hộ tống dùng nhận diện hình vẽ, có thể mất dấu khi sprite bị che hoặc không tải; không đoán NPC đã được cứu. Rift vẫn đứng trước các nhiệm vụ trong hồ sơ farm có bật theo cổng. Cấu hình di chuyển mẫu không làm nhiệm vụ; cần chế độ Thích ứng.

Kẹo candy-corn, gem, vé và bí ngô lấy dấu nhận diện từ hình vẽ công khai; ticket25 được nhận diện ở icon khi có nhưng chưa thấy bộ vẽ pickup ticket25 riêng trong bản Doofcraft đã đọc. Không coi icon ngôi sao không rõ loại là tài nguyên. Đếm phiên vẫn dựa vào phần thưởng đã xác nhận cuối lượt.

Thẻ: Revive dự trữ, 45 biến hình/Mega, 18 plate theo hệ, 4 bậc rarity của buff; rương Waves và khóa Choice Band có chính sách riêng. Tăng ưu tiên chữa máu khi HP thấp. Chưa tự dùng hồi sinh, chưa tự chọn/đổi chế độ Waves hay mua vật phẩm. Có thêm 17 chiêu và 10 loài trong danh mục mới; build suy luận chưa có mô phỏng được ghi rõ.

Bản gốc dùng chung cải thiện hộ tống, né nguy hiểm và lựa chọn thẻ khi có tín hiệu tương ứng. Không áp tên nhiệm vụ Halloween của Doofcraft cho một sprite trang trí ở bản gốc.

Đã kiểm tra logic và bộ vẽ công khai/DOM native bằng Chrome headless. Chưa chạy nhiệm vụ trọn vẹn bằng tài khoản thật, chưa đo tỷ lệ hoàn thành hay tài nguyên/giờ, chưa thử điện thoại thật. Cập nhật asset/ngôn ngữ/che khuất của game có thể cần bổ sung nhận diện; hiện ưu tiên nhãn English và một số nhãn Spanish được đối chiếu.
