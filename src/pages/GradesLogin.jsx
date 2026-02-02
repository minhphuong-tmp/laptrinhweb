import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './GradesLogin.css';

const GradesLogin = () => {
    const { user } = useAuth(); // Get global user
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [gradesData, setGradesData] = useState(null);
    const [error, setError] = useState(null);

    // Filters
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedSemester, setSelectedSemester] = useState('All');

    // Auto-load if user logged in via Microsoft or has cache
    useEffect(() => {
        const cached = localStorage.getItem('cached_grades');
        if (cached) {
            try {
                setGradesData(JSON.parse(cached));
            } catch (e) { console.error('Error parsing cached grades', e); }
        }

        // Pre-fill email if user exists
        if (user && user.email) {
            setEmail(user.email);
        }
    }, [user]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('Đang khởi động trình duyệt...');
        setError(null);
        setGradesData(null);

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

            setGradesData(data.data);
            // Cache the new data
            localStorage.setItem('cached_grades', JSON.stringify(data.data));
            setStatus('Lấy dữ liệu thành công!');
        } catch (err) {
            setError(err.message);
            setStatus('Thất bại.');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredData = useMemo(() => {
        if (!gradesData) return [];

        // Assuming Data Structure (after backend removal of "Lựa chọn"):
        // 0: #, 1: Năm học, 2: Học kỳ ...
        return gradesData.filter(row => {
            const yearMatch = selectedYear === 'All' || row[1] === selectedYear;
            const semesterMatch = selectedSemester === 'All' || row[2] === selectedSemester;
            return yearMatch && semesterMatch;
        });
    }, [gradesData, selectedYear, selectedSemester]);

    // Unique Years and Semesters for Options
    const years = useMemo(() => {
        if (!gradesData) return [];
        return [...new Set(gradesData.map(row => row[1]))].sort().reverse();
    }, [gradesData]);

    const semesters = useMemo(() => {
        if (!gradesData) return [];
        return [...new Set(gradesData.map(row => row[2]))].sort();
    }, [gradesData]);

    return (
        <div className="grades-login-container">
            <motion.div
                className="grades-login-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2>Xem Điểm Thi (Beta)</h2>

                {!gradesData ? (
                    <>
                        <p className="description">
                            Tính năng này sẽ mở một trình duyệt trên máy bạn để hỗ trợ đăng nhập Microsoft.
                        </p>
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
                                        <small>(Vui lòng thực hiện đăng nhập trên cửa sổ trình duyệt vừa mở)</small>
                                    </div>
                                )}
                                {error && <div className="error-message">{error}</div>}
                            </div>

                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? 'Đang xử lý...' : 'Bắt đầu Crawl'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="grades-result">
                        <div className="result-header">
                            <h3>Kết quả điểm thi</h3>
                            <button onClick={() => setGradesData(null)} className="reset-btn-small">
                                Tra cứu lại
                            </button>
                        </div>

                        <div className="filters">
                            <div className="filter-group">
                                <label>Năm học:</label>
                                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                                    <option value="All">Tất cả</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Học kỳ:</label>
                                <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
                                    <option value="All">Tất cả</option>
                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Năm học</th>
                                        <th>Học kỳ</th>
                                        <th>Môn thi</th>
                                        <th>Lần</th>
                                        <th>TP1</th>
                                        <th>TP2</th>
                                        <th>ĐQT</th>
                                        <th>Điểm thi</th>
                                        <th>Điểm HP</th>
                                        <th>Điểm chữ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((row, index) => (
                                            <tr key={index}>
                                                {row.map((cell, cellIndex) => (
                                                    <td key={cellIndex}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="11" style={{ textAlign: 'center', padding: '20px' }}>
                                                Không có dữ liệu cho bộ lọc này.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default GradesLogin;
