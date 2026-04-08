---
title: Mekong Pathfinder - Flood Segmentation API
emoji: 🌊
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# 🌊 FloodSeg AI: Flood Segmentation API

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**FloodSeg AI** là một giải pháp full-stack ứng dụng Deep Learning để phân đoạn hình ảnh (Image Segmentation) các vùng bị lũ lụt. Hệ thống sử dụng kiến trúc **ViT-UNet** tiên tiến với backbone là **ConvNeXt-Tiny** để nhận diện chính xác các thành phần như mặt nước, đường xá bị ngập, và công trình bị ảnh hưởng từ ảnh vệ tinh hoặc ảnh chụp từ trên cao.

## Demo Giao diện

![Demo FloodSeg AI](./assets/demo/Screenshot%202026-04-08%20145308.png)

---

## Tính năng nổi bật

- **Phân loại đa lớp (10 classes):** Không chỉ nhận diện nước lũ, model còn phân loại được Building, Road, Water, Tree, Vehicle, Pool, Grass, và đặc biệt là **Flooded Building** & **Flooded Road**.
- **Kiến trúc Hybrid hiện đại:** Kết hợp giữa sức mạnh trích xuất đặc trưng của ConvNeXt và khả năng nắm bắt ngữ cảnh toàn cục của Transformer (ViT).
- **Giao diện tương tác:** Dashboard Next.js cho phép upload ảnh, xem kết quả phân đoạn dưới dạng overlay, tùy chỉnh độ trong suốt (opacity) và so sánh trực tiếp với ảnh gốc.
- **Hiệu suất cao:** Model được tối ưu hóa để inference nhanh chóng trên CPU/GPU, trả về kết quả định dạng JSON mask chuẩn xác.
- **Docker Ready:** Dễ dàng triển khai trên mọi nền tảng hỗ trợ container.

---

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Backend** | Python, FastAPI, PyTorch, Timm, OpenCV |
| **Frontend** | Node.js, Next.js 15, TypeScript, TailwindCSS, Lucide React |
| **AI Model** | ViT-UNet (Hybrid Architecture), ConvNeXt-Tiny Backbone |
| **Deployment** | Docker, Vercel (Frontend), Render/Hugging Face (Backend) |

---

## Kiến trúc Model (ViT-UNet)

Hệ thống sử dụng một biến thể hybrid của UNet, được thiết kế đặc biệt cho các bài toán phân đoạn ảnh phức tạp:

1.  **Encoder:** Sử dụng **ConvNeXt-Tiny** (pre-trained) làm backbone để trích xuất feature maps đa cấp độ.
2.  **Transformer Bottleneck:** Ở cấp độ sâu nhất, các features được đưa qua các Transformer Blocks để nắm bắt các mối quan hệ không gian xa (long-range dependencies).
3.  **ASPP (Atrous Spatial Pyramid Pooling):** Giúp model hiểu được ngữ cảnh ở nhiều tỉ lệ khác nhau (multi-scale context).
4.  **Attention Gates:** Được tích hợp vào các skip connections để tập trung vào các vùng đặc trưng quan trọng nhất (ví dụ: ranh giới giữa nước và đường).
5.  **Decoder:** Các khối giải mã (Decoder Blocks) sử dụng Upsampling và Tích chập để khôi phục kích thước ảnh 512x512 với độ chi tiết cao.

### Chỉ số Performance (Benchmark)
- **Accuracy:** 87.49%
- **Dice Score:** 0.7522
- **Mean IoU:** 0.6825

---

## Cấu trúc thư mục

```text
flood-segmentation/
├── assets/             # Assets (Images, Demo)
│   ├── images/         # Sample images for testing
│   └── demo/           # Demo screenshots
├── backend/            # FastAPI Source Code
│   ├── app.py          # API Gateway
│   ├── model.py        # ViT-UNet Architecture
│   ├── inference.py    # Inference Engine
│   └── config.json     # Model & Class Configuration
├── frontend/           # Next.js Web Application
│   ├── src/            # Components & Logic
│   └── package.json    # Frontend Dependencies
├── Dockerfile          # Container configuration
└── requirements.txt    # Python dependencies
```

---

## Hướng dẫn cài đặt & Chạy Local

### 1. Chuẩn bị Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Hoặc .\venv\Scripts\activate trên Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```
API sẽ chạy tại: `http://localhost:8000`

### 2. Chuẩn bị Frontend
```bash
cd frontend
npm install
npm run dev
```
Truy cập giao diện tại: `http://localhost:3000`

---

## Danh sách các lớp phân đoạn (Classes)

| ID | Class Name | Màu sắc (RGB) |
| :--- | :--- | :--- |
| 0 | Background | `[20, 20, 20]` (Xám đậm) |
| 1 | Building | `[139, 69, 19]` (Nâu) |
| 2 | Road | `[128, 128, 128]` (Xám) |
| 3 | **Water** | `[30, 100, 220]` (Xanh dương) |
| 8 | **Flooded Building** | `[255, 105, 180]` (Hồng) |
| 9 | **Flooded Road** | `[148, 0, 211]` (Tím) |
*(Xem chi tiết trong `backend/config.json`)*

---

## Triển khai (Deployment)

Chi tiết xem tại [DEPLOYMENT.md](./DEPLOYMENT.md).

1.  **Backend:** Khuyến nghị dùng **Render** hoặc **Hugging Face Spaces** (Docker).
2.  **Frontend:** Khuyến nghị dùng **Vercel**.

### Ví dụ chạy với Docker:
```bash
docker build -t flood-api .
docker run -p 8000:8000 flood-api
```

---

## Giấy phép (License)

Dự án này được phát hành dưới giấy phép **MIT License**.

---
*Created by Team 3 DPL303m.*
