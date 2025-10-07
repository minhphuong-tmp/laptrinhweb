import { supabase } from "../lib/supabase";
import { getSupabaseFileUrl } from "./imageService";

// Lấy bài viết của user với phân trang
export const fetchPost = async (limit, userId) => {
    try {
        console.log('🔍 Fetching posts for user:', userId);
        console.log('📊 Limit:', limit);

        if (userId) {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                *,
                user:users(id,name,image),
                postLikes(*),
                comments (count)
                `)
                .order('created_at', { ascending: false })
                .eq('userId', userId)
                .limit(limit);

            console.log('📦 Raw data from Supabase:', data);
            console.log('❌ Error from Supabase:', error);

            if (error) {
                console.log('fetchPosts error:', error);
                return { success: false, msg: 'Could not fetch the posts' };
            }

            // Xử lý file URL cho mỗi post
            const processedData = data.map(post => {
                console.log('🔍 Processing post:', post.id, 'File:', post.file);
                return {
                    ...post,
                    file: post.file ? getSupabaseFileUrl(post.file) : null
                };
            });

            console.log('✅ Processed data:', processedData);
            return { success: true, data: processedData };
        }
    } catch (error) {
        console.log('fetchPost error:', error);
        return { success: false, msg: 'Could not fetchPost your post' };
    }
}

// Lấy chi tiết bài viết với comments
export const fetchPostDetails = async (postId) => {
    try {
        console.log('🔍 Fetching post details for:', postId);

        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                user:users(id,name,image),
                postLikes(*),
                comments(*, user:users(id,name,image))
                `)
            .eq('id', postId)
            .order('created_at', { ascending: false, foreignTable: 'comments' })
            .single();

        console.log('📦 Raw post details:', data);
        console.log('❌ Error:', error);

        if (error) {
            console.log('fetchPostsDetails error:', error);
            return { success: false, msg: 'Could not fetch the posts details' };
        }

        // Xử lý file URL
        const processedData = {
            ...data,
            file: data.file ? getSupabaseFileUrl(data.file) : null
        };

        console.log('✅ Processed post details:', processedData);
        return { success: true, data: processedData };
    } catch (error) {
        console.log('fetchPostDetails error:', error);
        return { success: false, msg: 'Could not fetchPost your post details' };
    }
}

// Thêm like
export const createPostLike = async (postLikes) => {
    try {
        const { data, error } = await supabase
            .from('postLikes')
            .insert(postLikes)
            .select()
            .single();

        if (error) {
            console.log('Post like error:', error);
            return { success: false, msg: 'Could not fetch the posts like' };
        }
        return { success: true, data: data };
    } catch (error) {
        console.log('fetchPost error:', error);
        return { success: false, msg: 'Could not fetchPost your post like' };
    }
}

// Bỏ like
export const removePostLike = async (postId, userId) => {
    try {
        const { error } = await supabase
            .from('postLikes')
            .delete()
            .eq('postId', postId)
            .eq('userId', userId);

        if (error) {
            console.log('Post delete error:', error);
            return { success: false, msg: 'Could not fetch the posts delete' };
        }
        return { success: true };
    } catch (error) {
        console.log('fetchPost error:', error);
        return { success: false, msg: 'Could not fetchPost your post delete' };
    }
}

// Thêm comment
export const createComment = async (comment) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert(comment)
            .select()
            .single();

        if (error) {
            console.log('comments error:', error);
            return { success: false, msg: 'Could not fetch the comments' };
        }
        return { success: true, data: data };
    } catch (error) {
        console.log('comments error:', error);
        return { success: false, msg: 'Could not comments' };
    }
}

// Xóa comment
export const removeComment = async (commentId) => {
    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            console.log('Comment delete error:', error);
            return { success: false, msg: 'Could not fetch the comments delete' };
        }
        return { success: true, data: { commentId } };
    } catch (error) {
        console.log('comment error:', error);
        return { success: false, msg: 'Could not fetchPost your comment delete' };
    }
}
