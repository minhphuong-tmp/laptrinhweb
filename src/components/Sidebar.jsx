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

    // CLB Tin học KMA - 11 chức năng
    const clbMenuItems = [
        { path: '/', icon: '🏠', label: 'Trang chủ', active: location.pathname === '/' },
        { path: '/members', icon: '👥', label: 'Thành viên', active: location.pathname === '/members' },
        { path: '/activities', icon: '📅', label: 'Hoạt động', active: location.pathname === '/activities' },
        { path: '/documents', icon: '📚', label: 'Tài liệu', active: location.pathname === '/documents' },
        { path: '/statistics', icon: '📈', label: 'Thống kê', active: location.pathname === '/statistics' },
        { path: '/announcements', icon: '📢', label: 'Thông báo CLB', active: location.pathname === '/announcements' },
        { path: '/calendar', icon: '📋', label: 'Lịch sự kiện', active: location.pathname === '/calendar' },
        { path: '/leaderboard', icon: '🏆', label: 'Bảng xếp hạng', active: location.pathname === '/leaderboard' },
        { path: '/meeting-notes', icon: '📝', label: 'Biên bản họp', active: location.pathname === '/meeting-notes' },
        { path: '/finance', icon: '💰', label: 'Quản lý tài chính', active: location.pathname === '/finance' },
        { path: '/support', icon: '📞', label: 'Liên hệ & Hỗ trợ', active: location.pathname === '/support' },
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
            {/* CLB Tin học KMA - 12 chức năng */}
            <div className="clb-section">
                <div className="clb-header">
                    <img className="clb-logo" src="/images/logo.png"  />
                    <h3>CLB Tin học KMA</h3>
                </div>
                <nav className="clb-nav">
                    {clbMenuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`clb-nav-item ${item.active ? 'active' : ''}`}
                        >
                            <span className="clb-nav-icon">{item.icon}</span>
                            <span className="clb-nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

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
