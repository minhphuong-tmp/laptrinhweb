-- Sửa lỗi bảng clb_members
-- Thêm UNIQUE constraint cho user_id
ALTER TABLE clb_members ADD CONSTRAINT clb_members_user_id_unique UNIQUE (user_id);

-- Xóa trigger cũ nếu tồn tại và tạo lại
DROP TRIGGER IF EXISTS update_clb_members_updated_at ON clb_members;

-- Tạo lại trigger
CREATE TRIGGER update_clb_members_updated_at 
    BEFORE UPDATE ON clb_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

