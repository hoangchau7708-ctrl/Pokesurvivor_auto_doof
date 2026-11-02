# 3.6.0 — Tránh vật cản và thoát kẹt

- Mở rộng tìm đường từ tường đa giác sang vật cản dạng tròn và các đạo cụ đã nhận diện. Không tự coi hiệu ứng/đối tượng chưa rõ là tường.
- Nhớ vật cản cứng vừa quan sát trong 1,2 giây, tối đa 512 mục và trong vùng gần; xóa khi đổi đấu trường/dịch chuyển xa để hạn chế dữ liệu cũ.
- Lưới tìm đường 24px, kiểm tra va chạm theo đoạn cách tối đa 6px và xét bán kính nhân vật; tránh cắt góc tường. Chia vùng không gian để giảm số lần kiểm tra hình học.
- Đổi đường ngay khi tập vật cản đổi, giảm tầm dự đoán gần điểm rẽ.
- Khi kẹt, ghi nhận vật cản suy đoán nhỏ trước hướng bị chặn, dùng ngay trong nhịp hiện tại và giữ ưu tiên lùi/né trong 1 giây. Né đạn/chiêu nguy hiểm vẫn ưu tiên hơn hướng thoát kẹt.
- Xóa bộ đếm kẹt liên tiếp khi đã đi xa hơn 35px. Vẫn tạm dừng nếu thực sự không thoát được sau nhiều lần, không ép nhân vật đi xuyên vật cản.

Kiểm tra mô phỏng có va chạm: vật cản tròn, tường mỏng, hai vật cản lệch nhau, ngõ cụt chữ U và mất nhận diện ngắn hạn; giữ Rift làm mục tiêu. Toàn bộ kiểm tra hồi quy đã qua. Chưa đo tỷ lệ kẹt thực chiến, chưa xác minh Android thật; phụ thuộc vật cản game vẽ và tool nhận diện được.
