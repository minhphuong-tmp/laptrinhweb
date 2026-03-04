import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllStats } from '../services/statisticsService';
import { hasStatisticsAccess } from '../services/clbService';
import { supabase } from '../lib/supabase';
import { getUserImageSrc } from '../services/imageService';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import './Statistics.css';

const Statistics = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Authorization states
    const [hasAccess, setHasAccess] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [accessError, setAccessError] = useState(null);

    // Filter states
    const [timePeriodFilter, setTimePeriodFilter] = useState('all'); // '7d', '30d', '90d', 'all'
    const [contributorLimit, setContributorLimit] = useState(5);
    const [selectedActivityTypes, setSelectedActivityTypes] = useState([]);

    // Helper functions for filtering data
    const getFilteredTimeData = () => {
        if (timePeriodFilter === 'all') {
            return [
                { period: '7 ngày', posts: stats.timeBased?.posts?.['7d'] || 0, comments: stats.timeBased?.comments?.['7d'] || 0, likes: stats.timeBased?.likes?.['7d'] || 0 },
                { period: '30 ngày', posts: stats.timeBased?.posts?.['30d'] || 0, comments: stats.timeBased?.comments?.['30d'] || 0, likes: stats.timeBased?.likes?.['30d'] || 0 },
                { period: '90 ngày', posts: stats.timeBased?.posts?.['90d'] || 0, comments: stats.timeBased?.comments?.['90d'] || 0, likes: stats.timeBased?.likes?.['90d'] || 0 }
            ];
        } else if (timePeriodFilter === '7d') {
            return [{ period: '7 ngày', posts: stats.timeBased?.posts?.['7d'] || 0, comments: stats.timeBased?.comments?.['7d'] || 0, likes: stats.timeBased?.likes?.['7d'] || 0 }];
        } else if (timePeriodFilter === '30d') {
            return [{ period: '30 ngày', posts: stats.timeBased?.posts?.['30d'] || 0, comments: stats.timeBased?.comments?.['30d'] || 0, likes: stats.timeBased?.likes?.['30d'] || 0 }];
        } else if (timePeriodFilter === '90d') {
            return [{ period: '90 ngày', posts: stats.timeBased?.posts?.['90d'] || 0, comments: stats.timeBased?.comments?.['90d'] || 0, likes: stats.timeBased?.likes?.['90d'] || 0 }];
        }
        return [];
    };

    const getFilteredContributors = () => {
        return stats.topContributors?.slice(0, contributorLimit) || [];
    };

    // Tạo map name -> contributor data để CustomAxisTick có thể truy cập nhanh
    const contributorsMap = useMemo(() => {
        return getFilteredContributors().reduce((map, contributor, idx) => {
            const name = contributor.user?.name || `User ${idx + 1}`;
            const shortName = name.length > 8 ? name.substring(0, 8) + '...' : name;
            map[shortName] = contributor;
            map[name] = contributor; // Cũng lưu tên đầy đủ
            return map;
        }, {});
    }, [stats.topContributors, contributorLimit]);

    // Custom tick component để hiển thị avatar và tên cạnh nhau
    const CustomAxisTick = useCallback(({ x, y, payload }) => {
        const nameValue = payload?.value || '';
        const contributor = contributorsMap[nameValue] || getFilteredContributors().find(c => {
            const name = c.user?.name || '';
            const shortName = name.length > 8 ? name.substring(0, 8) + '...' : name;
            return shortName === nameValue || name === nameValue;
        });
        
        const displayName = nameValue;
        const fullName = contributor?.user?.name || displayName;
        const avatar = contributor?.user?.image || null;
        
        // Tính toán vị trí để avatar và tên nằm cạnh nhau, xuống dưới biểu đồ
        const avatarSize = 24;
        const spacing = 6;
        const offsetY = 15; // Đẩy xuống dưới để không bị che bởi cột
        
        // Tạo avatar URL trực tiếp từ image path
        let avatarUrl = null;
        if (avatar) {
            // Xử lý path giống getUserImageSrc
            let cleanPath = avatar;
            if (avatar.startsWith('profiles/')) {
                cleanPath = avatar.replace('profiles/', '');
            }
            
            // Tạo URL từ Supabase storage (thử path profiles/ trước)
            const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://tguxydfhxcmqvcrenqbl.supabase.co';
            avatarUrl = `${supabaseUrl}/storage/v1/object/public/upload/profiles/${cleanPath}`;
        }
        
        // Tọa độ avatar trong hệ tọa độ địa phương
        const avatarCenterX = -12;
        const avatarCenterY = offsetY;
        
        return (
            <g transform={`translate(${x},${y})`}>
                {/* Avatar container - hình tròn với viền */}
                <circle 
                    cx={avatarCenterX} 
                    cy={avatarCenterY} 
                    r={12} 
                    fill="#f0f0f0" 
                    stroke="#ddd" 
                    strokeWidth={1}
                />
                {avatarUrl ? (
                    <g clipPath="url(#avatarClipTickStat)" transform={`translate(${avatarCenterX},${avatarCenterY})`}>
                        <image
                            x={-12}
                            y={-12}
                            width={avatarSize}
                            height={avatarSize}
                            href={avatarUrl}
                            preserveAspectRatio="xMidYMid slice"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </g>
                ) : (
                    <text 
                        x={avatarCenterX} 
                        y={avatarCenterY + 4} 
                        textAnchor="middle" 
                        fill="#666" 
                        fontSize={12} 
                        fontWeight="600"
                    >
                        {fullName?.charAt(0)?.toUpperCase() || '?'}
                    </text>
                )}
                {/* Name text - nằm cạnh avatar */}
                <text 
                    x={spacing} 
                    y={offsetY + 20} 
                    textAnchor="start" 
                    fill="#666" 
                    fontSize={11}
                >
                    {displayName.length > 10 ? displayName.substring(0, 10) + '...' : displayName}
                </text>
            </g>
        );
    }, [contributorsMap, contributorLimit]);

    const getFilteredActivityTypes = () => {
        const allTypes = Object.entries(stats.activities?.byType || {});
        if (selectedActivityTypes.length === 0) return allTypes;
        return allTypes.filter(([type]) => selectedActivityTypes.includes(type));
    };

    // Function to check access permission
    const checkAccess = async () => {
        if (!user) {
            setHasAccess(false);
            setCheckingAccess(false);
            return;
        }

        try {
            setCheckingAccess(true);
            setAccessError(null);

            const accessGranted = await hasStatisticsAccess(user.id);
            setHasAccess(accessGranted);
        } catch (error) {
            console.error('Error checking access:', error);
            setAccessError('Không thể kiểm tra quyền truy cập');
            setHasAccess(false);
        } finally {
            setCheckingAccess(false);
        }
    };

    // Function to load statistics
    const loadStats = async () => {
        try {
            setLoading(true);
            setError(null);

            const realStats = await getAllStats();
            setStats(realStats);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error loading statistics:', error);
            setError('Không thể tải thống kê. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // Thêm mock data vào đầu function Statistics
    const mockDownloads = [
      { id: 1, name: "Hướng dẫn sử dụng LMS.pdf", cover: "/images/defaultUser.png", downloads: 324, uploadedBy: "Hoàng Anh", uploadedAt: "2024-03-20", type: "PDF" },
      { id: 2, name: "Quy chế CLB 2024.docx", cover: "/images/logo.png", downloads: 290, uploadedBy: "Thu Thuỷ", uploadedAt: "2024-01-28", type: "DOCX" },
      { id: 3, name: "Mẫu đơn đăng ký hoạt động.xlsx", cover: "/images/defaultUser.png", downloads: 199, uploadedBy: "Văn Phúc", uploadedAt: "2023-11-17", type: "XLSX" },
      { id: 4, name: "Thông báo học vụ 05-2024.pdf", cover: "/images/logo.png", downloads: 112, uploadedBy: "Mỹ Linh", uploadedAt: "2024-05-04", type: "PDF" },
      { id: 5, name: "Sổ tay thành viên 2023.pdf", cover: "/images/defaultUser.png", downloads: 87, uploadedBy: "Quang Hưng", uploadedAt: "2023-08-12", type: "PDF" }
    ];
    const mockPreviews = [
      { id: 11, name: "Nội quy sử dụng thư viện.pdf", cover: "/images/logo.png", previews: 412, uploadedBy: "Lê Thảo", uploadedAt: "2022-12-10", type: "PDF" },
      { id: 12, name: "Tổng kết thành tích 2023.pptx", cover: "/images/defaultUser.png", previews: 374, uploadedBy: "Quốc Khánh", uploadedAt: "2023-09-02", type: "PPTX" },
      { id: 13, name: "Hướng dẫn sử dụng LMS.pdf", cover: "/images/defaultUser.png", previews: 290, uploadedBy: "Hoàng Anh", uploadedAt: "2024-03-20", type: "PDF" },
      { id: 14, name: "Lịch họp tháng 4.docx", cover: "/images/logo.png", previews: 187, uploadedBy: "Thu Thuỷ", uploadedAt: "2024-03-28", type: "DOCX" },
      { id: 15, name: "Quy chế CLB 2024.docx", cover: "/images/logo.png", previews: 130, uploadedBy: "Thu Thuỷ", uploadedAt: "2024-01-28", type: "DOCX" }
    ];

    // Check access when component mounts or user changes
    useEffect(() => {
        checkAccess();
    }, [user]);

    // Load statistics only if user has access
    useEffect(() => {
        if (hasAccess && !checkingAccess) {
            loadStats();
        }
    }, [hasAccess, checkingAccess]);

    // Setup real-time subscriptions for auto-refresh (only if user has access)
    useEffect(() => {
        if (!hasAccess) return;

        // Subscribe to changes in relevant tables
        const subscriptions = [
            // Users table changes (affects members stats)
            supabase
                .channel('users_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'users'
                }, () => {
                    console.log('🔄 Users changed, refreshing stats...');
                    loadStats();
                })
                .subscribe(),

            // CLB members table changes
            supabase
                .channel('clb_members_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'clb_members'
                }, () => {
                    console.log('🔄 CLB members changed, refreshing stats...');
                    loadStats();
                })
                .subscribe(),

            // Activities table changes
            supabase
                .channel('activities_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'activities'
                }, () => {
                    console.log('🔄 Activities changed, refreshing stats...');
                    loadStats();
                })
                .subscribe(),

            // Activity participants changes
            supabase
                .channel('activity_participants_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'activity_participants'
                }, () => {
                    console.log('🔄 Activity participants changed, refreshing stats...');
                    loadStats();
                })
                .subscribe(),

            // Documents table changes
            supabase
                .channel('documents_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'documents'
                }, () => {
                    console.log('🔄 Documents changed, refreshing stats...');
                    loadStats();
                })
                .subscribe(),

            // Posts, comments, likes changes
            supabase
                .channel('engagement_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'posts'
                }, () => {
                    console.log('🔄 Posts changed, refreshing engagement stats...');
                    loadStats();
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'comments'
                }, () => {
                    console.log('🔄 Comments changed, refreshing engagement stats...');
                    loadStats();
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'postLikes'
                }, () => {
                    console.log('🔄 Likes changed, refreshing engagement stats...');
                    loadStats();
                })
                .subscribe()
        ];

        // Cleanup subscriptions on unmount or when access is lost
        return () => {
            subscriptions.forEach(subscription => {
                supabase.removeChannel(subscription);
            });
        };
    }, [hasAccess]);

    // Check access loading
    if (checkingAccess) {
        return (
            <div className="page-content">
                <div className="loading">
                    <div className="loading-spinner">🔐</div>
                    <p>Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    // Access error
    if (accessError) {
        return (
            <div className="page-content">
                <div className="error">
                    <div className="error-icon">⚠️</div>
                    <p>{accessError}</p>
                    <button
                        onClick={checkAccess}
                        className="retry-button"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // Access denied
    if (!hasAccess) {
        return (
            <div className="page-content">
                <div className="access-denied">
                    <div className="access-icon">🚫</div>
                    <h2>Không có quyền truy cập</h2>
                    <p>Chỉ Chủ nhiệm CLB và Phó Chủ nhiệm mới có thể xem thống kê.</p>
                    <p>Vui lòng liên hệ với ban lãnh đạo CLB nếu bạn cần quyền truy cập.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="back-button"
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải thống kê...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content">
                <div className="error">
                    <div className="error-icon">❌</div>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="retry-button"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Thống kê CLB</h1>
                <div className="statistics-actions">
                    <button
                        onClick={loadStats}
                        disabled={loading}
                        className="refresh-button"
                        title="Làm mới thống kê"
                    >
                        🔄 {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                    {lastUpdated && (
                        <span className="last-updated">
                            Cập nhật: {lastUpdated.toLocaleString('vi-VN')}
                        </span>
                    )}
                </div>
            </div>

            {/* Tổng quan */}
            <div className="overview-section">
                <h2>📊 Tổng quan</h2>
                <div className="overview-grid">
                    <div className="overview-card">
                        <div className="card-icon">👥</div>
                        <div className="card-content">
                            <div className="card-number">{stats.members?.total || 0}</div>
                            <div className="card-label">Thành viên</div>
                        </div>
                    </div>
                    <div className="overview-card">
                        <div className="card-icon">📅</div>
                        <div className="card-content">
                            <div className="card-number">{stats.activities?.total || 0}</div>
                            <div className="card-label">Hoạt động</div>
                        </div>
                    </div>
                    <div className="overview-card">
                        <div className="card-icon">📚</div>
                        <div className="card-content">
                            <div className="card-number">{stats.documents?.total || 0}</div>
                            <div className="card-label">Tài liệu</div>
                        </div>
                    </div>
                    <div className="overview-card">
                        <div className="card-icon">💬</div>
                        <div className="card-content">
                            <div className="card-number">{stats.engagement?.posts || 0}</div>
                            <div className="card-label">Bài viết</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thành viên */}
            <div className="section">
                <h2>👥 Thống kê thành viên</h2>
                <div className="section-grid">
                    <div className="chart-card">
                        <h3>Phân bố theo vai trò</h3>
                        <div className="role-chart">
                            {Object.entries(stats.members?.byRole || {}).map(([role, count]) => (
                                <div key={role} className="role-item">
                                    <div className="role-info">
                                        <span className="role-name">{role}</span>
                                        <span className="role-count">{count}</span>
                                    </div>
                                    <div className="role-bar">
                                        <div 
                                            className="role-fill"
                                            style={{ 
                                                width: `${(count / stats.members?.total) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="chart-card">
                        <h3>Thành viên mới theo năm</h3>
                        <div className="year-chart">
                            {Object.entries(stats.members?.byYear || {}).map(([year, count]) => (
                                <div key={year} className="year-item">
                                    <div className="year-bar">
                                        <div 
                                            className="year-fill"
                                            style={{ 
                                                height: `${(count / Math.max(...Object.values(stats.members?.byYear || {}))) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                    <div className="year-info">
                                        <span className="year-number">{count}</span>
                                        <span className="year-label">{year}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hoạt động */}
            <div className="section">
                <div className="chart-header">
                    <h2>📅 Thống kê hoạt động</h2>
                    <div className="filter-controls">
                        <div className="filter-group">
                            <label>Lọc loại hoạt động:</label>
                            <div className="activity-filters">
                                {Object.keys(stats.activities?.byType || {}).map((type) => (
                                    <label key={type} className="activity-filter-item">
                                        <input
                                            type="checkbox"
                                            checked={selectedActivityTypes.length === 0 || selectedActivityTypes.includes(type)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    // Add to filter
                                                    setSelectedActivityTypes(prev =>
                                                        prev.includes(type) ? prev : [...prev, type]
                                                    );
                                                } else {
                                                    // Remove from filter
                                                    setSelectedActivityTypes(prev =>
                                                        prev.filter(t => t !== type)
                                                    );
                                                }
                                            }}
                                        />
                                        <span>{type}</span>
                                    </label>
                                ))}
                                {Object.keys(stats.activities?.byType || {}).length > 0 && (
                                    <button
                                        className="reset-filter-btn"
                                        onClick={() => setSelectedActivityTypes([])}
                                    >
                                        Hiển thị tất cả
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="section-grid">
                    <div className="chart-card">
                        <h3>Phân loại hoạt động</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={getFilteredActivityTypes().map(([type, count]) => ({
                                            name: type,
                                            value: count
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {Object.entries(stats.activities?.byType || {}).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#ff6b6b', '#ff8e8e', '#fff3e0', '#ffffff'][index % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3>Tham gia hoạt động</h3>
                        <div className="participation-stats">
                            <div className="stat-item">
                                <span className="stat-label">Tổng lượt tham gia:</span>
                                <span className="stat-value">{stats.activities?.participation?.totalParticipants || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Trung bình/hoạt động:</span>
                                <span className="stat-value">{stats.activities?.participation?.averagePerActivity || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tài liệu */}
            <div className="section">
                <h2>📚 Thống kê tài liệu</h2>
                <div className="section-grid">
                    <div className="chart-card">
                        <h3>Phân loại tài liệu</h3>
                        <div className="document-chart">
                            {Object.entries(stats.documents?.byCategory || {}).map(([category, count]) => (
                                <div key={category} className="document-item">
                                    <div className="document-info">
                                        <span className="document-name">{category}</span>
                                        <span className="document-count">{count}</span>
                                    </div>
                                    <div className="document-bar">
                                        <div 
                                            className="document-fill"
                                            style={{ 
                                                width: `${(count / stats.documents?.total) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="chart-card">
                        <h3>Lượt tải xuống</h3>
                        <div className="download-stats">
                            <div className="stat-item">
                                <span className="stat-label">Tổng lượt tải:</span>
                                <span className="stat-value">{stats.documents?.downloads?.total || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Tháng này:</span>
                                <span className="stat-value">{stats.documents?.downloads?.thisMonth || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tương tác */}
            <div className="section">
                <h2>💬 Thống kê tương tác</h2>
                <div className="engagement-grid">
                    <div className="engagement-card">
                        <div className="engagement-icon">📝</div>
                        <div className="engagement-content">
                            <div className="engagement-number">{stats.engagement?.posts || 0}</div>
                            <div className="engagement-label">Bài viết</div>
                        </div>
                    </div>
                    <div className="engagement-card">
                        <div className="engagement-icon">💬</div>
                        <div className="engagement-content">
                            <div className="engagement-number">{stats.engagement?.comments || 0}</div>
                            <div className="engagement-label">Bình luận</div>
                        </div>
                    </div>
                    <div className="engagement-card">
                        <div className="engagement-icon">👍</div>
                        <div className="engagement-content">
                            <div className="engagement-number">{stats.engagement?.likes || 0}</div>
                            <div className="engagement-label">Lượt thích</div>
                        </div>
                    </div>
                    <div className="engagement-card">
                        <div className="engagement-icon">🔄</div>
                        <div className="engagement-content">
                            <div className="engagement-number">{stats.engagement?.shares || 0}</div>
                            <div className="engagement-label">Chia sẻ</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thống kê theo thời gian với Chart */}
            <div className="section">
                <div className="chart-header">
                    <h2>📈 Xu hướng theo thời gian</h2>
                    <div className="filter-controls">
                        <div className="filter-group">
                            <label>Khoảng thời gian:</label>
                            <div className="filter-buttons">
                                <button
                                    className={`filter-btn ${timePeriodFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setTimePeriodFilter('all')}
                                >
                                    Tất cả
                                </button>
                                <button
                                    className={`filter-btn ${timePeriodFilter === '7d' ? 'active' : ''}`}
                                    onClick={() => setTimePeriodFilter('7d')}
                                >
                                    7 ngày
                                </button>
                                <button
                                    className={`filter-btn ${timePeriodFilter === '30d' ? 'active' : ''}`}
                                    onClick={() => setTimePeriodFilter('30d')}
                                >
                                    30 ngày
                                </button>
                                <button
                                    className={`filter-btn ${timePeriodFilter === '90d' ? 'active' : ''}`}
                                    onClick={() => setTimePeriodFilter('90d')}
                                >
                                    90 ngày
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                            data={getFilteredTimeData()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="posts"
                                stroke="#ff6b6b"
                                strokeWidth={3}
                                name="Bài viết"
                            />
                            <Line
                                type="monotone"
                                dataKey="comments"
                                stroke="#ff8e8e"
                                strokeWidth={3}
                                name="Bình luận"
                            />
                            <Line
                                type="monotone"
                                dataKey="likes"
                                stroke="#ff6b6b"
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                name="Lượt thích"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Contributors với Bar Chart */}
            {stats.topContributors && stats.topContributors.length > 0 && (
                <div className="section">
                    <div className="chart-header">
                        <h2>🏆 Top Contributors</h2>
                        <div className="filter-controls">
                            <div className="filter-group">
                                <label>Hiển thị:</label>
                                <div className="filter-buttons">
                                    <button
                                        className={`filter-btn ${contributorLimit === 3 ? 'active' : ''}`}
                                        onClick={() => setContributorLimit(3)}
                                    >
                                        Top 3
                                    </button>
                                    <button
                                        className={`filter-btn ${contributorLimit === 5 ? 'active' : ''}`}
                                        onClick={() => setContributorLimit(5)}
                                    >
                                        Top 5
                                    </button>
                                    <button
                                        className={`filter-btn ${contributorLimit === 10 ? 'active' : ''}`}
                                        onClick={() => setContributorLimit(10)}
                                    >
                                        Top 10
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={getFilteredContributors().map((contributor, index) => {
                                    const name = contributor.user?.name || `User ${index + 1}`;
                                    const shortName = name.length > 8 ? name.substring(0, 8) + '...' : name;
                                    return {
                                        name: shortName,
                                        fullName: name,
                                        avatar: contributor.user?.image || null,
                                    posts: contributor.postsCount,
                                    likes: contributor.likesReceived
                                    };
                                })}
                                margin={{ top: 20, right: 30, left: 20, bottom: 140 }}
                            >
                                <defs>
                                    <clipPath id="avatarClipTickStat">
                                        <circle cx="0" cy="0" r="12" />
                                    </clipPath>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="name" 
                                    height={100}
                                    tick={CustomAxisTick}
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="posts" fill="#ff6b6b" name="Bài viết" />
                                <Bar dataKey="likes" fill="#ff8e8e" name="Lượt thích" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Tài liệu phổ biến (hiện đại - mock) */}
            <div className="section">
                <h2>📑 Tài liệu phổ biến (Mock data, có ảnh)</h2>
                <div className="popular-documents-section" style={{display: 'flex', flexWrap: 'wrap', gap: '32px'}}>
                    {/* Top download with pics */}
                    <div style={{flex: 1, minWidth: 380, maxWidth: 520}}>
                        <h3>📥 Được tải nhiều nhất</h3>
                        <table className="popular-doc-table" style={{width: '100%', minWidth: 360}}>
                            <thead>
                                <tr>
                                    <th style={{textAlign:'center'}}>#</th>
                                    <th>Tài liệu</th>
                                    <th>Lượt tải</th>
                                    <th>Ngày upload</th>
                                    <th>Người upload</th>
                                    <th>Loại</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockDownloads.map((doc,idx)=>(
                                    <tr key={doc.id}>
                                        <td style={{textAlign:'center'}}>{idx+1}</td>
                                        <td style={{display:'flex',alignItems:'center',gap:8,minWidth:120,maxWidth:170}}>
                                            <img src={doc.cover} alt="thumb" width={36} height={36} style={{objectFit:'cover',borderRadius:4, boxShadow:'0 2px 6px #ccc'}}/>
                                            <div style={{fontWeight:600,wordBreak:'break-word'}}>{doc.name}</div>
                                        </td>
                                        <td style={{textAlign:'center',fontWeight:'bold'}}>{doc.downloads}</td>
                                        <td style={{whiteSpace:'nowrap'}}>{doc.uploadedAt}</td>
                                        <td>{doc.uploadedBy}</td>
                                        <td style={{textTransform:'uppercase',fontSize:13,textAlign:'center'}}>{doc.type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Top preview with pics */}
                    <div style={{flex: 1, minWidth: 380, maxWidth: 520}}>
                        <h3>👁️‍🗨️ Xem trước nhiều nhất</h3>
                        <table className="popular-doc-table" style={{width: '100%', minWidth: 360}}>
                            <thead>
                                <tr>
                                    <th style={{textAlign:'center'}}>#</th>
                                    <th>Tài liệu</th>
                                    <th>Lượt xem</th>
                                    <th>Ngày upload</th>
                                    <th>Người upload</th>
                                    <th>Loại</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockPreviews.map((doc,idx)=>(
                                    <tr key={doc.id}>
                                        <td style={{textAlign:'center'}}>{idx+1}</td>
                                        <td style={{display:'flex',alignItems:'center',gap:8,minWidth:120,maxWidth:170}}>
                                            <img src={doc.cover} alt="thumb" width={36} height={36} style={{objectFit:'cover',borderRadius:4, boxShadow:'0 2px 6px #ccc'}}/>
                                            <div style={{fontWeight:600,wordBreak:'break-word'}}>{doc.name}</div>
                                        </td>
                                        <td style={{textAlign:'center',fontWeight:'bold'}}>{doc.previews}</td>
                                        <td style={{whiteSpace:'nowrap'}}>{doc.uploadedAt}</td>
                                        <td>{doc.uploadedBy}</td>
                                        <td style={{textTransform:'uppercase',fontSize:13,textAlign:'center'}}>{doc.type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Biểu đồ tài liệu phổ biến (MOCK) */}
            <div className="section">
                <h2>⭐ Biểu đồ tài liệu phổ biến</h2>
                <div style={{display:'flex',flexWrap:'wrap',gap:'32px',marginBottom:36}}>
                    <div style={{flex:1 , minWidth:350, maxWidth:520}}>
                        <h3 style={{textAlign:'center',marginBottom:18}}>📥 Được tải nhiều nhất</h3>
                        <div style={{background:'#fff',borderRadius:10,padding:16,boxShadow:'0 2px 12px #eee'}}>
                            <ResponsiveContainer width="100%" height={230}>
                                <BarChart data={mockDownloads} margin={{top:20,right:20,left:0,bottom:36}}>
                                    <XAxis dataKey="name" tick={{fontSize:12}} interval={0} angle={-24} textAnchor="end" height={60}/>
                                    <YAxis allowDecimals={false} tick={{fontSize:13}}/>
                                    <Tooltip/>
                                    <Bar dataKey="downloads" name="Lượt tải" fill="#ff9800"/>
                                </BarChart>
                    </ResponsiveContainer>
                        </div>
                    </div>
                    <div style={{flex:1 , minWidth:350, maxWidth:520}}>
                        <h3 style={{textAlign:'center',marginBottom:18}}>👁️‍🗨️ Được xem trước nhiều nhất</h3>
                        <div style={{background:'#fff',borderRadius:10,padding:16,boxShadow:'0 2px 12px #eee'}}>
                            <ResponsiveContainer width="100%" height={230}>
                                <BarChart data={mockPreviews} margin={{top:20,right:20,left:0,bottom:36}}>
                                    <XAxis dataKey="name" tick={{fontSize:12}} interval={0} angle={-24} textAnchor="end" height={60}/>
                                    <YAxis allowDecimals={false} tick={{fontSize:13}}/>
                                    <Tooltip/>
                                    <Bar dataKey="previews" name="Lượt xem trước" fill="#2196f3"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
