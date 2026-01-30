-- Sửa cột id trong bảng activities để có DEFAULT UUID
-- Chạy script này trong Supabase SQL Editor

-- 1. Kiểm tra cấu trúc hiện tại
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'activities' AND column_name = 'id';

-- 2. Sửa cột id để có DEFAULT gen_random_uuid()
ALTER TABLE activities 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Kiểm tra lại cấu trúc
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'activities' AND column_name = 'id';

-- 4. Test insert lại
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
    'Test Activity Fixed',
    'This is a test activity with fixed ID',
    'workshop',
    NOW(),
    NOW() + INTERVAL '2 hours',
    'Test Location',
    (SELECT id FROM users LIMIT 1),
    30
) RETURNING *;

