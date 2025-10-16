import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Leaderboard.css';

const Leaderboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPeriod, setFilterPeriod] = useState('all'); // all, month, year
    const [filterCategory, setFilterCategory] = useState('all'); // all, activities, documents, posts

    // Mock data for demonstration
    useEffect(() => {
        const mockLeaderboard = [
            {
                id: 1,
                name: 'Nguyễn Văn A',
                studentId: 'KMA001',
                avatar: null,
                role: 'Chủ nhiệm CLB',
                totalPoints: 1250,
                activities: {
                    participated: 12,
                    organized: 3,
                    points: 400
                },
                documents: {
                    uploaded: 8,
                    downloaded: 45,
                    points: 300
                },
                posts: {
                    created: 15,
                    comments: 89,
                    likes: 156,
                    points: 350
                },
                achievements: ['🏆 Thành viên tích cực', '📚 Chuyên gia tài liệu', '💬 Người dẫn dắt'],
                rank: 1
            },
            {
                id: 2,
                name: 'Trần Thị B',
                studentId: 'KMA002',
                avatar: null,
                role: 'Phó CLB',
                totalPoints: 980,
                activities: {
                    participated: 10,
                    organized: 2,
                    points: 320
                },
                documents: {
                    uploaded: 6,
                    downloaded: 38,
                    points: 250
                },
                posts: {
                    created: 12,
                    comments: 67,
                    likes: 134,
                    points: 280
                },
                achievements: ['🏆 Thành viên tích cực', '📚 Chuyên gia tài liệu'],
                rank: 2
            },
            {
                id: 3,
                name: 'Lê Văn C',
                studentId: 'KMA003',
                avatar: null,
                role: 'Thành viên',
                totalPoints: 750,
                activities: {
                    participated: 8,
                    organized: 1,
                    points: 250
                },
                documents: {
                    uploaded: 4,
                    downloaded: 32,
                    points: 200
                },
                posts: {
                    created: 9,
                    comments: 45,
                    likes: 98,
                    points: 200
                },
                achievements: ['💬 Người dẫn dắt'],
                rank: 3
            },
            {
                id: 4,
                name: 'Phạm Thị D',
                studentId: 'KMA004',
                avatar: null,
                role: 'Thành viên',
                totalPoints: 620,
                activities: {
                    participated: 6,
                    organized: 0,
                    points: 180
                },
                documents: {
                    uploaded: 3,
                    downloaded: 28,
                    points: 150
                },
                posts: {
                    created: 7,
                    comments: 34,
                    likes: 76,
                    points: 150
                },
                achievements: [],
                rank: 4
            },
            {
                id: 5,
                name: 'Hoàng Văn E',
                studentId: 'KMA005',
                avatar: null,
                role: 'Thành viên',
                totalPoints: 480,
                activities: {
                    participated: 5,
                    organized: 0,
                    points: 150
                },
                documents: {
                    uploaded: 2,
                    downloaded: 25,
                    points: 120
                },
                posts: {
                    created: 5,
                    comments: 28,
                    likes: 65,
                    points: 110
                },
                achievements: [],
                rank: 5
            }
        ];
        
        setTimeout(() => {
            setLeaderboard(mockLeaderboard);
            setLoading(false);
        }, 1000);
    }, []);

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return `#${rank}`;
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 1:
                return '#ffd700';
            case 2:
                return '#c0c0c0';
            case 3:
                return '#cd7f32';
            default:
                return '#6c757d';
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Chủ nhiệm CLB':
                return '#e74c3c';
            case 'Phó CLB':
                return '#f39c12';
            case 'Thành viên':
                return '#27ae60';
            default:
                return '#95a5a6';
        }
    };

    if (loading) {
        return (
            <div className="leaderboard-page">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải bảng xếp hạng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-header">
                <div className="header-left">
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/home')}
                        title="Quay lại trang chủ"
                    >
                        ← Quay lại
                    </button>
                    <h1>🏆 Bảng xếp hạng CLB</h1>
                </div>
                <div className="header-right">
                    <div className="current-user-rank">
                        <span className="rank-label">Xếp hạng của bạn:</span>
                        <span className="rank-value">#8</span>
                    </div>
                </div>
            </div>

            <div className="leaderboard-filters">
                <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">Tất cả thời gian</option>
                    <option value="month">Tháng này</option>
                    <option value="year">Năm nay</option>
                </select>
                
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">Tất cả hoạt động</option>
                    <option value="activities">Hoạt động</option>
                    <option value="documents">Tài liệu</option>
                    <option value="posts">Bài viết</option>
                </select>
            </div>

            <div className="leaderboard-stats">
                <div className="stat-card">
                    <span className="stat-number">{leaderboard.length}</span>
                    <span className="stat-label">Thành viên</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{leaderboard[0]?.totalPoints || 0}</span>
                    <span className="stat-label">Điểm cao nhất</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{Math.round(leaderboard.reduce((sum, member) => sum + member.totalPoints, 0) / leaderboard.length)}</span>
                    <span className="stat-label">Điểm trung bình</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{leaderboard.filter(m => m.achievements.length > 0).length}</span>
                    <span className="stat-label">Có thành tích</span>
                </div>
            </div>

            <div className="leaderboard-container">
                <div className="leaderboard-list">
                    {leaderboard.map((member, index) => (
                        <div key={member.id} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                            <div className="rank-section">
                                <div 
                                    className="rank-icon"
                                    style={{ color: getRankColor(member.rank) }}
                                >
                                    {getRankIcon(member.rank)}
                                </div>
                                <div className="rank-number">#{member.rank}</div>
                            </div>
                            
                            <div className="member-info">
                                <div className="member-avatar">
                                    {member.avatar ? (
                                        <img src={member.avatar} alt={member.name} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {member.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="member-details">
                                    <h3 className="member-name">{member.name}</h3>
                                    <div className="member-meta">
                                        <span className="student-id">{member.studentId}</span>
                                        <span 
                                            className="member-role"
                                            style={{ color: getRoleColor(member.role) }}
                                        >
                                            {member.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="points-section">
                                <div className="total-points">{member.totalPoints.toLocaleString()}</div>
                                <div className="points-label">điểm</div>
                            </div>
                            
                            <div className="breakdown-section">
                                <div className="breakdown-item">
                                    <span className="breakdown-icon">📅</span>
                                    <span className="breakdown-value">{member.activities.points}</span>
                                </div>
                                <div className="breakdown-item">
                                    <span className="breakdown-icon">📚</span>
                                    <span className="breakdown-value">{member.documents.points}</span>
                                </div>
                                <div className="breakdown-item">
                                    <span className="breakdown-icon">💬</span>
                                    <span className="breakdown-value">{member.posts.points}</span>
                                </div>
                            </div>
                            
                            <div className="achievements-section">
                                {member.achievements.length > 0 ? (
                                    <div className="achievements">
                                        {member.achievements.map((achievement, idx) => (
                                            <span key={idx} className="achievement-badge">
                                                {achievement}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-achievements">Chưa có thành tích</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="scoring-info">
                <h3>📊 Hệ thống tính điểm</h3>
                <div className="scoring-grid">
                    <div className="scoring-category">
                        <h4>📅 Hoạt động</h4>
                        <ul>
                            <li>Tham gia hoạt động: <strong>20 điểm</strong></li>
                            <li>Tổ chức hoạt động: <strong>50 điểm</strong></li>
                            <li>Điểm danh đầy đủ: <strong>+10 điểm</strong></li>
                        </ul>
                    </div>
                    <div className="scoring-category">
                        <h4>📚 Tài liệu</h4>
                        <ul>
                            <li>Tải lên tài liệu: <strong>30 điểm</strong></li>
                            <li>Tải xuống tài liệu: <strong>5 điểm</strong></li>
                            <li>Tài liệu được đánh giá cao: <strong>+20 điểm</strong></li>
                        </ul>
                    </div>
                    <div className="scoring-category">
                        <h4>💬 Tương tác</h4>
                        <ul>
                            <li>Tạo bài viết: <strong>15 điểm</strong></li>
                            <li>Bình luận: <strong>5 điểm</strong></li>
                            <li>Nhận lượt thích: <strong>2 điểm</strong></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
