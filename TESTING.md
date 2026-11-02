# Kiểm tra 3.1.0

Kế thừa kết quả kiểm tra của 3.0.0; thay đổi 3.1.0 là chính sách mất focus và độ mới frame khi chạy nền. kiểm tra Chrome controller và phiên 2 lượt ở hai game, phần thưởng chưa ghi nhận. Thêm tests/events.test.cjs: phân loại sự kiện/HUD, tọa độ mũi tên, lồng có/không NPC, hold/tiến độ/hoàn thành, ngắt để né đòn, Rift vượt ưu tiên, hộ tống chờ/theo/tụt xa/đến đích, rarity/Mega/Revive/plate, rương Waves và Choice Band.

Kiểm tra phát triển với module công khai ngoài ZIP: bộ vẽ native Doofcraft zoom2 xác nhận cửa/dấu ?/vòng tiến độ, lồng và captive, đèn, bí ngô, HUD nhiệm vụ/counter/phần thưởng, quầng NPC + ! + đích, mũi tên ngoài màn hình và candy-corn/gem/vé; glow nhiệm vụ không thành hazard. Native Choice renderer xác nhận metadata Mega Evolve/Zap Plate/Revive/Legendary Power, tiêu đề rương Chest và Choice Band. Bộ vẽ Events.drawables bản gốc kiểm tra NPC wait/follow và đích xanh. Tiếp tục kiểm tra hazard xanh/beam tím/đạn/thời gian/HP/inventory cũ.

Giới hạn: các test đặt dữ liệu fixture vào bộ vẽ công khai, không phải trận chơi online; animation/sprite trong kiểm tra cũ bản gốc có ảnh giả lập theo metadata. Chưa xác minh nhiệm vụ trọn lượt với tài khoản hoặc trên điện thoại thật.

## Lịch sử kiểm tra

# Kiểm tra 2.7.0

Chạy npm test (Node.js) để kiểm tra lựa chọn nâng cấp/vật phẩm, ưu tiên tài nguyên, ngưỡng vào cổng, giữ rương, tránh nguy hiểm/vật cản, đồng hồ ngừng, kẹt đường, hủy start bất đồng bộ, giới hạn retry, xác nhận thẻ, pause/resume, giới hạn chơi lại và xác thực thông điệp lưu cấu hình.

Chạy npm install rồi npm run test:browser để chạy Chrome headless. Đặt CHROME_PATH nếu Chrome không ở đường dẫn Windows mặc định. Bài kiểm tra chặn URL game và trả trang giả lập, không đăng nhập hoặc điều khiển tài khoản. Nó kiểm tra DOM thẻ giống ảnh người dùng, chọn Magnet và Bond, lưu mục tiêu vé, nhường điều khiển khi bấm WASD, pause/stop, menu và lỗi JavaScript. Có thêm tình huống reroll ra cùng bộ thẻ hai lần rồi chọn ngẫu nhiên khi hết lượt. Ảnh sinh tại tests/artifacts/menu.png.

Đã thực hiện thêm kiểm tra bộ nhận diện với các mô-đun vẽ công khai của game tại commit d567c6da88e4ef66634ab54a01b5a3607501e03a: đối chiếu tọa độ chân sprite, rương, cổng, vé, vàng, XP, vùng nguy hiểm và HUD HP/cấp/thời gian. Mã/hình của game dùng trong kiểm tra này không được đóng gói trong extension.

Các bài kiểm tra không phải chơi thật và không chứng minh số vàng/vé mỗi giờ, khả năng thắng boss hoặc bao phủ tất cả map/phiên bản game. Ảnh preview dùng nền và trạng thái mô phỏng.

Kiểm tra bổ sung 2.7.0: reroll không phản hồi phải chuyển sang thẻ dự phòng; chỉ báo RIFT · 23 m · 9 s ở mép màn hình được suy ra từ gốc mũi tên và khoảng cách; chỉ báo RIFT · 9 s trên màn hình cho mục tiêu phía dưới mũi tên; TTL được gắn cả vào sprite cổng đã nhận diện. Các trường hợp này đã đạt trong trang mô phỏng.

2.7.0: đã đạt kiểm tra giữ mục tiêu qua nhiều frame, cổng sát cửa còn 2 giây, không đổi sang vé bên cạnh, che khuất ngắn, giảm HP, mô phỏng bước vào vùng tương tác và từ chối cổng xa sắp hết hạn. Kiểm tra canvas có sprite mâu thuẫn khoảng cách RIFT: bỏ vị trí sai, suy lại từ HUD; sửa điểm vào gần dưới mũi tên 10 đơn vị. Đây là kiểm tra mô phỏng, chưa chơi trận thật trên tài khoản.

Đã kiểm tra lại trên Chrome headless với trang game mô phỏng: chọn thẻ, reroll hai lần rồi chọn dự phòng, Bond, lưu cấu hình, di chuyển, nhường điều khiển và dừng. Đã chạy cùng kịch bản bằng userscript mobile đã gộp mã và CSS; không cần chrome.runtime để lưu cấu hình. Chưa xác nhận trên Safari/iOS hoặc Firefox Android thực tế.

2.7.0: kiểm tra so sánh item theo mục tiêu/HP/cấp, giữ item lạ, chọn orb khẩn cấp và orb đánh boss, không dùng chồng buff, đúng phím ô, cooldown/xác nhận giảm số lượng. Bộ canvas mô phỏng đọc đúng Focus Sash, ba orb như ảnh ở ô 5/6/7, stack ×2, buff riêng bên phải và lớp cooldown. Kịch bản trình duyệt chọn đổi Focus Sash sang Amulet Coin khi farm vàng HP tốt; khi bị áp sát HP thấp gửi phím 5 dùng Slumber và giữ Focus.

2.7.0: kiểm tra cả hai chế độ vàng/vé chọn Rift xa đủ thời gian thay vì vé ×10, vàng và rương sát bên; sinh tồn và công tắc tắt Rift không vào; chuỗi arena giao chiến → chờ boss bị che khuất → nhận phần thưởng → trở lại map; rút lui HP thấp; Bond sát thương + buff. Kịch bản trình duyệt kiểm tra thông báo chuyển giai đoạn bên cạnh các thao tác item/orb/reroll trước đó.

2.7.0: kiểm tra liên tục đứng yên bên rương trong hơn 3,5 giây dù có vé và quái gần; rời giữ khi nguy hiểm/HP thấp; Rift vẫn được ưu tiên; tiến độ vòng vàng 50% được nhận diện từ canvas tham chiếu. Kịch bản trình duyệt xác nhận nhả phím D đã giữ khi đi tới rương, không bấm lại vì loot bên cạnh, tiếp tục sau khi rương biến mất. Chưa kiểm chứng bằng trận thật.

2.7.0: kiểm tra trực tiếp hàm vẽ tham chiếu Hazards.draw và Projectiles.draw tại commit đã ghim trên trang mô phỏng: vòng cảnh báo xanh với tiến độ 70%, tia tím xoay 45° với tiến độ 80%, dấu đạn địch bán kính 7 và bỏ qua đạn thân thiện. Kiểm tra planner chọn thoát vùng tròn, di chuyển vuông góc tia, dự đoán đạn tới qua hai frame và di chuyển ngang khi boss Charge. Kiểm tra trình duyệt: báo vùng nguy hiểm → trạng thái né → gửi phím 8 dùng orb tốc độ; các luồng Rift/rương/item/Bond/reroll vẫn đạt. Không phải kiểm chứng tỷ lệ thắng boss thực tế.

2.7.1: kiểm tra mặc định Ép vào Rift, HP thấp/chưa có HP, cấp 2, TTL 2 giây dù cổng xa; giữ cam kết khi HP giảm; loại cổng đã hết hạn; Cân bằng và Sinh tồn không bị ép. Kịch bản trình duyệt xác nhận chuyển từ mẫu vòng tròn sang dẫn đường Rift ở HP20%/cấp2/TTL2 và chuyển lại Cân bằng. Chưa đo tỷ lệ vào cổng thực tế.

## 2.8.0 · Hai bản game
Đã qua bộ logic cũ, controller và service worker (thêm origin Doofcraft, từ chối host giả), trình duyệt bản gốc và bộ vẽ tham chiếu đã ghim. Bộ vẽ Doofcraft công khai được nạp trong trang phát triển riêng: sprite thường/shiny, boss đỏ, cổng, item/vé, rương thưởng và rương khóa; world scale3/HUD scale2; zone70%, beam xoay80%, đạn nhỏ; ánh loot không phải hazard. Đọc thành công tường/nước từ các chunk map thực do renderer công khai tạo. Kiểm tra không chọn khi ps-box còn locked, chọn khi armed; phím orb bị tắt ở Doofcraft. Kiểm tra định tuyến quanh tường và không đứng mở rương thưởng nhặt trực tiếp. Chưa chơi trận có tài khoản Doofcraft, chưa benchmark tỷ lệ thắng/rift/tài nguyên hoặc thử trên điện thoại thật.

## 2.9.0 · Lặp lượt, mục tiêu, TM
- Pure/unit: nhập 10k/1,5k/10.000, từ chối số âm và chuỗi không hợp lệ; đổi vé ×10/×25; chỉ hoàn thành khi mọi mục tiêu đạt; token chống đếm lại qua serialize; loại thưởng chưa xác nhận; điều kiện TM đủ/thiếu/tắt; chọn item theo kiểu đánh.
- Service worker: phân tách tiến độ theo origin, chặn nguồn giả, thông báo hoàn thành một lần.
- Trình duyệt mô phỏng (desktop và userscript độc lập, cả hai website): bắt đầu từ menu, bật/dạy TM đã có cho Pidgeot, chọn U-turn khởi đầu, không bấm mua; hoàn thành hai lượt 6.000+4.000 vàng, 2 vé thường+1 vé ×10; reload ở màn kết quả không cộng trùng; không mở lượt thứ ba; hiện hoàn thành và giữ trạng thái qua reload.
- Game báo not-credited: tạm dừng, không cộng, không replay; sau khi game xác nhận và người dùng tiếp tục thì cộng một lần và hoàn thành.
- Đã chạy lại luồng farm/Rift/né boss/rương/item/orb/reroll hiện có. Chưa chạy tính năng mới bằng tài khoản game thật, chưa kiểm tra Android/iOS trên thiết bị thật.

## v3.8.2 validation (2026-10-28)
- npm test: all suites pass, including Z-Move readiness/cooldown, 18 upgrade cards, same-kind evolved upgrades during navigation, and retry recovery.
- Native Doofcraft HUD fixture: actual public drawSlots/drawZSlot and keyboard listener; Solar Beam evolved Lv5 replaces Hyper Beam Lv2, F activates Z and cooldown is observed; all 18 crystals; touch layout without F text; 1x, 1.25x and 2x scales; item gold border and missing Z rejected.
- Controller fixture: one slot key, one F key, observed confirmation, no repeated use during cooldown; Shadow Mewtwo remains correctly identified.
- Browser regression: Rift, chest hold, rewards, items, orbs, choice/reroll, takeover/pause/stop and no JS errors.
- Mobile userscript: bootstrap/restore/duplicate guard at both origins; injection failure displayed.
- Limitations: fixtures use simulated player state and public renderer assets, not an authenticated live run. Android device execution and uninterrupted background gameplay are not guaranteed.

## v3.9.0
Custom-only target and migration tests replace obsolete reference-build/TM-meta assertions. All core choice/evolution offers outrank other cards. UI tests on both hosts verify explicit save, full page reload, per-Pokémon isolation, no legacy controls and duplicate rejection. Background settings and prior combat/navigation/Z-Move regression suites retained.
