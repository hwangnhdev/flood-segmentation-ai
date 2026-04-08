# Hướng dẫn Deployment Website Phân đoạn Lũ lụt (Flood Segmentation)

Project này bao gồm **Backend (FastAPI)** để xử lý model AI và **Frontend (Next.js)** để hiển thị giao diện. Dưới đây là các bước để deploy website này.

## 1. Môi trường yêu cầu (Prerequisites)
- **Node.js 18+** và **npm**.
- **Python 3.9+**.
- **GPU (Khuyến nghị)**: Nếu máy có NVIDIA GPU, hãy cài đặt [PyTorch với hỗ trợ CUDA](https://pytorch.org/get-started/locally/) để inference nhanh hơn.

---

## 2. Deploy Local (Để demo hoặc chạy nội bộ)

### Bước A: Chạy Backend
1. Mở terminal tại thư mục `backend/`.
2. Tạo môi trường ảo (tùy chọn nhưng nên làm):
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   .\venv\Scripts\activate   # Windows
   ```
3. Cài đặt thư viện:
   ```bash
   pip install -r requirements.txt
   ```
4. Chạy server:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

### Bước B: Chạy Frontend
1. Mở terminal tại thư mục `frontend/`.
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Tạo file `.env.local` để cấu hình API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Build và chạy production:
   ```bash
   npm run build
   npm run start
   ```
   Truy cập website tại: `http://localhost:3000`.

---

## 3. Deploy lên Cloud (Production)

Vì model AI (`.pth`) khá nặng (~350MB) và cần nhiều RAM/CPU (hoặc GPU), bạn nên chọn các dịch vụ hỗ trợ tốt cho Python.

### Các dịch vụ gợi ý:
- **Frontend**: Deploy lên **Vercel** (Miễn phí, cực nhanh cho Next.js).
- **Backend**: Deploy lên **Render**, **Railway**, hoặc **Fly.io** (Các dịch vụ này hỗ trợ chạy Docker hoặc Python trực tiếp).

### Quy trình Deploy (Ví dụ trên Render/Vercel):
1. **Frontend (Vercel)**:
   - Connect repository Github.
   - Set Environment Variable: `NEXT_PUBLIC_API_URL` là URL của Backend sau khi deploy (vd: `https://my-backend.onrender.com`).
2. **Backend (Render)**:
   - Tạo một "Web Service" mới từ repo Github.
   - Runtime chọn `Python 3`.
   - Build Command: `pip install -r requirements.txt`.
   - Start Command: `uvicorn app:app --host 0.0.0.0 --port 8000`.
   - Đảm bảo file model `best_model_iou.pth` đã được upload lên repo (hoặc dùng Git LFS nếu file quá lớn).

---

## 4. Lưu ý quan trọng
- **CORS**: Trong `app.py`, cấu hình `allow_origins` đã được đặt là `["*"]` để chấp nhận mọi domain. Khi deploy thật, bạn nên đổi thành domain cụ thể của frontend để bảo mật.
- **Model Storage**: Nếu deploy lên Github, hãy dùng **Git LFS** (Large File Storage) để quản lý file `.pth`. Một số dịch vụ như Render có giới hạn bộ nhớ free, bạn cần check kỹ cấu hình RAM (thường cần ít nhất 1-2GB để load model ConvNeXt).
- **Resolution**: Website đã được chỉnh để giữ nguyên resolution khi hiển thị. Model bên dưới vẫn resize về 512x512 để inference, sau đó resize kết quả trả về đúng kích thước gốc của hình bạn upload.
