# Nguồn và phạm vi sử dụng dữ liệu

## SurvivorTiers
- Trang: https://survivortiers.pages.dev/en/
- Phương pháp: https://survivortiers.pages.dev/en/metodo
- Ví dụ đã đối chiếu: https://survivortiers.pages.dev/en/pokemon/798-kartana/
- Snapshot lấy ngày 2026-10-25, chỉ trường dữ kiện về tên Pokémon/chiêu, bộ chiêu, điều kiện tiến hóa, Nature/Ability và số lượt mô phỏng.
- Bộ build: https://raw.githubusercontent.com/felipebasurto/survivortiers/58ce062950908ac9e65ecf48b75899b9413f4b88/data/bounded_ranking.json
- SHA256 của file bộ build: d5a3b49f110133c70108efa61f74b996e90a48001db5245db181d745fe649065
- Tên/chiêu: /data/pokemon-index.json, /data/moves.json, /data/moves_unranked.json trên cùng website, lấy ngày trên.
- Nguồn JSON ghi gameCommit ce5785313b0205af8b9477423f64b0a7b7039dcd; meta.json của website ghi 5a23d49. Đây là mốc khác nhau ở nguồn, không có khẳng định dữ liệu khớp phiên bản game đang chạy.

Không dùng species.json của Build planner vì bộ đó có khác biệt với Best builds trên trang chi tiết. Từ 2.9.0 dùng cả nhánh no_tm và optimized trong cùng bounded_ranking; nhánh TM được xét khi các TM cần thiết đã có trong giao diện của Pokémon. Các ứng viên được so sánh theo survival của snapshot. Không dùng dữ liệu này để cam kết tối ưu toàn cục hoặc tối ưu xu/giờ. Giữ stage/seeds để hiển thị build sơ bộ.

Công cụ tự viết quy tắc chọn thẻ; không gọi đó là quy tắc do SurvivorTiers đề xuất. Snapshot được đóng gói nội bộ, không tải và chạy mã từ xa, không có sprites, artwork, CSS, JavaScript hoặc engine mô phỏng của website. Không phải sản phẩm được SurvivorTiers hay game chứng nhận. Các thông báo quyền nguồn vẫn cần được xem xét riêng trước khi phân phối thương mại.

## PokeSurvivorTool
Xem THIRD_PARTY_NOTICES.txt. Các ý tưởng đọc canvas và đánh giá hướng đi được tham khảo khi tự triển khai chế độ thích ứng 2.4. Gói này không chứa loader hay bản vá mạng của repo đó.

## Nhận diện game 2.4
Nguồn tham chiếu công khai: https://github.com/JPTER78/pokesurvivor/tree/d567c6da88e4ef66634ab54a01b5a3607501e03a (snapshot nghiên cứu 2026-10-25). Dùng đối chiếu cấu trúc DOM, cách vẽ, vùng tương tác và thời gian sự kiện. vision-data.js chỉ chứa dấu băm số của hình vẽ và dữ kiện kích thước/điểm neo; không đóng gói hình ảnh hoặc mã nguồn game. Có 384 dấu nhận diện và 966 bộ neo sprite. Dấu kỹ năng trùng nhau bị bỏ qua khi không thể phân biệt.

Quy tắc ưu tiên tài nguyên, ngưỡng an toàn, lựa chọn vật phẩm và dự đoán chuyển động là heuristic của công cụ, chưa phải kết quả benchmark tối ưu.

2.5.0: đối chiếu thêm js/systems/orbs.js và vị trí túi orb/item trong js/ui/hud.js cùng commit game nêu trên. Lưu thêm 6 dấu băm orb; không đóng gói mã hoặc hình của game. Điều kiện dùng orb và đánh giá item là quy tắc tự viết của công cụ.

2.6.1: đối chiếu interact.js (bigchest), world.js (vòng tiến độ), sprites.js/player.js (bán kính va chạm) cùng commit đã ghim. Chỉ thêm logic và dữ kiện nhận diện tự viết.

2.7.0: đối chiếu thêm js/systems/hazards.js, js/entities/projectile.js và phần boss trong js/entities/enemy.js cùng commit game đã ghim. Không đóng gói mã vẽ tham chiếu; chỉ dùng trong kiểm tra phát triển. Logic quan sát, theo dõi vận tốc và chọn hướng né được viết riêng.

## Doofcraft · 2.8.0
Trang công khai: https://pokesurvivor.doofcraft.com/ (đối chiếu 2026-10-26). Đây là bộ tích hợp riêng cho canvas.ps-canvas, /sprites/ và hộp ps-choice; không dùng bộ nhận diện của bản gốc để đoán khả năng tương thích.

Các bản công khai đã đọc trong phát triển:
- /assets/screens-BSx8ctvn.js · SHA256 9f34c23ce251d20a9cabdeda778403b6c621ede7262b615930243f8e5d29b7b2
- /assets/route-tip-CExLELcE.js · SHA256 1d85f7760c75a79ea612a60a4fe0b1eca63bfeb6f923e027842b8f7d4bc9c617
- /assets/sprites-C6ODQ9zN.js · SHA256 af410698c75ff9c360d88ac90ee3366d07c370976f8716499337c287058fc365
- /assets/audio-BajYTkLb.js · SHA256 1d330bd32a94d3b3cd69892ea05f30686c56f3d45538fba762eb7641d6d1228b

Chỉ đóng gói 390 dấu băm, 1021 bộ neo sprite thường/shiny/form và 22 bảng màu địa hình. Không đóng gói hình ảnh, source module, tài khoản, dữ liệu lưu hoặc engine mô phỏng Doofcraft. Module game dùng trong kịch bản kiểm tra phát triển nằm ngoài ZIP. Extension/userscript không tải mã từ mạng khi chạy. Tham khảo thêm sites/doofcraft/site.js của PokeSurvivorTool để đối chiếu khóa hộp chọn và khác biệt hotkey; tự triển khai bộ tích hợp và đường đi trong gói này.

## 2.9.0 · Phiên và TM
Bổ sung 1.078 ứng viên optimized (giữ tms/attacks/start/nature/ability/stage/seeds) từ chính bounded_ranking đã ghim và băm ở trên. Không dùng bảng species.json của Build planner. Điều kiện sở hữu TM, ghi nhận phần thưởng, điều hướng menu, lựa chọn item theo kiểu đánh và mục tiêu là logic tự viết. Đối chiếu DOM hiển thị trong menu.js/run-ui.js của commit game gốc đã ghim và screens-BSx8ctvn.js của Doofcraft đã băm ở phần trước. Native UI được dùng để bật/dạy TM đã có và chọn chiêu khởi đầu; không đóng gói source game, không gọi API hoặc mua nâng cấp/TM.

## 3.0.0 · Sự kiện Doofcraft
Đọc lại index và các module công khai cùng tên/hash phía trên ngày 26/10/2026: quy tắc objectives cage/lanterns/doors/escort, HUD và bộ vẽ prop/NPC, catalogue chiêu/form/plate/rarity. Dữ liệu giới hạn trong event-data.js là tên/id/hệ, phạm vi/thời gian tương tác và bảng độ hiếm; build-data.js bổ sung tên/hệ chiêu và Pokémon mới với build suy luận, không gán kết quả mô phỏng cho chúng. Bộ fingerprint mở rộng lồng/đèn/bí ngô và gem/candy/ticket25, không kèm hình hoặc mã engine game. Logic hold/escort, chọn thẻ và ưu tiên do tool tự triển khai. Bản gốc đối chiếu events.js ở commit đã ghim; geometry quầng NPC/đích và HUD xanh dùng chung.

3.1.0: không tự pause khi visibilitychange/window blur; cho phép frame age đến 3.5 giây khi document.hidden do tab nền bị giảm tốc. Mọi hành động vẫn dựa trên dữ liệu render canvas; không dùng quyền debugger/steal focus. Browser throttling có thể làm giảm tốc thêm.

3.4.0: coneReach là speed × lifetime lấy từ snapshot work/doofcraft-catalog300.json đã nghiên cứu trước đó; chỉ dùng làm ngưỡng tầm phun bảo thủ, không phải DPS thực đo hoặc xác nhận cấu hình hiện tại của mọi server.


v3.8.0 combat estimates: numeric move facts extracted from existing local original game moves.js and Doofcraft catalog300 snapshot. Original level ladders kept separate from Doofcraft base values; Doofcraft level ranking remains heuristic. No game combat engine is shipped. These snapshots are not a verification of current live balance.


v3.8.2: Doofcraft public catalog and sprite manifest read 2026-10-28 from https://pokesurvivor.doofcraft.com/assets/audio-DbpiyuBI.js and https://pokesurvivor.doofcraft.com/assets/sprites-B2rlzCVo.js. Numeric upgrade ladder facts and internal/national Dex mapping extracted; game runtime not shipped.

## v3.8.2 · 2026-10-28
Doofcraft public assets: /assets/screens-DL0pfdZ6.js (drawSlots, drawZSlot, keyboard F), /assets/route-tip-nSsL0bab.js (pixel-rounded icons), /assets/audio-DbpiyuBI.js (18 Z-Moves, 400 radius, 120-second cooldown). Source: https://pokesurvivor.doofcraft.com/. No account data or game-engine code bundled; renderer/input modules are loaded only by development fixtures.

## v3.13.0 · 2026-10-30
Doofcraft public renderer: https://pokesurvivor.doofcraft.com/assets/screens-DL0pfdZ6.js ; game mechanics/localization: https://pokesurvivor.doofcraft.com/assets/route-tip-nSsL0bab.js . Verified procedural obelisk sprites Wf/Qf (26x58) and feet offset 6 at draw scale 2; only hashes and geometry used in product. Retained move facts from build-data.js; no promise of future compatibility.
