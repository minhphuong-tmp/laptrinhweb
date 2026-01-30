-- Test script để kiểm tra bảng activities
-- Chạy script này trong Supabase SQL Editor

-- 1. Kiểm tra cấu trúc bảng
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;

-- 2. Kiểm tra constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'activities';

-- 3. Test tạo activity mẫu
INSERT INTO activities (
    title,
    description,
    activity_type,
    start_date,
    end_date,
    location,
    organizer_id,
    max_participants
) VALUES (
    'Test Activity',
    'This is a test activity',
    'workshop',
    NOW(),
    NOW() + INTERVAL '2 hours',
    'Test Location',
    (SELECT id FROM users LIMIT 1),
    30
) RETURNING *;

-- 4. Kiểm tra dữ liệu đã tạo
SELECT * FROM activities ORDER BY created_at DESC LIMIT 5;

