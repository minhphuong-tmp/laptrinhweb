import { supabase } from "../lib/supabase";

// Lấy bài viết của user cụ thể với phân trang
export const fetchUserPosts = async (limit, userId) => {
    try {
        if (!userId) {
            return { success: false, msg: 'User ID is required' };
        }

        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                user:users(id,name,image),
                postLikes(count),
                comments(count)
            `)
            .order('created_at', { ascending: false })
            .eq('userId', userId)
            .limit(limit);

        if (error) {
            console.log('fetchUserPosts error:', error);
            return { success: false, msg: 'Could not fetch the posts' };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.log('fetchUserPosts error:', error);
        return { success: false, msg: 'Could not fetch user posts' };
    }
};

// Lấy tất cả bài viết với phân trang
export const fetchAllPosts = async (limit, offset = 0) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                user:users(id,name,image),
                postLikes(count),
                comments(count)
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.log('fetchAllPosts error:', error);
            return { success: false, msg: 'Could not fetch the posts' };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.log('fetchAllPosts error:', error);
        return { success: false, msg: 'Could not fetch posts' };
    }
};

// Lấy thông tin chi tiết của một bài viết
export const fetchPostById = async (postId) => {
    try {
        // Try with user:users first (if foreign key is userId)
        let { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                user:users(id,name,image),
                postLikes(*),
                comments(*)
            `)
            .eq('id', postId)
            .single();

        // If that fails, try with users:user_id (if foreign key is user_id)
        if (error || !data?.user) {
            const retry = await supabase
                .from('posts')
                .select(`
                    *,
                    users:user_id(id,name,image),
                    postLikes(*),
                    comments(*)
                `)
                .eq('id', postId)
                .single();
            
            if (!retry.error && retry.data) {
                data = retry.data;
                error = null;
                // Rename users to user for consistency
                if (data.users) {
                    data.user = data.users;
                }
            }
        }

        if (error) {
            console.log('fetchPostById error:', error);
            return { success: false, msg: 'Could not fetch the post' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('fetchPostById error:', error);
        return { success: false, msg: 'Could not fetch post' };
    }
};

// Tạo bài viết mới
export const createPost = async (postData) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .insert([postData])
            .select()
            .single();

        if (error) {
            console.log('createPost error:', error);
            return { success: false, msg: 'Could not create the post' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('createPost error:', error);
        return { success: false, msg: 'Could not create post' };
    }
};

// Cập nhật bài viết
export const updatePost = async (postId, updateData) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', postId)
            .select()
            .single();

        if (error) {
            console.log('updatePost error:', error);
            return { success: false, msg: 'Could not update the post' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('updatePost error:', error);
        return { success: false, msg: 'Could not update post' };
    }
};

// Xóa bài viết
export const deletePost = async (postId) => {
    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) {
            console.log('deletePost error:', error);
            return { success: false, msg: 'Could not delete the post' };
        }

        return { success: true };
    } catch (error) {
        console.log('deletePost error:', error);
        return { success: false, msg: 'Could not delete post' };
    }
};

// Like/Unlike bài viết (sử dụng likesService)
export const togglePostLike = async (postId, userId) => {
    try {
        // Import likesService dynamically để tránh circular dependency
        const { toggleLike } = await import('../services/likesService');
        const result = await toggleLike(postId, userId);

        if (result.success) {
            return { success: true, message: result.message };
        } else {
            return { success: false, msg: result.message };
        }
    } catch (error) {
        console.log('togglePostLike error:', error);
        return { success: false, msg: 'Could not toggle like' };
    }
};

// Lấy URL file từ Supabase Storage
export const getSupabaseFileUrl = (filePath) => {
    if (!filePath) return null;

    const supabaseUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co';
    return `${supabaseUrl}/storage/v1/object/public/${filePath}`;
};