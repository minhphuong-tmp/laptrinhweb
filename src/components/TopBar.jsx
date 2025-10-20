import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadNotificationCount } from '../services/notificationService';
import Avatar from './Avatar';
import NotificationDropdown from './NotificationDropdown';
import MessageDropdown from './MessageDropdown';
import './TopBar.css';

const TopBar = () => {
    const { user, signOut, userData } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load unread notification count
    useEffect(() => {
        const loadUnreadCount = async () => {
            if (user?.id) {
                try {
                    const count = await getUnreadNotificationCount(user.id);
                    setUnreadCount(count);
                } catch (error) {
                    console.error('Error loading unread count:', error);
                }
            }
        };

        loadUnreadCount();
    }, [user]);

    const handleSignOut = async () => {
        if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            try {
                const result = await signOut();
                if (result.success) {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Sign out error:', error);
            }
        }
    };

    return (
        <div className="topbar">
            <div className="topbar-content">
                {/* Search Bar */}
                <div className="search-container">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm trên LinkUp..." 
                            className="search-input"
                        />
                    </div>
                </div>

                {/* Right Side */}
                <div className="topbar-right">
                    {/* Notifications */}
                    <div className="notification-container">
                        <button 
                            className="topbar-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>
                        
                        <NotificationDropdown 
                            isOpen={showNotifications}
                            onClose={() => setShowNotifications(false)}
                            onNotificationRead={() => {
                                // Reload unread count when notification is read
                                if (user?.id) {
                                    getUnreadNotificationCount(user.id).then(setUnreadCount);
                                }
                            }}
                        />
                    </div>

                    {/* Messages */}
                    <div className="message-container">
                        <button 
                            className="topbar-btn"
                            onClick={() => setShowMessages(!showMessages)}
                            title="Tin nhắn"
                        >
                            <span className="btn-icon">💬</span>
                        </button>
                        <MessageDropdown 
                            isOpen={showMessages}
                            onClose={() => setShowMessages(false)}
                        />
                    </div>

                    {/* User Menu */}
                    <div className="user-menu-container">
                        <button 
                            className="user-menu-btn"
                            onClick={() => navigate('/profile')}
                        >
                            <Avatar
                                src={user?.image}
                                name={user?.name}
                                size={32}
                            />
                            <span className="user-name-small">{user?.name || 'Người dùng'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
