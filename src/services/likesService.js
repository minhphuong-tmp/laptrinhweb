import { supabase } from '../lib/supabase';

// ===== LIKES SERVICE =====

/**
 * Like một post
 * @param {number} postId - ID của post
 * @param {string} userId - ID của user
 * @returns {Promise<Object>} Kết quả like
 */
export const likePost = async (postId, userId) => {
    try {
        const { data, error } = await supabase
            .from('postLikes')
            .insert({
                postId: postId,
                userId: userId
            })
            .select()
            .single();

        if (error) {
            // Nếu đã like rồi (unique constraint violation)
            if (error.code === '23505') {
                return { success: false, message: 'Bạn đã thích bài viết này rồi' };
            }
            throw error;
        }

        return { success: true, data, message: 'Đã thích bài viết' };
    } catch (error) {
        console.error('Error liking post:', error);
        return { success: false, message: 'Không thể thích bài viết', error };
    }
};

/**
 * Unlike một post
 * @param {number} postId - ID của post
 * @param {string} userId - ID của user
 * @returns {Promise<Object>} Kết quả unlike
 */
export const unlikePost = async (postId, userId) => {
    try {
        const { data, error } = await supabase
            .from('postLikes')
            .delete()
            .eq('postId', postId)
            .eq('userId', userId)
            .select();

        if (error) throw error;

        return { success: true, data, message: 'Đã bỏ thích bài viết' };
    } catch (error) {
        console.error('Error unliking post:', error);
        return { success: false, message: 'Không thể bỏ thích bài viết', error };
    }
};

/**
 * Toggle like/unlike một post
 * @param {number} postId - ID của post
 * @param {string} userId - ID của user
 * @returns {Promise<Object>} Kết quả toggle
 */
export const toggleLike = async (postId, userId) => {
    try {
        // Kiểm tra đã like chưa
        const { data: existingLike, error: checkError } = await supabase
            .from('postLikes')
            .select('id')
            .eq('postId', postId)
            .eq('userId', userId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
            throw checkError;
        }

        if (existingLike) {
            // Đã like rồi, unlike
            return await unlikePost(postId, userId);
        } else {
            // Chưa like, like
            return await likePost(postId, userId);
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        return { success: false, message: 'Không thể thực hiện thao tác', error };
    }
};

/**
 * Kiểm tra user đã like post chưa
 * @param {number} postId - ID của post
 * @param {string} userId - ID của user
 * @returns {Promise<boolean>} True nếu đã like
 */
export const hasUserLikedPost = async (postId, userId) => {
    try {
        const { data, error } = await supabase
            .from('postLikes')
            .select('id')
            .eq('postId', postId)
            .eq('userId', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.warn('Error checking like status:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('Error checking like status:', error);
        return false;
    }
};

/**
 * Lấy danh sách likes của một post
 * @param {number} postId - ID của post
 * @returns {Promise<Object>} Danh sách likes với thông tin user
 */
export const getPostLikes = async (postId) => {
    try {
        const { data, error } = await supabase
            .from('postLikes')
            .select(`
                id,
                created_at,
                users (
                    id,
                    name,
                    image
                )
            `)
            .eq('postId', postId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error fetching post likes:', error);
        return { success: false, data: [], error };
    }
};

/**
 * Lấy số lượng likes của một post
 * @param {number} postId - ID của post
 * @returns {Promise<number>} Số lượng likes
 */
export const getPostLikesCount = async (postId) => {
    try {
        const { count, error } = await supabase
            .from('postLikes')
            .select('*', { count: 'exact', head: true })
            .eq('postId', postId);

        if (error) throw error;

        return count || 0;
    } catch (error) {
        console.error('Error fetching post likes count:', error);
        return 0;
    }
};
