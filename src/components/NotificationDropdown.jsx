import { useState, useEffect, useRef } from 'react';
import './NotificationDropdown.css';

const NotificationDropdown = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Load notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            // Mock data - thay thế bằng API thực tế
            const mockNotifications = [
                {
                    id: 1,
                    type: 'like',
                    user: {
                        name: 'Nguyễn Văn A',
                        avatar: 'profiles/avatar1.jpg'
                    },
                    post: {
                        content: 'Bài viết của bạn'
                    },
                    time: '2 phút trước',
                    isRead: false
                },
                {
                    id: 2,
                    type: 'comment',
                    user: {
                        name: 'Trần Thị B',
                        avatar: 'profiles/avatar2.jpg'
                    },
                    post: {
                        content: 'Bài viết của bạn'
                    },
                    time: '5 phút trước',
                    isRead: false
                },
                {
                    id: 3,
                    type: 'follow',
                    user: {
                        name: 'Lê Văn C',
                        avatar: 'profiles/avatar3.jpg'
                    },
                    time: '1 giờ trước',
                    isRead: true
                },
                {
                    id: 4,
                    type: 'like',
                    user: {
                        name: 'Phạm Thị D',
                        avatar: 'profiles/avatar4.jpg'
                    },
                    post: {
                        content: 'Bài viết của bạn'
                    },
                    time: '2 giờ trước',
                    isRead: true
                }
            ];
            
            setNotifications(mockNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like':
                return '♥';
            case 'comment':
                return '💬';
            case 'follow':
                return '👤';
            case 'share':
                return '📤';
            default:
                return '🔔';
        }
    };

    const getNotificationText = (notification) => {
        switch (notification.type) {
            case 'like':
                return `${notification.user.name} đã thích bài viết của bạn`;
            case 'comment':
                return `${notification.user.name} đã bình luận bài viết của bạn`;
            case 'follow':
                return `${notification.user.name} đã theo dõi bạn`;
            case 'share':
                return `${notification.user.name} đã chia sẻ bài viết của bạn`;
            default:
                return 'Thông báo mới';
        }
    };

    const markAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === notificationId 
                    ? { ...notif, isRead: true }
                    : notif
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notif => ({ ...notif, isRead: true }))
        );
    };

    if (!isOpen) return null;

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            <div className="notification-header">
                <h3>Thông báo</h3>
                <div className="notification-actions">
                    <button 
                        className="mark-all-read-btn"
                        onClick={markAllAsRead}
                    >
                        Đánh dấu tất cả đã đọc
                    </button>
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>
            </div>

            <div className="notification-content">
                {loading ? (
                    <div className="notification-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải thông báo...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="notification-list">
                        {notifications.map((notification) => (
                            <div 
                                key={notification.id}
                                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="notification-icon">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="notification-content">
                                    <div className="notification-text">
                                        {getNotificationText(notification)}
                                    </div>
                                    <div className="notification-time">
                                        {notification.time}
                                    </div>
                                </div>
                                {!notification.isRead && (
                                    <div className="unread-indicator"></div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="notification-empty">
                        <div className="empty-icon">🔔</div>
                        <p>Chưa có thông báo nào</p>
                    </div>
                )}
            </div>

            <div className="notification-footer">
                <button className="view-all-btn">
                    Xem tất cả thông báo
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;

