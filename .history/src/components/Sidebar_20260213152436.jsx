import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getUserImageSrc } from '../services/imageService';
import { fadeInLeft, buttonHover, buttonTap, staggerContainer, staggerItem } from '../utils/animations';
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
        { path: '/activities', icon: '📅', label: 'Lịch sự kiện', active: location.pathname === '/activities' },
        { path: '/documents', icon: '📚', label: 'Tài liệu', active: location.pathname === '/documents' },
        { path: '/statistics', icon: '📈', label: 'Thống kê', active: location.pathname === '/statistics' },
        { path: '/announcements', icon: '📢', label: 'Thông báo CLB', active: location.pathname === '/announcements' },
        { path: '/curriculum', icon: '📖', label: 'Chương trình học', active: location.pathname === '/curriculum' },
        { path: '/leaderboard', icon: '🏆', label: 'Bảng xếp hạng', active: location.pathname === '/leaderboard' },
        { path: '/leaderboard', icon: '🏆', label: 'Bảng xếp hạng', active: location.pathname === '/leaderboard' },
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
        <motion.div
            className="sidebar"
            initial="initial"
            animate="animate"
            variants={fadeInLeft}
        >
            {/* CLB Tin học KMA - 12 chức năng */}
            <div className="clb-section">
                <motion.div
                    className="clb-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <img className="clb-logo" src="/images/logo.png" />
                    <motion.h3
                        variants={{
                            initial: { opacity: 0 },
                            animate: { opacity: 1 }
                        }}
                    >
                        CLB Tin học KMA
                    </motion.h3>
                </motion.div>
                <motion.nav
                    className="clb-nav"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                >
                    {clbMenuItems.map((item) => (
                        <motion.div
                            key={item.path}
                            variants={staggerItem}
                        >
                            <Link
                                to={item.path}
                                className={`clb-nav-item ${item.active ? 'active' : ''}`}
                            >
                                <span className="clb-nav-icon">{item.icon}</span>
                                <span className="clb-nav-label">{item.label}</span>
                            </Link>
                        </motion.div>
                    ))}
                </motion.nav>
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

                <motion.button
                    className="logout-btn"
                    onClick={async () => {
                        await signOut();
                        navigate('/login');
                    }}
                    whileHover={buttonHover}
                    whileTap={buttonTap}
                >
                    <span className="logout-icon">🚪</span>
                    <span className="logout-text">Đăng xuất</span>
                </motion.button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
