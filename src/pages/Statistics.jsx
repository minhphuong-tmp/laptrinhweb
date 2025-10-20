import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Statistics.css';

const Statistics = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    // Mock data for demonstration
    useEffect(() => {
        const mockStats = {
            members: {
                total: 156,
                newThisMonth: 12,
                byRole: {
                    'Chủ nhiệm CLB': 1,
                    'Phó CLB': 2,
                    'Thành viên': 153
                },
                byYear: {
                    '2021': 15,
                    '2022': 28,
                    '2023': 45,
                    '2024': 68
                }
            },
            activities: {
                total: 24,
                thisMonth: 3,
                byType: {
                    'Workshop': 8,
                    'Cuộc thi': 4,
                    'Seminar': 6,
                    'Họp CLB': 6
                },
                participation: {
                    totalParticipants: 1240,
                    averagePerActivity: 52
                }
            },
            documents: {
                total: 89,
                thisMonth: 7,
                byCategory: {
                    'Lập trình': 35,
                    'Lý thuyết': 28,
                    'Video': 15,
                    'Thi cử': 11
                },
                downloads: {
                    total: 2340,
                    thisMonth: 180
                }
            },
            engagement: {
                posts: 156,
                comments: 892,
                likes: 2340,
                shares: 156
            }
        };
        
        setTimeout(() => {
            setStats(mockStats);
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải thống kê...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Thống kê CLB</h1>
            </div>

            {/* Tổng quan */}
            <div className="overview-section">
                <h2>📊 Tổng quan</h2>
                <div className="overview-grid">
                    <div className="overview-card">
                        <div className="card-icon">👥</div>
                        <div className="card-content">
                            <div className="card-number">{stats.members?.total || 0}</div>
                            <div className="card-label">Thành viên</div>
                        </div>
                    </div>
                    <div className="overview-card">
                        <div className="card-icon">📅</div>
                        <div className="card-content">
                            <div className="card-number">{stats.activities?.total || 0}</div>
                            <div className="card-label">Hoạt động</div>
                        </div>
                    </div>
                    <div className="overview-card">
                        <div className="card-icon">📚</div>
                        <div className="card-content">
                            <div className="card-number">{stats.documents?.total || 0}</div>
                            <div className="card-label">Tài liệu</div>
                        </div>
                    </div>
                    <div className="overview-card">
                        <div className="card-icon">💬</div>
                        <div className="card-content">
                            <div className="card-number">{stats.engagement?.posts || 0}</div>
                            <div className="card-label">Bài viết</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thành viên */}
            <div className="section">
                <h2>👥 Thống kê thành viên</h2>
                <div className="section-grid">
                    <div className="chart-card">
                        <h3>Phân bố theo vai trò</h3>
                        <div className="role-chart">
                            {Object.entries(stats.members?.byRole || {}).map(([role, count]) => (
                                <div key={role} className="role-item">
                                    <div className="role-info">
                                        <span className="role-name">{role}</span>
                                        <span className="role-count">{count}</span>
                                    </div>
                                    <div className="role-bar">
                                        <div 
                                            className="role-fill"
                                            style={{ 
                                                width: `${(count / stats.members?.total) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="chart-card">
                        <h3>Thành viên mới theo năm</h3>
                        <div className="year-chart">
                            {Object.entries(stats.members?.byYear || {}).map(([year, count]) => (
                                <div key={year} className="year-item">
                                    <div className="year-bar">
                                        <div 
                                            className="year-fill"
                                            style={{ 
                                                height: `${(count / Math.max(...Object.values(stats.members?.byYear || {}))) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                    <div className="year-info">
                                        <span className="year-number">{count}</span>
                                        <span className="year-label">{year}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hoạt động */}
            <div className="section">
                <h2>📅 Thống kê hoạt động</h2>
                <div className="section-grid">
                    <div className="chart-card">
                        <h3>Phân loại hoạt động</h3>
                        <div className="activity-chart">
                            {Object.entries(stats.activities?.byType || {}).map(([type, count]) => (
                                <div key={type} className="activity-item">
                                    <div className="activity-info">
                                        <span className="activity-name">{type}</span>
                                        <span className="activity-count">{count}</span>
                                    </div>
                                    <div className="activity-bar">
                                        <div 
                                            className="activity-fill"
                                            style={{ 
                                                width: `${(count / stats.activities?.total) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="chart-card">
                        <h3>Tham gia hoạt động</h3>
                        <div className="participation-stats">
                            <div className="stat-item">
                                <span className="stat-label">Tổng lượt tham gia:</span>
                                <span className="stat-value">{stats.activities?.participation?.totalParticipants || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Trung bình/hoạt động:</span>
                                <span className="stat-value">{stats.activities?.participation?.averagePerActivity || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tài liệu */}
            <div className="section">
                <h2>📚 Thống kê tài liệu</h2>
                <div className="section-grid">
                    <div className="chart-card">
                        <h3>Phân loại tài liệu</h3>
                        <div className="document-chart">
                            {Object.entries(stats.documents?.byCategory || {}).map(([category, count]) => (
                                <div key={category} className="document-item">
                                    <div className="document-info">
                                        <span className="document-name">{category}</span>
                                        <span className="document-count">{count}</span>
                                    </div>
                                    <div className="document-bar">
                                        <div 
                                            className="document-fill"
                                            style={{ 
                                                width: `${(count / stats.documents?.total) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="chart-card">
                        <h3>Lượt tải xuống</h3>
                        <div className="download-stats">
                            <div className="stat-item">
                                <span className="stat-label">Tổng lượt tải:</span>
                                <span className="stat-value">{stats.documents?.downloads?.total || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Tháng này:</span>
                                <span className="stat-value">{stats.documents?.downloads?.thisMonth || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tương tác */}
            <div className="section">
                <h2>💬 Thống kê tương tác</h2>
                <div className="engagement-grid">
                    <div className="engagement-card">
                        <div className="engagement-icon">📝</div>
                        <div className="engagement-content">
                            <div className="engagement-number">{stats.engagement?.posts || 0}</div>
                            <div className="engagement-label">Bài viết</div>
                        </div>
                    </div>
                    <div className="engagement-card">
                        <div className="engagement-icon">💬</div>
                        <div className="engagement-content">
                            <div className="engagement-number">{stats.engagement?.comments || 0}</div>
                            <div className="engagement-label">Bình luận</div>
                        </div>
                    </div>
                    <div className="engagement-card">
                        <div className="engagement-icon">👍</div>
                        <div className="engagement-content">
                            <div className="engagement-number">{stats.engagement?.likes || 0}</div>
                            <div className="engagement-label">Lượt thích</div>
                        </div>
                    </div>
                    <div className="engagement-card">
                        <div className="engagement-icon">🔄</div>
                        <div className="engagement-content">
                            <div className="engagement-number">{stats.engagement?.shares || 0}</div>
                            <div className="engagement-label">Chia sẻ</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
