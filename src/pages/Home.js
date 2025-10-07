import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { user, signOut, debugSession } = useAuth();
    const navigate = useNavigate();

    console.log('Home component rendering with user:', user);

    const handleSignOut = async () => {
        const result = await signOut();
        if (result.success) {
            // Navigate to login page after successful logout
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="home-container">
            <div className="welcome-section">
                <h1 className="welcome-title">
                    Chào mừng, {user?.name || 'User'}! 👋
                </h1>
                <p className="welcome-description">
                    Khám phá tất cả các tính năng của LinkUp
                </p>
            </div>

            <div className="features-grid">
                <Link to="/posts" className="feature-card">
                    <div className="feature-icon">📝</div>
                    <h3 className="feature-title">Bài viết</h3>
                    <p className="feature-description">
                        Tạo và chia sẻ bài viết với cộng đồng
                    </p>
                    <div className="feature-arrow">→</div>
                </Link>

                <Link to="/todo" className="feature-card">
                    <div className="feature-icon">📋</div>
                    <h3 className="feature-title">Ghi chú</h3>
                    <p className="feature-description">
                        Quản lý công việc và ghi chú cá nhân
                    </p>
                    <div className="feature-arrow">→</div>
                </Link>

                <Link to="/stats" className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h3 className="feature-title">Thống kê</h3>
                    <p className="feature-description">
                        Xem thống kê hoạt động và xếp hạng
                    </p>
                    <div className="feature-arrow">→</div>
                </Link>

                <Link to="/chat" className="feature-card">
                    <div className="feature-icon">💬</div>
                    <h3 className="feature-title">Chat</h3>
                    <p className="feature-description">
                        Trò chuyện realtime với bạn bè
                    </p>
                    <div className="feature-arrow">→</div>
                </Link>

                <Link to="/notifications" className="feature-card">
                    <div className="feature-icon">🔔</div>
                    <h3 className="feature-title">Thông báo</h3>
                    <p className="feature-description">
                        Xem các thông báo và cập nhật mới nhất
                    </p>
                    <div className="feature-arrow">→</div>
                </Link>

                <Link to="/profile" className="feature-card">
                    <div className="feature-icon">👤</div>
                    <h3 className="feature-title">Hồ sơ</h3>
                    <p className="feature-description">
                        Chỉnh sửa thông tin cá nhân
                    </p>
                    <div className="feature-arrow">→</div>
                </Link>
            </div>

            <div className="quick-actions">
                <Link to="/posts" className="quick-action-button primary">
                    📝 Tạo bài viết mới
                </Link>
                <Link to="/todo" className="quick-action-button secondary">
                    📋 Thêm ghi chú
                </Link>
                <button
                    className="quick-action-button danger"
                    onClick={handleSignOut}
                >
                    🚪 Đăng xuất
                </button>
                <button
                    className="quick-action-button info"
                    onClick={() => window.location.reload()}
                >
                    🔄 Reload Page
                </button>
                <button
                    className="quick-action-button warning"
                    onClick={debugSession}
                >
                    🔍 Debug Session
                </button>
            </div>
        </div>
    );
};

export default Home;