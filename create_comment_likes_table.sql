-- Tạo bảng commentLikes để quản lý lượt thích comment
CREATE TABLE IF NOT EXISTS commentLikes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    commentId UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(commentId, userId) -- Đảm bảo mỗi user chỉ like một comment một lần
);

-- Tạo index để tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON commentLikes(commentId);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON commentLikes(userId);
CREATE INDEX IF NOT EXISTS idx_comment_likes_created ON commentLikes(created_at);

-- Tạo RLS (Row Level Security) policies
ALTER TABLE commentLikes ENABLE ROW LEVEL SECURITY;

-- Policy: Mọi người có thể xem likes
CREATE POLICY "Anyone can view comment likes" ON commentLikes
    FOR SELECT USING (true);

-- Policy: Chỉ authenticated users mới có thể like/unlike
CREATE POLICY "Authenticated users can insert comment likes" ON commentLikes
    FOR INSERT WITH CHECK (auth.uid() = userId);

CREATE POLICY "Users can delete their own comment likes" ON commentLikes
    FOR DELETE USING (auth.uid() = userId);


