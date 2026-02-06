import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('clb'); // 'clb', 'qldt', 'microsoft'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // New state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn, user, setAuth } = useAuth();
    const navigate = useNavigate();

    // Redirect về home nếu đã đăng nhập
    useEffect(() => {
        const isValidUser = user && user.id && user.email;
        if (isValidUser) {
            navigate('/home', { replace: true });
        }
    }, [user, navigate]);

    const handleClbSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Vui lòng nhập đầy đủ thông tin!');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await signIn(email.trim(), password.trim());
            if (result.success) {
                navigate('/home');
            } else {
                setError(result.error?.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            setError('Đã xảy ra lỗi khi đăng nhập: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQldtSubmit = (e) => {
        e.preventDefault();
        alert('Chức năng đăng nhập QLĐT đang bảo trì.');
    };

    const handleMicrosoftLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Vui lòng nhập Email và Mật khẩu Microsoft!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Call crawler to verify credentials and get data
            const response = await fetch('http://localhost:3001/api/crawl-grades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Đăng nhập Microsoft thất bại');
            }

            // Login Success
            // 1. Create User Object
            const microsoftUser = {
                id: 'ms_' + email.split('@')[0],
                email: email,
                name: email.split('@')[0],
                type: 'microsoft',
                created_at: new Date().toISOString()
            };

            // 2. Persist Session (Mock Supabase Token structure for checkSession compatibility)
            const sessionData = {
                user: {
                    id: microsoftUser.id,
                    email: microsoftUser.email,
                    user_metadata: { name: microsoftUser.name },
                    created_at: microsoftUser.created_at,
                    updated_at: microsoftUser.created_at
                },
                access_token: 'microsoft-mock-token-' + Date.now()
            };
            localStorage.setItem('sb-oqtlakdvlmkaalymgrwd-auth-token', JSON.stringify(sessionData));

            // 3. Cache Grades
            localStorage.setItem('cached_grades', JSON.stringify(data.data));

            // 4. Set Global State
            setAuth(microsoftUser);

            navigate('/home');

        } catch (err) {
            console.error(err);
            setError(err.message || 'Lỗi kết nối đến Server xác thực');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get title based on method
    const getFormTitle = () => {
        switch (loginMethod) {
            case 'clb': return 'CLB Tin Học KMA';
            case 'qldt': return 'Cổng QLĐT';
            case 'microsoft': return 'Microsoft Account';
            default: return 'Đăng nhập';
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">{getFormTitle()}</h1>
                    <p className="login-subtitle">Vui lòng chọn phương thức đăng nhập</p>
                </div>

                {loading && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                        <div className="loading-text">Đang đăng nhập...</div>
                    </div>
                )}

                <div className="login-tabs">
                    <button
                        className={`tab-item ${loginMethod === 'clb' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('clb'); setError(''); }}
                    >
                        Tài khoản CLB
                    </button>
                    <button
                        className={`tab-item ${loginMethod === 'qldt' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('qldt'); setError(''); }}
                    >
                        Tài khoản QLĐT
                    </button>
                    <button
                        className={`tab-item ${loginMethod === 'microsoft' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('microsoft'); setError(''); }}
                    >
                        Microsoft
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {loginMethod === 'clb' && (
                    <form onSubmit={handleClbSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Mật khẩu</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                        </button>

                        <div className="login-footer">
                            <p>Chưa có tài khoản? <Link to="/signup">Đăng ký ngay</Link></p>
                        </div>
                    </form>
                )}

                {loginMethod === 'qldt' && (
                    <form onSubmit={handleQldtSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="qldt-user">Mã sinh viên</label>
                            <input type="text" id="qldt-user" placeholder="Nhập mã sinh viên (CT...)" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="qldt-pass">Mật khẩu</label>
                            <input type="password" id="qldt-pass" placeholder="Mật khẩu QLĐT" />
                        </div>
                        <button type="submit" className="login-button btn-qldt">
                            Đăng nhập QLĐT
                        </button>
                    </form>
                )}

                {loginMethod === 'microsoft' && (
                    <form onSubmit={handleMicrosoftLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="micro-email">Email Microsoft</label>
                            <input
                                type="email"
                                id="micro-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@student.actvn.edu.vn"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="micro-pass">Mật khẩu</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="micro-pass"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Mật khẩu email trường"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            style={{ background: '#2F2F2F' }} // Style distinct from CLB button
                        >
                            Đăng nhập Microsoft
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
