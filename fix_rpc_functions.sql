-- Tạo RPC functions cho download count
-- Chạy script này trong Supabase SQL Editor

-- Function để tăng download count
CREATE OR REPLACE FUNCTION increment_download_count(doc_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    -- Tăng download_count lên 1
    UPDATE documents 
    SET download_count = download_count + 1,
        updated_at = NOW()
    WHERE id = doc_id
    RETURNING download_count INTO new_count;
    
    -- Trả về count mới
    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function để lấy download count
CREATE OR REPLACE FUNCTION get_download_count(doc_id UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT download_count INTO count_result
    FROM documents 
    WHERE id = doc_id;
    
    RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test functions
SELECT increment_download_count('ac0dbad9-5d40-4f30-a89b-6a7a38ebb4b2'::UUID);
SELECT get_download_count('ac0dbad9-5d40-4f30-a89b-6a7a38ebb4b2'::UUID);


