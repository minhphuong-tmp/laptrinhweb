import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateActivity from '../components/CreateActivity';
import EventCalendar from '../components/EventCalendar';
import { getActivities, deleteActivity } from '../services/activityService';
import './Activities.css';

const Activities = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Load activities from database
    useEffect(() => {
        const loadActivities = async () => {
            try {
                setLoading(true);
                console.log('📂 Loading activities from database...');
                
                const filters = {
                    activity_type: filterType,
                    status: filterStatus,
                    search: searchTerm
                };
                
                const { data, error } = await getActivities(filters);
                
                if (error) {
                    console.error('❌ Error loading activities:', error);
                    setActivities([]);
                } else {
                    console.log('✅ Activities loaded:', data.length);
                    setActivities(data);
                }
            } catch (error) {
                console.error('❌ Error loading activities:', error);
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };

        loadActivities();
    }, [filterType, filterStatus, searchTerm]);

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

    const handleCreateSuccess = (newActivity) => {
        console.log('✅ Activity created successfully:', newActivity);
        // Reload activities from database
        const loadActivities = async () => {
            try {
                const filters = {
                    activity_type: filterType,
                    status: filterStatus,
                    search: searchTerm
                };
                
                const { data, error } = await getActivities(filters);
                
                if (!error) {
                    setActivities(data);
                }
            } catch (error) {
                console.error('❌ Error reloading activities:', error);
            }
        };
        
        loadActivities();
        setShowCreateModal(false);
    };

    const handleDeleteActivity = async (activityId) => {
        try {
            console.log('🗑️ Deleting activity:', activityId);
            
            const { error } = await deleteActivity(activityId);
            
            if (error) {
                console.error('❌ Error deleting activity:', error);
                alert('Không thể xóa sự kiện: ' + error.message);
                return;
            }
            
            // Reload activities from database
            const filters = {
                activity_type: filterType,
                status: filterStatus,
                search: searchTerm
            };
            
            const { data, error: reloadError } = await getActivities(filters);
            
            if (!reloadError) {
                setActivities(data);
                console.log('✅ Activity deleted successfully');
            }
        } catch (error) {
            console.error('❌ Error deleting activity:', error);
            alert('Không thể xóa sự kiện');
        }
    };

    const handleUpdateActivity = (updatedActivity) => {
        console.log('✅ Activity updated successfully:', updatedActivity);
        // Reload activities from database
        const loadActivities = async () => {
            try {
                const filters = {
                    activity_type: filterType,
                    status: filterStatus,
                    search: searchTerm
                };
                
                const { data, error } = await getActivities(filters);
                
                if (!error) {
                    setActivities(data);
                }
            } catch (error) {
                console.error('❌ Error reloading activities:', error);
            }
        };
        
        loadActivities();
    };

    // Filtering is now handled by the API, so we can use activities directly
    const filteredActivities = activities;

    if (loading) {
        return (
            <div className="activities-container">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Đang tải hoạt động...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="activities-container">
            {/* Header */}
            <div className="activities-header">
                <div className="header-left">
                    <h1>📅 Lịch sự kiện CLB</h1>
                    <p>Xem và quản lý các sự kiện của CLB</p>
                </div>
                <div className="header-right">
                    <button 
                        className="create-activity-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        ➕ Tạo sự kiện
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="activities-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm sự kiện..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                </div>
                
                <div className="filter-buttons">
                    <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Tất cả loại</option>
                        <option value="workshop">Workshop</option>
                        <option value="competition">Competition</option>
                        <option value="meeting">Meeting</option>
                        <option value="social">Social</option>
                        <option value="project">Project</option>
                    </select>
                    
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="upcoming">Sắp tới</option>
                        <option value="ongoing">Đang diễn ra</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
            </div>

            {/* Calendar View */}
            <EventCalendar 
                activities={activities}
                onDateClick={(date) => {
                    console.log('Date clicked:', date);
                }}
                onEventClick={(event) => {
                    navigate(`/activities/${event.id}`);
                }}
            />

            {/* Activities List */}
            <div className="activities-section">
                <h2 className="section-title">📋 Danh sách sự kiện</h2>
                <div className="activities-grid">
                {filteredActivities.map((activity) => (
                    <div key={activity.id} className="activity-card">
                        <div className="activity-thumbnail">
                            <img src={activity.thumbnail} alt={activity.title} />
                            <div className="activity-type-badge">
                                {getActivityTypeIcon(activity.activity_type)}
                                {getActivityTypeLabel(activity.activity_type)}
                            </div>
                        </div>
                        
                        <div className="activity-content">
                            <div className="activity-header">
                                <h3 className="activity-title">{activity.title}</h3>
                                <span className={`status-badge status-${activity.status}`}>
                                    {getStatusLabel(activity.status)}
                                </span>
                            </div>
                            
                            <p className="activity-description">{activity.description}</p>
                            
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
                            
                            <div className="activity-tags">
                                {activity.tags && Array.isArray(activity.tags) ? activity.tags.map((tag, index) => (
                                    <span key={index} className="tag">
                                        #{tag}
                                    </span>
                                )) : null}
                            </div>
                        </div>
                        
                        <div className="activity-actions">
                            <button 
                                className="action-btn details-btn"
                                onClick={() => navigate(`/activities/${activity.id}`)}
                            >
                                📝 Chi tiết
                            </button>
                            
                            {activity.is_registered ? (
                                <button className="action-btn registered-btn">
                                    ✅ Đã đăng ký
                                </button>
                            ) : (
                                <button className="action-btn register-btn">
                                    ⏰ Đăng ký
                                </button>
                            )}

                            <button 
                                className="action-btn delete-btn"
                                onClick={() => {
                                    if (window.confirm('Bạn có chắc muốn xóa sự kiện này?')) {
                                        handleDeleteActivity(activity.id);
                                    }
                                }}
                                title="Xóa sự kiện"
                            >
                                🗑️ Xóa
                            </button>
                        </div>
                    </div>
                ))}

                {filteredActivities.length === 0 && (
                    <div className="no-activities">
                        <div className="no-activities-icon">📅</div>
                        <h3>Không có sự kiện nào</h3>
                        <p>Không tìm thấy sự kiện phù hợp với bộ lọc của bạn</p>
                    </div>
                )}
                </div>
            </div>

            {/* Create Activity Modal */}
            {showCreateModal && (
                <CreateActivity
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
};

export default Activities;