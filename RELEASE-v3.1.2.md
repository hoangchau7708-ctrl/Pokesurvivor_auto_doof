# 3.1.2 — Sửa tính chính xác của build

- Dữ liệu SurvivorTiers của Xurkitree đã đúng; lỗi nằm ở bước áp dụng danh sách chiêu đọc từ game.
- Gắn danh sách chiêu/TM đúng Pokémon. Không lấy dữ liệu của Pokémon trước đó khi đổi lựa chọn.
- Chỉ giới hạn build khi đã đối chiếu đúng Pokémon và đọc được danh sách chiêu; không tự chèn Tackle/Quick Attack hay buff bất kỳ cho đủ bốn ô.
- Hiển thị nguồn, ngày snapshot, trạng thái đối chiếu và chiêu bị thiếu so với build tham khảo.
- TM chỉ được xét từ dữ liệu TM đã đọc; danh sách chiêu Solo không còn tự biến thành kho TM.
- Giữ snapshot SurvivorTiers 2026-10-25; đây là build tham khảo, không cam kết tối ưu cho mọi phiên bản Doofcraft hoặc tài nguyên/giờ.

Cài desktop: giải nén ZIP, chọn thư mục chứa manifest.json trong Load unpacked; tắt bản cũ rồi tải lại game.
Mobile: cập nhật userscript lên 3.1.2 và tải lại game. Có nút H để mở bảng/chẩn đoán khởi động. Chưa kiểm chứng trên Android thật.
