import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn, user } = useAuth();
    const navigate = useNavigate();

    // Redirect về home nếu đã đăng nhập
    useEffect(() => {
        const isValidUser = user && user.id && user.email;
        if (isValidUser) {
            console.log('User already logged in, redirecting to home');
            navigate('/home', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Vui lòng nhập đầy đủ thông tin!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Attempting login with:', email);
            const result = await signIn(email.trim(), password.trim());
            console.log('Login response:', result);

            if (result.success) {
                console.log('Login successful, navigating to home...');
                navigate('/home');
            } else {
                console.error('Login error:', result.error);
                setError(result.error?.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            console.error('Login catch error:', error);
            setError('Đã xảy ra lỗi khi đăng nhập: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Đăng nhập</h1>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Nhập email của bạn"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Nhập mật khẩu"
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Chưa có tài khoản? <Link to="/signup">Đăng ký ngay</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
