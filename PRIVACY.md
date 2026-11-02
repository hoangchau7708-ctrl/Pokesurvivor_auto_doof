# Dữ liệu cục bộ

Extension quan sát lệnh vẽ canvas game, văn bản HUD và cửa sổ chọn thẻ để quyết định phím/click. Không đọc mật khẩu, cookie hay token tài khoản; không sửa thông tin tài khoản và không chặn/vá yêu cầu mạng của game.

Cấu hình, trạng thái báo cáo và nhãn nhận diện được lưu trong chrome.storage.local. Nhật ký trong phiên giới hạn 60 dòng. Không có máy chủ telemetry, không tải/chạy mã từ xa; dữ liệu build và dấu nhận diện được đóng gói sẵn. Xóa dữ liệu extension hoặc gỡ extension để xóa cấu hình lưu cục bộ.

Hỗ trợ hai website pokesurvivor.com và pokesurvivor.doofcraft.com. Userscript mobile lưu cấu hình trong localStorage của từng website; cấu hình của hai miền không tự đồng bộ. Không cần cung cấp thông tin đăng nhập cho tool.

## Phiên farm 3.0.0
Mục tiêu, tổng phần thưởng đã xác nhận, token chống đếm trùng và trạng thái hoàn thành được lưu cục bộ theo origin game. Chrome lưu bằng chrome.storage.local; userscript lưu trong localStorage từng website. Có thể xóa tiến độ bằng Đặt lại tiến độ phiên. Thông báo hoàn thành không gửi dữ liệu tới máy chủ ngoài. Native UI clicks có thể dạy một TM sẵn trong túi bản gốc, bật TM đã học và thay chiêu khởi đầu đã mở khóa cho Pokémon đã chọn. Tool không đọc dữ liệu đăng nhập, sửa trực tiếp dữ liệu lưu game hoặc gọi API game.


v3.7.0: power và alarms dùng để giữ thức theo heartbeat của tab farm. Mốc heartbeat lưu cục bộ; không gửi ra máy chủ. Core tự chọn lưu cục bộ trong cấu hình.


v3.8.0: lưu tạm trạng thái autoDiscardable của các tab farm để khôi phục sau khi dừng. Nút tách cửa sổ chỉ di chuyển tab gửi yêu cầu; không đọc nội dung tab công việc khác.
