import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            // Mock notifications data since we don't have a notifications table yet
            const mockNotifications = [
                {
                    id: 1,
                    type: 'like',
                    title: 'Ai đó đã thích bài viết của bạn',
                    message: 'Nguyễn Văn A đã thích bài viết "Chia sẻ kinh nghiệm lập trình"',
                    read: false,
                    created_at: new Date().toISOString(),
                    user: {
                        name: 'Nguyễn Văn A',
                        image: null
                    }
                },
                {
                    id: 2,
                    type: 'comment',
                    title: 'Có bình luận mới',
                    message: 'Trần Thị B đã bình luận: "Bài viết rất hay!"',
                    read: false,
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    user: {
                        name: 'Trần Thị B',
                        image: null
                    }
                },
                {
                    id: 3,
                    type: 'follow',
                    title: 'Người dùng mới theo dõi',
                    message: 'Lê Văn C đã bắt đầu theo dõi bạn',
                    read: true,
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                    user: {
                        name: 'Lê Văn C',
                        image: null
                    }
                },
                {
                    id: 4,
                    type: 'system',
                    title: 'Cập nhật hệ thống',
                    message: 'Ứng dụng đã được cập nhật với nhiều tính năng mới',
                    read: true,
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    user: null
                }
            ];

            setNotifications(mockNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === notificationId 
                    ? { ...notif, read: true }
                    : notif
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notif => ({ ...notif, read: true }))
        );
    };

    const deleteNotification = (notificationId) => {
        setNotifications(prev => 
            prev.filter(notif => notif.id !== notificationId)
        );
    };

    const getFilteredNotifications = () => {
        switch (filter) {
            case 'unread':
                return notifications.filter(notif => !notif.read);
            case 'likes':
                return notifications.filter(notif => notif.type === 'like');
            case 'comments':
                return notifications.filter(notif => notif.type === 'comment');
            case 'follows':
                return notifications.filter(notif => notif.type === 'follow');
            default:
                return notifications;
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like': return '❤️';
            case 'comment': return '💬';
            case 'follow': return '👤';
            case 'system': return '🔔';
            default: return '📢';
        }
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    };

    const filteredNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(notif => !notif.read).length;

    if (loading) {
        return (
            <div className="notifications-container">
                <div className="loading">Đang tải thông báo...</div>
            </div>
        );
    }

    return (
        <div className="notifications-container">
            <div className="notifications-header">
                <h2>Thông báo</h2>
                <div className="header-actions">
                    {unreadCount > 0 && (
                        <button 
                            className="btn btn-secondary"
                            onClick={markAllAsRead}
                        >
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                </div>
            </div>

            <div className="notifications-filters">
                <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Tất cả ({notifications.length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Chưa đọc ({unreadCount})
                </button>
                <button 
                    className={`filter-btn ${filter === 'likes' ? 'active' : ''}`}
                    onClick={() => setFilter('likes')}
                >
                    Thích ({notifications.filter(n => n.type === 'like').length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'comments' ? 'active' : ''}`}
                    onClick={() => setFilter('comments')}
                >
                    Bình luận ({notifications.filter(n => n.type === 'comment').length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'follows' ? 'active' : ''}`}
                    onClick={() => setFilter('follows')}
                >
                    Theo dõi ({notifications.filter(n => n.type === 'follow').length})
                </button>
            </div>

            <div className="notifications-list">
                {filteredNotifications.length === 0 ? (
                    <div className="empty-state">
                        <p>Không có thông báo nào.</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div 
                            key={notification.id} 
                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                            <div className="notification-icon">
                                {getNotificationIcon(notification.type)}
                            </div>
                            <div className="notification-content">
                                <div className="notification-header">
                                    <h4 className="notification-title">{notification.title}</h4>
                                    <span className="notification-time">
                                        {getTimeAgo(notification.created_at)}
                                    </span>
                                </div>
                                <p className="notification-message">{notification.message}</p>
                                {notification.user && (
                                    <div className="notification-user">
                                        <Avatar 
                                            src={notification.user.image}
                                            name={notification.user.name}
                                            size={24}
                                            className="user-avatar"
                                        />
                                        <span className="user-name">{notification.user.name}</span>
                                    </div>
                                )}
                            </div>
                            <div className="notification-actions">
                                <button 
                                    className="action-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
