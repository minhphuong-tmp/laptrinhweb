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
                postLikes(*),
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
                postLikes(*),
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
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                user:users(id,name,image),
                postLikes(*),
                comments(*)
            `)
            .eq('id', postId)
            .single();

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

// Like/Unlike bài viết
export const togglePostLike = async (postId, userId) => {
    try {
        // Kiểm tra xem user đã like chưa
        const { data: existingLike, error: checkError } = await supabase
            .from('postLikes')
            .select('id')
            .eq('postId', postId)
            .eq('userId', userId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.log('togglePostLike check error:', checkError);
            return { success: false, msg: 'Could not check like status' };
        }

        if (existingLike) {
            // Unlike
            const { error } = await supabase
                .from('postLikes')
                .delete()
                .eq('id', existingLike.id);

            if (error) {
                console.log('unlike error:', error);
                return { success: false, msg: 'Could not unlike the post' };
            }
        } else {
            // Like
            const { error } = await supabase
                .from('postLikes')
                .insert([{ postId, userId }]);

            if (error) {
                console.log('like error:', error);
                return { success: false, msg: 'Could not like the post' };
            }
        }

        return { success: true };
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