import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './GradesLogin.css'; // Re-use existing styles for consistency

const ScheduleLogin = ({ onLoginSuccess }) => {
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/crawl-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Đăng nhập thất bại');
            }

            // Success - Pass data to parent
            // data.data is the rows
            onLoginSuccess({ studentId, scheduleData: data.data });

        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra khi kết nối');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grades-login-container" style={{ height: '100%', minHeight: '600px' }}>
            <motion.div
                className="grades-login-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2>Đăng nhập QLDT</h2>
                <p className="description">
                    Vui lòng đăng nhập tài khoản Quản lý đào tạo để xem thời khóa biểu cá nhân.
                </p>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Mã sinh viên</label>
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            required
                            placeholder="CT0..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <div className="password-input-wrapper" style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ width: '100%', paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
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

                    <div className="status-message">
                        {error && <div className="error-message">{error}</div>}
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>

                    <div style={{ marginTop: '15px', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setStudentId('CT060131');
                                setPassword('phuong2003');
                            }}
                            style={{
                                background: 'transparent',
                                border: '1px dashed #666',
                                color: '#666',
                                padding: '5px 10px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                borderRadius: '4px'
                            }}
                        >
                            Điền tài khoản mẫu
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ScheduleLogin;
