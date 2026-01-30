// Chat service sử dụng REST API thay vì Supabase client

// ===== CONVERSATIONS =====
export const createConversation = async (data) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        const response = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversations', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.log('createConversation error:', response.status);
            return { success: false, msg: 'Không thể tạo cuộc trò chuyện' };
        }

        const conversation = await response.json();
        return { success: true, data: conversation[0] || conversation };
    } catch (error) {
        console.log('createConversation error:', error);
        return { success: false, msg: 'Không thể tạo cuộc trò chuyện' };
    }
};

export const getConversations = async (userId) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        // Lấy danh sách conversation members của user
        const membersUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members?user_id=eq.${userId}&select=conversation_id,last_read_at,conversation:conversations(id,name,type,created_at,updated_at,created_by)`;
        const membersResponse = await fetch(membersUrl, {
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!membersResponse.ok) {
            console.log('getConversations members error:', membersResponse.status);
            return { success: false, msg: 'Không thể lấy danh sách cuộc trò chuyện' };
        }

        const membersData = await membersResponse.json();

        // Lấy tin nhắn cuối và thông tin thành viên cho mỗi conversation
        const conversationsWithMessages = await Promise.all(
            membersData.map(async (item) => {
                // Lấy tin nhắn cuối
                const messagesUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/messages?conversation_id=eq.${item.conversation_id}&select=id,content,message_type,file_url,created_at,sender_id,sender:users(id,name,image)&order=created_at.desc&limit=1`;
                const messagesResponse = await fetch(messagesUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': apiKey,
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                let lastMessage = null;
                if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json();
                    lastMessage = messagesData[0] || null;
                }

                // Lấy thông tin tất cả thành viên của conversation
                const conversationMembersUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members?conversation_id=eq.${item.conversation_id}&select=user_id,last_read_at,is_admin,user:users(*)`;
                const conversationMembersResponse = await fetch(conversationMembersUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': apiKey,
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                let members = [];
                if (conversationMembersResponse.ok) {
                    members = await conversationMembersResponse.json();
                }

                return {
                    ...item.conversation,
                    conversation_members: members || [],
                    last_message: lastMessage || null,
                    messages: lastMessage ? [lastMessage] : []
                };
            })
        );

        // Sắp xếp theo updated_at của conversation
        conversationsWithMessages.sort((a, b) =>
            new Date(b.updated_at) - new Date(a.updated_at)
        );

        return { success: true, data: conversationsWithMessages };
    } catch (error) {
        console.log('getConversations error:', error);
        return { success: false, msg: 'Không thể lấy danh sách cuộc trò chuyện' };
    }
};

export const getConversationById = async (conversationId) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        const conversationUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversations?id=eq.${conversationId}&select=*`;
        const conversationResponse = await fetch(conversationUrl, {
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!conversationResponse.ok) {
            console.log('getConversationById error:', conversationResponse.status);
            return { success: false, msg: 'Không thể lấy thông tin cuộc trò chuyện' };
        }

        const conversationData = await conversationResponse.json();
        const conversation = conversationData[0];

        if (!conversation) {
            return { success: false, msg: 'Không tìm thấy cuộc trò chuyện' };
        }

        // Lấy thông tin thành viên
        const membersUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members?conversation_id=eq.${conversationId}&select=user_id,last_read_at,is_admin,user:users(*)`;
        const membersResponse = await fetch(membersUrl, {
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        let members = [];
        if (membersResponse.ok) {
            members = await membersResponse.json();
        }

        return { 
            success: true, 
            data: {
                ...conversation,
                conversation_members: members
            }
        };
    } catch (error) {
        console.log('getConversationById error:', error);
        return { success: false, msg: 'Không thể lấy thông tin cuộc trò chuyện' };
    }
};

// ===== CONVERSATION MEMBERS =====
export const addMemberToConversation = async (conversationId, userId) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        const response = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                conversation_id: conversationId,
                user_id: userId
            })
        });

        if (!response.ok) {
            console.log('addMemberToConversation error:', response.status);
            return { success: false, msg: 'Không thể thêm thành viên' };
        }

        const data = await response.json();
        return { success: true, data: data[0] || data };
    } catch (error) {
        console.log('addMemberToConversation error:', error);
        return { success: false, msg: 'Không thể thêm thành viên' };
    }
};

export const removeMemberFromConversation = async (conversationId, userId) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        const response = await fetch(`https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members?conversation_id=eq.${conversationId}&user_id=eq.${userId}`, {
            method: 'DELETE',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log('removeMemberFromConversation error:', response.status);
            return { success: false, msg: 'Không thể xóa thành viên' };
        }

        return { success: true };
    } catch (error) {
        console.log('removeMemberFromConversation error:', error);
        return { success: false, msg: 'Không thể xóa thành viên' };
    }
};

// ===== MESSAGES =====
export const sendMessage = async (data) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        const response = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/messages', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.log('sendMessage error:', response.status);
            return { success: false, msg: 'Không thể gửi tin nhắn' };
        }

        const message = await response.json();

        // Cập nhật updated_at của conversation
        await fetch(`https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversations?id=eq.${data.conversation_id}`, {
            method: 'PATCH',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ updated_at: new Date().toISOString() })
        });

        return { success: true, data: message[0] || message };
    } catch (error) {
        console.log('sendMessage error:', error);
        return { success: false, msg: 'Không thể gửi tin nhắn' };
    }
};

export const getMessages = async (conversationId, limit = 50, offset = 0) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        const messagesUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/messages?conversation_id=eq.${conversationId}&select=*,sender:users(*),message_reads(user_id,read_at)&order=created_at.desc&limit=${limit}&offset=${offset}`;
        const response = await fetch(messagesUrl, {
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log('getMessages error:', response.status);
            return { success: false, msg: 'Không thể lấy tin nhắn' };
        }

        const data = await response.json();
        return { success: true, data: data.reverse() }; // Reverse để hiển thị từ cũ đến mới
    } catch (error) {
        console.log('getMessages error:', error);
        return { success: false, msg: 'Không thể lấy tin nhắn' };
    }
};

export const markMessageAsRead = async (messageId, userId) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        const response = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/message_reads', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                message_id: messageId,
                user_id: userId,
                read_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.log('markMessageAsRead error:', response.status);
            return { success: false, msg: 'Không thể đánh dấu đã đọc' };
        }

        const data = await response.json();
        return { success: true, data: data[0] || data };
    } catch (error) {
        console.log('markMessageAsRead error:', error);
        return { success: false, msg: 'Không thể đánh dấu đã đọc' };
    }
};

export const markConversationAsRead = async (conversationId, userId) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        // Cập nhật last_read_at của user trong conversation
        const response = await fetch(`https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members?conversation_id=eq.${conversationId}&user_id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ last_read_at: new Date().toISOString() })
        });

        if (!response.ok) {
            console.log('markConversationAsRead error:', response.status);
            return { success: false, msg: 'Không thể đánh dấu đã đọc' };
        }

        return { success: true };
    } catch (error) {
        console.log('markConversationAsRead error:', error);
        return { success: false, msg: 'Không thể đánh dấu đã đọc' };
    }
};

export const editMessage = async (messageId, content) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        const response = await fetch(`https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/messages?id=eq.${messageId}`, {
            method: 'PATCH',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                content,
                is_edited: true,
                edited_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.log('editMessage error:', response.status);
            return { success: false, msg: 'Không thể chỉnh sửa tin nhắn' };
        }

        const data = await response.json();
        return { success: true, data: data[0] || data };
    } catch (error) {
        console.log('editMessage error:', error);
        return { success: false, msg: 'Không thể chỉnh sửa tin nhắn' };
    }
};

export const deleteMessage = async (messageId) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        const response = await fetch(`https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/messages?id=eq.${messageId}`, {
            method: 'DELETE',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log('deleteMessage error:', response.status);
            return { success: false, msg: 'Không thể xóa tin nhắn' };
        }

        return { success: true };
    } catch (error) {
        console.log('deleteMessage error:', error);
        return { success: false, msg: 'Không thể xóa tin nhắn' };
    }
};

export const deleteConversation = async (conversationId, userId) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        // Kiểm tra xem user có phải admin của nhóm không
        const memberUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members?conversation_id=eq.${conversationId}&user_id=eq.${userId}&select=is_admin,conversation:conversations(type)`;
        const memberResponse = await fetch(memberUrl, {
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!memberResponse.ok) {
            console.log('deleteConversation memberError:', memberResponse.status);
            return { success: false, msg: 'Không thể xóa cuộc trò chuyện' };
        }

        const memberData = await memberResponse.json();
        const member = memberData[0];

        if (!member) {
            return { success: false, msg: 'Không tìm thấy thành viên' };
        }

        // Chỉ admin mới có thể xóa nhóm, hoặc có thể xóa cuộc trò chuyện 1-1
        if (member.conversation.type === 'group' && !member.is_admin) {
            return { success: false, msg: 'Chỉ admin mới có thể xóa nhóm' };
        }

        // Xóa tất cả messages trong conversation
        const messagesResponse = await fetch(`https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/messages?conversation_id=eq.${conversationId}`, {
            method: 'DELETE',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!messagesResponse.ok) {
            console.log('deleteMessages error:', messagesResponse.status);
            return { success: false, msg: 'Không thể xóa tin nhắn' };
        }

        // Xóa tất cả conversation_members
        const membersResponse = await fetch(`https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members?conversation_id=eq.${conversationId}`, {
            method: 'DELETE',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!membersResponse.ok) {
            console.log('deleteMembers error:', membersResponse.status);
            return { success: false, msg: 'Không thể xóa thành viên' };
        }

        // Xóa conversation
        const conversationResponse = await fetch(`https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversations?id=eq.${conversationId}`, {
            method: 'DELETE',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!conversationResponse.ok) {
            console.log('deleteConversation error:', conversationResponse.status);
            return { success: false, msg: 'Không thể xóa cuộc trò chuyện' };
        }

        return { success: true, msg: 'Đã xóa cuộc trò chuyện thành công' };
    } catch (error) {
        console.log('deleteConversation error:', error);
        return { success: false, msg: 'Không thể xóa cuộc trò chuyện' };
    }
};

// ===== UTILITY FUNCTIONS =====
export const createDirectConversation = async (userId1, userId2) => {
    try {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        // Kiểm tra xem đã có conversation giữa 2 user chưa
        const existingUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversations?type=eq.direct&select=id,conversation_members!inner(user_id)`;
        const existingResponse = await fetch(existingUrl, {
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (existingResponse.ok) {
            const existingConversations = await existingResponse.json();
            
            // Nếu đã có conversation, trả về
            if (existingConversations && existingConversations.length > 0) {
                for (const conv of existingConversations) {
                    const membersUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members?conversation_id=eq.${conv.id}&select=user_id`;
                    const membersResponse = await fetch(membersUrl, {
                        method: 'GET',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (membersResponse.ok) {
                        const members = await membersResponse.json();
                        if (members && members.length === 2 &&
                            members.some(m => m.user_id === userId1) &&
                            members.some(m => m.user_id === userId2)) {
                            return { success: true, data: { id: conv.id } };
                        }
                    }
                }
            }
        }

        // Tạo conversation mới
        const createResponse = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversations', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                type: 'direct',
                created_by: userId1
            })
        });

        if (!createResponse.ok) {
            console.log('createDirectConversation error:', createResponse.status);
            return { success: false, msg: 'Không thể tạo cuộc trò chuyện' };
        }

        const conversationData = await createResponse.json();
        const conversation = conversationData[0] || conversationData;

        // Thêm 2 user vào conversation
        const addMembersResponse = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify([
                { conversation_id: conversation.id, user_id: userId1 },
                { conversation_id: conversation.id, user_id: userId2 }
            ])
        });

        if (!addMembersResponse.ok) {
            console.log('addMembers error:', addMembersResponse.status);
            return { success: false, msg: 'Không thể thêm thành viên' };
        }

        return { success: true, data: conversation };
    } catch (error) {
        console.log('createDirectConversation error:', error);
        return { success: false, msg: 'Không thể tạo cuộc trò chuyện' };
    }
};

export const createGroupConversation = async (name, createdBy, memberIds) => {
    try {
        console.log('🔍 createGroupConversation called with:', { name, createdBy, memberIds });
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        // Tạo conversation
        const createResponse = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversations', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                name,
                type: 'group',
                created_by: createdBy
            })
        });

        console.log('🔍 Create conversation response status:', createResponse.status);
        
        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.log('❌ createGroupConversation error:', createResponse.status, errorText);
            return { success: false, msg: 'Không thể tạo nhóm' };
        }

        const conversationData = await createResponse.json();
        const conversation = conversationData[0] || conversationData;

        // Thêm các thành viên (bao gồm cả người tạo nhóm)
        const allMemberIds = [createdBy, ...memberIds];
        const members = allMemberIds.map(userId => ({
            conversation_id: conversation.id,
            user_id: userId,
            is_admin: userId === createdBy
        }));

        const addMembersResponse = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/conversation_members', {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(members)
        });

        if (!addMembersResponse.ok) {
            console.log('addMembersError:', addMembersResponse.status);
            return { success: false, msg: 'Không thể thêm thành viên' };
        }

        return { success: true, data: conversation };
    } catch (error) {
        console.log('createGroupConversation error:', error);
        return { success: false, msg: 'Không thể tạo nhóm' };
    }
};

