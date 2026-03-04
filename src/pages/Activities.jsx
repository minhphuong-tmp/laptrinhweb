import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateActivity from '../components/CreateActivity';
import EventCalendar from '../components/EventCalendar';
import { getActivities, deleteActivity } from '../services/activityService';
import ScheduleLogin from './ScheduleLogin';
import './Activities.css';

const Activities = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State for QLDT Login
    const [isQLDTLoggedIn, setIsQLDTLoggedIn] = useState(false);

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
                    setActivities(prev => prev.filter(a => a.is_qldt));
                } else {
                    console.log('✅ Activities loaded:', data.length);
                    setActivities(prev => {
                        const qldtEvents = prev.filter(a => a.is_qldt);
                        return [...data, ...qldtEvents];
                    });
                }
            } catch (error) {
                console.error('❌ Error loading activities:', error);
                setActivities(prev => prev.filter(a => a.is_qldt));
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
                    setActivities(prev => {
                        const qldtEvents = prev.filter(a => a.is_qldt);
                        return [...data, ...qldtEvents];
                    });
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
                setActivities(prev => {
                    const qldtEvents = prev.filter(a => a.is_qldt);
                    return [...data, ...qldtEvents];
                });
                console.log('✅ Activity deleted successfully');
            }
        } catch (error) {
            console.error('❌ Error deleting activity:', error);
            alert('Không thể xóa sự kiện');
        }
    };

    // Helper: Parse Schedule Data (Supports both QLDT Table and SuperKMA Text)
    const parseQLDTSchedule = (courses) => {
        const events = [];
        // structured data from server: [{ course_name, course_code, schedule: [{ startDate, endDate, day, periods, type }] }]

        if (!Array.isArray(courses)) return [];

        courses.forEach((course, idx) => {
            // Case 1: New Structured JSON format
            if (course.course_name && Array.isArray(course.schedule)) {
                course.schedule.forEach((sched) => {
                    // sched: { startDate: "19/01/2026", endDate: "08/02/2026", day: 2, periods: [1,2,3], type: "(LT)" }

                    if (!sched.startDate || !sched.endDate) return;

                    // Parse start/end dates for the recurring block
                    const [sD, sM, sY] = sched.startDate.split('/').map(Number);
                    const [eD, eM, eY] = sched.endDate.split('/').map(Number);

                    if (isNaN(sD) || isNaN(eD)) return;

                    const rangeStart = new Date(sY, sM - 1, sD);
                    const rangeEnd = new Date(eY, eM - 1, eD);
                    // Set rangeEnd to end of day to include it
                    rangeEnd.setHours(23, 59, 59);

                    // Iterate strictly by day of week within range
                    // QLDT: Monday=2, Sunday=8? Or Mon=2...
                    // Let's assume input 'day' follows QLDT convention: 2=Mon, 3=Tue, ... 8=Sun

                    let current = new Date(rangeStart);

                    // Helper to check match
                    const targetDay = sched.day === 8 ? 0 : sched.day - 1; // JS Day: 0=Sun, 1=Mon...6=Sat

                    while (current <= rangeEnd) {
                        if (current.getDay() === targetDay) {
                            // This day matches! Create event
                            const periods = sched.periods || [];
                            if (periods.length > 0) {
                                const startPeriod = Math.min(...periods);
                                const endPeriod = Math.max(...periods);

                                const getHour = (p) => {
                                    if (p <= 6) return 7 + (p - 1);
                                    return 13 + (p - 7);
                                };

                                const startHour = getHour(startPeriod);
                                const endHour = getHour(endPeriod) + 1; // End of last period

                                const eventStart = new Date(current);
                                eventStart.setHours(startHour, 0, 0);

                                const eventEnd = new Date(current);
                                eventEnd.setHours(endHour, 0, 0);

                                if (!isNaN(eventStart.getTime()) && !isNaN(eventEnd.getTime())) {
                                    events.push({
                                        id: `qldt-${course.course_code}-${current.getTime()}`,
                                        title: course.course_name,
                                        description: `Mã: ${course.course_code || 'N/A'} - Lớp: ${course.stt || ''}\nTiết: ${startPeriod}-${endPeriod} (${sched.type || ''})\nGV: ${course.lecturer || ''}`,
                                        start_date: eventStart.toISOString(),
                                        end_date: eventEnd.toISOString(),
                                        location: course.location || 'Học viện',
                                        activity_type: 'class',
                                        status: 'upcoming',
                                        is_qldt: true,
                                        organizer: { name: course.lecturer || 'QLDT' }
                                    });
                                }
                            }
                        }
                        // Next day
                        current.setDate(current.getDate() + 1);
                    }
                });
            }
            // Case 2: Fallback for string-based rows (if API fails or reverts) - simplified/kept for compatibility
            else if (typeof course === 'string') {
                // ... old logic if needed, or remove. 
                // Keeping it might be safer but the indexes changed. 
                // Let's assume new API always returns objects.
            }
        });
        return events;
    };

    // Load login state and data (moved after helper definition)
    useEffect(() => {
        // Check for new cached_schedule from Login.js
        const cachedSchedule = localStorage.getItem('cached_schedule');
        const storedLogin = localStorage.getItem('qldt_sched_login'); // Legacy/Fallback

        const allEvents = [];
        let hasQldt = false;

        if (cachedSchedule) {
            try {
                const parsedData = JSON.parse(cachedSchedule);
                // parsedData is usually array of courses [{ course_name, ..., schedule: [...] }]
                // OR it might be wrapped in { data: [...] } depending on API response.
                // Login.js does: localStorage.setItem('cached_schedule', JSON.stringify(data.data));
                // So parsedData should be the array of courses directly.
                const qldtEvents = parseQLDTSchedule(parsedData);
                allEvents.push(...qldtEvents);
                hasQldt = true;
                setIsQLDTLoggedIn(true);
            } catch (e) {
                console.error('Error parsing cached_schedule:', e);
            }
        } else if (storedLogin) {
            // Fallback to old key if new one doesn't exist
            try {
                const parsed = JSON.parse(storedLogin);
                if (parsed.scheduleData) {
                    const qldtEvents = parseQLDTSchedule(parsed.scheduleData);
                    allEvents.push(...qldtEvents);
                    hasQldt = true;
                    setIsQLDTLoggedIn(true);
                }
            } catch (e) { console.error('Error parsing storedLogin:', e); }
        }

        if (hasQldt) {
            setActivities(prev => {
                const nonQldt = prev.filter(a => !a.is_qldt);
                return [...nonQldt, ...allEvents];
            });
        }
    }, []);

    const handleQLDTLogin = (data) => {
        localStorage.setItem('qldt_sched_login', JSON.stringify(data));
        setIsQLDTLoggedIn(true);
        if (data.scheduleData) {
            const qldtEvents = parseQLDTSchedule(data.scheduleData);
            setActivities(prev => {
                const nonQldt = prev.filter(a => !a.is_qldt);
                return [...nonQldt, ...qldtEvents];
            });
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

    if (!isQLDTLoggedIn) {
        return <ScheduleLogin onLoginSuccess={handleQLDTLogin} />;
    }

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
                    <h1>📅 Thời khóa biểu CLB & QLDT</h1>
                    <p>Xem và quản lý các sự kiện của CLB và lịch học</p>
                </div>
                <div className="header-right">
                    <button
                        onClick={() => {
                            localStorage.removeItem('qldt_sched_login');
                            localStorage.removeItem('cached_schedule');
                            setIsQLDTLoggedIn(false);
                        }}
                        style={{ marginRight: '10px', padding: '8px 16px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Đăng xuất QLDT
                    </button>
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