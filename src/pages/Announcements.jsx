import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './Announcements.css';
import { getCurrentUserCLBInfo, clbApi } from '../services/clbService';
import { createNotification } from '../services/notificationService';
import { supabase } from '../lib/supabase';

const Announcements = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPriority, setFilterPriority] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
        priority: 'medium',
        tags: '',
    });
    const [modalUserRole, setModalUserRole] = useState(null);
    const [modalRoleLoading, setModalRoleLoading] = useState(false);
    const lastScrollTimestampRef = useRef(0);

    // Load dữ liệu thật từ notifications_clb
    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('notifications_clb')
                    .select(`
                        *,
                        users:created_by (
                            id,
                            name,
                            email
                        )
                    `)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error loading announcements:', error);
                    setAnnouncements([]);
                } else if (data && Array.isArray(data)) {
                    setAnnouncements(data.map(item => ({
                        id: item.id,
                        title: item.title,
                        content: item.content,
                        priority: item.priority || 'medium',
                        author: item.users?.name || user?.name || 'Ẩn danh',
                        publishDate: item.created_at?.slice(0, 10) || '',
                isPinned: false,
                        views: 0,
                        tags: item.tags || [],
                    })));
                }
            } catch (error) {
                console.error('Error fetching announcements:', error);
                setAnnouncements([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, [user]);

    // Handle scroll to specific announcement from notification
    useEffect(() => {
        const scrollToAnnouncementId = location.state?.scrollToAnnouncementId;
        const scrollTimestamp = location.state?.scrollTimestamp;
        if (!scrollToAnnouncementId || announcements.length === 0) return;

        // Update last scroll timestamp to track this request
        // Each new timestamp means a new click, so we should always process it
        if (scrollTimestamp) {
            // Only skip if this exact same timestamp was processed (same click event)
            // This prevents duplicate processing from React's strict mode or double renders
            if (scrollTimestamp === lastScrollTimestampRef.current) {
                console.log('⏭️ [Announcements] Skipping duplicate scroll request (same timestamp):', scrollTimestamp);
                return;
            }
            lastScrollTimestampRef.current = scrollTimestamp;
        }

        console.log('🔍 [Announcements] Scroll to announcement requested:', scrollToAnnouncementId, 'timestamp:', scrollTimestamp);

        // Find the announcement
        const targetAnnouncement = announcements.find(a => 
            String(a.id) === String(scrollToAnnouncementId) || a.id === scrollToAnnouncementId
        );

        if (!targetAnnouncement) {
            console.warn('⚠️ [Announcements] Announcement not found:', scrollToAnnouncementId);
            // Clear location state
            navigate(location.pathname, { replace: true, state: {} });
            return;
        }

        // Clear filters to ensure announcement is visible
        let needsFilterClear = false;
        if (filterPriority !== 'all' && targetAnnouncement.priority !== filterPriority) {
            setFilterPriority('all');
            needsFilterClear = true;
        }
        if (searchTerm && !targetAnnouncement.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !targetAnnouncement.content.toLowerCase().includes(searchTerm.toLowerCase())) {
            setSearchTerm('');
            needsFilterClear = true;
        }

        // Helper function to try scrolling to announcement
        const tryScrollToAnnouncement = () => {
            const announcementId = String(scrollToAnnouncementId);
            const selectors = [
                `#announcement-${announcementId}`,
                `[data-announcement-id="${announcementId}"]`,
                `[data-announcement-id="${scrollToAnnouncementId}"]`
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    // Remove highlight from any previously highlighted element
                    document.querySelectorAll('.announcement-card.highlighted').forEach(el => {
                        el.classList.remove('highlighted');
                    });
                    
                    // Scroll to element
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Add highlight class
                    element.classList.add('highlighted');
                    
                    // Remove highlight after animation completes (2 seconds)
                    setTimeout(() => {
                        element.classList.remove('highlighted');
                    }, 2000);
                    
                    console.log('✅ [Announcements] Scrolled to announcement:', scrollToAnnouncementId);
                    return true;
                }
            }
            return false;
        };

        // If filters were cleared, wait for DOM to update before scrolling
        const scrollDelay = needsFilterClear ? 500 : 300;

        // Retry with delays if element not found
        let attempts = 0;
        const maxAttempts = 15;
        const retry = () => {
            attempts++;
            if (tryScrollToAnnouncement()) {
                // Don't clear location state immediately - allow re-clicking
                // State will be cleared when navigating away or on next navigation
                console.log('✅ [Announcements] Scroll completed, keeping state for potential re-clicks');
                return;
            }
            if (attempts < maxAttempts) {
                setTimeout(retry, 200);
            } else {
                console.warn('⚠️ [Announcements] Announcement element not found after', maxAttempts, 'attempts:', scrollToAnnouncementId);
                // Don't clear state even if scroll failed - allow retry
            }
        };

        setTimeout(retry, scrollDelay);
    }, [location.state?.scrollToAnnouncementId, location.state?.scrollTimestamp, announcements, navigate, location.pathname, filterPriority, searchTerm]);

    const handleOpenModal = () => {
        setShowCreateForm(true);
        if (user?.id) {
            setModalRoleLoading(true);
            getCurrentUserCLBInfo(user.id).then(res => {
                const roleForDebug = res.success && res.data ? res.data.role : null;
                console.log('[DEBUG] userId:', user && user.id, '| role:', roleForDebug);
                setModalUserRole(roleForDebug);
            }).finally(() => setModalRoleLoading(false));
        } else {
            setModalUserRole(null);
        }
    };

    const modalIsManager = modalUserRole === 'Chủ nhiệm CLB' || modalUserRole === 'Phó Chủ Nhiệm';

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        if (!modalIsManager) {
            alert('Chỉ Chủ nhiệm CLB hoặc Phó Chủ Nhiệm mới có quyền tạo thông báo!');
            return;
        }
        if (!newAnnouncement.title || !newAnnouncement.content) return;
        
        try {
            const now = new Date();
            const { data, error } = await supabase
                .from('notifications_clb')
                .insert([{
                    title: newAnnouncement.title,
                    content: newAnnouncement.content,
                    priority: newAnnouncement.priority,
                    tags: newAnnouncement.tags.split(',').map(t => t.trim()).filter(Boolean),
                    created_at: now.toISOString(),
                    created_by: user?.id,
                }])
                .select(`
                    *,
                    users:created_by (
                        id,
                        name,
                        email
                    )
                `)
                .single();

            if (!error && data) {
                setAnnouncements([{
                    id: data.id,
                    title: data.title,
                    content: data.content,
                    priority: data.priority,
                    author: data.users?.name || user?.name || 'Bạn',
                    publishDate: data.created_at?.slice(0, 10) || '',
                    isPinned: false,
                    views: 0,
                    tags: data.tags || [],
                }, ...announcements]);
                setShowCreateForm(false);
                setNewAnnouncement({ title: '', content: '', priority: 'medium', tags: '' });
                
                // Tạo notification cho tất cả thành viên CLB
                try {
                    // Lấy danh sách tất cả thành viên CLB
                    const membersResult = await clbApi.getMembers();
                    if (membersResult.success && membersResult.data) {
                        const members = membersResult.data;
                        console.log('📋 Danh sách thành viên CLB:', members.length);
                        
                        // Lấy role của người tạo
                        const creatorMember = members.find(m => m.user_id === user?.id);
                        const creatorRole = creatorMember?.role || 'Chủ Nhiệm CLB';
                        console.log('👤 Role của người tạo:', creatorRole);
                        
                        // Tạo title cho notification
                        const notificationTitle = `${creatorRole} vừa đăng một thông báo`;
                        
                        // Tạo notification cho mỗi thành viên (trừ người tạo)
                        const membersToNotify = members.filter(member => {
                            const hasUserId = member.user_id && member.user_id !== user?.id;
                            const hasUserData = member.users && member.users.id;
                            return hasUserId && hasUserData;
                        });
                        
                        console.log(`📢 Sẽ tạo notification cho ${membersToNotify.length} thành viên`);
                        
                        const notificationPromises = membersToNotify.map(member => 
                            createNotification({
                                title: notificationTitle,
                                senderId: user?.id,
                                receiverId: member.user_id,
                                type: 'announcement',
                                announcementId: data.id,
                                postId: null,
                                commentId: null,
                                is_read: false,
                                data: {
                                    announcementTitle: newAnnouncement.title
                                }
                            }).catch(err => {
                                console.error(`❌ Lỗi tạo notification cho ${member.user_id}:`, err);
                                return null;
                            })
                        );
                        
                        // Thực hiện tất cả notifications song song
                        const results = await Promise.allSettled(notificationPromises);
                        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
                        console.log(`✅ Đã tạo ${successCount}/${membersToNotify.length} thông báo cho thành viên CLB`);
                    } else {
                        console.warn('⚠️ Không thể lấy danh sách thành viên CLB');
                    }
                } catch (notifError) {
                    console.error('❌ Lỗi khi tạo notification cho thành viên:', notifError);
                    // Không hiển thị lỗi cho user vì thông báo đã được tạo thành công
                }
            } else {
                alert('Lỗi tạo thông báo: ' + (error?.message || error));
            }
        } catch (error) {
            console.error('Error creating announcement:', error);
            alert('Lỗi tạo thông báo: ' + error.message);
        }
    };

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
            <div className="announcements-header">
                <div className="header-left">
                <h1>Thông báo CLB</h1>
                    <p>Xem và quản lý các thông báo của CLB</p>
                </div>
                <div className="header-right">
                    <button className="create-activity-btn" onClick={handleOpenModal}>
                        ➕ Tạo thông báo
                    </button>
                </div>
            </div>

            {showCreateForm && (
                <div className="announcement-modal-backdrop">
                    <form className="announcement-create-form" onSubmit={handleCreateAnnouncement}>
                        <h2><span style={{marginRight:4}}>📢</span> Tạo thông báo mới</h2>
                        {modalRoleLoading && <div style={{color:'#888',textAlign:'center',fontWeight:600,marginBottom:12}}>Đang kiểm tra quyền...</div>}
                        {!modalRoleLoading && !modalIsManager && (
                            <div style={{color:'#e74c3c',background:'#ffeded', borderRadius:7, marginBottom:10, padding:'6px 10px', textAlign:'center', fontWeight:600}}>
                                <div style={{fontSize:48, marginBottom:8}}>🔒</div>
                                Bạn không có quyền tạo thông báo!<br/>Chỉ Chủ nhiệm CLB hoặc Phó Chủ Nhiệm mới có thể tạo thông báo mới.
                                <div style={{marginTop:12}}><button type="button" className="action-btn view-btn" onClick={()=>setShowCreateForm(false)}>Đã hiểu</button></div>
                            </div>
                        )}
                        {modalIsManager && !modalRoleLoading && (
                            <>
                                <div>
                                    <label>Tiêu đề</label>
                                    <input type="text" value={newAnnouncement.title} onChange={e=>setNewAnnouncement({...newAnnouncement, title:e.target.value})} required />
                                </div>
                                <div>
                                    <label>Nội dung</label>
                                    <textarea value={newAnnouncement.content} onChange={e=>setNewAnnouncement({...newAnnouncement, content:e.target.value})} rows={5} required/>
                                </div>
                                <div>
                                    <label>Độ ưu tiên</label>
                                    <select value={newAnnouncement.priority} onChange={e=>setNewAnnouncement({...newAnnouncement, priority:e.target.value})}>
                                        <option value="high">Quan trọng</option>
                                        <option value="medium">Thường</option>
                                        <option value="low">Thông tin</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Tags (phân cách bằng dấu phẩy)</label>
                                    <input type="text" value={newAnnouncement.tags} onChange={e=>setNewAnnouncement({...newAnnouncement, tags:e.target.value})}/>
                                </div>
                                <div style={{marginTop:16,display:'flex',gap:8,justifyContent:'flex-end'}}>
                                    <button type="button" className="action-btn edit-btn" onClick={()=>setShowCreateForm(false)}>Huỷ</button>
                                    <button type="submit" className="action-btn view-btn">Tạo thông báo</button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            )}

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
                    <div 
                        key={announcement.id} 
                        id={`announcement-${announcement.id}`}
                        data-announcement-id={announcement.id}
                        className={`announcement-card ${announcement.isPinned ? 'pinned' : ''}`}
                    >
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
