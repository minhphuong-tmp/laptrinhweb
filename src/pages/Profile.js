import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './Profile.css';

const Profile = () => {
    const { user, setUserData } = useAuth();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        image: null
    });
    const [loading, setLoading] = useState(false);
    const [userPosts, setUserPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);

    useEffect(() => {
        console.log('Profile useEffect - user:', user);
        if (user) {
            console.log('Setting formData with user:', {
                name: user.name,
                bio: user.bio,
                image: user.image,
                email: user.email
            });
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                image: user.image || null
            });
        } else {
            console.log('No user available yet');
        }
    }, [user]);

    // Fetch posts của user
    const fetchUserPosts = async () => {
        if (!user?.id) return;
        
        setPostsLoading(true);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    users:userId (
                        id,
                        name,
                        image
                    ),
                    comments (
                        id,
                        content,
                        userId,
                        created_at
                    ),
                    likes (
                        id,
                        userId
                    )
                `)
                .eq('userId', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUserPosts(data || []);
        } catch (error) {
            console.error('Error fetching user posts:', error);
        } finally {
            setPostsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserPosts();
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
                    image: formData.image
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update local user data
            setUserData({
                name: formData.name,
                bio: formData.bio,
                image: formData.image
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
            image: user.image || ''
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
                                size={80}
                                className="profile-avatar"
                            />
                        </div>
                        <div className="profile-info">
                            <h3>{formData.name || 'Chưa có tên'}</h3>
                            <p className="profile-email">{user?.email}</p>
                            {/* Debug info */}
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                Debug: user.email = "{user?.email}", user = {JSON.stringify(user, null, 2)}
                            </div>
                            {formData.bio && (
                                <p className="profile-bio">{formData.bio}</p>
                            )}
                        </div>
                    </div>

                    <div className="profile-actions">
                        {!editing ? (
                            <button 
                                className="btn btn-primary"
                                onClick={() => setEditing(true)}
                            >
                                Chỉnh sửa hồ sơ
                            </button>
                        ) : (
                            <div className="edit-actions">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    Hủy
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={loading}
                                >
                                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        )}
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
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="form-input"
                                placeholder="Nhập tên hiển thị"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Giới thiệu bản thân</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                className="form-input"
                                rows="4"
                                placeholder="Giới thiệu về bản thân..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">URL ảnh đại diện</label>
                            <input
                                type="url"
                                value={formData.image}
                                onChange={(e) => setFormData({...formData, image: e.target.value})}
                                className="form-input"
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>
                    </div>
                )}

                {/* User Posts Section */}
                <div className="user-posts-section">
                    <h3>Bài đăng của {formData.name || 'bạn'}</h3>
                    {postsLoading ? (
                        <div className="loading-posts">
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
                        </div>
                    ) : (
                        <div className="no-posts">
                            <p>Chưa có bài đăng nào.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;