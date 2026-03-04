import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudySessions, getTopRequestedSubjects, requestStudySupport } from '../services/studyService';
import './StudySupport.css';

const StudySupport = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [topSubjects, setTopSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form đăng ký học
    const [subjectName, setSubjectName] = useState('');
    const [currentGrade, setCurrentGrade] = useState('');
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [sessionsRes, subjectsRes] = await Promise.all([
                getStudySessions(),
                getTopRequestedSubjects()
            ]);

            if (sessionsRes.data) setSessions(sessionsRes.data);
            if (subjectsRes.data) setTopSubjects(subjectsRes.data);
            setLoading(false);
        };

        loadData();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!subjectName.trim()) {
            alert('⚠️ Vui lòng nhập tên môn học!');
            return;
        }

        if (!user?.id) {
            alert('⚠️ Bạn cần đăng nhập để đăng ký học!');
            return;
        }

        setRegistering(true);
        try {
            const result = await requestStudySupport(user.id, subjectName.trim(), currentGrade.trim());
            if (result.error) {
                alert(`❌ Đăng ký thất bại: ${result.error.message || 'Lỗi không xác định'}`);
            } else {
                alert(`✅ Đã gửi yêu cầu hỗ trợ môn "${subjectName}" thành công! Admin sẽ liên hệ sớm.`);
                setSubjectName('');
                setCurrentGrade('');
                // Reload top subjects
                const subjectsRes = await getTopRequestedSubjects();
                if (subjectsRes.data) setTopSubjects(subjectsRes.data);
            }
        } catch (err) {
            alert('❌ Đã có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div className="study-support-container">
            <motion.div
                className="study-support-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>🤝 Hỗ trợ học tập (Peer Support)</h1>
                <p>Nơi kết nối sinh viên hỗ trợ nhau cùng vượt qua các môn học khó.</p>
            </motion.div>

            <div className="study-support-grid">
                {/* Section 1: Active/Upcoming Sessions */}
                <section className="support-section active-sessions">
                    <div className="section-header">
                        <h2>📚 Phòng học đang/sắp diễn ra</h2>
                    </div>
                    {loading ? (
                        <div className="loading-box">Đang tải lịch học...</div>
                    ) : sessions.length === 0 ? (
                        <div className="empty-box">Chưa có phòng học nào được lên lịch.</div>
                    ) : (
                        <div className="session-cards">
                            {sessions.map(session => (
                                <motion.div
                                    key={session.id}
                                    className={`session-card ${session.status}`}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="session-info">
                                        <div className="subject-badge">{session.subject_name}</div>
                                        <div className="session-time">
                                            ⏰ {new Date(session.scheduled_at).toLocaleString('vi-VN')}
                                        </div>
                                        <div className="session-members">
                                            👥 {session.member_count} người tham gia
                                        </div>
                                    </div>
                                    <div className="session-action">
                                        <Link
                                            to={`/study-room/${session.id}`}
                                            className="join-btn"
                                        >
                                            🎥 Vào phòng học
                                        </Link>
                                        {session.room_url && session.room_url !== '#' && (
                                            <a href={session.room_url} target="_blank" rel="noopener noreferrer" className="join-btn-alt">
                                                🔗 Google Meet
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Section 2: Đăng ký học */}
                <section className="support-section register-section">
                    <div className="section-header">
                        <h2>✍️ Đăng ký cần hỗ trợ</h2>
                    </div>
                    <form onSubmit={handleRegister} className="register-form">
                        <div className="form-group">
                            <label htmlFor="subject-name">Tên môn học <span style={{ color: 'red' }}>*</span></label>
                            <input
                                id="subject-name"
                                type="text"
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                placeholder="VD: Giải tích 1, Vật lý 2..."
                                disabled={registering}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="current-grade">Điểm hiện tại (nếu có)</label>
                            <input
                                id="current-grade"
                                type="text"
                                value={currentGrade}
                                onChange={(e) => setCurrentGrade(e.target.value)}
                                placeholder="VD: 4.5, D+, Chưa thi..."
                                disabled={registering}
                            />
                        </div>
                        <button
                            type="submit"
                            className="register-btn"
                            disabled={registering}
                        >
                            {registering ? '⏳ Đang gửi...' : '📩 Đăng ký học'}
                        </button>
                    </form>
                </section>

                {/* Section 3: Public Registration Stats */}
                <section className="support-section public-stats">
                    <div className="section-header">
                        <h2>🔥 Top môn học cần hỗ trợ</h2>
                    </div>
                    <div className="stats-list">
                        {topSubjects.length === 0 ? (
                            <div className="empty-box">Chưa có yêu cầu nào.</div>
                        ) : (
                            topSubjects.map((sub, index) => (
                                <div key={index} className="stat-item">
                                    <span className="subject-name">{sub.subject_name}</span>
                                    <div className="stat-bar-container">
                                        <div
                                            className="stat-bar"
                                            style={{ width: `${Math.min(sub.count * 10, 100)}%` }}
                                        ></div>
                                        <span className="count-label">{sub.count} yêu cầu</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="admin-note">
                        <p>💡 <i>Ghi chú: Chủ nhiệm (Admin) sẽ dựa trên số học viên đăng ký để tổ chức buổi phụ đạo sớm nhất.</i></p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StudySupport;
