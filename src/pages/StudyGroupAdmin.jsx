import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './StudyGroupAdmin.css';

const StudyGroupAdmin = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('requests');
    const [requests, setRequests] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSession, setNewSession] = useState({
        subject_name: '',
        scheduled_at: '',
        room_url: '',
        mentor_name: ''
    });
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState({ pending: 0, approved: 0, completed: 0 });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([fetchRequests(), fetchSessions()]);
        setLoading(false);
    };

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('study_requests')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) {
            setRequests(data);
            setStats({
                pending: data.filter(r => r.status === 'pending').length,
                approved: data.filter(r => r.status === 'approved').length,
                completed: data.filter(r => r.status === 'completed').length,
            });
        }
    };

    const fetchSessions = async () => {
        const { data, error } = await supabase
            .from('study_sessions')
            .select('*')
            .order('scheduled_at', { ascending: true });
        if (!error && data) setSessions(data);
    };

    const updateRequestStatus = async (id, status) => {
        const { error } = await supabase
            .from('study_requests')
            .update({ status })
            .eq('id', id);
        if (!error) fetchRequests();
        else alert('Lỗi khi cập nhật: ' + error.message);
    };

    const createSession = async () => {
        if (!newSession.subject_name || !newSession.scheduled_at) {
            alert('Vui lòng điền đầy đủ tên môn học và thời gian.');
            return;
        }
        const { error } = await supabase.from('study_sessions').insert([{
            subject_name: newSession.subject_name,
            scheduled_at: new Date(newSession.scheduled_at).toISOString(),
            room_url: newSession.room_url || '#',
            mentor_id: newSession.mentor_name || user?.id || 'admin',
            member_count: 0,
            status: 'upcoming'
        }]);
        if (!error) {
            setShowCreateModal(false);
            setNewSession({ subject_name: '', scheduled_at: '', room_url: '', mentor_name: '' });
            fetchSessions();
        } else {
            alert('Lỗi tạo buổi học: ' + error.message);
        }
    };

    const deleteSession = async (id) => {
        if (!window.confirm('Xóa buổi học này?')) return;
        const { error } = await supabase.from('study_sessions').delete().eq('id', id);
        if (!error) fetchSessions();
    };

    const filteredRequests = statusFilter === 'all'
        ? requests
        : requests.filter(r => r.status === statusFilter);

    const statusLabel = (s) => ({ pending: 'Chờ duyệt', approved: 'Đã duyệt', completed: 'Hoàn thành', cancelled: 'Đã hủy' }[s] || s);
    const statusClass = (s) => ({ pending: 'badge-pending', approved: 'badge-approved', completed: 'badge-completed', cancelled: 'badge-cancelled' }[s] || '');
    const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '-';

    // Group requests by subject for quick overview
    const topSubjects = Object.entries(
        requests.filter(r => r.status === 'pending').reduce((acc, r) => {
            acc[r.subject_name] = (acc[r.subject_name] || 0) + 1;
            return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
        <div className="study-admin-page">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-content">
                    <h1>🛡️ Admin — Hỗ trợ học tập</h1>
                    <p>Quản lý yêu cầu & lịch học từ sinh viên CLB Tin học KMA</p>
                </div>
                <button className="btn-create-session" onClick={() => setShowCreateModal(true)}>
                    ＋ Tạo buổi học
                </button>
            </div>

            {/* Stats Cards */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card card-pending">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <div className="stat-number">{stats.pending}</div>
                        <div className="stat-label">Chờ duyệt</div>
                    </div>
                </div>
                <div className="admin-stat-card card-approved">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <div className="stat-number">{stats.approved}</div>
                        <div className="stat-label">Đã duyệt</div>
                    </div>
                </div>
                <div className="admin-stat-card card-completed">
                    <div className="stat-icon">🎓</div>
                    <div className="stat-info">
                        <div className="stat-number">{stats.completed}</div>
                        <div className="stat-label">Hoàn thành</div>
                    </div>
                </div>
                <div className="admin-stat-card card-sessions">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                        <div className="stat-number">{sessions.filter(s => s.status === 'upcoming').length}</div>
                        <div className="stat-label">Buổi học sắp tới</div>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="admin-main-layout">
                {/* Left: Top subjects */}
                <div className="admin-sidebar-panel">
                    <h3>🔥 Môn cần hỗ trợ nhiều nhất</h3>
                    {topSubjects.length === 0 ? (
                        <p className="no-data-msg">Chưa có yêu cầu nào.</p>
                    ) : (
                        <ul className="top-subjects-list">
                            {topSubjects.map(([subject, count], i) => (
                                <li key={i}>
                                    <span className="rank-badge">#{i + 1}</span>
                                    <span className="subject-label">{subject}</span>
                                    <span className="count-badge">{count} SV</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Right: Tabs */}
                <div className="admin-content-panel">
                    <div className="admin-tabs">
                        <button
                            className={`admin-tab ${tab === 'requests' ? 'active' : ''}`}
                            onClick={() => setTab('requests')}
                        >
                            📋 Yêu cầu ({requests.length})
                        </button>
                        <button
                            className={`admin-tab ${tab === 'sessions' ? 'active' : ''}`}
                            onClick={() => setTab('sessions')}
                        >
                            📅 Buổi học ({sessions.length})
                        </button>
                    </div>

                    {loading ? (
                        <div className="admin-loading">Đang tải dữ liệu...</div>
                    ) : tab === 'requests' ? (
                        <div className="requests-panel">
                            {/* Filter bar */}
                            <div className="filter-bar">
                                {['all', 'pending', 'approved', 'completed', 'cancelled'].map(f => (
                                    <button
                                        key={f}
                                        className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
                                        onClick={() => setStatusFilter(f)}
                                    >
                                        {f === 'all' ? 'Tất cả' : statusLabel(f)}
                                    </button>
                                ))}
                                <button className="refresh-btn" onClick={fetchRequests}>🔄</button>
                            </div>

                            {filteredRequests.length === 0 ? (
                                <div className="no-data-box">
                                    <p>📭 Không có yêu cầu nào.</p>
                                </div>
                            ) : (
                                <div className="requests-table-wrap">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Môn học</th>
                                                <th>Điểm</th>
                                                <th>Trạng thái</th>
                                                <th>Thời gian</th>
                                                <th>Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRequests.map(req => (
                                                <tr key={req.id}>
                                                    <td className="subject-cell">{req.subject_name}</td>
                                                    <td><span className="grade-tag">{req.current_grade || '-'}</span></td>
                                                    <td>
                                                        <span className={`status-badge ${statusClass(req.status)}`}>
                                                            {statusLabel(req.status)}
                                                        </span>
                                                    </td>
                                                    <td className="date-cell">{formatDate(req.created_at)}</td>
                                                    <td className="action-cell">
                                                        {req.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    className="action-btn approve"
                                                                    onClick={() => updateRequestStatus(req.id, 'approved')}
                                                                    title="Duyệt"
                                                                >✅</button>
                                                                <button
                                                                    className="action-btn cancel"
                                                                    onClick={() => updateRequestStatus(req.id, 'cancelled')}
                                                                    title="Từ chối"
                                                                >❌</button>
                                                            </>
                                                        )}
                                                        {req.status === 'approved' && (
                                                            <button
                                                                className="action-btn complete"
                                                                onClick={() => updateRequestStatus(req.id, 'completed')}
                                                                title="Đánh dấu hoàn thành"
                                                            >🎓</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="sessions-panel">
                            <div className="filter-bar">
                                <button className="refresh-btn" onClick={fetchSessions}>🔄 Làm mới</button>
                            </div>
                            {sessions.length === 0 ? (
                                <div className="no-data-box">
                                    <p>📭 Chưa có buổi học nào. Hãy tạo buổi học mới!</p>
                                </div>
                            ) : (
                                <div className="sessions-grid">
                                    {sessions.map(s => (
                                        <div key={s.id} className={`session-card status-${s.status}`}>
                                            <div className="session-subject">{s.subject_name}</div>
                                            <div className="session-meta">
                                                <span>📅 {formatDate(s.scheduled_at)}</span>
                                                <span>👥 {s.member_count} người</span>
                                            </div>
                                            <div className={`session-status-tag tag-${s.status}`}>
                                                {s.status === 'upcoming' ? '🟢 Sắp diễn ra'
                                                    : s.status === 'ongoing' ? '🔴 Đang diễn ra'
                                                        : s.status === 'completed' ? '✅ Hoàn thành' : '❌ Đã hủy'}
                                            </div>
                                            {s.room_url && s.room_url !== '#' && (
                                                <a className="session-link" href={s.room_url} target="_blank" rel="noreferrer">
                                                    🔗 Tham gia phòng
                                                </a>
                                            )}
                                            <div className="session-actions">
                                                {s.status === 'upcoming' && (
                                                    <button className="action-btn approve" onClick={() => {
                                                        supabase.from('study_sessions').update({ status: 'ongoing' }).eq('id', s.id).then(() => fetchSessions());
                                                    }}>▶ Bắt đầu</button>
                                                )}
                                                {s.status === 'ongoing' && (
                                                    <button className="action-btn complete" onClick={() => {
                                                        supabase.from('study_sessions').update({ status: 'completed' }).eq('id', s.id).then(() => fetchSessions());
                                                    }}>✅ Kết thúc</button>
                                                )}
                                                <button className="action-btn cancel" onClick={() => deleteSession(s.id)}>🗑</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Session Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h2>📅 Tạo buổi học mới</h2>
                        <div className="modal-form">
                            <label>Tên môn học <span className="required">*</span></label>
                            <input
                                type="text"
                                placeholder="VD: Giải tích, Đại số tuyến tính..."
                                value={newSession.subject_name}
                                onChange={e => setNewSession({ ...newSession, subject_name: e.target.value })}
                            />
                            <label>Thời gian bắt đầu <span className="required">*</span></label>
                            <input
                                type="datetime-local"
                                value={newSession.scheduled_at}
                                onChange={e => setNewSession({ ...newSession, scheduled_at: e.target.value })}
                            />
                            <label>Link phòng họp (Zoom/Meet)</label>
                            <input
                                type="url"
                                placeholder="https://meet.google.com/..."
                                value={newSession.room_url}
                                onChange={e => setNewSession({ ...newSession, room_url: e.target.value })}
                            />
                            <label>Tên người phụ đạo</label>
                            <input
                                type="text"
                                placeholder="VD: Nguyễn Minh Phương"
                                value={newSession.mentor_name}
                                onChange={e => setNewSession({ ...newSession, mentor_name: e.target.value })}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel-modal" onClick={() => setShowCreateModal(false)}>Hủy</button>
                            <button className="btn-confirm-modal" onClick={createSession}>✅ Tạo buổi học</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyGroupAdmin;
