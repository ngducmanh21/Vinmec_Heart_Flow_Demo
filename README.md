# CardioFlow Lab — từ ảnh lâm sàng đến mô hình dòng chảy

Website dùng trình tự bốn bước từ `Slides.pdf` (slide 55), với kiểu tương tác lấy cảm hứng từ [HeartFlow FFRCT Analysis](https://www.heartflow.com/heartflow-one/ffrct-analysis/). Giao diện và nội dung được viết mới; hình và thương hiệu HeartFlow không được sao chép. Hai khu showcase van tự dựng và “Tính năng tương tác” trước đó đã được gỡ.

1. **Ảnh lâm sàng và thông số đo:** duyệt 16 lát trích từ `0225_H_AO_COA.vti`. [Báo cáo ca](public/vmr-0225/0225_H_AO_COA.pdf) xác nhận phương thức ảnh là **MR**, không phải CT. Folder chưa có phép đo áp lực/lưu lượng lâm sàng độc lập để dùng làm endpoint.
2. **Mô hình dòng chảy theo ca:** xoay bề mặt PolyData `P001.vtp`, ghim tối đa ba tọa độ hình học, và phát `coa_step0_to31600_pressure_0_6mmHg.mp4` với metadata của 80 frame. Video trái là áp lực bề mặt với thang màu cố định 0–6 mmHg; bên phải là đường dòng vận tốc tức thời với thang màu theo từng frame. Thời gian vật lý là 0–3,95 s, phát chậm thành 16 s. STEP được tải riêng như CAD solid xấp xỉ, không phải mesh CFD.
3. **Phương án do bác sĩ định nghĩa:** các ca hẹp mạch vành, phình mạch, stent, bypass, van và thiết bị trong slide 47–53 được tóm tắt như ví dụ nghiên cứu đã công bố hoặc hướng tương lai. Chúng không phải các lần chạy thay thế của ca 0225.
4. **Đối chiếu với phép đo độc lập:** trình bày dữ liệu và endpoint cần có để kiểm chứng. Folder chưa chứa bộ đo độc lập và solver chưa được xác thực lâm sàng cho ca này.

Ảnh MR và bề mặt P001 thuộc cùng ca nhưng demo **không xác nhận căn chỉnh không gian giữa hai file**, nên không phủ mask lên ảnh. Pin trên P001 chỉ trả tọa độ của mô hình đã chuẩn hóa, không trả áp lực hay FFRCT tại điểm. Đường dòng trong video không phải các hạt máu được theo dõi. Kết quả CFD là lượt chạy nghiên cứu với lưu lượng đầu vào được giảm có chủ ý, không phải đánh giá lâm sàng hay khuyến nghị điều trị. Slide 56 phân biệt **Now / Next / Future**; asset ca 0225 hiện chứng minh được áp lực và vận tốc, chưa có bảng branch-flow riêng.

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
