-- Tạo bảng clb_members để quản lý thành viên CLB
CREATE TABLE IF NOT EXISTS clb_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Thành viên',
    major VARCHAR(100) DEFAULT 'Công nghệ thông tin',
    year VARCHAR(10) DEFAULT '2024',
    phone VARCHAR(20),
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index để tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_clb_members_user_id ON clb_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clb_members_student_id ON clb_members(student_id);
CREATE INDEX IF NOT EXISTS idx_clb_members_role ON clb_members(role);

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clb_members_updated_at 
    BEFORE UPDATE ON clb_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Thêm RLS (Row Level Security) policies
ALTER TABLE clb_members ENABLE ROW LEVEL SECURITY;

-- Policy cho phép tất cả authenticated users đọc dữ liệu
CREATE POLICY "Allow authenticated users to read clb_members" ON clb_members
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy cho phép authenticated users thêm thành viên
CREATE POLICY "Allow authenticated users to insert clb_members" ON clb_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy cho phép authenticated users cập nhật thành viên
CREATE POLICY "Allow authenticated users to update clb_members" ON clb_members
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy cho phép authenticated users xóa thành viên
CREATE POLICY "Allow authenticated users to delete clb_members" ON clb_members
    FOR DELETE USING (auth.role() = 'authenticated');
