# 3.5.1 — Sửa dừng ở bảng thưởng cuối vòng

- Nhận diện bảng chọn dựa trên hộp nội dung đang hiện, hỗ trợ lớp bao không có kích thước (display: contents) và nhiều lớp choice tồn tại cùng lúc.
- Xóa lịch sử kẹt/bức tường suy đoán khi xử lý lựa chọn; không cộng dồn các lần kẹt trước bảng thưởng sang sau bảng thưởng.
- Không đọc số Round thành cấp Pokémon; dùng cấp từ HUD khi chọn thưởng cuối vòng.
- Khi tool tự tạm dừng do vật cản nhưng có bảng lựa chọn hiện ra, tự xử lý lựa chọn rồi tiếp tục nếu Tự chọn thẻ đang bật. Không tự tiếp tục khi người dùng bấm tạm dừng, dừng hoặc tiếp quản thủ công.
- Vẫn dừng nếu thật sự không thoát vật cản sau nhiều lần.

Kiểm tra: mô phỏng đúng ba thẻ Hex / Ominous Wind Lv4→5 / Body Slam ở Round 7, tự hồi phục sau cảnh báo kẹt, chọn nâng Ominous Wind và tiếp tục. Kiểm tra tạm dừng thủ công không bị ghi đè và hồi quy các chức năng cũ. Chưa xác minh trực tiếp trên phiên game của người dùng hoặc Android thật.

Cập nhật desktop: tắt bản cũ, giải nén ZIP, Load unpacked thư mục có manifest.json rồi tải lại game. Nếu đang trong trận, chỉ tải lại khi game đã lưu hoặc khi sẵn sàng bắt đầu lượt mới.
