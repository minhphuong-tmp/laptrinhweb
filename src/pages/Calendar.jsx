import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';

const Calendar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('month'); // month, week, day
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Mock data for demonstration
    useEffect(() => {
        const mockEvents = [
            {
                id: 1,
                title: 'Workshop React.js',
                description: 'Học cách xây dựng ứng dụng web với React',
                date: '2024-02-15',
                time: '14:00',
                duration: 120,
                location: 'Phòng A101',
                type: 'workshop',
                participants: 25,
                maxParticipants: 30
            },
            {
                id: 2,
                title: 'Họp CLB tháng 2',
                description: 'Tổng kết tháng 1 và kế hoạch tháng 2',
                date: '2024-02-20',
                time: '18:00',
                duration: 90,
                location: 'Phòng họp CLB',
                type: 'meeting',
                participants: 15,
                maxParticipants: 20
            },
            {
                id: 3,
                title: 'Cuộc thi Hackathon',
                description: 'Cuộc thi lập trình 48h',
                date: '2024-02-25',
                time: '08:00',
                duration: 2880, // 48 hours
                location: 'Hội trường lớn',
                type: 'competition',
                participants: 45,
                maxParticipants: 50
            },
            {
                id: 4,
                title: 'Seminar AI/ML',
                description: 'Tìm hiểu về trí tuệ nhân tạo',
                date: '2024-02-28',
                time: '19:00',
                duration: 90,
                location: 'Online - Zoom',
                type: 'seminar',
                participants: 80,
                maxParticipants: 100
            }
        ];
        
        setTimeout(() => {
            setEvents(mockEvents);
            setLoading(false);
        }, 1000);
    }, []);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const days = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        
        return days;
    };

    const getEventsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(event => event.date === dateStr);
    };

    const getEventTypeIcon = (type) => {
        switch (type) {
            case 'workshop':
                return '🛠️';
            case 'meeting':
                return '👥';
            case 'competition':
                return '🏆';
            case 'seminar':
                return '🎓';
            default:
                return '📅';
        }
    };

    const getEventTypeColor = (type) => {
        switch (type) {
            case 'workshop':
                return '#3498db';
            case 'meeting':
                return '#e74c3c';
            case 'competition':
                return '#f39c12';
            case 'seminar':
                return '#27ae60';
            default:
                return '#95a5a6';
        }
    };

    const formatTime = (time) => {
        return time;
    };

    const formatDuration = (minutes) => {
        if (minutes < 60) {
            return `${minutes} phút`;
        } else if (minutes < 1440) {
            const hours = Math.floor(minutes / 60);
            return `${hours} giờ`;
        } else {
            const days = Math.floor(minutes / 1440);
            return `${days} ngày`;
        }
    };

    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    if (loading) {
        return (
            <div className="calendar-page">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải lịch sự kiện...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-page">
            <div className="calendar-header">
                <div className="header-left">
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/home')}
                        title="Quay lại trang chủ"
                    >
                        ← Quay lại
                    </button>
                    <h1>📋 Lịch sự kiện CLB</h1>
                </div>
                <div className="view-controls">
                    <button 
                        className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
                        onClick={() => setViewMode('month')}
                    >
                        Tháng
                    </button>
                    <button 
                        className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                        onClick={() => setViewMode('week')}
                    >
                        Tuần
                    </button>
                    <button 
                        className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
                        onClick={() => setViewMode('day')}
                    >
                        Ngày
                    </button>
                </div>
            </div>

            <div className="calendar-controls">
                <button 
                    className="nav-btn"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                >
                    ← Tháng trước
                </button>
                <h2 className="current-month">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button 
                    className="nav-btn"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                >
                    Tháng sau →
                </button>
            </div>

            <div className="calendar-stats">
                <div className="stat-card">
                    <span className="stat-number">{events.length}</span>
                    <span className="stat-label">Tổng sự kiện</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{events.filter(e => e.type === 'workshop').length}</span>
                    <span className="stat-label">Workshop</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{events.filter(e => e.type === 'meeting').length}</span>
                    <span className="stat-label">Họp CLB</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{events.filter(e => e.type === 'competition').length}</span>
                    <span className="stat-label">Cuộc thi</span>
                </div>
            </div>

            <div className="calendar-container">
                <div className="calendar-grid">
                    <div className="calendar-header-row">
                        {dayNames.map(day => (
                            <div key={day} className="day-header">{day}</div>
                        ))}
                    </div>
                    <div className="calendar-body">
                        {getDaysInMonth(currentDate).map((day, index) => {
                            const dayEvents = getEventsForDate(day);
                            const isToday = day && day.toDateString() === new Date().toDateString();
                            const isSelected = day && day.toDateString() === selectedDate.toDateString();
                            
                            return (
                                <div 
                                    key={index} 
                                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                    onClick={() => day && setSelectedDate(day)}
                                >
                                    {day && (
                                        <>
                                            <div className="day-number">{day.getDate()}</div>
                                            <div className="day-events">
                                                {dayEvents.slice(0, 3).map(event => (
                                                    <div 
                                                        key={event.id}
                                                        className="event-dot"
                                                        style={{ backgroundColor: getEventTypeColor(event.type) }}
                                                        title={event.title}
                                                    >
                                                        {getEventTypeIcon(event.type)}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="more-events">+{dayEvents.length - 3}</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="events-sidebar">
                <h3>Sự kiện ngày {selectedDate.toLocaleDateString('vi-VN')}</h3>
                <div className="events-list">
                    {getEventsForDate(selectedDate).map(event => (
                        <div key={event.id} className="event-card">
                            <div className="event-header">
                                <span className="event-icon">{getEventTypeIcon(event.type)}</span>
                                <span className="event-time">{formatTime(event.time)}</span>
                            </div>
                            <h4 className="event-title">{event.title}</h4>
                            <p className="event-description">{event.description}</p>
                            <div className="event-details">
                                <div className="detail-item">
                                    <span className="detail-icon">📍</span>
                                    <span className="detail-text">{event.location}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">⏱️</span>
                                    <span className="detail-text">{formatDuration(event.duration)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">👥</span>
                                    <span className="detail-text">{event.participants}/{event.maxParticipants} người</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {getEventsForDate(selectedDate).length === 0 && (
                        <div className="no-events">
                            <p>Không có sự kiện nào trong ngày này</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
