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

export const getUserNotifications = async (userId) => {
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
            return getMockNotifications();
        }

        // Try to get notifications with join
        const response = await fetch(
            `${API_URL}/notifications?receiverId=eq.${userId}&select=*,sender:senderId(id,name,image)&order=created_at.desc&limit=20`,
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
            console.log('Error fetching notifications:', response.status);
            return getMockNotifications();
        }

        const data = await response.json();
        // If no notifications, return mock data
        if (data.length === 0) {
            return getMockNotifications();
        }
        
        // Filter out self-notifications
        const filteredNotifications = data.filter(notification => notification.senderId !== notification.receiverId);
        
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
        // Return mock notifications when there's network error
        return getMockNotifications();
    }
};

// Mock notifications for when server is down or no internet
const getMockNotifications = () => {
    return [
        {
            id: 'mock-1',
            title: 'like',
            senderId: 'mock-user-1',
            receiverId: 'current-user',
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            data: { is_read: false, postId: 'mock-post-1' },
            sender: {
                id: 'mock-user-1',
                name: 'Nguyễn Văn A',
                image: null
            }
        },
        {
            id: 'mock-2',
            title: 'comment',
            senderId: 'mock-user-2',
            receiverId: 'current-user',
            created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            data: { is_read: false, postId: 'mock-post-2' },
            sender: {
                id: 'mock-user-2',
                name: 'Trần Thị B',
                image: null
            }
        },
        {
            id: 'mock-3',
            title: 'like',
            senderId: 'mock-user-3',
            receiverId: 'current-user',
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            data: { is_read: true, postId: 'mock-post-3' },
            sender: {
                id: 'mock-user-3',
                name: 'Lê Văn C',
                image: null
            }
        }
    ];
};

export const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await fetch(`${API_URL}/notifications?id=eq.${notificationId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                data: { is_read: true }
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
                data: { is_read: true }
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
        
        // First try with data filter
        const response = await fetch(
            `${API_URL}/notifications?receiverId=eq.${userId}&data->is_read=is.false`,
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
            // Fallback: get all notifications and filter in code
            const fallbackResponse = await fetch(
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

            if (!fallbackResponse.ok) {
                throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
            }

            const data = await fallbackResponse.json();
            
            // Filter unread notifications
            const unreadCount = data.filter(notification => 
                notification.senderId !== notification.receiverId && 
                !notification.data?.is_read
            ).length;
            
            return unreadCount;
        }

        const data = await response.json();
        return data.length;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
};

export const createLikeNotification = async (postId, postOwnerId, likerId, likerName) => {
    if (postOwnerId === likerId) return; // Don't notify self
    
    const notificationData = {
        title: 'like',
        senderId: likerId,
        receiverId: postOwnerId,
        data: {
            postId: postId,
            is_read: false
        }
    };

    return await createNotification(notificationData);
};

export const createCommentNotification = async (postId, postOwnerId, commenterId, commenterName) => {
    if (postOwnerId === commenterId) return; // Don't notify self
    
    const notificationData = {
        title: 'comment',
        senderId: commenterId,
        receiverId: postOwnerId,
        data: {
            postId: postId,
            is_read: false
        }
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




