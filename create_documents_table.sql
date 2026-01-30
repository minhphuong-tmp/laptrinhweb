-- Tạo bảng documents trong Supabase
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    file_type VARCHAR(50),
    file_size INTEGER,
    file_path VARCHAR(500),
    uploader_id UUID REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT NOW(),
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,1) DEFAULT 0,
    tags TEXT[],
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tạo index để tối ưu tìm kiếm
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_uploader ON documents(uploader_id);
CREATE INDEX idx_documents_upload_date ON documents(upload_date);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);

-- Tạo RLS (Row Level Security) policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người có thể xem documents public
CREATE POLICY "Public documents are viewable by everyone" ON documents
    FOR SELECT USING (is_public = true);

-- Policy: Chỉ uploader mới có thể update/delete documents của mình
CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.uid() = uploader_id);

CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (auth.uid() = uploader_id);

-- Policy: Authenticated users có thể insert documents
CREATE POLICY "Authenticated users can insert documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = uploader_id);

-- ========================================
-- STORAGE POLICIES (cho bucket documents)
-- ========================================

-- Policy: Mọi người có thể xem files trong bucket documents
CREATE POLICY "Public documents are viewable by everyone" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents');

-- Policy: Authenticated users có thể upload files
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

-- Policy: Users có thể update files của mình
CREATE POLICY "Users can update their own documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users có thể delete files của mình
CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ========================================
-- RPC FUNCTIONS (cho download count)
-- ========================================

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
