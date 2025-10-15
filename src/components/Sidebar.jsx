import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();

    const menuItems = [
        { path: '/', icon: '🏠', label: 'Trang chủ', active: location.pathname === '/' },
        { path: '/posts', icon: '📝', label: 'Bài viết', active: location.pathname === '/posts' },
        { path: '/todo', icon: '📋', label: 'Ghi chú', active: location.pathname === '/todo' },
        { path: '/stats', icon: '📊', label: 'Thống kê', active: location.pathname === '/stats' },
    ];

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
                        {user?.image ? (
                            <img src={user.image} alt={user.name} />
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
            </div>
        </div>
    );
};

export default Sidebar;
