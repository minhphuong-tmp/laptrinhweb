import { supabase } from '../lib/supabase';

// ===== CLB MEMBERS API =====
export const clbApi = {
    // Lấy danh sách thành viên CLB
    getMembers: async () => {
        try {
            const { data, error } = await supabase
                .from('clb_members')
                .select(`
                    *,
                    users:user_id (
                        id,
                        name,
                        email,
                        image,
                        bio,
                        created_at
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error loading CLB members:', error);
            return { success: false, error: error.message };
        }
    },

    // Thêm thành viên vào CLB
    addMember: async (memberData) => {
        try {
            const { data, error } = await supabase
                .from('clb_members')
                .insert([memberData])
                .select(`
                    *,
                    users:user_id (
                        id,
                        name,
                        email,
                        image,
                        bio,
                        created_at
                    )
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error adding CLB member:', error);
            return { success: false, error: error.message };
        }
    },

    // Cập nhật thông tin thành viên
    updateMember: async (memberId, updates) => {
        try {
            const { data, error } = await supabase
                .from('clb_members')
                .update(updates)
                .eq('id', memberId)
                .select(`
                    *,
                    users:user_id (
                        id,
                        name,
                        email,
                        image,
                        bio,
                        created_at
                    )
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating CLB member:', error);
            return { success: false, error: error.message };
        }
    },

    // Xóa thành viên khỏi CLB
    removeMember: async (memberId) => {
        try {
            const { error } = await supabase
                .from('clb_members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error removing CLB member:', error);
            return { success: false, error: error.message };
        }
    },

    // Lấy thông tin thành viên theo user_id
    getMemberByUserId: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('clb_members')
                .select(`
                    *,
                    users:user_id (
                        id,
                        name,
                        email,
                        image,
                        bio,
                        created_at
                    )
                `)
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting CLB member:', error);
            return { success: false, error: error.message };
        }
    },

    // Lấy danh sách users chưa tham gia CLB
    getAvailableUsers: async () => {
        try {
            // Lấy tất cả users
            const { data: allUsers, error: usersError } = await supabase
                .from('users')
                .select('id, name, email, image, bio, created_at')
                .order('name');

            if (usersError) throw usersError;

            // Lấy danh sách user_id đã tham gia CLB
            const { data: clbMembers, error: membersError } = await supabase
                .from('clb_members')
                .select('user_id');

            if (membersError) throw membersError;

            const memberIds = clbMembers.map(member => member.user_id);
            const availableUsers = allUsers.filter(user => !memberIds.includes(user.id));

            return { success: true, data: availableUsers };
        } catch (error) {
            console.error('Error getting available users:', error);
            return { success: false, error: error.message };
        }
    }
};

/**
 * Lấy thông tin CLB member của user hiện tại
 * @param {string} userId - ID của user
 * @returns {Promise<Object>} Thông tin CLB member
 */
export const getCurrentUserCLBInfo = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('clb_members')
            .select(`
                *,
                users (
                    id,
                    name,
                    email,
                    image
                )
            `)
            .eq('user_id', userId)
            .single();

        if (error) {
            // Nếu không tìm thấy record, có thể user chưa được thêm vào CLB
            if (error.code === 'PGRST116') {
                return { success: true, data: null, message: 'User chưa được thêm vào CLB' };
            }
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching CLB member info:', error);
        return { success: false, error, message: 'Không thể lấy thông tin CLB member' };
    }
};

/**
 * Kiểm tra xem user có quyền truy cập thống kê không
 * @param {string} userId - ID của user
 * @returns {Promise<boolean>} True nếu có quyền
 */
export const hasStatisticsAccess = async (userId) => {
    try {
        const result = await getCurrentUserCLBInfo(userId);

        if (!result.success || !result.data) {
            return false;
        }

        const allowedRoles = ['Chủ nhiệm CLB', 'Phó Chủ Nhiệm'];
        return allowedRoles.includes(result.data.role);
    } catch (error) {
        console.error('Error checking statistics access:', error);
        return false;
    }
};

