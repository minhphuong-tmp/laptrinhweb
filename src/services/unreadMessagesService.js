const API_URL = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

const headers = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
};

// Đếm tin nhắn chưa đọc cho một conversation
export const getUnreadMessageCount = async (conversationId, userId) => {
    try {
        // Lấy thời gian đọc cuối cùng của user trong conversation
        const memberResponse = await fetch(
            `${API_URL}/conversation_members?conversation_id=eq.${conversationId}&user_id=eq.${userId}&select=last_read_at`,
            {
                method: 'GET',
                headers
            }
        );

        if (!memberResponse.ok) {
            console.error('Error fetching conversation member:', memberResponse.status);
            return 0;
        }

        const memberData = await memberResponse.json();
        const lastReadAt = memberData[0]?.last_read_at;
        
        console.log(`🔍 Conversation ${conversationId}:`, {
            lastReadAt,
            hasLastRead: !!lastReadAt
        });

        // Nếu chưa có last_read_at, đếm tất cả tin nhắn
        let unreadCount = 0;
        if (!lastReadAt) {
            // Đếm tất cả tin nhắn trong conversation (trừ tin nhắn của chính user)
            const messagesResponse = await fetch(
                `${API_URL}/messages?conversation_id=eq.${conversationId}&sender_id=neq.${userId}&select=id`,
                {
                    method: 'GET',
                    headers
                }
            );

            if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                unreadCount = messagesData.length;
                console.log(`📨 No last_read_at - Total messages: ${unreadCount}`);
            }
        } else {
            // Lấy tất cả tin nhắn và filter trong code (đơn giản hơn)
            const messagesResponse = await fetch(
                `${API_URL}/messages?conversation_id=eq.${conversationId}&sender_id=neq.${userId}&select=id,created_at`,
                {
                    method: 'GET',
                    headers
                }
            );

            if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                const lastReadDate = new Date(lastReadAt);
                
                // Debug: Log message timestamps
                if (messagesData.length > 0) {
                    console.log(`📅 Message timestamps for conversation ${conversationId}:`);
                    messagesData.forEach((msg, index) => {
                        const msgDate = new Date(msg.created_at);
                        const isAfterLastRead = msgDate > lastReadDate;
                        console.log(`  Message ${index + 1}: ${msg.created_at} (${isAfterLastRead ? 'AFTER' : 'BEFORE'} last read)`);
                    });
                }
                
                unreadCount = messagesData.filter(msg => new Date(msg.created_at) > lastReadDate).length;
                console.log(`📨 With last_read_at - Total messages: ${messagesData.length}, Unread: ${unreadCount}, Last read: ${lastReadAt}`);
            } else {
                console.error('Error fetching messages:', messagesResponse.status);
            }
        }

        return unreadCount;
    } catch (error) {
        console.error('Error getting unread message count:', error);
        return 0;
    }
};


// Đếm tin nhắn chưa đọc cho tất cả conversations của user
export const getAllUnreadMessageCounts = async (userId) => {
    try {
        // Lấy tất cả conversations của user
        const conversationsResponse = await fetch(
            `${API_URL}/conversation_members?user_id=eq.${userId}&select=conversation_id,last_read_at`,
            {
                method: 'GET',
                headers
            }
        );

        if (!conversationsResponse.ok) {
            console.error('Error fetching conversations:', conversationsResponse.status);
            return {};
        }

        const conversationsData = await conversationsResponse.json();
        const unreadCounts = {};

        // Đếm tin nhắn chưa đọc cho mỗi conversation
        await Promise.all(
            conversationsData.map(async (conversation) => {
                const conversationId = conversation.conversation_id;
                const lastReadAt = conversation.last_read_at;

                console.log(`🔍 Processing conversation ${conversationId}:`, {
                    lastReadAt,
                    hasLastRead: !!lastReadAt
                });

                let unreadCount = 0;
                if (!lastReadAt) {
                    // Đếm tất cả tin nhắn (trừ tin nhắn của chính user)
                    const messagesResponse = await fetch(
                        `${API_URL}/messages?conversation_id=eq.${conversationId}&sender_id=neq.${userId}&select=id`,
                        {
                            method: 'GET',
                            headers
                        }
                    );

                    if (messagesResponse.ok) {
                        const messagesData = await messagesResponse.json();
                        unreadCount = messagesData.length;
                        console.log(`📨 No last_read_at - Total messages: ${unreadCount}`);
                    }
                } else {
                    // Lấy tất cả tin nhắn và filter trong code (đơn giản hơn)
                    const messagesResponse = await fetch(
                        `${API_URL}/messages?conversation_id=eq.${conversationId}&sender_id=neq.${userId}&select=id,created_at`,
                        {
                            method: 'GET',
                            headers
                        }
                    );

                    if (messagesResponse.ok) {
                        const messagesData = await messagesResponse.json();
                        const lastReadDate = new Date(lastReadAt);
                        
                        // Debug: Log message timestamps
                        if (messagesData.length > 0) {
                            console.log(`📅 Message timestamps for conversation ${conversationId}:`);
                            messagesData.forEach((msg, index) => {
                                const msgDate = new Date(msg.created_at);
                                const isAfterLastRead = msgDate > lastReadDate;
                                console.log(`  Message ${index + 1}: ${msg.created_at} (${isAfterLastRead ? 'AFTER' : 'BEFORE'} last read)`);
                            });
                        }
                        
                        unreadCount = messagesData.filter(msg => new Date(msg.created_at) > lastReadDate).length;
                        console.log(`📨 With last_read_at - Total messages: ${messagesData.length}, Unread: ${unreadCount}, Last read: ${lastReadAt}`);
                    } else {
                        console.error('Error fetching messages:', messagesResponse.status);
                    }
                }

                unreadCounts[conversationId] = unreadCount;
            })
        );

        return unreadCounts;
    } catch (error) {
        console.error('Error getting all unread message counts:', error);
        return {};
    }
};

// Đánh dấu conversation là đã đọc
export const markConversationAsRead = async (conversationId, userId) => {
    try {
        const response = await fetch(
            `${API_URL}/conversation_members?conversation_id=eq.${conversationId}&user_id=eq.${userId}`,
            {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    last_read_at: new Date().toISOString()
                })
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error marking conversation as read:', error);
        throw error;
    }
};

// Lấy tổng số tin nhắn chưa đọc của user
export const getTotalUnreadCount = async (userId) => {
    try {
        const unreadCounts = await getAllUnreadMessageCounts(userId);
        return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
    } catch (error) {
        console.error('Error getting total unread count:', error);
        return 0;
    }
};
