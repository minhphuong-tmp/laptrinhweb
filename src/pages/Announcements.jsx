import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Announcements.css';

const Announcements = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPriority, setFilterPriority] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data for demonstration
    useEffect(() => {
        const mockAnnouncements = [
            {
                id: 1,
                title: 'Thông báo về cuộc thi Hackathon KMA 2024',
                content: 'CLB Tin học KMA tổ chức cuộc thi Hackathon với chủ đề "Giải pháp số cho giáo dục". Thời gian: 20-21/02/2024. Đăng ký tại: https://hackathon.kma.edu.vn',
                priority: 'high',
                author: 'Nguyễn Văn A - Chủ nhiệm CLB',
                publishDate: '2024-01-15',
                isPinned: true,
                views: 156,
                tags: ['Cuộc thi', 'Hackathon', 'Lập trình']
            },
            {
                id: 2,
                title: 'Lịch họp CLB tháng 2/2024',
                content: 'Thông báo lịch họp CLB định kỳ tháng 2/2024 vào ngày 25/02/2024 lúc 18:00 tại phòng A101. Nội dung: Tổng kết tháng 1 và kế hoạch tháng 2.',
                priority: 'medium',
                author: 'Trần Thị B - Phó CLB',
                publishDate: '2024-01-20',
                isPinned: false,
                views: 89,
                tags: ['Họp CLB', 'Lịch trình']
            },
            {
                id: 3,
                title: 'Cập nhật quy định CLB mới',
                content: 'Ban chủ nhiệm CLB thông báo về việc cập nhật quy định thành viên. Các thành viên vui lòng đọc kỹ và tuân thủ theo quy định mới.',
                priority: 'high',
                author: 'Lê Văn C - Ban chủ nhiệm',
                publishDate: '2024-01-18',
                isPinned: true,
                views: 234,
                tags: ['Quy định', 'Cập nhật']
            },
            {
                id: 4,
                title: 'Thông báo nghỉ lễ Tết Nguyên đán',
                content: 'CLB sẽ nghỉ hoạt động từ ngày 8/2 đến 15/2/2024 để nghỉ lễ Tết Nguyên đán. Các hoạt động sẽ tiếp tục từ ngày 16/2/2024.',
                priority: 'low',
                author: 'Phạm Thị D - Ban chủ nhiệm',
                publishDate: '2024-01-25',
                isPinned: false,
                views: 67,
                tags: ['Nghỉ lễ', 'Tết']
            }
        ];
        
        setTimeout(() => {
            setAnnouncements(mockAnnouncements);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredAnnouncements = announcements.filter(announcement => {
        const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            announcement.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
        return matchesSearch && matchesPriority;
    });

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return '#e74c3c';
            case 'medium':
                return '#f39c12';
            case 'low':
                return '#27ae60';
            default:
                return '#95a5a6';
        }
    };

    const getPriorityText = (priority) => {
        switch (priority) {
            case 'high':
                return 'Quan trọng';
            case 'medium':
                return 'Thường';
            case 'low':
                return 'Thông tin';
            default:
                return priority;
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải thông báo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Thông báo CLB</h1>
            </div>

            <div className="announcements-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm thông báo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                </div>
                
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="priority-filter"
                >
                    <option value="all">Tất cả mức độ</option>
                    <option value="high">Quan trọng</option>
                    <option value="medium">Thường</option>
                    <option value="low">Thông tin</option>
                </select>
            </div>

            <div className="announcements-stats">
                <div className="stat-card">
                    <span className="stat-number">{announcements.length}</span>
                    <span className="stat-label">Tổng thông báo</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{announcements.filter(a => a.priority === 'high').length}</span>
                    <span className="stat-label">Quan trọng</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{announcements.filter(a => a.isPinned).length}</span>
                    <span className="stat-label">Đã ghim</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{announcements.reduce((sum, a) => sum + a.views, 0)}</span>
                    <span className="stat-label">Lượt xem</span>
                </div>
            </div>

            <div className="announcements-list">
                {filteredAnnouncements.map((announcement) => (
                    <div key={announcement.id} className={`announcement-card ${announcement.isPinned ? 'pinned' : ''}`}>
                        {announcement.isPinned && (
                            <div className="pinned-badge">📌 Đã ghim</div>
                        )}
                        
                        <div className="announcement-header">
                            <div className="announcement-views">
                                👁️ {announcement.views} lượt xem
                            </div>
                        </div>
                        
                        <div className="announcement-content">
                            <h3 className="announcement-title">{announcement.title}</h3>
                            <p className="announcement-text">{announcement.content}</p>
                            
                            <div className="announcement-meta">
                                <div className="meta-item">
                                    <span className="meta-icon">👤</span>
                                    <span className="meta-text">{announcement.author}</span>
                                </div>
                                
                                <div className="meta-item">
                                    <span className="meta-icon">📅</span>
                                    <span className="meta-text">
                                        {new Date(announcement.publishDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="announcement-tags">
                                {announcement.tags.map((tag, index) => (
                                    <span key={index} className="tag">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="announcement-actions">
                            <button className="action-btn view-btn">
                                👁️ Xem chi tiết
                            </button>
                            <button className="action-btn edit-btn">
                                ✏️ Chỉnh sửa
                            </button>
                            <button className="action-btn delete-btn">
                                🗑️ Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAnnouncements.length === 0 && (
                <div className="no-results">
                    <p>Không tìm thấy thông báo nào phù hợp</p>
                </div>
            )}
        </div>
    );
};

export default Announcements;
