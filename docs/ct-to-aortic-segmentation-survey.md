# CT → Phân đoạn động mạch chủ → CAD model PolyData → Trực quan hóa 3D

## Kết luận cho ca P-3

**Dùng pipeline SimVascular đã có trong ca `0227_H_AO_COA` cho bản demo hiện tại.** Kho Stanford cung cấp ảnh CT `0227_H_AO_COA.vti`, đường mạch `aorta.pth`, phân đoạn `aorta.ctgr`, bề mặt `P007.vtp` và mesh cùng ca. Đây là bằng chứng trực tiếp về quan hệ CT → mô hình. Giao diện local dùng 9 lát CT thật, P007 và centerline; mask tô trên CT được tính bằng cách cắt bề mặt P007 theo mặt phẳng lát hiện tại. Đây là **chiếu ngược kết quả đã có**, không phải dự đoán AI trực tiếp từ CT. SimVascular gọi PolyData là một loại solid model; P007 `.vtp` có bề mặt tam giác khép kín và thuộc loại đó, nhưng không phải CAD tham số STEP/BREP. Bước 3 trực quan hóa chính mô hình này trong 3D.

## Các hướng xử lý CT → mask → centerline → surface

| Lựa chọn | Đầu ra và mức sẵn sàng | Phù hợp với demo này | Giới hạn chính |
| --- | --- | --- | --- |
| **SimVascular image-based modeling** | Path → contour segmentation → surface/solid model → mesh. Bộ P-3 đã có mọi tệp cần thiết. | **Tốt nhất để trình bày dữ liệu cùng ca, có thể kiểm chứng.** | Chủ yếu là quy trình tương tác/bán tự động, không phải một nút AI trong browser. |
| **TotalSegmentator** | Model pretrained tách `aorta` và các nhánh lớn trên CT; có `--roi_subset`. | Điểm khởi đầu tốt nhất nếu muốn thêm bước **AI tự động** chạy offline. | Kết quả phải kiểm tra/chỉnh vùng hẹp và nhánh; mask mới không mặc nhiên giống P007. Cần chuyển VTI sang đầu vào NIfTI/DICOM phù hợp. |
| **SimVascular SimCardio** | Model pretrained cho các cấu trúc tim lớn, gồm aorta, từ CT/MR. | Có thể thử để so sánh với TotalSegmentator trên cùng P-3. | Phải kiểm tra thực nghiệm trên CT P-3; không nên tuyên bố khớp P007 trước khi đối chiếu. |
| **nnU-Net / AortaSeg24** | Model nghiên cứu phân đoạn nhiều lớp của aorta, nhánh và vùng giải phẫu trên CTA. | Hợp nếu mục tiêu là phát triển hoặc huấn luyện model chuyên biệt. | Phức tạp hơn nhiều; bản mô tả chính thức huấn luyện nnU-Net ResEnc L trên GPU A100 40 GB. Không cần thiết cho demo frontend. |
| **3D Slicer + SlicerVMTK** | Công cụ sửa mask, trích centerline và đo nhánh sau phân đoạn. | Tốt cho bước hậu xử lý và kiểm tra hình học. | Đây không phải model AI tự động CT → phân đoạn. |

## Lộ trình khuyến nghị

1. **Demo hiện tại:** tiếp tục dùng các kết quả gốc cùng ca P-3, để CT, overlay, centerline và mesh chuyển tiếp trong một viewer.
2. **Nếu cần chứng minh AI:** chạy TotalSegmentator offline trên CT P-3, giữ mask đầu ra riêng với contour P-3, rồi so sánh trực quan và đo sai khác với P007.
3. **Nếu cần nghiên cứu độ chính xác vùng hẹp:** dùng nhãn/chuyên gia kiểm tra, sau đó mới cân nhắc fine-tune nnU-Net hoặc mô hình AortaSeg24. Không dùng các giá trị demo làm kết luận lâm sàng.

## Nguồn chính

- [Stanford VMR case P-3 / 0227_H_AO_COA](https://purl.stanford.edu/hh073fw2871)
- [SimVascular modeling pipeline](https://simvascular.github.io/documentation/getting_started.html)
- [TotalSegmentator repository and class list](https://github.com/wasserth/TotalSegmentator)
- [SimVascular SimCardio documentation](https://simvascular.github.io/documentation/simcardio.html)
- [nnU-Net AortaSeg24 implementation notes](https://github.com/MIC-DKFZ/nnUNet/blob/master/documentation/competitions/AortaSeg24.md)
- [3D Slicer VMTK centerline workflow](https://github.com/vmtk/SlicerExtension-VMTK/blob/master/Docs/CoronaryArteryCenterlineExtraction.md)
