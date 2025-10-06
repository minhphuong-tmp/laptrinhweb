import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = ({ title = "LinkUp", showBackButton = true }) => {
    const { signOut } = useAuth();

    const handleBack = () => {
        window.history.back();
    };

    const handleSignOut = async () => {
        if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            try {
                const { error } = await signOut();
                if (error) {
                    console.error('Sign out error:', error);
                    alert('Lỗi khi đăng xuất');
                }
            } catch (error) {
                console.error('Sign out error:', error);
                alert('Lỗi khi đăng xuất');
            }
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                {showBackButton && (
                    <button className="back-button" onClick={handleBack}>
                        ←
                    </button>
                )}
                <h1 className="header-title">{title}</h1>
                
                <div className="header-icons">
                    <Link to="/posts" className="icon-link">
                        <span className="icon">📝</span>
                    </Link>
                    <Link to="/todo" className="icon-link">
                        <span className="icon">📋</span>
                    </Link>
                    <Link to="/stats" className="icon-link">
                        <span className="icon">📊</span>
                    </Link>
                    <Link to="/chat" className="icon-link">
                        <span className="icon">💬</span>
                    </Link>
                    <Link to="/notifications" className="icon-link">
                        <span className="icon">🔔</span>
                    </Link>
                    <Link to="/profile" className="icon-link">
                        <span className="icon">👤</span>
                    </Link>
                    <button 
                        className="icon-link logout-btn"
                        onClick={handleSignOut}
                        title="Đăng xuất"
                    >
                        <span className="icon">🚪</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
