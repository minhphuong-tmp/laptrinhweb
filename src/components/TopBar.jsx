import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './TopBar.css';

const TopBar = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);

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
                    <button className="topbar-btn notification-btn">
                        <span className="btn-icon">🔔</span>
                        <span className="notification-badge">3</span>
                    </button>

                    {/* Messages */}
                    <button className="topbar-btn">
                        <span className="btn-icon">💬</span>
                    </button>

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
