# CardioFlow Lab — Aorta Demo

Web demo chạy cục bộ trong thư mục này, không cần tài khoản hay dịch vụ hosting. Ảnh CT và hình học mạch lấy từ **cùng ca P-3 / 0227_H_AO_COA** trong [Stanford Vascular Model Repository](https://purl.stanford.edu/hh073fw2871):

1. **Ảnh CT:** 9 lát cắt thật được trích từ `Images/0227_H_AO_COA.vti`, có thanh đổi lát và window width.
2. **CAD model (PolyData):** giữ nguyên lát CT đang xem, phủ vùng mạch là giao tuyến của `Models/P007.vtp` với mặt phẳng lát đó. Bên cạnh là mô hình P007 dưới góc nhìn kỹ thuật: bề mặt lưới tam giác có thể xoay, các contour của 9 lát và `Paths/aorta.pth`. P007 là **mô hình PolyData `.vtp` của SimVascular**, không phải CAD tham số dạng STEP/BREP.
3. **3D tương tác:** hiển thị đồng thời ảnh CT, CAD PolyData và góc nhìn 3D của **cùng mô hình P007**. Cả ba dùng chung lát CT, đường cắt màu vàng và điểm đang chọn. Có thể xoay/phóng to mô hình và bật chế độ tô màu vận tốc minh họa. Đây là cách xem mô hình, không tạo một mô hình khác.

Ảnh trên slide trước thuộc ca **0225_H_AO_COA dùng MR** nên đã được gỡ khỏi giao diện. Bước 2 và 3 phóng đại vùng mạch trên CT để đường cắt dễ thấy; bước 1 vẫn cho thấy ảnh CT toàn bộ. Vùng mask trên CT được **chiếu ngược từ mesh P007** để minh họa sự tương ứng hình học; web không chạy một model AI tách mạch từ CT. Khi đổi lát CT, mặt phẳng và đường cắt trên cả hai mô hình cập nhật cùng vị trí. Khi chọn điểm trên mô hình, web chuyển đến lát CT gần nhất trong 9 lát đã trích; nếu điểm nằm ngoài phạm vi này, giao diện báo rõ không có lát mẫu tương ứng. **Màu vận tốc, biểu đồ, đường kính và áp lực có dấu * là mô phỏng**, không phải kết quả đo của P-3.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in ra trong terminal (thường là `http://127.0.0.1:5173`). Máy chủ chỉ lắng nghe trên loopback. Kiểm tra bản build bằng `npm run build` và xem bản build cục bộ bằng `npm run preview`.

Kiểm tra sự khớp hình học của 9 lát CT với P007 bằng `npm run verify:geometry`. Lệnh cắt trực tiếp tam giác của `model.bin` tại từng mặt phẳng CT, so sánh biên contour lưu trong demo và kiểm tra điểm centerline được chọn nằm trong vùng mạch trên CT.

Nguồn dữ liệu P-3 thuộc Stanford University / Vascular Model Repository. Điều khoản sử dụng và thông tin bản quyền có trong [README-COPYRIGHT](public/vmr-p3/README-COPYRIGHT.txt). Dữ liệu chỉ dùng cho trình diễn nghiên cứu, không dùng cho chẩn đoán.

Khảo sát các cách phân đoạn động mạch chủ từ CT: [CT → Aortic Segmentation survey](docs/ct-to-aortic-segmentation-survey.md).
