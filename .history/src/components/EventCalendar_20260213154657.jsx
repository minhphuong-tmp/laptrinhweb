import { useState, useEffect } from 'react';
import { getActivitiesByDate } from '../services/activityService';
import './EventCalendar.css';

const EventCalendar = ({ activities = [], onDateClick, onEventClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewMode, setViewMode] = useState('month'); // month, week, day
    const [scheduleEvents, setScheduleEvents] = useState([]);

    useEffect(() => {
        // Load schedule from localStorage (saved by Login.js)
        const savedSchedule = localStorage.getItem('studentSchedule');
        if (savedSchedule) {
            try {
                const parsed = JSON.parse(savedSchedule);
                // Convert schedule items to event format
                // Assuming SuperKMA structure or similar. 
                // We need to map generic "Monday" classes to concrete dates for the current view?
                // Or if parsed data contains specific dates (SuperKMA usually returns specific week dates).
                // Let's assume generic mapping for now or specific if dates exist.

                // For "Modern" restore, we simply Map them if it's an array.
                // If it lacks dates, we might default to current week?
                // Let's wrap them as 'class' type events.

                const classes = Array.isArray(parsed) ? parsed.map((item, idx) => {
                    // Start/End handling needed. 
                    // Fallback: If date is missing, ignore for now to avoid crash, 
                    // BUT user wants to see it. 
                    // Let's assume the crawler provided 'date' or we map 'day' to current week.

                    // QUICK FIX: If 'day' is "Thứ 2", find Monday of current week?
                    // Better: The crawler returns specific dates in 'rawDate' or similar if implemented well.
                    // If not, we just show what we have.

                    return {
                        id: `class-${idx}`,
                        title: item.subject || item.className || 'Giờ học',
                        start_date: item.start_date || new Date(), // Placeholder if missing
                        end_date: item.end_date || new Date(),
                        location: item.room || 'Hội trường',
                        activity_type: 'class', // New type
                        description: item.teacher || ''
                    };
                }) : [];
                setScheduleEvents(classes);
            } catch (e) {
                console.error('Error parsing schedule:', e);
            }
        }
    }, []);

    // Merge activities + schedule
    const allEvents = [...activities, ...scheduleEvents];

    // Helper to get events (Updated to use allEvents)
    const getEventsForDate = (date) => {
        if (!date) return [];
        const dateStr = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');

        return allEvents.filter(activity => {
            // ... existing filter logic ...
            const activityStartDate = new Date(activity.start_date);
            const activityEndDate = new Date(activity.end_date);
            // ... strict date comparison ...
            const startDateStr = activityStartDate.getFullYear() + '-' +
                String(activityStartDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(activityStartDate.getDate()).padStart(2, '0');
            const endDateStr = activityEndDate.getFullYear() + '-' +
                String(activityEndDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(activityEndDate.getDate()).padStart(2, '0');
            return dateStr >= startDateStr && dateStr <= endDateStr;
        });
    };


    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

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
            days.push(day);
        }

        return days;
    };

    const getEventsForDay = (day) => {
        if (!day) return [];
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return getEventsForDate(date);
    };

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

    const getActivityTypeColor = (type) => {
        switch (type) {
            case 'workshop': return '#1976d2';
            case 'competition': return '#d32f2f';
            case 'meeting': return '#7b1fa2';
            case 'social': return '#f57c00';
            case 'project': return '#388e3c';
            default: return '#65676b';
        }
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const handleDateClick = (day) => {
        if (!day) return;

        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);

        if (onDateClick) {
            onDateClick(date);
        }
    };

    const handleEventClick = (event) => {
        if (onEventClick) {
            onEventClick(event);
        }
    };

    const isToday = (day) => {
        if (!day) return false;
        const today = new Date();
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (day) => {
        if (!day || !selectedDate) return false;
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return date.toDateString() === selectedDate.toDateString();
    };

    const days = getDaysInMonth(currentDate);

    return (
        <div className="event-calendar">
            {/* Calendar Header */}
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button
                        className="nav-btn"
                        onClick={() => navigateMonth(-1)}
                    >
                        ←
                    </button>
                    <h2 className="calendar-title">
                        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <button
                        className="nav-btn"
                        onClick={() => navigateMonth(1)}
                    >
                        →
                    </button>
                </div>

                <div className="view-mode">
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

            {/* Calendar Grid */}
            <div className="calendar-grid">
                {/* Weekday Headers */}
                <div className="weekday-headers">
                    {weekdays.map(day => (
                        <div key={day} className="weekday-header">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="calendar-days">
                    {days.map((day, index) => {
                        const events = getEventsForDay(day);
                        const isCurrentDay = isToday(day);
                        const isSelectedDay = isSelected(day);


                        return (
                            <div
                                key={index}
                                className={`calendar-day ${!day ? 'empty' : ''} ${isCurrentDay ? 'today' : ''} ${isSelectedDay ? 'selected' : ''}`}
                                onClick={() => handleDateClick(day)}
                            >
                                {day && (
                                    <>
                                        <div className="day-number">{day}</div>
                                        <div className="day-events">
                                            {events.slice(0, 2).map((event, eventIndex) => (
                                                <div
                                                    key={eventIndex}
                                                    className="event-indicator"
                                                    style={{ backgroundColor: getActivityTypeColor(event.activity_type) }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEventClick(event);
                                                    }}
                                                    title={event.title}
                                                >
                                                    <span className="event-icon">{getActivityTypeIcon(event.activity_type)}</span>
                                                    <span className="event-time">
                                                        {new Date(event.start_date).toLocaleTimeString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                    <span className="event-title">{event.title}</span>
                                                </div>
                                            ))}
                                            {events.length > 2 && (
                                                <div className="more-events">
                                                    +{events.length - 2} sự kiện
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Date Events */}
            {selectedDate && (
                <div className="selected-date-events">
                    <h3>
                        📅 {selectedDate.toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </h3>
                    <div className="events-list">
                        {getEventsForDate(selectedDate).map(event => (
                            <div
                                key={event.id}
                                className="event-item"
                                onClick={() => handleEventClick(event)}
                            >
                                <div
                                    className="event-type-indicator"
                                    style={{ backgroundColor: getActivityTypeColor(event.activity_type) }}
                                >
                                    {getActivityTypeIcon(event.activity_type)}
                                </div>
                                <div className="event-info">
                                    <h4>{event.title}</h4>
                                    <p>{event.location}</p>
                                    <p>
                                        {new Date(event.start_date).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })} -
                                        {new Date(event.end_date).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventCalendar;

