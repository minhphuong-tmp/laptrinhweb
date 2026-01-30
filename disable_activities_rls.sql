-- Tạm thời disable RLS để test
-- Chạy script này trong Supabase SQL Editor

-- Disable RLS cho bảng activities
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- Disable RLS cho bảng activity_participants
ALTER TABLE activity_participants DISABLE ROW LEVEL SECURITY;

-- Kiểm tra RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('activities', 'activity_participants');

