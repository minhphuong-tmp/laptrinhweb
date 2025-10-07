// API endpoints cho mobile app integration
// Đây là các utility functions để mobile app có thể sử dụng cùng API

import { supabase } from '../lib/supabase';

// ===== API RESPONSE HELPERS =====
const createApiResponse = (success, data = null, message = null, error = null) => ({
    success,
    data,
    message,
    error: error?.message || error
});

// ===== USER API =====
export const userApi = {
    // Lấy thông tin user
    getProfile: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return createApiResponse(true, data);
        } catch (error) {
            return createApiResponse(false, null, 'Không thể lấy thông tin người dùng', error);
        }
    },

    // Cập nhật profile
    updateProfile: async (userId, profileData) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .update(profileData)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return createApiResponse(true, data, 'Cập nhật thành công');
        } catch (error) {
            return createApiResponse(false, null, 'Không thể cập nhật thông tin', error);
        }
    },

    // Lấy danh sách users
    getUsers: async (limit = 50, offset = 0) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email, image, bio, created_at')
                .order('name')
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return createApiResponse(true, data);
        } catch (error) {
            return createApiResponse(false, null, 'Không thể lấy danh sách người dùng', error);
        }
    }
};

// ===== POSTS API =====
export const postsApi = {
    // Lấy danh sách posts
    getPosts: async (limit = 20, offset = 0) => {
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

            if (error) throw error;

            const processedPosts = data.map(post => ({
                ...post,
                likes_count: post.post_likes?.length || 0,
                comments_count: post.comments?.length || 0
            }));

            return createApiResponse(true, processedPosts);
        } catch (error) {
            return createApiResponse(false, null, 'Không thể lấy danh sách bài viết', error);
        }
    },

    // Tạo post mới
    createPost: async (postData) => {
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

            if (error) throw error;
            return createApiResponse(true, data, 'Tạo bài viết thành công');
        } catch (error) {
            return createApiResponse(false, null, 'Không thể tạo bài viết', error);
        }
    },

    // Like/Unlike post
    toggleLike: async (postId, userId) => {
        try {
            const { data: existingLike } = await supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', userId)
                .single();

            if (existingLike) {
                // Unlike
                const { error } = await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userId);

                if (error) throw error;
                return createApiResponse(true, { action: 'unliked' });
            } else {
                // Like
                const { error } = await supabase
                    .from('post_likes')
                    .insert({ post_id: postId, user_id: userId });

                if (error) throw error;
                return createApiResponse(true, { action: 'liked' });
            }
        } catch (error) {
            return createApiResponse(false, null, 'Không thể thích bài viết', error);
        }
    }
};

// ===== TODOS API =====
export const todosApi = {
    // Lấy todos của user
    getTodos: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return createApiResponse(true, data || []);
        } catch (error) {
            return createApiResponse(false, null, 'Không thể lấy danh sách ghi chú', error);
        }
    },

    // Tạo todo mới
    createTodo: async (todoData) => {
        try {
            const { data, error } = await supabase
                .from('todos')
                .insert(todoData)
                .select()
                .single();

            if (error) throw error;
            return createApiResponse(true, data, 'Tạo ghi chú thành công');
        } catch (error) {
            return createApiResponse(false, null, 'Không thể tạo ghi chú', error);
        }
    },

    // Cập nhật todo
    updateTodo: async (todoId, updates) => {
        try {
            const { data, error } = await supabase
                .from('todos')
                .update(updates)
                .eq('id', todoId)
                .select()
                .single();

            if (error) throw error;
            return createApiResponse(true, data, 'Cập nhật ghi chú thành công');
        } catch (error) {
            return createApiResponse(false, null, 'Không thể cập nhật ghi chú', error);
        }
    },

    // Xóa todo
    deleteTodo: async (todoId) => {
        try {
            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', todoId);

            if (error) throw error;
            return createApiResponse(true, null, 'Xóa ghi chú thành công');
        } catch (error) {
            return createApiResponse(false, null, 'Không thể xóa ghi chú', error);
        }
    }
};

// ===== CHAT API =====
export const chatApi = {
    // Lấy danh sách conversations
    getConversations: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('conversation_members')
                .select(`
                    conversation_id,
                    last_read_at,
                    conversation:conversations(
                        id,
                        name,
                        type,
                        created_at,
                        updated_at,
                        created_by
                    )
                `)
                .eq('user_id', userId);

            if (error) throw error;

            // Lấy tin nhắn cuối cho mỗi conversation
            const conversationsWithMessages = await Promise.all(
                data.map(async (item) => {
                    const { data: lastMessage } = await supabase
                        .from('messages')
                        .select(`
                            id,
                            content,
                            message_type,
                            created_at,
                            sender_id,
                            sender:users(id, name, image)
                        `)
                        .eq('conversation_id', item.conversation_id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    return {
                        ...item.conversation,
                        messages: lastMessage ? [lastMessage] : []
                    };
                })
            );

            return createApiResponse(true, conversationsWithMessages);
        } catch (error) {
            return createApiResponse(false, null, 'Không thể lấy danh sách cuộc trò chuyện', error);
        }
    },

    // Lấy messages của conversation
    getMessages: async (conversationId, limit = 50, offset = 0) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:users(id, name, image)
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return createApiResponse(true, data.reverse());
        } catch (error) {
            return createApiResponse(false, null, 'Không thể lấy tin nhắn', error);
        }
    },

    // Gửi message
    sendMessage: async (messageData) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert(messageData)
                .select(`
                    *,
                    sender:users(id, name, image)
                `)
                .single();

            if (error) throw error;

            // Cập nhật updated_at của conversation
            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', messageData.conversation_id);

            return createApiResponse(true, data, 'Gửi tin nhắn thành công');
        } catch (error) {
            return createApiResponse(false, null, 'Không thể gửi tin nhắn', error);
        }
    }
};

// ===== AUTH API =====
export const authApi = {
    // Đăng nhập
    signIn: async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return createApiResponse(true, data, 'Đăng nhập thành công');
        } catch (error) {
            return createApiResponse(false, null, 'Đăng nhập thất bại', error);
        }
    },

    // Đăng ký
    signUp: async (email, password, userData) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) throw error;

            // Tạo user record trong database
            if (data.user) {
                await supabase
                    .from('users')
                    .insert({
                        id: data.user.id,
                        email: data.user.email,
                        ...userData
                    });
            }

            return createApiResponse(true, data, 'Đăng ký thành công');
        } catch (error) {
            return createApiResponse(false, null, 'Đăng ký thất bại', error);
        }
    },

    // Đăng xuất
    signOut: async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return createApiResponse(true, null, 'Đăng xuất thành công');
        } catch (error) {
            return createApiResponse(false, null, 'Đăng xuất thất bại', error);
        }
    }
};

// ===== EXPORT ALL APIs =====
export const api = {
    user: userApi,
    posts: postsApi,
    todos: todosApi,
    chat: chatApi,
    auth: authApi
};

