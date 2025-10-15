import { useState, useEffect } from 'react';

const RealtimeTime = ({ timestamp, className = '' }) => {
    const [timeString, setTimeString] = useState('');

    const formatTime = (timestamp) => {
        const now = new Date();
        const commentTime = new Date(timestamp);
        const diffInSeconds = Math.floor((now - commentTime) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Vừa xong';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} phút`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} giờ`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ngày`;
        } else {
            return commentTime.toLocaleDateString('vi-VN', {
                day: 'numeric',
                month: 'short',
                year: commentTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    useEffect(() => {
        // Update time immediately
        setTimeString(formatTime(timestamp));

        // Update every minute for real-time feel
        const interval = setInterval(() => {
            setTimeString(formatTime(timestamp));
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [timestamp]);

    return (
        <span className={className}>
            {timeString}
        </span>
    );
};

export default RealtimeTime;


