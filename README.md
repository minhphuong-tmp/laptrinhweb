# Xây dựng Website CLB Tin học

Link GitHub: https://github.com/minhphuong-tmp/laptrinhweb

Số lượng thành viên: 01 (Full Stack Developer)

## Công nghệ sử dụng

### Frontend
- HTML, CSS, Javascript, TypeScript
- ReactJS 19 (Hooks)
- Redux

### Backend
- Node.js (Express)
- JavaScript, TypeScript
- NestJS

### Database
- Supabase

## Mô tả chức năng chính

Đầy đủ chức năng giống một trang mạng xã hội và có sự cải tiến thêm để phù hợp với mô hình CLB.

### Chức năng chat
- Mã hóa thiết bị đầu cuối: Đảm bảo tin nhắn gửi từ thiết bị nào thì chỉ có thiết bị đó đọc được.
- 100% tin nhắn ở Database lưu dưới dạng mã hóa cyphertext thay vì plaintext.

### Truyền thông đa phương tiện
- Đầy đủ chức năng call video, call voice.
- Chat nhóm.
- Gửi hình ảnh, video, tin nhắn.

### Hiệu năng
- Cache dữ liệu: Khi người dùng truy cập, dữ liệu được lấy ra từ Cache sẽ nhanh hơn thay vì đợi lấy từ Database.
- Cải thiện tốc độ từ khoảng 800ms xuống 40ms.

### Đăng nhập & Bảo mật
- Đăng nhập bằng tài khoản Google.
- Tài khoản được đăng ký sử dụng JWT.
- Phân quyền giữa Chủ Nhiệm CLB và thành viên.

### Quản lý nội dung
- Phân trang khi lướt xem bài viết.
- Đăng, sửa, xóa bài viết.
- Bình luận, like bài viết.

### Thành viên
- Xem hồ sơ cá nhân.
- Tìm kiếm thành viên.
- CRUD (Create, Read, Update, Delete) thông tin.

## Cài đặt và chạy dự án

### 1. Clone repository
```bash
git clone https://github.com/minhphuong-tmp/laptrinhweb.git
cd web-app
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` ở thư mục gốc và thêm các thông tin cấu hình Supabase:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Chạy dự án
```bash
npm start
```
Dự án sẽ chạy tại `http://localhost:3000`