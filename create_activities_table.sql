-- Tạo bảng activities để quản lý sự kiện CLB
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL DEFAULT 'workshop',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_participants INTEGER DEFAULT 30,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'upcoming',
    thumbnail TEXT,
    tags TEXT[],
    requirements TEXT[],
    materials JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng activity_participants để quản lý người tham gia
CREATE TABLE IF NOT EXISTS activity_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'registered',
    UNIQUE(activity_id, user_id)
);

-- Tạo index để tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_activities_organizer ON activities(organizer_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date);
CREATE INDEX IF NOT EXISTS idx_activities_end_date ON activities(end_date);
CREATE INDEX IF NOT EXISTS idx_activities_tags ON activities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user ON activity_participants(user_id);

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON activities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_activities_updated_at();

-- Thêm RLS (Row Level Security) policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;

-- Policy cho activities: Mọi người có thể xem activities public
CREATE POLICY "Public activities are viewable by everyone" ON activities
    FOR SELECT USING (true);

-- Policy cho activities: Chỉ organizer mới có thể update/delete activities của mình
CREATE POLICY "Organizers can update their own activities" ON activities
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own activities" ON activities
    FOR DELETE USING (auth.uid() = organizer_id);

-- Policy cho activities: Authenticated users có thể tạo activities
CREATE POLICY "Authenticated users can create activities" ON activities
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- Policy cho activity_participants: Mọi người có thể xem participants
CREATE POLICY "Activity participants are viewable by everyone" ON activity_participants
    FOR SELECT USING (true);

-- Policy cho activity_participants: Users có thể đăng ký tham gia
CREATE POLICY "Users can register for activities" ON activity_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy cho activity_participants: Users có thể hủy đăng ký
CREATE POLICY "Users can unregister from activities" ON activity_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Policy cho activity_participants: Organizers có thể quản lý participants
CREATE POLICY "Organizers can manage participants" ON activity_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM activities 
            WHERE id = activity_participants.activity_id 
            AND organizer_id = auth.uid()
        )
    );

-- Function để tăng current_participants khi có người đăng ký
CREATE OR REPLACE FUNCTION increment_activity_participants()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE activities 
    SET current_participants = current_participants + 1
    WHERE id = NEW.activity_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function để giảm current_participants khi có người hủy đăng ký
CREATE OR REPLACE FUNCTION decrement_activity_participants()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE activities 
    SET current_participants = current_participants - 1
    WHERE id = OLD.activity_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Tạo triggers
CREATE TRIGGER increment_participants_on_insert
    AFTER INSERT ON activity_participants
    FOR EACH ROW
    EXECUTE FUNCTION increment_activity_participants();

CREATE TRIGGER decrement_participants_on_delete
    AFTER DELETE ON activity_participants
    FOR EACH ROW
    EXECUTE FUNCTION decrement_activity_participants();

-- Function để lấy activities với thông tin organizer
CREATE OR REPLACE FUNCTION get_activities_with_organizer(
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0,
    activity_type_filter VARCHAR DEFAULT NULL,
    status_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    activity_type VARCHAR,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR,
    organizer_id UUID,
    organizer_name VARCHAR,
    organizer_image TEXT,
    max_participants INTEGER,
    current_participants INTEGER,
    status VARCHAR,
    thumbnail TEXT,
    tags TEXT[],
    requirements TEXT[],
    materials JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.description,
        a.activity_type,
        a.start_date,
        a.end_date,
        a.location,
        a.organizer_id,
        u.name as organizer_name,
        u.image as organizer_image,
        a.max_participants,
        a.current_participants,
        a.status,
        a.thumbnail,
        a.tags,
        a.requirements,
        a.materials,
        a.created_at,
        a.updated_at
    FROM activities a
    JOIN users u ON a.organizer_id = u.id
    WHERE 
        (activity_type_filter IS NULL OR a.activity_type = activity_type_filter)
        AND (status_filter IS NULL OR a.status = status_filter)
    ORDER BY a.start_date ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function để kiểm tra user đã đăng ký activity chưa
CREATE OR REPLACE FUNCTION is_user_registered_for_activity(
    user_uuid UUID,
    activity_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM activity_participants 
        WHERE user_id = user_uuid AND activity_id = activity_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

