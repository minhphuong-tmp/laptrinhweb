import { supabase } from "../lib/supabase";

export const getUserData = async (userId) => {
    try {
        // Lấy dữ liệu từ bảng users tùy chỉnh
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select()
            .eq('id', userId)
            .single();

        // Lấy dữ liệu từ Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (userError) {
            return { success: false, msg: userError?.message };
        }

        if (authError) {
            return { success: false, msg: authError?.message };
        }

        // Merge dữ liệu từ cả hai nguồn
        const mergedData = {
            ...userData,
            email: authData.user?.email || userData.email, // Ưu tiên email từ auth
            email_confirmed_at: authData.user?.email_confirmed_at,
            created_at: authData.user?.created_at,
            updated_at: authData.user?.updated_at
        };

        return { success: true, data: mergedData };
    } catch (error) {
        console.log('got error: ', error);
        return { success: false, msg: error.message };
    }
};

export const updateUser = async (userId, data) => {
    try {
        const { error } = await supabase
            .from('users')
            .update(data)
            .eq('id', userId);

        if (error) {
            return { success: false, msg: error?.message };
        }

        return { success: true, data };
    } catch (error) {
        console.log('got error: ', error);
        return { success: false, msg: error.message };
    }
};

export const createUser = async (userData) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();

        if (error) {
            return { success: false, msg: error?.message };
        }

        return { success: true, data };
    } catch (error) {
        console.log('got error: ', error);
        return { success: false, msg: error.message };
    }
};

export const deleteUser = async (userId) => {
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) {
            return { success: false, msg: error?.message };
        }

        return { success: true };
    } catch (error) {
        console.log('got error: ', error);
        return { success: false, msg: error.message };
    }
};

// Helper function để check user có tồn tại không
export const checkUserExists = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();

        if (error) {
            return { success: false, exists: false };
        }

        return { success: true, exists: !!data };
    } catch (error) {
        console.log('got error: ', error);
        return { success: false, exists: false };
    }
};

// Helper function để sync user data với auth
export const syncUserWithAuth = async (userId) => {
    try {
        const userRes = await getUserData(userId);
        if (userRes.success) {
            return userRes;
        } else {
            // Nếu không lấy được từ database, tạo user mới
            const { data: authData } = await supabase.auth.getUser();
            if (authData.user) {
                const newUserData = {
                    id: authData.user.id,
                    email: authData.user.email,
                    name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
                    image: authData.user.user_metadata?.avatar_url || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const createRes = await createUser(newUserData);
                if (createRes.success) {
                    return { success: true, data: createRes.data };
                }
            }
            return { success: false, msg: 'Failed to sync user data' };
        }
    } catch (error) {
        console.log('got error: ', error);
        return { success: false, msg: error.message };
    }
};

// Lấy tất cả users (cho chat, search, etc.)
export const getAllUsers = async (limit = 50, offset = 0) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*') // Select tất cả fields để debug
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.log('getAllUsers error:', error);
            return { success: false, msg: error?.message };
        }

        console.log('All users data:', data);

        // Đảm bảo có image field
        const processedUsers = (data || []).map(user => ({
            ...user,
            image: user.image || user.avatar || user.avatar_url || null
        }));

        return { success: true, data: processedUsers };
    } catch (error) {
        console.log('got error: ', error);
        return { success: false, msg: error.message };
    }
};

// Tìm kiếm users theo tên hoặc email
export const searchUsers = async (query, limit = 20) => {
    try {
        if (!query || query.trim().length < 2) {
            return { success: true, data: [] };
        }

        const searchTerm = `%${query.trim()}%`;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
            .limit(limit);

        if (error) {
            console.log('searchUsers error:', error);
            return { success: false, msg: error?.message };
        }

        // Đảm bảo có image field
        const processedUsers = (data || []).map(user => ({
            ...user,
            image: user.image || user.avatar || user.avatar_url || null
        }));

        return { success: true, data: processedUsers };
    } catch (error) {
        console.log('got error: ', error);
        return { success: false, msg: error.message };
    }
};