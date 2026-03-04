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


            {/* Activities List - HIDDEN in Modern Version 
            <div className="activities-section">
                ... (Hidden to focus on Calendar)
            </div>
            */}

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