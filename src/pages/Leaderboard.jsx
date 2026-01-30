import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { getLeaderboardData } from '../services/statisticsService';
import Avatar from '../components/Avatar';
import { getUserImageSrc } from '../services/imageService';
import './Leaderboard.css';

// Custom tooltip với avatar
const CustomTooltip = ({ active, payload, label }) => {
    const [avatarUrl, setAvatarUrl] = useState(null);
    
    useEffect(() => {
        const loadAvatar = async () => {
            if (payload && payload[0] && payload[0].payload && payload[0].payload.avatar) {
                try {
                    const url = await getUserImageSrc(
                        payload[0].payload.avatar, 
                        payload[0].payload.fullName || label, 
                        'avatar'
                    );
                    setAvatarUrl(url);
                } catch (error) {
                    console.log('Error loading avatar in tooltip:', error);
                }
            }
        };
        loadAvatar();
    }, [payload, label]);
    
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const rankIcon = data.rank === 1 ? '🥇' : data.rank === 2 ? '🥈' : data.rank === 3 ? '🥉' : '';
        
        return (
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '2px solid #1877f2',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '12px',
                minWidth: '180px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        {avatarUrl ? (
                            <img 
                                src={avatarUrl} 
                                alt={data.fullName || label}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={() => setAvatarUrl(null)}
                            />
                        ) : (
                            <span style={{ fontSize: '16px', color: '#666' }}>
                                {data.fullName?.charAt(0) || label?.charAt(0) || '?'}
                            </span>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>
                            {rankIcon} {data.fullName || label}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            Rank #{data.rank}
                        </div>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '8px', marginTop: '8px' }}>
                    {payload.map((entry, index) => {
                        const labels = {
                            'Bài viết': 'bài viết',
                            'Bình luận': 'bình luận',
                            'Tài liệu đã tải': 'tài liệu',
                            'Lượt thích': 'lượt thích',
                            'Tổng điểm': 'điểm'
                        };
                        const isPoints = entry.name === 'Tổng điểm';
                        const unit = labels[entry.name] || '';
                        return (
                            <div key={index} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                marginTop: '4px'
                            }}>
                                <span style={{ color: '#6c757d', fontSize: '12px' }}>{entry.name}:</span>
                                <span style={{ fontWeight: '600', color: '#1877f2', fontSize: '13px' }}>
                                    {typeof entry.value === 'number' ? `${entry.value.toLocaleString()} ${unit}` : entry.value}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

const Leaderboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPeriod, setFilterPeriod] = useState('all'); // all, month, year
    const [filterCategory, setFilterCategory] = useState('all'); // all, activities, documents, posts
    const [topLimit, setTopLimit] = useState(10); // 3, 5 or 10
    const [chartMetric, setChartMetric] = useState('Bài viết'); // Bài viết, Bình luận, Tài liệu đã tải, Lượt thích
    const [selectedMember, setSelectedMember] = useState(null); // Member detail view
    const [viewMode, setViewMode] = useState('overview'); // overview, detailed, comparison
    const [compareMembers, setCompareMembers] = useState([]);
    
    // Tạo map name -> member data để CustomAxisTick có thể truy cập nhanh
    const chartDataMap = useMemo(() => {
        return leaderboard.slice(0, topLimit).reduce((map, member, idx) => {
            const shortName = member.name.length > 8 ? member.name.substring(0, 8) + '...' : member.name;
            map[shortName] = member;
            map[member.name] = member; // Cũng lưu tên đầy đủ
            return map;
        }, {});
    }, [leaderboard, topLimit]);
    
    // Custom tick component để hiển thị avatar và tên cạnh nhau
    // Tạo bên trong component để có thể truy cập leaderboard data
    const CustomAxisTick = useCallback(({ x, y, payload }) => {
        console.log('[CustomAxisTick] Called with payload:', payload);
        
        const nameValue = payload?.value || '';
        const member = chartDataMap[nameValue] || leaderboard.find(m => {
            const shortName = m.name.length > 8 ? m.name.substring(0, 8) + '...' : m.name;
            return shortName === nameValue || m.name === nameValue;
        });
        
        console.log('[CustomAxisTick] nameValue:', nameValue, 'member found:', member?.name, 'avatar:', member?.avatar);
        
        const displayName = nameValue;
        const fullName = member?.name || displayName;
        const avatar = member?.avatar;
        
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
            const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://oqtlakdvlmkaalymgrwd.supabase.co';
            avatarUrl = `${supabaseUrl}/storage/v1/object/public/upload/profiles/${cleanPath}`;
            console.log('[CustomAxisTick] Generated avatar URL:', avatarUrl);
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
                    <g clipPath="url(#avatarClipTick)" transform={`translate(${avatarCenterX},${avatarCenterY})`}>
                        <image
                            x={-12}
                            y={-12}
                            width={avatarSize}
                            height={avatarSize}
                            href={avatarUrl}
                            preserveAspectRatio="xMidYMid slice"
                            onError={(e) => {
                                console.log('[CustomAxisTick] Image load error for:', avatarUrl);
                                e.target.style.display = 'none';
                            }}
                            onLoad={() => {
                                console.log('[CustomAxisTick] Image loaded successfully:', avatarUrl);
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
    }, [chartDataMap, leaderboard]);

    // Load dữ liệu thật từ database
    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                setLoading(true);
                const data = await getLeaderboardData();
                setLeaderboard(data || []);
            } catch (error) {
                console.error('Error loading leaderboard:', error);
                setLeaderboard([]);
            } finally {
                setLoading(false);
            }
        };

        loadLeaderboard();
    }, []);

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return `#${rank}`;
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 1:
                return '#ffd700';
            case 2:
                return '#c0c0c0';
            case 3:
                return '#cd7f32';
            default:
                return '#6c757d';
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Chủ nhiệm CLB':
                return '#e74c3c';
            case 'Phó Chủ Nhiệm':
                return '#f39c12';
            case 'Thành viên':
                return '#27ae60';
            default:
                return '#95a5a6';
        }
    };

    // Tính toán thống kê nâng cao
    const getStatsData = () => {
        const totalPoints = leaderboard.reduce((sum, m) => sum + m.totalPoints, 0);
        const avgPoints = Math.round(totalPoints / leaderboard.length);
        const maxPoints = leaderboard[0]?.totalPoints || 0;
        const categoryDistribution = {
            activities: leaderboard.reduce((sum, m) => sum + m.activities.points, 0),
            documents: leaderboard.reduce((sum, m) => sum + m.documents.points, 0),
            posts: leaderboard.reduce((sum, m) => sum + m.posts.points, 0)
        };
        const totalCategoryPoints = categoryDistribution.activities + categoryDistribution.documents + categoryDistribution.posts;
        
        return {
            totalPoints,
            avgPoints,
            maxPoints,
            categoryDistribution: {
                activities: Math.round((categoryDistribution.activities / totalCategoryPoints) * 100),
                documents: Math.round((categoryDistribution.documents / totalCategoryPoints) * 100),
                posts: Math.round((categoryDistribution.posts / totalCategoryPoints) * 100)
            },
            topPerformers: leaderboard.slice(0, 5),
            improvementRate: leaderboard.map(m => ({
                name: m.name,
                rank: m.rank,
                points: m.totalPoints,
                trend: m.rank <= 3 ? 'up' : m.rank <= 7 ? 'stable' : 'down'
            }))
        };
    };

    const stats = getStatsData();

    // Dữ liệu cho biểu đồ pie phân bố điểm
    const pieChartData = [
        { name: 'Hoạt động', value: stats.categoryDistribution.activities, fill: '#ff6b6b' },
        { name: 'Tài liệu', value: stats.categoryDistribution.documents, fill: '#4ecdc4' },
        { name: 'Bài viết', value: stats.categoryDistribution.posts, fill: '#ffe66d' }
    ];

    // Dữ liệu cho biểu đồ trend (giả lập dữ liệu theo tháng)
    const trendData = [
        { month: 'T1', top1: 1100, top3: 2800, avg: 550 },
        { month: 'T2', top1: 1150, top3: 2900, avg: 580 },
        { month: 'T3', top1: 1200, top3: 3000, avg: 600 },
        { month: 'T4', top1: 1220, top3: 3050, avg: 610 },
        { month: 'T5', top1: 1250, top3: 3100, avg: 620 }
    ];

    // Dữ liệu cho biểu đồ radial (top 5)
    const radialData = leaderboard.slice(0, 5).map((m, idx) => ({
        name: m.name,
        value: m.totalPoints,
        fill: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#42a5f5'
    }));

    const handleMemberClick = (member) => {
        setSelectedMember(member);
        setViewMode('detailed');
    };

    const handleCompareToggle = (memberId) => {
        if (compareMembers.includes(memberId)) {
            setCompareMembers(compareMembers.filter(id => id !== memberId));
        } else if (compareMembers.length < 3) {
            setCompareMembers([...compareMembers, memberId]);
        } else {
            alert('Chỉ có thể so sánh tối đa 3 thành viên!');
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải bảng xếp hạng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Bảng xếp hạng CLB</h1>
            </div>

            <div className="leaderboard-filters">
                <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">Tất cả thời gian</option>
                    <option value="month">Tháng này</option>
                    <option value="year">Năm nay</option>
                </select>
                
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">Tất cả hoạt động</option>
                    <option value="activities">Hoạt động</option>
                    <option value="documents">Tài liệu</option>
                    <option value="posts">Bài viết</option>
                </select>

                <div className="view-mode-toggle">
                    <button 
                        className={`view-btn ${viewMode === 'overview' ? 'active' : ''}`}
                        onClick={() => setViewMode('overview')}
                    >
                        📊 Tổng quan
                    </button>
                    <button 
                        className={`view-btn ${viewMode === 'detailed' ? 'active' : ''}`}
                        onClick={() => setViewMode('detailed')}
                    >
                        📈 Chi tiết
                    </button>
                    <button 
                        className={`view-btn ${viewMode === 'comparison' ? 'active' : ''}`}
                        onClick={() => setViewMode('comparison')}
                    >
                        ⚖️ So sánh
                    </button>
                </div>
            </div>

            <div className="leaderboard-stats">
                <div className="stat-card highlight">
                    <span className="stat-number">{leaderboard.length}</span>
                    <span className="stat-label">Tổng thành viên</span>
                    <span className="stat-icon">👥</span>
                </div>
                <div className="stat-card highlight">
                    <span className="stat-number">{stats.maxPoints.toLocaleString()}</span>
                    <span className="stat-label">Điểm cao nhất</span>
                    <span className="stat-icon">🏆</span>
                </div>
                <div className="stat-card highlight">
                    <span className="stat-number">{stats.avgPoints.toLocaleString()}</span>
                    <span className="stat-label">Điểm trung bình</span>
                    <span className="stat-icon">📊</span>
                </div>
                <div className="stat-card highlight">
                    <span className="stat-number">{leaderboard.filter(m => m.achievements.length > 0).length}</span>
                    <span className="stat-label">Có thành tích</span>
                    <span className="stat-icon">⭐</span>
                </div>
                <div className="stat-card highlight">
                    <span className="stat-number">{stats.totalPoints.toLocaleString()}</span>
                    <span className="stat-label">Tổng điểm hệ thống</span>
                    <span className="stat-icon">💯</span>
                </div>
            </div>

            {/* Biểu đồ cột tổng điểm */}
            <div className="leaderboard-section">
                <h2>📊 Biểu đồ xếp hạng theo tổng điểm</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <button
                        className={`chart-filter-btn ${topLimit === 3 ? 'active' : ''}`}
                        onClick={() => setTopLimit(3)}
                    >
                        Top 3
                    </button>
                    <button
                        className={`chart-filter-btn ${topLimit === 5 ? 'active' : ''}`}
                        onClick={() => setTopLimit(5)}
                    >
                        Top 5
                    </button>
                    <button
                        className={`chart-filter-btn ${topLimit === 10 ? 'active' : ''}`}
                        onClick={() => setTopLimit(10)}
                    >
                        Top 10
                    </button>
                </div>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={450}>
                        <BarChart
                            data={leaderboard.slice(0, topLimit).map((member, index) => ({
                                name: member.name.length > 8 ? member.name.substring(0, 8) + '...' : member.name,
                                fullName: member.name,
                                rank: member.rank,
                                avatar: member.avatar,
                                'Tổng điểm': member.totalPoints,
                                fill: index === 0 ? 'url(#goldGradient)' : index === 1 ? 'url(#silverGradient)' : index === 2 ? 'url(#bronzeGradient)' : 'url(#blueGradient)'
                            }))}
                            margin={{ top: 30, right: 30, left: 20, bottom: 140 }}
                        >
                            <defs>
                                <clipPath id="avatarClipTick">
                                    <circle cx="12" cy="12" r="12" />
                                </clipPath>
                                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ffd700" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#ffed4e" stopOpacity={0.8}/>
                                </linearGradient>
                                <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#c0c0c0" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#e8e8e8" stopOpacity={0.8}/>
                                </linearGradient>
                                <linearGradient id="bronzeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#cd7f32" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#e6a366" stopOpacity={0.8}/>
                                </linearGradient>
                                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#1877f2" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#42a5f5" stopOpacity={0.8}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                            <XAxis 
                                dataKey="name" 
                                height={100}
                                tick={CustomAxisTick}
                                stroke="#999"
                            />
                            <YAxis 
                                tick={{ fontSize: 12, fill: '#666' }}
                                stroke="#999"
                                label={{ value: 'Điểm', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#666' } }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar 
                                dataKey="Tổng điểm" 
                                radius={[12, 12, 0, 0]}
                                name="Tổng điểm"
                                animationDuration={1000}
                            >
                                {leaderboard.slice(0, topLimit).map((member, index) => {
                                    const fillColor = index === 0 ? 'url(#goldGradient)' : 
                                                     index === 1 ? 'url(#silverGradient)' : 
                                                     index === 2 ? 'url(#bronzeGradient)' : 
                                                     'url(#blueGradient)';
                                    return (
                                        <Cell key={`cell-${index}`} fill={fillColor} />
                                    );
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Biểu đồ cột số lượng thực tế - chỉ 1 cột, filter để chọn loại */}
            <div className="leaderboard-section">
                <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>📈 Số liệu chi tiết theo loại hoạt động</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <button
                        className={`chart-filter-btn ${chartMetric === 'Bài viết' ? 'active' : ''}`}
                        onClick={() => setChartMetric('Bài viết')}
                    >
                        📝 Bài viết
                    </button>
                    <button
                        className={`chart-filter-btn ${chartMetric === 'Bình luận' ? 'active' : ''}`}
                        onClick={() => setChartMetric('Bình luận')}
                    >
                        💬 Bình luận
                    </button>
                    <button
                        className={`chart-filter-btn ${chartMetric === 'Tài liệu đã tải' ? 'active' : ''}`}
                        onClick={() => setChartMetric('Tài liệu đã tải')}
                    >
                        📚 Tài liệu đã tải
                    </button>
                    <button
                        className={`chart-filter-btn ${chartMetric === 'Lượt thích' ? 'active' : ''}`}
                        onClick={() => setChartMetric('Lượt thích')}
                    >
                        👍 Lượt thích
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <button
                        className={`chart-filter-btn ${topLimit === 3 ? 'active' : ''}`}
                        onClick={() => setTopLimit(3)}
                    >
                        Top 3
                    </button>
                    <button
                        className={`chart-filter-btn ${topLimit === 5 ? 'active' : ''}`}
                        onClick={() => setTopLimit(5)}
                    >
                        Top 5
                    </button>
                    <button
                        className={`chart-filter-btn ${topLimit === 10 ? 'active' : ''}`}
                        onClick={() => setTopLimit(10)}
                    >
                        Top 10
                    </button>
                </div>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={450}>
                        <BarChart
                            data={leaderboard.slice(0, topLimit).map((member, index) => {
                                const metricValues = {
                                    'Bài viết': member.posts.created,
                                    'Bình luận': member.posts.comments,
                                    'Tài liệu đã tải': member.documents.uploaded,
                                    'Lượt thích': member.posts.likes
                                };
                                const gradientColors = {
                                    'Bài viết': 'url(#postGradient)',
                                    'Bình luận': 'url(#commentGradient)',
                                    'Tài liệu đã tải': 'url(#documentGradient)',
                                    'Lượt thích': 'url(#likeGradient)'
                                };
                                return {
                                    name: member.name.length > 8 ? member.name.substring(0, 8) + '...' : member.name,
                                    fullName: member.name,
                                    rank: member.rank,
                                    avatar: member.avatar,
                                    [chartMetric]: metricValues[chartMetric],
                                    fillColor: index === 0 ? 'url(#goldGradient)' : 
                                              index === 1 ? 'url(#silverGradient)' : 
                                              index === 2 ? 'url(#bronzeGradient)' : 
                                              gradientColors[chartMetric]
                                };
                            })}
                            margin={{ top: 30, right: 30, left: 20, bottom: 140 }}
                        >
                            <defs>
                                <clipPath id="avatarClipTick2">
                                    <circle cx="12" cy="12" r="12" />
                                </clipPath>
                                <linearGradient id="postGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#1877f2" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#42a5f5" stopOpacity={0.8}/>
                                </linearGradient>
                                <linearGradient id="commentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4ecdc4" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#6edcd4" stopOpacity={0.8}/>
                                </linearGradient>
                                <linearGradient id="documentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ff6b6b" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#ff8787" stopOpacity={0.8}/>
                                </linearGradient>
                                <linearGradient id="likeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ffe66d" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#ffed87" stopOpacity={0.8}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                            <XAxis 
                                dataKey="name" 
                                height={100}
                                tick={CustomAxisTick}
                                stroke="#999"
                            />
                            <YAxis 
                                tick={{ fontSize: 12, fill: '#666' }}
                                stroke="#999"
                                allowDecimals={false}
                                label={{ value: 'Số lượng', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#666' } }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar 
                                dataKey={chartMetric} 
                                radius={[12, 12, 0, 0]}
                                name={chartMetric}
                                animationDuration={1000}
                            >
                                {leaderboard.slice(0, topLimit).map((member, index) => {
                                    const gradientColors = {
                                        'Bài viết': 'url(#postGradient)',
                                        'Bình luận': 'url(#commentGradient)',
                                        'Tài liệu đã tải': 'url(#documentGradient)',
                                        'Lượt thích': 'url(#likeGradient)'
                                    };
                                    const fillColor = index === 0 ? 'url(#goldGradient)' : 
                                                      index === 1 ? 'url(#silverGradient)' : 
                                                      index === 2 ? 'url(#bronzeGradient)' : 
                                                      gradientColors[chartMetric];
                                    return (
                                        <Cell key={`cell-${index}`} fill={fillColor} />
                                    );
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="leaderboard-container">
                <div className="leaderboard-list">
                    {leaderboard.map((member, index) => (
                        <div 
                            key={member.id} 
                            className={`leaderboard-item ${index < 3 ? 'top-three' : ''} ${compareMembers.includes(member.id) ? 'selected-for-compare' : ''}`}
                            onClick={() => handleMemberClick(member)}
                            style={{ cursor: 'pointer' }}
                        >
                            {viewMode === 'comparison' && (
                                <input 
                                    type="checkbox"
                                    checked={compareMembers.includes(member.id)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        handleCompareToggle(member.id);
                                    }}
                                    style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                            )}
                            <div className="rank-section">
                                <div 
                                    className="rank-icon"
                                    style={{ color: getRankColor(member.rank) }}
                                >
                                    {getRankIcon(member.rank)}
                                </div>
                                <div className="rank-number">#{member.rank}</div>
                            </div>
                            
                            <div className="member-info">
                                <div className="member-avatar">
                                    <Avatar 
                                        src={member.avatar} 
                                        name={member.name} 
                                        size={50}
                                    />
                                </div>
                                <div className="member-details">
                                    <h3 className="member-name">{member.name}</h3>
                                    <div className="member-meta">
                                        <span className="student-id">{member.studentId}</span>
                                        <span 
                                            className="member-role"
                                            style={{ color: getRoleColor(member.role) }}
                                        >
                                            {member.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="points-section">
                                <div className="total-points">{member.totalPoints.toLocaleString()}</div>
                                <div className="points-label">điểm</div>
                            </div>
                            
                            <div className="breakdown-section">
                                <div className="breakdown-item">
                                    <span className="breakdown-icon">📅</span>
                                    <span className="breakdown-value">{member.activities.points}</span>
                                </div>
                                <div className="breakdown-item">
                                    <span className="breakdown-icon">📚</span>
                                    <span className="breakdown-value">{member.documents.points}</span>
                                </div>
                                <div className="breakdown-item">
                                    <span className="breakdown-icon">💬</span>
                                    <span className="breakdown-value">{member.posts.points}</span>
                                </div>
                            </div>
                            
                            <div className="achievements-section">
                                {member.achievements.length > 0 ? (
                                    <div className="achievements">
                                        {member.achievements.map((achievement, idx) => (
                                            <span key={idx} className="achievement-badge">
                                                {achievement}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-achievements">Chưa có thành tích</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal chi tiết thành viên */}
            {selectedMember && viewMode === 'detailed' && (
                <div className="member-detail-modal" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '30px',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#2c3e50' }}>📊 Chi tiết thành viên</h2>
                            <button onClick={() => {setSelectedMember(null); setViewMode('overview');}} style={{
                                background: '#ff6b6b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}>✕ Đóng</button>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ color: '#1877f2', marginBottom: '10px' }}>{selectedMember.name}</h3>
                            <p style={{ color: '#6c757d', margin: '4px 0' }}>MSSV: {selectedMember.studentId}</p>
                            <p style={{ color: '#6c757d', margin: '4px 0' }}>Vai trò: <span style={{ color: getRoleColor(selectedMember.role), fontWeight: '600' }}>{selectedMember.role}</span></p>
                            <p style={{ color: '#6c757d', margin: '4px 0' }}>Tổng điểm: <strong style={{ color: '#ff6b6b', fontSize: '18px' }}>{selectedMember.totalPoints.toLocaleString()}</strong></p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ padding: '16px', background: '#fff5f5', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff6b6b' }}>{selectedMember.activities.points}</div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>Hoạt động</div>
                            </div>
                            <div style={{ padding: '16px', background: '#f0fffe', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#4ecdc4' }}>{selectedMember.documents.points}</div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>Tài liệu</div>
                            </div>
                            <div style={{ padding: '16px', background: '#fffef0', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffe66d' }}>{selectedMember.posts.points}</div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>Bài viết</div>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ marginBottom: '10px' }}>Thành tích:</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedMember.achievements.length > 0 ? selectedMember.achievements.map((ach, idx) => (
                                    <span key={idx} style={{
                                        background: '#e8f5e8',
                                        color: '#2e7d32',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>{ach}</span>
                                )) : <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Chưa có thành tích</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Biểu đồ so sánh thành viên */}
            {viewMode === 'comparison' && compareMembers.length > 0 && (
                <div className="leaderboard-section">
                    <h2>⚖️ So sánh thành viên</h2>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={leaderboard.filter(m => compareMembers.includes(m.id)).map(member => ({
                                    name: member.name,
                                    'Hoạt động': member.activities.points,
                                    'Tài liệu': member.documents.points,
                                    'Bài viết': member.posts.points,
                                    'Tổng điểm': member.totalPoints
                                }))}
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} stroke="#999" />
                                <YAxis tick={{ fontSize: 12, fill: '#666' }} stroke="#999" />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                        border: '2px solid #1877f2',
                                        borderRadius: '12px',
                                        padding: '12px'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="Bài viết" fill="#1877f2" name="Bài viết" />
                                <Bar dataKey="Bình luận" fill="#4ecdc4" name="Bình luận" />
                                <Bar dataKey="Tài liệu đã tải" fill="#ff6b6b" name="Tài liệu đã tải" />
                                <Bar dataKey="Lượt thích" fill="#ffe66d" name="Lượt thích" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="scoring-info">
                <h3>📊 Hệ thống tính điểm</h3>
                <div className="scoring-grid">
                    <div className="scoring-category">
                        <h4>📅 Hoạt động</h4>
                        <ul>
                            <li>Tham gia hoạt động: <strong>20 điểm</strong></li>
                            <li>Tổ chức hoạt động: <strong>50 điểm</strong></li>
                            <li>Điểm danh đầy đủ: <strong>+10 điểm</strong></li>
                        </ul>
                    </div>
                    <div className="scoring-category">
                        <h4>📚 Tài liệu</h4>
                        <ul>
                            <li>Tải lên tài liệu: <strong>30 điểm</strong></li>
                            <li>Tải xuống tài liệu: <strong>5 điểm</strong></li>
                            <li>Tài liệu được đánh giá cao: <strong>+20 điểm</strong></li>
                        </ul>
                    </div>
                    <div className="scoring-category">
                        <h4>💬 Tương tác</h4>
                        <ul>
                            <li>Tạo bài viết: <strong>15 điểm</strong></li>
                            <li>Bình luận: <strong>5 điểm</strong></li>
                            <li>Nhận lượt thích: <strong>2 điểm</strong></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
