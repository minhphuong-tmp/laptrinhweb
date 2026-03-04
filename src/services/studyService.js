import { supabase } from '../lib/supabase';

/**
 * Gửi yêu cầu hỗ trợ học tập cho một môn học cụ thể
 */
export const requestStudySupport = async (userId, subjectName, currentGrade) => {
    try {
        console.log('📝 Requesting study support:', { subjectName, currentGrade });

        const { data, error } = await supabase
            .from('study_requests')
            .insert([{
                user_id: userId,
                subject_name: subjectName,
                current_grade: currentGrade,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Error requesting study support:', error);
            return { data: null, error };
        }

        console.log('✅ Study support requested successfully');
        return { data, error: null };
    } catch (error) {
        console.error('❌ Error in requestStudySupport:', error);
        return { data: null, error };
    }
};

/**
 * Lấy danh sách các buổi học (sessions) đang có
 */
export const getStudySessions = async () => {
    try {
        const { data, error } = await supabase
            .from('study_sessions')
            .select('*')
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('❌ Error fetching study sessions:', error);
            return { data: [], error };
        }

        // --- Bắt đầu phần Mock Data ---
        let finalData = data || [];
        if (finalData.length === 0) {
            const now = new Date();
            finalData = [
                {
                    id: 'mock-session-1',
                    subject_name: 'Giải tích 1',
                    mentor_id: 'mentor-1',
                    scheduled_at: new Date(now.getTime() - 1000 * 60 * 15).toISOString(), // 15 phút trước
                    room_url: '/study-room/mock-session-1',
                    member_count: 5,
                    status: 'ongoing'
                },
                {
                    id: 'mock-session-2',
                    subject_name: 'Lập trình C/C++',
                    mentor_id: 'mentor-2',
                    scheduled_at: new Date(now.getTime() + 1000 * 60 * 60 * 2).toISOString(), // 2 tiếng sau
                    room_url: '/study-room/mock-session-2',
                    member_count: 12,
                    status: 'upcoming'
                }
            ];
        }
        // --- Kết thúc phần Mock Data ---

        return { data: finalData, error: null };
    } catch (error) {
        console.error('❌ Error in getStudySessions:', error);
        return { data: [], error };
    }
};

/**
 * Lấy danh sách các môn được đăng ký nhiều nhất (public)
 */
export const getTopRequestedSubjects = async () => {
    try {
        const { data, error } = await supabase
            .from('study_requests')
            .select('subject_name, status')
            .eq('status', 'pending');

        if (error) return { data: [], error };

        // --- Bắt đầu phần Mock Data nếu rỗng ---
        let rawData = data || [];
        if (rawData.length === 0) {
            rawData = [
                { subject_name: 'Vật lý 1', status: 'pending' },
                { subject_name: 'Vật lý 1', status: 'pending' },
                { subject_name: 'Vật lý 1', status: 'pending' },
                { subject_name: 'Vật lý 1', status: 'pending' },
                { subject_name: 'Cơ học cơ sở', status: 'pending' },
                { subject_name: 'Cơ học cơ sở', status: 'pending' },
                { subject_name: 'Toán rời rạc', status: 'pending' },
            ];
        }

        // Thống kê số lượng theo tên môn
        const stats = rawData.reduce((acc, curr) => {
            acc[curr.subject_name] = (acc[curr.subject_name] || 0) + 1;
            return acc;
        }, {});

        const sortedStats = Object.entries(stats)
            .map(([name, count]) => ({ subject_name: name, count }))
            .sort((a, b) => b.count - a.count);

        return { data: sortedStats, error: null };
    } catch (error) {
        return { data: [], error };
    }
};
