# 3.2.0 — Chọn chiêu theo tình huống

Bỏ bấm E theo chu kỳ. Game tự đánh bằng ô chiêu đang chọn; tool chọn trực tiếp phím 1–4 khi đã đọc được số ô, icon và tên chiêu đang hoạt động trên HUD.

- Một ô chiêu: giữ nguyên. Không đọc chắc: giữ nguyên, không xoay thử.
- So sánh chiêu sát thương theo quái gần/xa và build; giữ chiêu hiện tại nếu lợi thế đổi không rõ.
- Không tự chuyển sang ô chỉ có buff hoặc ô có chiêu dash/charge/shove khi chưa có mô hình hướng lao/thời gian niệm đáng tin cậy. Bond đã nhận diện đầy đủ có sát thương vẫn được xét.
- Không đổi lúc HP dưới 40%, né đòn, tiếp cận/vào Rift, giữ tương tác hoặc thoát kẹt; tôn trọng Choice Band.
- Giữ chiêu orbit khi còn hữu ích; tránh liên tục làm mất các cầu xoay do chuyển ô.
- Chờ HUD xác nhận ô mới; không bấm liên tiếp. Khoảng nghỉ tối thiểu 4,5 giây; hai lần không xác nhận thì ngừng thử đến khi bố cục chiêu thay đổi hoặc bắt đầu lại.
- Xem Nhật ký để biết lý do chọn ô. Có thể tắt Chọn chiêu theo tình huống trong tab Build để giữ ô bạn chọn tay.

Đã kiểm tra logic, nhận diện HUD bằng icon game ở tỉ lệ 1x/2x và vị trí thanh chiêu thay đổi, cùng luồng controller chọn đúng phím và chờ xác nhận. Chưa có benchmark giảm tử vong/thử trên Android thật. Các ngưỡng là heuristic; không cam kết né được mọi đòn hoặc sử dụng tối ưu mọi chiêu mới.
