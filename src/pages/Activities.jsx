import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Activities.css';

const Activities = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');

    // Mock data for demonstration
    useEffect(() => {
        const mockActivities = [
            {
                id: 1,
                title: 'Workshop Lập trình Web với React',
                description: 'Học cách xây dựng ứng dụng web hiện đại với React.js',
                type: 'Workshop',
                date: '2024-01-15',
                time: '14:00',
                location: 'Phòng A101',
                maxParticipants: 30,
                currentParticipants: 25,
                status: 'upcoming',
                organizer: 'Nguyễn Văn A',
                requirements: 'Kiến thức cơ bản về HTML, CSS, JavaScript'
            },
            {
                id: 2,
                title: 'Cuộc thi Hackathon KMA 2024',
                description: 'Cuộc thi lập trình 48h với chủ đề "Giải pháp số cho giáo dục"',
                type: 'Cuộc thi',
                date: '2024-02-20',
                time: '08:00',
                location: 'Hội trường lớn',
                maxParticipants: 100,
                currentParticipants: 85,
                status: 'upcoming',
                organizer: 'Trần Thị B',
                requirements: 'Thành viên CLB Tin học'
            },
            {
                id: 3,
                title: 'Seminar AI và Machine Learning',
                description: 'Tìm hiểu về trí tuệ nhân tạo và học máy trong thực tế',
                type: 'Seminar',
                date: '2024-01-10',
                time: '19:00',
                location: 'Online - Zoom',
                maxParticipants: 200,
                currentParticipants: 150,
                status: 'completed',
                organizer: 'Lê Văn C',
                requirements: 'Không yêu cầu kiến thức trước'
            },
            {
                id: 4,
                title: 'Họp CLB tháng 1/2024',
                description: 'Tổng kết hoạt động tháng 12 và kế hoạch tháng 1',
                type: 'Họp CLB',
                date: '2024-01-05',
                time: '18:00',
                location: 'Phòng họp CLB',
                maxParticipants: 50,
                currentParticipants: 35,
                status: 'completed',
                organizer: 'Phạm Thị D',
                requirements: 'Thành viên CLB'
            }
        ];
        
        setTimeout(() => {
            setActivities(mockActivities);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredActivities = activities.filter(activity => {
        const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
        const matchesType = filterType === 'all' || activity.type === filterType;
        return matchesStatus && matchesType;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming':
                return '#3498db';
            case 'ongoing':
                return '#f39c12';
            case 'completed':
                return '#27ae60';
            case 'cancelled':
                return '#e74c3c';
            default:
                return '#95a5a6';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'upcoming':
                return 'Sắp diễn ra';
            case 'ongoing':
                return 'Đang diễn ra';
            case 'completed':
                return 'Đã hoàn thành';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Workshop':
                return '🛠️';
            case 'Cuộc thi':
                return '🏆';
            case 'Seminar':
                return '🎓';
            case 'Họp CLB':
                return '👥';
            default:
                return '📅';
        }
    };

    if (loading) {
        return (
            <div className="activities-page">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải danh sách hoạt động...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="activities-page">
            <div className="activities-header">
                <div className="header-left">
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/home')}
                        title="Quay lại trang chủ"
                    >
                        ← Quay lại
                    </button>
                    <h1>📅 Quản lý hoạt động CLB</h1>
                </div>
                <button 
                    className="add-activity-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    ➕ Tạo hoạt động mới
                </button>
            </div>

            <div className="activities-filters">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="upcoming">Sắp diễn ra</option>
                    <option value="ongoing">Đang diễn ra</option>
                    <option value="completed">Đã hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                </select>
                
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">Tất cả loại</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Cuộc thi">Cuộc thi</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Họp CLB">Họp CLB</option>
                </select>
            </div>

            <div className="activities-stats">
                <div className="stat-card">
                    <span className="stat-number">{activities.length}</span>
                    <span className="stat-label">Tổng hoạt động</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{activities.filter(a => a.status === 'upcoming').length}</span>
                    <span className="stat-label">Sắp diễn ra</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{activities.filter(a => a.status === 'ongoing').length}</span>
                    <span className="stat-label">Đang diễn ra</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{activities.filter(a => a.status === 'completed').length}</span>
                    <span className="stat-label">Đã hoàn thành</span>
                </div>
            </div>

            <div className="activities-grid">
                {filteredActivities.map((activity) => (
                    <div key={activity.id} className="activity-card">
                        <div className="activity-header">
                            <div className="activity-type">
                                <span className="type-icon">{getTypeIcon(activity.type)}</span>
                                <span className="type-text">{activity.type}</span>
                            </div>
                            <div 
                                className="activity-status"
                                style={{ backgroundColor: getStatusColor(activity.status) }}
                            >
                                {getStatusText(activity.status)}
                            </div>
                        </div>
                        
                        <div className="activity-content">
                            <h3 className="activity-title">{activity.title}</h3>
                            <p className="activity-description">{activity.description}</p>
                            
                            <div className="activity-details">
                                <div className="detail-item">
                                    <span className="detail-icon">📅</span>
                                    <span className="detail-text">
                                        {new Date(activity.date).toLocaleDateString('vi-VN')} lúc {activity.time}
                                    </span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="detail-icon">📍</span>
                                    <span className="detail-text">{activity.location}</span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="detail-icon">👤</span>
                                    <span className="detail-text">Tổ chức: {activity.organizer}</span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="detail-icon">👥</span>
                                    <span className="detail-text">
                                        {activity.currentParticipants}/{activity.maxParticipants} người tham gia
                                    </span>
                                </div>
                            </div>
                            
                            {activity.requirements && (
                                <div className="activity-requirements">
                                    <strong>Yêu cầu:</strong> {activity.requirements}
                                </div>
                            )}
                        </div>
                        
                        <div className="activity-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ 
                                        width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%` 
                                    }}
                                ></div>
                            </div>
                            <span className="progress-text">
                                {Math.round((activity.currentParticipants / activity.maxParticipants) * 100)}% đã đăng ký
                            </span>
                        </div>
                        
                        <div className="activity-actions">
                            <button className="action-btn edit-btn">✏️ Chỉnh sửa</button>
                            <button className="action-btn participants-btn">👥 Danh sách</button>
                            <button className="action-btn delete-btn">🗑️ Xóa</button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredActivities.length === 0 && (
                <div className="no-results">
                    <p>Không tìm thấy hoạt động nào phù hợp</p>
                </div>
            )}
        </div>
    );
};

export default Activities;
