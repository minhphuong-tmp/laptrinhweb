-- Kiểm tra bảng users
-- Chạy script này trong Supabase SQL Editor

-- 1. Kiểm tra cấu trúc bảng users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Kiểm tra dữ liệu trong bảng users
SELECT id, name, email, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Đếm số lượng users
SELECT COUNT(*) as user_count FROM users;

-- 4. Nếu không có users, tạo user mẫu
INSERT INTO users (
    id,
    email,
    name,
    created_at
) VALUES (
    gen_random_uuid(),
    'test@example.com',
    'Test User',
    NOW()
) ON CONFLICT (id) DO NOTHING
RETURNING *;
