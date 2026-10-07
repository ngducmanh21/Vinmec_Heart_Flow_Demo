# CardioFlow Lab — từ ảnh lâm sàng đến mô hình dòng chảy

Website dùng trình tự nghiên cứu bốn bước từ tài liệu `Slides.pdf`, với kiểu tương tác lấy cảm hứng từ [HeartFlow FFRCT Analysis](https://www.heartflow.com/heartflow-one/ffrct-analysis/). Giao diện và nội dung được viết mới; hình và thương hiệu HeartFlow không được sao chép. Hai khu showcase van tự dựng và “Tính năng tương tác” trước đó đã được gỡ.

1. **Ảnh lâm sàng và thông số đo:** duyệt 16 lát trích từ `0225_H_AO_COA.vti`. [Báo cáo ca](public/vmr-0225/0225_H_AO_COA.pdf) xác nhận phương thức ảnh là **MR**, không phải CT, và ghi huyết áp catheter trung bình AAo 88 / DAo 81 mmHg. Folder chưa có waveform catheter thô hoặc phép ghép số đo này với video CFD.
2. **Mô hình dòng chảy theo ca:** xoay bề mặt PolyData `P001.vtp`, ghim tối đa ba tọa độ hình học, và phát `coa_step0_to31600_pressure_0_6mmHg.mp4` với metadata của 80 frame. Video trái là áp lực bề mặt với thang màu cố định 0–6 mmHg; bên phải là đường dòng vận tốc tức thời với thang màu theo từng frame. Thời gian vật lý là 0–3,95 s, phát chậm thành 16 s. STEP được tải riêng như CAD solid xấp xỉ, không phải mesh CFD.
3. **Phương án do bác sĩ định nghĩa:** các ca hẹp mạch vành, phình mạch, stent, bypass, van và thiết bị được tóm tắt như ví dụ nghiên cứu đã công bố hoặc hướng tương lai. Chúng không phải các lần chạy thay thế của ca 0225.
4. **Đối chiếu với phép đo độc lập:** trình bày số đo catheter đã có và cặp đầu ra mô hình còn cần để đối chiếu cùng điều kiện. Video CFD hiện tại chưa được kiểm chứng lâm sàng cho ca này.

## Khu mô phỏng tương tác

Khu tương tác riêng đi từ ảnh nguồn đến mô hình và các câu hỏi dòng chảy:

- **Ảnh đến mô hình:** bộ CT P-3/0227 có 9 lát, contour và P007 cùng ca; có thể duyệt CT, bật contour và xoay model 3D. `npm run verify:geometry` kiểm tra vị trí contour với mesh. Tab MR 0225 là ca **khác**, không phủ P001 lên MR khi chưa kiểm chứng registration.
- **MR coronal bổ sung:** 11 lát mặt phẳng đứng được trích thật từ volume MR ca 0225, có hai ảnh nguồn để so sánh khi kéo qua volume. Màu xanh là thang hiển thị cường độ, không phải mask. Bề mặt P001 được xem ở khung 3D riêng; chưa có căn chỉnh không gian MR–P001. Các view CT và MR axial trước đây vẫn dùng được.
- **Áp lực và vận tốc:** phát lại video CFD và metadata thật của ca MR 0225. Dùng thang màu và thời gian thuộc chính video này.
- **Câu hỏi ứng dụng:** can thiệp và van/thiết bị được ghi là hướng phát triển.
- **Hẹp mạch:** mô hình SVG tương tác, tham khảo [Gosling et al. (2019)](https://doi.org/10.1016/j.jcmg.2018.01.019). Phần trăm hiển thị là thang đồ họa quy ước, không giải CFD hay tính FFR.
- **Phình mạch:** mô hình túi phình và vùng hồi lưu định tính, tham khảo [Jing et al. (2015)](https://doi.org/10.1371/journal.pone.0132494). Không có dữ liệu phình mạch bệnh nhân và không dự đoán nguy cơ vỡ.

Ảnh MR và bề mặt P001 thuộc cùng ca nhưng demo **không xác nhận căn chỉnh không gian giữa hai file**, nên không phủ mask lên ảnh. Pin trên P001 chỉ trả tọa độ của mô hình đã chuẩn hóa, không trả áp lực hay FFRCT tại điểm. Đường dòng trong video không phải các hạt máu được theo dõi. Kết quả CFD là lượt chạy nghiên cứu với lưu lượng đầu vào được giảm có chủ ý, không phải đánh giá lâm sàng hay khuyến nghị điều trị. Asset ca 0225 hiện chứng minh được áp lực và vận tốc, chưa có bảng branch-flow riêng.

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

Script dùng Python standard library, đọc VTI/VTP và xuất ảnh MR axial/coronal PNG cùng `surface.bin`. File MP4 và frame metadata đã được đặt sẵn trong `public/vmr-0225/`; metadata công khai đã bỏ các đường dẫn máy cục bộ. `scripts/verify-registration.mjs` chỉ kiểm tra contour CT P-3 với P007, không kiểm tra căn chỉnh của ca 0225.

## Nguồn và quyền sử dụng

Dữ liệu ca từ [Vascular Model Repository](https://purl.stanford.edu/rm095dp9056). Xem [LICENSE.txt](public/vmr-0225/LICENSE.txt) và [README-COPYRIGHT](public/vmr-0225/README-COPYRIGHT) trước khi tái sử dụng. The data used herein was provided in whole or in part with Federal funds from the National Library of Medicine under Grant No. R01LM013120, and the National Heart, Lung, and Blood Institute, National Institutes of Health, Department of Health and Human Services, under Contract No. HHSN268201100035C.
