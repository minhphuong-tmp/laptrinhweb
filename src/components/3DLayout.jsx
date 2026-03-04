import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './3DLayout.css';

const ThreeDLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    
    // Simple navigation menu for 3D pages
    const menuItems = [
        { path: '/leaderboard', icon: '🏆', label: 'Bảng xếp hạng' },
        { path: '/finance', icon: '💰', label: 'Tài chính' },
        { path: '/support', icon: '💬', label: 'Hỗ trợ' },
    ];
    
    return (
        <div className="three-d-layout-simple">
            {/* Top Bar */}
            <div className="three-d-topbar">
                <div className="three-d-topbar-left">
                    <h1 className="three-d-title">CLB Tin học KMA</h1>
                </div>
                {user && (
                    <div className="three-d-topbar-right">
                        <Avatar
                            src={user.image}
                            name={user.name}
                            size={40}
                        />
                        <span className="three-d-username">{user.name}</span>
                    </div>
                )}
            </div>
            
            {/* Main Container */}
            <div className="three-d-main-container">
                {/* Simple sidebar */}
                <div className="three-d-sidebar">
                    <nav className="three-d-nav">
                        {menuItems.map((item) => (
                            <button
                                key={item.path}
                                className={`three-d-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                
                {/* Content area */}
                <div className="three-d-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ThreeDLayout;

