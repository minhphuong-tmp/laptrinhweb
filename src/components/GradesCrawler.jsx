import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './GradesCrawler.css';

const GradesCrawler = ({ onCrawlSuccess, userEmail }) => {
    const [email, setEmail] = useState(userEmail || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userEmail) setEmail(userEmail);
    }, [userEmail]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('Đang khởi động trình duyệt...');
        setError(null);

        try {
            const response = await fetch('http://localhost:3001/api/crawl-grades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Có lỗi xảy ra');
            }

            // Cache the new data
            localStorage.setItem('cached_grades', JSON.stringify(data.data));
            setStatus('Lấy dữ liệu thành công!');

            if (onCrawlSuccess) {
                onCrawlSuccess(data.data);
            }
        } catch (err) {
            setError(err.message);
            setStatus('Thất bại.');
        } finally {
            setLoading(false);
        }
    };

    const fillSampleCredentials = () => {
        setEmail('CT060131@actvn.edu.vn');
        setPassword('Phuong2003!');
    };

    return (
        <div className="grades-crawler-container">
            <motion.div
                className="grades-crawler-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <h3>Tra cứu dữ liệu điểm</h3>
                <p className="description">
                    Vui lòng đăng nhập tài khoản Microsoft Office 365 của Học viện để hệ thống tự động đồng bộ điểm vào chương trình học của bạn.
                </p>

                <div className="sample-credentials-box">
                    <button
                        type="button"
                        onClick={fillSampleCredentials}
                        className="btn-fill-sample"
                    >
                        💡 Điền thông tin mẫu (Test)
                    </button>
                    <div className="sample-info">
                        <span>Email: CT060131@actvn.edu.vn</span>
                        <span>PW: Phuong2003!</span>
                    </div>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email Sinh viên</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="example@student.actvn.edu.vn"
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="status-message">
                        {loading && (
                            <div className="loading-indicator">
                                <div className="spinner"></div>
                                <span>{status}</span>
                                <small>(Thực hiện đăng nhập trên trình duyệt vừa mở)</small>
                            </div>
                        )}
                        {error && <div className="error-message">{error}</div>}
                    </div>

                    <button type="submit" className="crawl-btn" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Bắt đầu Crawl Dữ liệu'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default GradesCrawler;
