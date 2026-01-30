const API_URL = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

const headers = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

export const createNotification = async (notificationData) => {
    try {
        const response = await fetch(`${API_URL}/notifications`, {
            method: 'POST',
            headers,
            body: JSON.stringify(notificationData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export const getUserNotifications = async (userId, page = 1) => {
    try {
        // Check if notifications table exists first
        const testResponse = await fetch(`${API_URL}/notifications?limit=1`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!testResponse.ok) {
            console.log('Notifications table does not exist or no access');
            return [];
        }

        // Calculate offset for pagination
        const limit = 20;
        const offset = (page - 1) * limit;

        // Try to get notifications with join - using new fields: is_read, postId, commentId, type
        const response = await fetch(
            `${API_URL}/notifications?receiverId=eq.${userId}&select=id,created_at,title,senderId,receiverId,is_read,postId,commentId,type,data,sender:senderId(id,name,image)&order=created_at.desc&limit=${limit}&offset=${offset}`,
            {
                method: 'GET',
                headers: {
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error('Error fetching notifications:', response.status);
            return [];
        }

        const data = await response.json();
        
        // If no notifications, return empty array
        if (!data || data.length === 0) {
            return [];
        }
        
        // Parse notification.data if it's a string (for backward compatibility)
        const parsedNotifications = data.map(notification => {
            if (typeof notification.data === 'string') {
                try {
                    notification.data = JSON.parse(notification.data);
                } catch (e) {
                    console.warn('Failed to parse notification.data:', e, notification.data);
                    notification.data = {};
                }
            }
            // Ensure is_read defaults to false if not set
            if (notification.is_read === null || notification.is_read === undefined) {
                notification.is_read = false;
            }
            return notification;
        });
        
        // Filter out self-notifications
        let filteredNotifications = parsedNotifications.filter(notification => notification.senderId !== notification.receiverId);
        
        // If join didn't work, fetch sender data separately
        if (filteredNotifications.length > 0 && !filteredNotifications[0].sender) {
            
            const notificationsWithSenders = await Promise.all(
                filteredNotifications.map(async (notification) => {
                    try {
                        const senderResponse = await fetch(
                            `${API_URL}/users?id=eq.${notification.senderId}&select=id,name,image`,
                            {
                                method: 'GET',
                                headers: {
                                    'apikey': API_KEY,
                                    'Authorization': `Bearer ${API_KEY}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        
                        if (senderResponse.ok) {
                            const senderData = await senderResponse.json();
                            return {
                                ...notification,
                                sender: senderData[0] || null
                            };
                        }
                        
                        return notification;
                    } catch (error) {
                        console.error('Error fetching sender data:', error);
                        return notification;
                    }
                })
            );
            
            filteredNotifications = notificationsWithSenders;
        }
        
        return filteredNotifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        // Return empty array instead of mock data
        return [];
    }
};


export const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await fetch(`${API_URL}/notifications?id=eq.${notificationId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                is_read: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

export const markAllNotificationsAsRead = async (userId) => {
    try {
        const response = await fetch(`${API_URL}/notifications?receiverId=eq.${userId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                is_read: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

export const getUnreadNotificationCount = async (userId) => {
    try {
        console.log('🔍 [notificationService] Getting unread count for user:', userId);
        
        // Always use fallback method: get all notifications and filter in code
        // This is more reliable than trying to filter with JSONB operators
        const response = await fetch(
            `${API_URL}/notifications?receiverId=eq.${userId}`,
            {
                method: 'GET',
                headers: {
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error('❌ [notificationService] Failed to fetch notifications:', response.status);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 [notificationService] Total notifications fetched:', data.length);
        
        if (data.length > 0) {
            console.log('📊 [notificationService] Sample notification:', {
                id: data[0].id,
                senderId: data[0].senderId,
                receiverId: data[0].receiverId,
                data: data[0].data,
                dataType: typeof data[0].data
            });
        }
        
        // Filter unread notifications - using is_read field directly
        const unreadCount = data.filter(notification => {
            // Skip self-notifications
            if (notification.senderId === notification.receiverId) {
                return false;
            }
            
            // Use is_read field directly (defaults to false if null/undefined)
            const isUnread = !notification.is_read;
            
            if (isUnread) {
                console.log('📬 [notificationService] Found unread notification:', {
                    id: notification.id,
                    title: notification.title,
                    is_read: notification.is_read
                });
            }
            
            return isUnread;
        }).length;
        
        console.log('✅ [notificationService] Unread count:', unreadCount);
        return unreadCount;
    } catch (error) {
        console.error('❌ [notificationService] Error fetching unread count:', error);
        return 0;
    }
};

export const createLikeNotification = async (postId, postOwnerId, likerId, likerName) => {
    if (postOwnerId === likerId) return; // Don't notify self
    
    const notificationData = {
        title: 'Đã thích bài viết của bạn',
        senderId: likerId,
        receiverId: postOwnerId,
        type: 'like',
        postId: postId,
        commentId: null,
        is_read: false,
        data: {} // Keep for backward compatibility
    };

    return await createNotification(notificationData);
};

export const createCommentNotification = async (postId, postOwnerId, commenterId, commenterName, commentId = null) => {
    if (postOwnerId === commenterId) return; // Don't notify self
    
    const notificationData = {
        title: 'Đã bình luận vào bài viết của bạn',
        senderId: commenterId,
        receiverId: postOwnerId,
        type: 'comment',
        postId: postId,
        commentId: commentId, // Lưu commentId để có thể scroll đến đúng comment
        is_read: false,
        data: {} // Keep for backward compatibility
    };

    return await createNotification(notificationData);
};

export const deleteLikeNotification = async (postId, postOwnerId, likerId) => {
    try {
        const response = await fetch(
            `${API_URL}/notifications?title=eq.like&senderId=eq.${likerId}&receiverId=eq.${postOwnerId}&data->postId=eq.${postId}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting like notification:', error);
        throw error;
    }
};




