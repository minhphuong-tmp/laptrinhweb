import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import { getUserImageSrc } from '../services/imageService';
import './Stats.css';

// ===== STATS SERVICE (using REST API) =====
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';
const BASE_URL = 'https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1';

// Helper function to get auth token
const getAuthToken = () => {
    const storedToken = localStorage.getItem('sb-tguxydfhxcmqvcrenqbl-auth-token');
    if (storedToken) {
        try {
            const authData = JSON.parse(storedToken);
            return authData.access_token || API_KEY;
        } catch (e) {
            return API_KEY;
        }
    }
    return API_KEY;
};

const Stats = () => {
    const [filter, setFilter] = useState('all');
    const [topUsers, setTopUsers] = useState([]);
    const [overallStats, setOverallStats] = useState({
        totalPosts: 0,
        totalUsers: 0,
        averagePostsPerUser: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [filter]);

    const loadStats = async () => {
        try {
            setLoading(true);
            console.log('📊 Loading stats for filter:', filter);
            
            const authToken = getAuthToken();
            
            // Calculate date filter
            let dateFilter = '';
            if (filter === '7days') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                dateFilter = `&created_at=gte.${sevenDaysAgo.toISOString()}`;
            } else if (filter === '30days') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                dateFilter = `&created_at=gte.${thirtyDaysAgo.toISOString()}`;
            }
            
            // Load users with their posts count
            console.log('👥 Loading users...');
            const usersResponse = await fetch(`${BASE_URL}/users?select=id,name,image`, {
                method: 'GET',
                headers: {
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!usersResponse.ok) {
                throw new Error(`Users API error: ${usersResponse.status}`);
            }

            const users = await usersResponse.json();
            console.log('👥 Users loaded:', users.length);

            // Load posts count for each user with date filter
            const usersWithStats = await Promise.all(
                users.map(async (user) => {
                    try {
                        // Get posts count for this user with date filter
                        const postsUrl = `${BASE_URL}/posts?userId=eq.${user.id}&select=id${dateFilter}`;
                        const postsResponse = await fetch(postsUrl, {
                            method: 'GET',
                            headers: {
                                'apikey': API_KEY,
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        let postsCount = 0;
                        if (postsResponse.ok) {
                            const posts = await postsResponse.json();
                            postsCount = posts.length;
                        }

                        // Get likes count for this user's posts with date filter
                        const likesUrl = `${BASE_URL}/postLikes?userId=eq.${user.id}&select=id${dateFilter}`;
                        const likesResponse = await fetch(likesUrl, {
                            method: 'GET',
                            headers: {
                                'apikey': API_KEY,
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        let likesCount = 0;
                        if (likesResponse.ok) {
                            const likes = await likesResponse.json();
                            likesCount = likes.length;
                        }

                        return {
                            id: user.id,
                            name: user.name,
                            image: user.image,
                            postsCount,
                            likesCount
                        };
                    } catch (error) {
                        console.error(`Error loading stats for user ${user.id}:`, error);
                        return {
                            id: user.id,
                            name: user.name,
                            image: user.image,
                            postsCount: 0,
                            likesCount: 0
                        };
                    }
                })
            );

            // Sort by posts count and take top 10
            const sortedUsers = usersWithStats
                .sort((a, b) => b.postsCount - a.postsCount)
                .slice(0, 10);

            console.log('📊 Top users:', sortedUsers);
            setTopUsers(sortedUsers);

            // Load overall stats with date filter
            console.log('📈 Loading overall stats...');
            
            const totalPostsUrl = `${BASE_URL}/posts?select=id${dateFilter}`;
            const totalPostsResponse = await fetch(totalPostsUrl, {
                method: 'GET',
                headers: {
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const totalUsersResponse = await fetch(`${BASE_URL}/users?select=id`, {
                method: 'GET',
                headers: {
                    'apikey': API_KEY,
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            let totalPosts = 0;
            let totalUsers = 0;

            if (totalPostsResponse.ok) {
                const posts = await totalPostsResponse.json();
                totalPosts = posts.length;
            }

            if (totalUsersResponse.ok) {
                const users = await totalUsersResponse.json();
                totalUsers = users.length;
            }

            const overallStats = {
                totalPosts,
                totalUsers,
                averagePostsPerUser: totalUsers > 0 ? Math.round(totalPosts / totalUsers) : 0
            };

            console.log('📈 Overall stats:', overallStats);
            setOverallStats(overallStats);

        } catch (error) {
            console.error('❌ Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilterText = () => {
        switch (filter) {
            case '7days': return '7 ngày qua';
            case '30days': return '30 ngày qua';
            default: return 'Tất cả';
        }
    };

    if (loading) {
        return (
            <div className="stats-container">
                <div className="loading">Đang tải thống kê...</div>
            </div>
        );
    }

    return (
        <div className="stats-container">
            <div className="stats-header">
                <h2>Thống kê</h2>
                <div className="filter-buttons">
                    <button 
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Tất cả
                    </button>
                    <button 
                        className={`filter-btn ${filter === '30days' ? 'active' : ''}`}
                        onClick={() => setFilter('30days')}
                    >
                        30 ngày
                    </button>
                    <button 
                        className={`filter-btn ${filter === '7days' ? 'active' : ''}`}
                        onClick={() => setFilter('7days')}
                    >
                        7 ngày
                    </button>
                </div>
            </div>

            <div className="stats-overview">
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-content">
                        <h3>{overallStats.totalPosts}</h3>
                        <p>Tổng bài viết</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>{overallStats.totalUsers}</h3>
                        <p>Người dùng hoạt động</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>{overallStats.averagePostsPerUser}</h3>
                        <p>TB bài/người</p>
                    </div>
                </div>
            </div>

            <div className="top-users-section">
                <h3>Top 10 người dùng tích cực</h3>
                <div className="users-list">
                    {topUsers.length === 0 ? (
                        <div className="empty-state">
                            <p>Chưa có dữ liệu thống kê.</p>
                        </div>
                    ) : (
                        topUsers.map((user, index) => {
                            const getRankColor = (rank) => {
                                switch (rank) {
                                    case 0: return '#FFD700'; // Vàng cho #1
                                    case 1: return '#C0C0C0'; // Bạc cho #2
                                    case 2: return '#CD7F32'; // Đồng cho #3
                                    default: return '#6B7280'; // Xám cho các thứ hạng khác
                                }
                            };

                            const getRankBackground = (rank) => {
                                switch (rank) {
                                    case 0: return 'linear-gradient(135deg, #FFD700, #FFA500)';
                                    case 1: return 'linear-gradient(135deg, #C0C0C0, #A8A8A8)';
                                    case 2: return 'linear-gradient(135deg, #CD7F32, #B8860B)';
                                    default: return 'linear-gradient(135deg, #6B7280, #4B5563)';
                                }
                            };

                            return (
                                <div key={user.id} className="user-item">
                                    <div className="user-rank">
                                        {index < 3 ? (
                                            <span 
                                                className={`medal medal-${index + 1}`}
                                                style={{ 
                                                    background: getRankBackground(index),
                                                    color: index < 3 ? 'white' : 'var(--text-dark)'
                                                }}
                                            >
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                            </span>
                                        ) : (
                                            <span 
                                                className="rank-number"
                                                style={{ 
                                                    background: getRankBackground(index),
                                                    color: 'white'
                                                }}
                                            >
                                                {index + 1}
                                            </span>
                                        )}
                                    </div>
                                    <div className="user-avatar">
                                        <Avatar 
                                            src={user.image}
                                            name={user.name}
                                            size={50}
                                        />
                                    </div>
                                    <div className="user-info">
                                        <div className="user-details">
                                            <h4>{user.name}</h4>
                                            <div className="user-stats">
                                                <span className="stat-item">
                                                    📝 {user.postsCount} bài
                                                </span>
                                                <span className="stat-item">
                                                    ❤️ {user.likesCount} lượt thích
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="chart-section">
                <h3>Biểu đồ hoạt động</h3>
                <div className="chart-container">
                    <div className="chart-bars">
                        {topUsers.slice(0, 5).map((user, index) => {
                            const maxPosts = Math.max(...topUsers.map(u => u.postsCount));
                            const height = maxPosts > 0 ? (user.postsCount / maxPosts) * 100 : 0;
                            
                            // Màu sắc theo thứ hạng
                            const getBarColor = (rank) => {
                                switch (rank) {
                                    case 0: return 'linear-gradient(135deg, #FFD700, #FFA500)'; // Vàng
                                    case 1: return 'linear-gradient(135deg, #C0C0C0, #A8A8A8)'; // Bạc
                                    case 2: return 'linear-gradient(135deg, #CD7F32, #B8860B)'; // Đồng
                                    case 3: return 'linear-gradient(135deg, #8B5CF6, #7C3AED)'; // Tím
                                    case 4: return 'linear-gradient(135deg, #06B6D4, #0891B2)'; // Xanh dương
                                    default: return 'linear-gradient(135deg, #10B981, #059669)'; // Xanh lá
                                }
                            };

                            const getHoverColor = (rank) => {
                                switch (rank) {
                                    case 0: return 'linear-gradient(135deg, #FFA500, #FFD700)';
                                    case 1: return 'linear-gradient(135deg, #A8A8A8, #C0C0C0)';
                                    case 2: return 'linear-gradient(135deg, #B8860B, #CD7F32)';
                                    case 3: return 'linear-gradient(135deg, #7C3AED, #8B5CF6)';
                                    case 4: return 'linear-gradient(135deg, #0891B2, #06B6D4)';
                                    default: return 'linear-gradient(135deg, #059669, #10B981)';
                                }
                            };
                            
                            return (
                                <div key={user.id} className="chart-bar">
                                    <div className="bar-container">
                                        <div 
                                            className="bar-fill"
                                            style={{ 
                                                height: `${height}%`,
                                                background: getBarColor(index)
                                            }}
                                            title={`${user.name}: ${user.postsCount} bài viết`}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = getHoverColor(index);
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = getBarColor(index);
                                            }}
                                        ></div>
                                    </div>
                                    <div className="bar-label">
                                        <div className="bar-name">{user.name}</div>
                                        <div className="bar-value">{user.postsCount}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="chart-legend">
                        <p>📊 Top 5 người dùng tích cực nhất ({getFilterText()})</p>
                        <small>Số liệu: Bài viết</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stats;
