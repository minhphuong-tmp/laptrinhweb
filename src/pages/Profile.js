import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchPost } from '../services/postService';
import { useScrollToLoad } from '../hooks/useInfiniteScroll';
import './Profile.css';

const Profile = () => {
    const { user, setUserData, signOut } = useAuth();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        image: null,
        address: '',
        phoneNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [userPosts, setUserPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [postsLimit, setPostsLimit] = useState(4);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                image: user.image || null,
                address: user.address || '',
                phoneNumber: user.phoneNumber || ''
            });
        }
    }, [user]);

    // Fetch posts của user với phân trang
    const loadUserPosts = async (loadMore = false) => {
        if (!user?.id) return;

        setPostsLoading(true);
        try {
            const limit = loadMore ? postsLimit + 4 : 4;
            const result = await fetchPost(limit, user.id);

            if (result.success) {
                const newPosts = result.data;

                if (loadMore) {
                    // Nếu load more, kiểm tra xem có thêm bài không
                    if (newPosts.length === userPosts.length) {
                        setHasMore(false);
                    } else {
                        setUserPosts(newPosts);
                        setPostsLimit(limit);
                    }
                } else {
                    // Load lần đầu
                    setUserPosts(newPosts);
                    setPostsLimit(4);
                    setHasMore(newPosts.length >= 4);
                }
            } else {
                console.error('Error fetching user posts:', result.msg);
            }
        } catch (error) {
            console.error('Error fetching user posts:', error);
        } finally {
            setPostsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!postsLoading && !isLoadingMore && hasMore) {
            setIsLoadingMore(true);
            loadUserPosts(true);
        }
    };

    // Sử dụng infinite scroll
    useScrollToLoad(handleLoadMore, hasMore, postsLoading || isLoadingMore, 200);

    useEffect(() => {
        loadUserPosts();
    }, [user?.id]);

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    name: formData.name,
                    bio: formData.bio,
                    image: formData.image,
                    address: formData.address,
                    phoneNumber: formData.phoneNumber
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update local user data
            setUserData({
                name: formData.name,
                bio: formData.bio,
                image: formData.image,
                address: formData.address,
                phoneNumber: formData.phoneNumber
            });

            setEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user.name || '',
            bio: user.bio || '',
            image: user.image || '',
            address: user.address || '',
            phoneNumber: user.phoneNumber || ''
        });
        setEditing(false);
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h2>Hồ sơ cá nhân</h2>
            </div>

            <div className="profile-content">
                <div className="profile-card">
                    <div className="profile-avatar-section">
                        <div className="avatar-container">
                            <Avatar
                                src={formData.image}
                                name={formData.name}
                                size={100}
                                className="profile-avatar"
                            />
                        </div>
                        <div className="profile-info">
                            <h3>{formData.name || 'Chưa có tên'}</h3>
                            <p className="profile-email">{user?.email}</p>
                            {formData.address && (
                                <p className="profile-address">📍 {formData.address}</p>
                            )}
                            {formData.phoneNumber && (
                                <p className="profile-phone">📞 {formData.phoneNumber}</p>
                            )}
                            {formData.bio ? (
                                <p className="profile-bio">{formData.bio}</p>
                            ) : (
                                <p className="profile-bio-placeholder">Chưa có giới thiệu về bản thân</p>
                            )}
                        </div>
                    </div>

                    <div className="profile-actions">
                        {!editing ? (
                            <button
                                className="btn btn-primary"
                                onClick={() => setEditing(true)}
                            >
                                ✏️ Chỉnh sửa hồ sơ
                            </button>
                        ) : (
                            <div className="edit-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    ❌ Hủy
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={loading}
                                >
                                    {loading ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
                                </button>
                            </div>
                        )}
                    </div>

                </div>

                {/* Profile Stats */}
                <div className="profile-stats">
                    <h3>📊 Thống kê</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-icon">📝</div>
                            <div className="stat-content">
                                <div className="stat-number">{userPosts.length}</div>
                                <div className="stat-label">Bài đăng</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon">💬</div>
                            <div className="stat-content">
                                <div className="stat-number">
                                    {userPosts.reduce((total, post) => total + (post.comments?.length || 0), 0)}
                                </div>
                                <div className="stat-label">Bình luận</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon">❤️</div>
                            <div className="stat-content">
                                <div className="stat-number">
                                    {userPosts.reduce((total, post) => total + (post.likes?.length || 0), 0)}
                                </div>
                                <div className="stat-label">Lượt thích</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-icon">👤</div>
                            <div className="stat-content">
                                <div className="stat-number">1</div>
                                <div className="stat-label">Tài khoản</div>
                            </div>
                        </div>
                    </div>
                </div>

                {editing && (
                    <div className="edit-form">
                        <h3>Chỉnh sửa thông tin</h3>
                        <div className="form-group">
                            <label className="form-label">Tên hiển thị</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="form-input"
                                placeholder="Nhập tên hiển thị"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Giới thiệu bản thân</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="form-input"
                                rows="4"
                                placeholder="Giới thiệu về bản thân..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Địa chỉ</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="form-input"
                                placeholder="Nhập địa chỉ của bạn"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Số điện thoại</label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="form-input"
                                placeholder="Nhập số điện thoại"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">URL ảnh đại diện</label>
                            <input
                                type="url"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="form-input"
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>
                    </div>
                )}

                {/* User Posts Section */}
                <div className="user-posts-section">
                    <h3>📝 Bài đăng của {formData.name || 'bạn'}</h3>
                    {postsLoading ? (
                        <div className="loading-posts">
                            <div className="loading-spinner">⏳</div>
                            <p>Đang tải bài đăng...</p>
                        </div>
                    ) : userPosts.length > 0 ? (
                        <div className="posts-grid">
                            {userPosts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    item={post}
                                    currentUser={user}
                                />
                            ))}
                            {/* Loading indicator cho infinite scroll */}
                            {(postsLoading || isLoadingMore) && (
                                <div className="infinite-loading">
                                    <div className="loading-spinner">⏳</div>
                                    <p>Đang tải thêm bài đăng...</p>
                                </div>
                            )}
                            {/* End of posts indicator */}
                            {!hasMore && userPosts.length > 0 && (
                                <div className="end-of-posts">
                                    <p>🎉 Đã xem hết tất cả bài đăng!</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="no-posts">
                            <div className="no-posts-icon">📝</div>
                            <p>Chưa có bài đăng nào.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;