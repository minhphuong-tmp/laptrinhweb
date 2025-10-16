import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserImageSrc } from '../services/imageService';
import './Sidebar.css';

const Sidebar = () => {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [userImageUrl, setUserImageUrl] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);

    const menuItems = [
        { path: '/', icon: '🏠', label: 'Trang chủ', active: location.pathname === '/' },
        { path: '/posts', icon: '📝', label: 'Bài viết', active: location.pathname === '/posts' },
        { path: '/todo', icon: '📋', label: 'Ghi chú', active: location.pathname === '/todo' },
        { path: '/stats', icon: '📊', label: 'Thống kê', active: location.pathname === '/stats' },
    ];

    // Load user image
    useEffect(() => {
        const loadUserImage = async () => {
            if (user?.image) {
                setImageLoading(true);
                try {
                    const imageUrl = await getUserImageSrc(user.image, user.name, 40);
                    setUserImageUrl(imageUrl);
                } catch (error) {
                    console.error('Error loading user image:', error);
                    setUserImageUrl(null);
                } finally {
                    setImageLoading(false);
                }
            } else {
                setUserImageUrl(null);
            }
        };

        loadUserImage();
    }, [user?.image, user?.name]);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>LinkUp</h2>
            </div>
            
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${item.active ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        {imageLoading ? (
                            <div className="avatar-loading">
                                <div className="loading-spinner"></div>
                            </div>
                        ) : userImageUrl ? (
                            <img src={userImageUrl} alt={user?.name || 'User'} />
                        ) : (
                            <div className="avatar-placeholder">
                                {user?.name?.charAt(0) || '👤'}
                            </div>
                        )}
                    </div>
                    <div className="user-details">
                        <div className="user-name">{user?.name || 'Người dùng'}</div>
                        <div className="user-status">Đang hoạt động</div>
                    </div>
                </div>
                
                <button 
                    className="logout-btn"
                    onClick={async () => {
                        await signOut();
                        navigate('/login');
                    }}
                >
                    <span className="logout-icon">🚪</span>
                    <span className="logout-text">Đăng xuất</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
