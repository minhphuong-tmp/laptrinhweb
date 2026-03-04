import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getActivityById, getActivityParticipants, registerForActivity, unregisterFromActivity, isUserRegistered } from '../services/activityService';
import './ActivityDetail.css';

const ActivityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [participants, setParticipants] = useState([]);
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        const loadActivity = async () => {
            try {
                setLoading(true);
                console.log('📂 Loading activity from database:', id);
                
                // Load activity details
                const { data: activityData, error: activityError } = await getActivityById(id);
                
                if (activityError) {
                    console.error('❌ Error loading activity:', activityError);
                    setActivity(null);
                    return;
                }
                
                setActivity(activityData);
                
                // Load participants
                const { data: participantsData, error: participantsError } = await getActivityParticipants(id);
                
                if (!participantsError) {
                    setParticipants(participantsData);
                }
                
                // Check if user is registered
                if (user) {
                    const { data: isReg, error: regError } = await isUserRegistered(id, user.id);
                    
                    if (!regError) {
                        setIsRegistered(isReg);
                    }
                }
                
            } catch (error) {
                console.error('❌ Error loading activity:', error);
                setActivity(null);
            } finally {
                setLoading(false);
            }
        };

        loadActivity();
    }, [id, user]);

    const getActivityTypeIcon = (type) => {
        switch (type) {
            case 'workshop': return '📚';
            case 'competition': return '🎯';
            case 'meeting': return '📝';
            case 'social': return '🎉';
            case 'project': return '💻';
            default: return '📅';
        }
    };

    const getActivityTypeLabel = (type) => {
        switch (type) {
            case 'workshop': return 'Workshop';
            case 'competition': return 'Competition';
            case 'meeting': return 'Meeting';
            case 'social': return 'Social';
            case 'project': return 'Project';
            default: return 'Activity';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'upcoming': return 'Sắp tới';
            case 'ongoing': return 'Đang diễn ra';
            case 'completed': return 'Đã hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return 'Không xác định';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRegister = () => {
        if (isRegistered) {
            setIsRegistered(false);
            // TODO: Call API to unregister
        } else {
            setIsRegistered(true);
            // TODO: Call API to register
        }
    };

    if (loading) {
        return (
            <div className="activity-detail-container">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải chi tiết hoạt động...</p>
                </div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="activity-detail-container">
                <div className="error">
                    <h3>Không tìm thấy sự kiện</h3>
                    <p>Sự kiện này không tồn tại hoặc đã bị xóa</p>
                    <button onClick={() => navigate('/activities')} className="back-btn">
                        ← Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="activity-detail-container">
            {/* Header */}
            <div className="activity-detail-header">
                <button onClick={() => navigate('/activities')} className="back-btn">
                    ← Quay lại danh sách
                </button>
                
                <div className="header-actions">
                    <button className="share-btn">
                        📤 Chia sẻ
                    </button>
                    <button className="calendar-btn">
                        📅 Thêm vào lịch
                    </button>
                </div>
            </div>

            {/* Activity Info */}
            <div className="activity-detail-content">
                <div className="activity-main">
                    {/* Thumbnail */}
                    <div className="activity-thumbnail">
                        <img src={activity.thumbnail} alt={activity.title} />
                        <div className="activity-type-badge">
                            {getActivityTypeIcon(activity.activity_type)}
                            {getActivityTypeLabel(activity.activity_type)}
                        </div>
                        <span className={`status-badge status-${activity.status}`}>
                            {getStatusLabel(activity.status)}
                        </span>
                    </div>

                    {/* Title and Description */}
                    <div className="activity-info">
                        <h1 className="activity-title">{activity.title}</h1>
                        
                        <div className="activity-meta">
                            <div className="meta-item">
                                <span className="meta-icon">📅</span>
                                <span className="meta-text">{formatDate(activity.start_date)}</span>
                            </div>
                            
                            <div className="meta-item">
                                <span className="meta-icon">🏢</span>
                                <span className="meta-text">{activity.location}</span>
                            </div>
                            
                            <div className="meta-item">
                                <span className="meta-icon">👥</span>
                                <span className="meta-text">{activity.current_participants}/{activity.max_participants} người</span>
                            </div>
                            
                            <div className="meta-item">
                                <span className="meta-icon">👨‍🏫</span>
                                <span className="meta-text">{activity.organizer.name}</span>
                            </div>
                        </div>

                        <div className="activity-description">
                            <h3>📋 Mô tả</h3>
                            <p>{activity.description}</p>
                        </div>

                        <div className="activity-tags">
                            <h3>🏷️ Tags</h3>
                            <div className="tags-list">
                                {activity.tags && Array.isArray(activity.tags) ? activity.tags.map((tag, index) => (
                                    <span key={index} className="tag">
                                        #{tag}
                                    </span>
                                )) : <span className="no-tags">Không có tags</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="activity-sidebar">
                    {/* Register Button */}
                    <div className="register-section">
                        {isRegistered ? (
                            <button className="registered-btn" onClick={handleRegister}>
                                ✅ Đã đăng ký
                            </button>
                        ) : (
                            <button className="register-btn" onClick={handleRegister}>
                                ⏰ Đăng ký tham gia
                            </button>
                        )}
                        
                        <div className="register-info">
                            <p>👥 {activity.current_participants}/{activity.max_participants} người đã đăng ký</p>
                            {activity.current_participants < activity.max_participants && (
                                <p>🎯 Còn {activity.max_participants - activity.current_participants} chỗ trống</p>
                            )}
                        </div>
                    </div>

                    {/* Organizer Info */}
                    <div className="organizer-section">
                        <h3>👨‍🏫 Người tổ chức</h3>
                        <div className="organizer-info">
                            <img src={activity.organizer.image} alt={activity.organizer.name} />
                            <div className="organizer-details">
                                <h4>{activity.organizer.name}</h4>
                                <p>{activity.organizer.title}</p>
                                <p>{activity.organizer.company}</p>
                            </div>
                        </div>
                    </div>

                    {/* Requirements */}
                    <div className="requirements-section">
                        <h3>📋 Yêu cầu</h3>
                        <ul className="requirements-list">
                            {activity.requirements.map((req, index) => (
                                <li key={index}>{req}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Materials */}
                    <div className="materials-section">
                        <h3>📎 Tài liệu</h3>
                        <div className="materials-list">
                            {activity.materials.map((material, index) => (
                                <div key={index} className="material-item">
                                    <span className="material-icon">
                                        {material.type === 'pdf' ? '📄' : '📦'}
                                    </span>
                                    <div className="material-info">
                                        <span className="material-name">{material.name}</span>
                                        <span className="material-size">{material.size}</span>
                                    </div>
                                    <button className="download-btn">⬇️</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Participants */}
            <div className="participants-section">
                <h3>👥 Danh sách tham gia</h3>
                <div className="participants-list">
                    {participants.map((participant) => (
                        <div key={participant.id} className="participant-item">
                            <img src={participant.image} alt={participant.name} />
                            <span className="participant-name">{participant.name}</span>
                            <span className="participant-role">{participant.role}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActivityDetail;

