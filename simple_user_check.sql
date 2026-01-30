-- Script đơn giản để kiểm tra và tạo user
-- Chạy script này trong Supabase SQL Editor

-- 1. Kiểm tra cấu trúc bảng users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Kiểm tra dữ liệu trong bảng users
SELECT id, name, email 
FROM users 
LIMIT 3;

-- 3. Nếu không có users, tạo user mẫu đơn giản
INSERT INTO users (
    id,
    email,
    name
) VALUES (
    gen_random_uuid(),
    'test@example.com',
    'Test User'
) ON CONFLICT (id) DO NOTHING
RETURNING id, name, email;

