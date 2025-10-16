import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './MeetingNotes.css';

const MeetingNotes = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [meetingNotes, setMeetingNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);

    // Mock data for demonstration
    useEffect(() => {
        const mockMeetingNotes = [
            {
                id: 1,
                title: 'Biên bản họp CLB tháng 1/2024',
                meetingDate: '2024-01-25',
                meetingTime: '18:00',
                location: 'Phòng họp CLB',
                attendees: [
                    'Nguyễn Văn A - Chủ nhiệm CLB',
                    'Trần Thị B - Phó CLB',
                    'Lê Văn C - Thành viên',
                    'Phạm Thị D - Thành viên'
                ],
                agenda: [
                    'Tổng kết hoạt động tháng 12/2023',
                    'Kế hoạch hoạt động tháng 1/2024',
                    'Thảo luận về cuộc thi Hackathon',
                    'Báo cáo tài chính CLB'
                ],
                decisions: [
                    'Tổ chức Workshop React.js vào ngày 15/02',
                    'Chuẩn bị cho cuộc thi Hackathon KMA 2024',
                    'Tăng cường hoạt động tài liệu học tập',
                    'Thành lập nhóm hỗ trợ kỹ thuật'
                ],
                actionItems: [
                    'Nguyễn Văn A: Chuẩn bị nội dung Workshop React.js',
                    'Trần Thị B: Liên hệ với Ban giám hiệu về cuộc thi',
                    'Lê Văn C: Cập nhật thư viện tài liệu',
                    'Phạm Thị D: Tạo form đăng ký tham gia'
                ],
                nextMeeting: '2024-02-25',
                status: 'completed',
                createdBy: 'Nguyễn Văn A',
                createdAt: '2024-01-25T20:30:00Z'
            },
            {
                id: 2,
                title: 'Biên bản họp khẩn cấp - Cuộc thi Hackathon',
                meetingDate: '2024-02-10',
                meetingTime: '19:00',
                location: 'Online - Zoom',
                attendees: [
                    'Nguyễn Văn A - Chủ nhiệm CLB',
                    'Trần Thị B - Phó CLB',
                    'Lê Văn C - Thành viên'
                ],
                agenda: [
                    'Thảo luận chi tiết về cuộc thi Hackathon',
                    'Phân công nhiệm vụ cho từng thành viên',
                    'Xác định ngân sách và tài nguyên cần thiết'
                ],
                decisions: [
                    'Cuộc thi sẽ diễn ra vào ngày 25-26/02',
                    'Ngân sách dự kiến: 5,000,000 VNĐ',
                    'Cần ít nhất 10 mentor hỗ trợ thí sinh'
                ],
                actionItems: [
                    'Nguyễn Văn A: Liên hệ với các công ty tài trợ',
                    'Trần Thị B: Chuẩn bị địa điểm và thiết bị',
                    'Lê Văn C: Tạo website đăng ký và thông tin cuộc thi'
                ],
                nextMeeting: '2024-02-15',
                status: 'completed',
                createdBy: 'Trần Thị B',
                createdAt: '2024-02-10T21:00:00Z'
            },
            {
                id: 3,
                title: 'Biên bản họp định kỳ tháng 2/2024',
                meetingDate: '2024-02-25',
                meetingTime: '18:00',
                location: 'Phòng họp CLB',
                attendees: [
                    'Nguyễn Văn A - Chủ nhiệm CLB',
                    'Trần Thị B - Phó CLB',
                    'Lê Văn C - Thành viên',
                    'Phạm Thị D - Thành viên',
                    'Hoàng Văn E - Thành viên'
                ],
                agenda: [
                    'Đánh giá kết quả cuộc thi Hackathon',
                    'Kế hoạch hoạt động tháng 3/2024',
                    'Thảo luận về việc mở rộng CLB',
                    'Báo cáo tài chính sau cuộc thi'
                ],
                decisions: [
                    'Cuộc thi Hackathon thành công tốt đẹp',
                    'Tổ chức Workshop Python vào tháng 3',
                    'Mở rộng CLB thêm 20 thành viên mới',
                    'Tăng ngân sách hoạt động lên 10,000,000 VNĐ'
                ],
                actionItems: [
                    'Nguyễn Văn A: Chuẩn bị nội dung Workshop Python',
                    'Trần Thị B: Tạo form tuyển thành viên mới',
                    'Lê Văn C: Cập nhật quy định CLB',
                    'Phạm Thị D: Lập kế hoạch tài chính chi tiết'
                ],
                nextMeeting: '2024-03-25',
                status: 'completed',
                createdBy: 'Nguyễn Văn A',
                createdAt: '2024-02-25T20:15:00Z'
            }
        ];
        
        setTimeout(() => {
            setMeetingNotes(mockMeetingNotes);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredNotes = meetingNotes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            note.agenda.some(item => item.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            note.decisions.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || note.status === filterType;
        return matchesSearch && matchesType;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return '#27ae60';
            case 'draft':
                return '#f39c12';
            case 'pending':
                return '#3498db';
            default:
                return '#95a5a6';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed':
                return 'Hoàn thành';
            case 'draft':
                return 'Bản nháp';
            case 'pending':
                return 'Chờ duyệt';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <div className="meeting-notes-page">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải biên bản họp...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="meeting-notes-page">
            <div className="meeting-notes-header">
                <div className="header-left">
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/home')}
                        title="Quay lại trang chủ"
                    >
                        ← Quay lại
                    </button>
                    <h1>📝 Biên bản họp CLB</h1>
                </div>
                <button 
                    className="create-note-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    ➕ Tạo biên bản mới
                </button>
            </div>

            <div className="meeting-notes-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm biên bản họp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                </div>
                
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="type-filter"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="draft">Bản nháp</option>
                    <option value="pending">Chờ duyệt</option>
                </select>
            </div>

            <div className="meeting-notes-stats">
                <div className="stat-card">
                    <span className="stat-number">{meetingNotes.length}</span>
                    <span className="stat-label">Tổng biên bản</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{meetingNotes.filter(n => n.status === 'completed').length}</span>
                    <span className="stat-label">Hoàn thành</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{meetingNotes.filter(n => n.status === 'draft').length}</span>
                    <span className="stat-label">Bản nháp</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{meetingNotes.reduce((sum, n) => sum + n.attendees.length, 0)}</span>
                    <span className="stat-label">Lượt tham gia</span>
                </div>
            </div>

            <div className="meeting-notes-list">
                {filteredNotes.map((note) => (
                    <div key={note.id} className="meeting-note-card">
                        <div className="note-header">
                            <div className="note-title-section">
                                <h3 className="note-title">{note.title}</h3>
                                <div className="note-meta">
                                    <span className="note-date">
                                        📅 {new Date(note.meetingDate).toLocaleDateString('vi-VN')} lúc {note.meetingTime}
                                    </span>
                                    <span className="note-location">📍 {note.location}</span>
                                </div>
                            </div>
                            <div className="note-status">
                                <span 
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(note.status) }}
                                >
                                    {getStatusText(note.status)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="note-content">
                            <div className="note-section">
                                <h4 className="section-title">👥 Thành viên tham gia</h4>
                                <ul className="attendees-list">
                                    {note.attendees.map((attendee, index) => (
                                        <li key={index} className="attendee-item">{attendee}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="note-section">
                                <h4 className="section-title">📋 Nội dung thảo luận</h4>
                                <ul className="agenda-list">
                                    {note.agenda.map((item, index) => (
                                        <li key={index} className="agenda-item">{item}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="note-section">
                                <h4 className="section-title">✅ Quyết định</h4>
                                <ul className="decisions-list">
                                    {note.decisions.map((decision, index) => (
                                        <li key={index} className="decision-item">{decision}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="note-section">
                                <h4 className="section-title">📌 Hành động tiếp theo</h4>
                                <ul className="action-items-list">
                                    {note.actionItems.map((item, index) => (
                                        <li key={index} className="action-item">{item}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            {note.nextMeeting && (
                                <div className="note-section">
                                    <h4 className="section-title">📅 Cuộc họp tiếp theo</h4>
                                    <p className="next-meeting">
                                        {new Date(note.nextMeeting).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="note-footer">
                            <div className="note-info">
                                <span className="created-by">Tạo bởi: {note.createdBy}</span>
                                <span className="created-at">
                                    {new Date(note.createdAt).toLocaleString('vi-VN')}
                                </span>
                            </div>
                            <div className="note-actions">
                                <button className="action-btn view-btn">👁️ Xem</button>
                                <button className="action-btn edit-btn">✏️ Sửa</button>
                                <button className="action-btn download-btn">⬇️ Tải</button>
                                <button className="action-btn delete-btn">🗑️ Xóa</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredNotes.length === 0 && (
                <div className="no-results">
                    <p>Không tìm thấy biên bản họp nào phù hợp</p>
                </div>
            )}
        </div>
    );
};

export default MeetingNotes;
