import { supabase } from "../lib/supabase";

// ===== POSTS SERVICE =====
export const createPost = async (postData) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .insert(postData)
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    image
                )
            `)
            .single();

        if (error) {
            console.log('createPost error:', error);
            return { success: false, msg: 'Không thể tạo bài viết' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('createPost error:', error);
        return { success: false, msg: 'Không thể tạo bài viết' };
    }
};

export const getPosts = async (limit = 20, offset = 0) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    image
                ),
                post_likes (
                    id,
                    user_id
                ),
                comments (
                    id,
                    content,
                    user_id,
                    created_at,
                    users:user_id (
                        id,
                        name,
                        image
                    )
                )
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.log('getPosts error:', error);
            return { success: false, msg: 'Không thể lấy danh sách bài viết' };
        }

        // Process posts to add like counts and comment counts
        const processedPosts = data.map(post => ({
            ...post,
            likes_count: post.post_likes?.length || 0,
            comments_count: post.comments?.length || 0,
            is_liked: false // Will be set based on current user
        }));

        return { success: true, data: processedPosts };
    } catch (error) {
        console.log('getPosts error:', error);
        return { success: false, msg: 'Không thể lấy danh sách bài viết' };
    }
};

export const getUserPosts = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    image
                ),
                post_likes (
                    id,
                    user_id
                ),
                comments (
                    id,
                    content,
                    user_id,
                    created_at,
                    users:user_id (
                        id,
                        name,
                        image
                    )
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.log('getUserPosts error:', error);
            return { success: false, msg: 'Không thể lấy bài viết của người dùng' };
        }

        const processedPosts = data.map(post => ({
            ...post,
            likes_count: post.post_likes?.length || 0,
            comments_count: post.comments?.length || 0
        }));

        return { success: true, data: processedPosts };
    } catch (error) {
        console.log('getUserPosts error:', error);
        return { success: false, msg: 'Không thể lấy bài viết của người dùng' };
    }
};

export const likePost = async (postId, userId) => {
    try {
        // Check if already liked
        const { data: existingLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .single();

        if (existingLike) {
            // Unlike the post
            const { error } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId);

            if (error) {
                console.log('unlikePost error:', error);
                return { success: false, msg: 'Không thể bỏ thích bài viết' };
            }

            return { success: true, action: 'unliked' };
        } else {
            // Like the post
            const { error } = await supabase
                .from('post_likes')
                .insert({
                    post_id: postId,
                    user_id: userId
                });

            if (error) {
                console.log('likePost error:', error);
                return { success: false, msg: 'Không thể thích bài viết' };
            }

            return { success: true, action: 'liked' };
        }
    } catch (error) {
        console.log('likePost error:', error);
        return { success: false, msg: 'Không thể thích bài viết' };
    }
};

export const addComment = async (commentData) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert(commentData)
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    image
                )
            `)
            .single();

        if (error) {
            console.log('addComment error:', error);
            return { success: false, msg: 'Không thể thêm bình luận' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('addComment error:', error);
        return { success: false, msg: 'Không thể thêm bình luận' };
    }
};

export const getPostComments = async (postId) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                users:user_id (
                    id,
                    name,
                    image
                )
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            console.log('getPostComments error:', error);
            return { success: false, msg: 'Không thể lấy bình luận' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('getPostComments error:', error);
        return { success: false, msg: 'Không thể lấy bình luận' };
    }
};

export const deletePost = async (postId, userId) => {
    try {
        // Check if user owns the post
        const { data: post } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single();

        if (!post || post.user_id !== userId) {
            return { success: false, msg: 'Bạn không có quyền xóa bài viết này' };
        }

        // Delete related data first
        await supabase.from('post_likes').delete().eq('post_id', postId);
        await supabase.from('comments').delete().eq('post_id', postId);

        // Delete the post
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) {
            console.log('deletePost error:', error);
            return { success: false, msg: 'Không thể xóa bài viết' };
        }

        return { success: true };
    } catch (error) {
        console.log('deletePost error:', error);
        return { success: false, msg: 'Không thể xóa bài viết' };
    }
};

// ===== REALTIME SUBSCRIPTIONS =====
export const subscribeToPosts = (callback) => {
    const channel = supabase
        .channel('posts-changes')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'posts'
            },
            callback
        )
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'post_likes'
            },
            callback
        )
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'comments'
            },
            callback
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

