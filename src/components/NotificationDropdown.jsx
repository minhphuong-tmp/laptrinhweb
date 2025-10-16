import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserNotifications, markNotificationAsRead } from '../services/notificationService';
import Avatar from './Avatar';
import './NotificationDropdown.css';

const NotificationDropdown = ({ isOpen, onClose, onNotificationRead }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const dropdownRef = useRef(null);


    useEffect(() => {
        if (isOpen && user) {
            // Reset state when opening dropdown
            setNotifications([]);
            setCurrentPage(1);
            setHasMore(true); // Always start with true
            console.log('🔄 Opening dropdown, resetting state');
            loadNotifications(1);
        }
    }, [isOpen, user]);

    const loadNotifications = async (page = 1, append = false) => {
        if (!user) return;
        
        if (page === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        
        try {
            const data = await getUserNotifications(user.id, page);
            if (append) {
                setNotifications(prev => [...prev, ...(data || [])]);
            } else {
                setNotifications(data || []);
            }
            
            // Check if there are more notifications (assuming 20 per page)
            const dataLength = (data || []).length;
            const hasMoreData = dataLength >= 20;
            
            // For first page, always assume there might be more unless we get less than 20
            if (page === 1) {
                setHasMore(dataLength >= 20 || dataLength > 0);
            } else {
                setHasMore(hasMoreData);
            }
            
            console.log('📊 Notifications loaded:', {
                page,
                count: dataLength,
                hasMore: hasMoreData,
                finalHasMore: page === 1 ? (dataLength >= 20 || dataLength > 0) : hasMoreData,
                totalNotifications: append ? notifications.length + dataLength : dataLength
            });
        } catch (error) {
            console.error('Error loading notifications:', error);
            if (!append) {
                setNotifications([]);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = async () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        setLoadingMore(true);
        
        try {
            const data = await getUserNotifications(user.id, nextPage);
            
            if (data && data.length > 0) {
                setNotifications(prev => [...prev, ...data]);
                setHasMore(data.length >= 20);
                console.log('📄 Loaded more notifications:', {
                    page: nextPage,
                    count: data.length,
                    hasMore: data.length >= 20
                });
            } else {
                setHasMore(false);
                console.log('📭 No more notifications available');
            }
        } catch (error) {
            console.error('Error loading more notifications:', error);
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleClickOutside = (event) => {
        // Don't close if clicking on the notification button or its children
        if (event.target.closest('.notification-container') || 
            event.target.closest('.topbar-btn') ||
            event.target.classList.contains('topbar-btn')) {
            return;
        }
        
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Add small delay to prevent immediate closing
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);
            
            return () => {
                clearTimeout(timer);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen]);

    const handleNotificationClick = async (notification) => {
        try {
            // Only mark as read if it's not already read
            if (!notification.data?.is_read) {
                await markNotificationAsRead(notification.id);
                
                // Update local state
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notification.id 
                            ? { ...notif, data: { ...notif.data, is_read: true } }
                            : notif
                    )
                );
                
                // Notify parent to update unread count
                if (onNotificationRead) {
                    onNotificationRead();
                }
            }
            
            // Navigate to post
            if (notification.data?.postId) {
                navigate(`/post/${notification.data.postId}`);
                
                // If it's a comment notification, scroll to comments
                if (notification.title === 'comment' || notification.title.includes('bình luận')) {
                    setTimeout(() => {
                        const commentsSection = document.querySelector('.comments-section');
                        if (commentsSection) {
                            commentsSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 100);
                }
            }
            
            onClose();
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const getNotificationIcon = (title) => {
        switch (title) {
            case 'like':
                return '👍';
            case 'comment':
                return '💬';
            default:
                return '🔔';
        }
    };

    const getNotificationText = (notification) => {
        const senderName = notification.sender?.name || 'Ai đó';
        
        // Always use sender name + custom text
        if (notification.title && notification.title.includes('bình luận')) {
            return `${senderName} đã bình luận bài viết của bạn`;
        }
        if (notification.title && notification.title.includes('thích')) {
            return `${senderName} đã thích bài viết của bạn`;
        }
        
        // New format with short titles
        switch (notification.title) {
            case 'like':
                return `${senderName} đã thích bài viết của bạn`;
            case 'comment':
                return `${senderName} đã bình luận bài viết của bạn`;
            default:
                return `${senderName} - ${notification.title || 'Thông báo mới'}`;
        }
    };

    const formatTime = (createdAt) => {
        const now = new Date();
        const notificationTime = new Date(createdAt);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} ngày trước`;
    };

    if (!isOpen) return null;

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            <div className="notification-header">
                <h3>Thông báo</h3>
            </div>
            <div className="notification-content">
                {loading ? (
                    <div className="notification-loading">
                        <div className="loading-spinner"></div>
                        <span>Đang tải thông báo...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notification-empty">
                        <p>Chưa có thông báo nào</p>
                    </div>
                ) : (
                    <>
                        {notifications.map((notification) => (
                            <div 
                                key={notification.id} 
                                className={`notification-item ${notification.data?.is_read ? 'read' : 'unread'}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="notification-avatar">
                                    {notification.sender?.image ? (
                                        <Avatar 
                                            src={notification.sender.image} 
                                            name={notification.sender.name}
                                            size={32}
                                        />
                                    ) : (
                                        <span>{getNotificationIcon(notification.title)}</span>
                                    )}
                                </div>
                                <div className="notification-text">
                                    <p>{getNotificationText(notification)}</p>
                                    <span className="notification-time">
                                        {formatTime(notification.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {notifications.length > 0 && (
                            <div className="notification-view-more">
                                {console.log('🔘 Button state:', {
                                    notificationsLength: notifications.length,
                                    hasMore,
                                    loadingMore,
                                    showButton: notifications.length > 0
                                })}
                                <button 
                                    className="view-more-btn"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore || !hasMore}
                                >
                                    {loadingMore ? (
                                        <>
                                            <div className="loading-spinner-small"></div>
                                            Đang tải...
                                        </>
                                    ) : hasMore ? (
                                        'Xem thêm thông báo'
                                    ) : (
                                        'Đã xem hết thông báo'
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;




