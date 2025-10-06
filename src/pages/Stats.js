import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import { supabase } from '../lib/supabase';
import './Stats.css';

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
            
            // Load top users based on posts count
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select(`
                    id,
                    name,
                    image,
                    posts:posts(count),
                    post_likes:posts!inner(post_likes(count))
                `)
                .order('posts.count', { ascending: false })
                .limit(10);

            if (usersError) throw usersError;

            // Process users data
            const processedUsers = usersData?.map(user => ({
                id: user.id,
                name: user.name,
                image: user.image,
                postsCount: user.posts?.[0]?.count || 0,
                likesCount: user.post_likes?.[0]?.count || 0
            })) || [];

            setTopUsers(processedUsers);

            // Load overall stats
            const { count: totalPosts } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true });

            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            setOverallStats({
                totalPosts: totalPosts || 0,
                totalUsers: totalUsers || 0,
                averagePostsPerUser: totalUsers > 0 ? Math.round((totalPosts || 0) / totalUsers) : 0
            });

        } catch (error) {
            console.error('Error loading stats:', error);
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
                        topUsers.map((user, index) => (
                            <div key={user.id} className="user-item">
                                <div className="user-rank">
                                    {index < 3 ? (
                                        <span className={`medal medal-${index + 1}`}>
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                        </span>
                                    ) : (
                                        <span className="rank-number">{index + 1}</span>
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
                        ))
                    )}
                </div>
            </div>

            <div className="chart-section">
                <h3>Biểu đồ hoạt động</h3>
                <div className="chart-container">
                    <div className="chart-placeholder">
                        <p>📊 Biểu đồ sẽ được hiển thị ở đây</p>
                        <small>Dữ liệu: {getFilterText()}</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stats;
