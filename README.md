# CardioFlow Lab — Valve Closure & VMR 0225

Demo web cục bộ có hai tuyến nội dung độc lập:

- **Valve support & closure:** minh họa tương tác định tính về van ba lá, dây chằng nâng đỡ, mép lá khép kín và tình huống sa lá van khi mất nâng đỡ. Phần này dựa trên chủ đề nghiên cứu của [Kamensky và cộng sự (2018), Hình 15–16](https://yan.cee.illinois.edu/files/2021/08/1-s2.0-S0045782517307120-main.pdf), nhưng hình minh họa trên web do project tạo mới. Đây không phải mesh, trường biến dạng MIPE hay nghiệm fluid–structure interaction của bài báo.
- **VMR 0225_H_AO_COA:** ca động mạch chủ có ảnh MR, bề mặt P001 và video CFD từ folder được cung cấp. Ca này không chứa dữ liệu van.

Các kiểu tương tác trong showcase được tham khảo từ [HeartFlow FFRCT Analysis](https://www.heartflow.com/heartflow-one/ffrct-analysis/): mô hình 3D, màu để đọc trường sinh lý, điểm thăm dò và so sánh các tình huống. Demo này không tính FFRCT, không có CCTA mạch vành và không sử dụng các tuyên bố hiệu quả lâm sàng của HeartFlow.

Trên web, phần van có chế độ **bình thường / sa lá van / so sánh**, thanh pha đóng, phát chuyển động, lớp màu định tính và các điểm chú giải lá van, dây chằng, vòng van, vùng tiếp áp. Phần ca 0225 có thể ghim một điểm trên P001 để đọc tọa độ hình học; áp lực và vận tốc chỉ được đọc theo **toàn frame video**, không được gán cho điểm ghim.

Flow dữ liệu ca `0225_H_AO_COA` dựa trên thư mục `cardiovascular_demo_2026-10-07/`:

1. **Ảnh MR:** duyệt các lát trích từ volume `0225_H_AO_COA.vti`. [Báo cáo ca](public/vmr-0225/0225_H_AO_COA.pdf) xác nhận phương thức ảnh là **MR**, không phải CT.
2. **Bề mặt mạch:** xoay mô hình PolyData `P001.vtp` cùng ca. Bề mặt này là đầu vào hình học được mô tả cho lưới CFD của video. File `0225_H_AO_COA_lumen_smooth.step` được cung cấp để tải về như một CAD solid xấp xỉ; STEP không được biểu diễn là mesh dùng trong video.
3. **Video CFD:** phát `coa_step0_to31600_pressure_0_6mmHg.mp4` và đọc metadata của 80 frame. Video trái là áp lực bề mặt với thang màu cố định 0–6 mmHg; video phải là đường dòng vận tốc tức thời với thang màu theo từng frame. Thời gian vật lý là 0–3,95 s, phát chậm thành 16 s.

Ảnh MR và bề mặt P001 thuộc cùng ca nhưng demo **không xác nhận căn chỉnh không gian giữa hai file**, nên không phủ mask lên ảnh. Bề mặt trong trình xem 3D chỉ được chuẩn hóa và xoay trục để dễ quan sát. Đường dòng trong video không phải các hạt máu được theo dõi. Kết quả CFD là lượt chạy nghiên cứu với lưu lượng đầu vào được giảm có chủ ý, không phải đánh giá lâm sàng hay khuyến nghị điều trị.

## Chạy cục bộ

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in ra trong terminal, thường là `http://127.0.0.1:5173`. Kiểm tra bản production bằng `npm run build` rồi `npm run preview`.

Các asset web đã có trong `public/vmr-0225/`, nên bản clone mới chạy được demo ngay. Thư mục nguồn `cardiovascular_demo_2026-10-07/` được giữ cục bộ vì chứa dữ liệu gốc trùng với bản web và metadata có đường dẫn máy của người tạo. Muốn tái tạo các lát MR cùng mesh trình xem trên bản clone mới, cần có thư mục nguồn được bàn giao riêng rồi chạy:

```bash
npm run prepare:case
```

Script dùng Python standard library, đọc VTI/VTP và xuất ảnh PNG cùng `surface.bin`. File MP4 và frame metadata đã được đặt sẵn trong `public/vmr-0225/`; metadata công khai đã bỏ các đường dẫn máy cục bộ. `scripts/verify-registration.mjs` thuộc flow cũ P-3 và không kiểm tra căn chỉnh của ca 0225.

## Nguồn và quyền sử dụng

Dữ liệu ca từ [Vascular Model Repository](https://purl.stanford.edu/rm095dp9056). Xem [LICENSE.txt](public/vmr-0225/LICENSE.txt) và [README-COPYRIGHT](public/vmr-0225/README-COPYRIGHT) trước khi tái sử dụng. The data used herein was provided in whole or in part with Federal funds from the National Library of Medicine under Grant No. R01LM013120, and the National Heart, Lung, and Blood Institute, National Institutes of Health, Department of Health and Human Services, under Contract No. HHSN268201100035C.
