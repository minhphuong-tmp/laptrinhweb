-- Kiểm tra RPC functions đã tạo
-- Chạy script này để xem functions có tồn tại không

-- Kiểm tra functions trong schema
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('increment_download_count', 'get_download_count');

-- Kiểm tra documents table
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
AND column_name = 'download_count';


