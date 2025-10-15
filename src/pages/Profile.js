import { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { getUserImageSrc } from '../services/imageService';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
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
    const [hasLoaded, setHasLoaded] = useState(false);
    const isLoadingRef = useRef(false);
    const isProcessingRef = useRef(false);
    const lastLoadTimeRef = useRef(0);
    const initialLoadRef = useRef(false);
    const loadMoreRef = useRef(null);

    // Refs để tránh stale state trong IntersectionObserver
    const hasMoreRef = useRef(hasMore);
    const isLoadingMoreRef = useRef(isLoadingMore);
    const postsLoadingRef = useRef(postsLoading);

    // Refs giữ khoảng cách với đáy trang khi load thêm
    const preserveFromBottomRef = useRef(null); // số px cách đáy trước khi append

    useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
    useEffect(() => { isLoadingMoreRef.current = isLoadingMore; }, [isLoadingMore]);
    useEffect(() => { postsLoadingRef.current = postsLoading; }, [postsLoading]);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                image: user.image || null,
                address: user.address || '',
                phoneNumber: user.phoneNumber || ''
            });
            // Reset hasLoaded và initialLoadRef khi user thay đổi
            setHasLoaded(false);
            initialLoadRef.current = false;
        }
    }, [user]);

    // Fetch posts của user với REST API
    const loadUserPosts = async (loadMore = false) => {
        const now = Date.now();
        
        // Ngăn chặn multiple calls trong vòng 0.8 giây
        if (now - lastLoadTimeRef.current < 800) {
            console.log('🚫 Load blocked - too soon:', now - lastLoadTimeRef.current, 'ms ago');
            return;
        }
        
        if (!user?.id || isLoadingRef.current) return;

        lastLoadTimeRef.current = now;
        isLoadingRef.current = true;
        // Chỉ hiển thị loading overlay cho lần tải đầu, không cho loadMore
        setPostsLoading(!loadMore);
        try {
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

            // Tính offset theo số bài hiện có
            const pageSize = postsLimit; // giữ cố định 4
            const offset = loadMore ? userPosts.length : 0;

            // Load posts của user từ REST API (limit + offset)
            const postsUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/posts?userId=eq.${user.id}&order=created_at.desc&limit=${pageSize}&offset=${offset}`;
            const postsResponse = await fetch(postsUrl, {
                method: 'GET',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (postsResponse.ok) {
                const postsData = await postsResponse.json();
                console.log('✅ User posts loaded:', postsData.length, 'offset:', offset);

                // Load likes và comments
                const likesUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/postLikes';
                const likesResponse = await fetch(likesUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': apiKey,
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                const commentsUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments';
                const commentsResponse = await fetch(commentsUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': apiKey,
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                let likesData = [];
                let commentsData = [];

                if (likesResponse.ok) {
                    likesData = await likesResponse.json();
                }
                if (commentsResponse.ok) {
                    commentsData = await commentsResponse.json();
                }

                // Format posts với user data từ database
                const formattedPosts = await Promise.all(postsData.map(async (post) => {
                    const postLikes = likesData.filter(like => like.postId === post.id);
                    const postComments = commentsData.filter(comment => comment.postId === post.id);

                    // Xử lý HTML tags trong body
                    const cleanBody = post.body ? post.body.replace(/<[^>]*>/g, '') : '';
                    const title = cleanBody ? cleanBody.substring(0, 50) + (cleanBody.length > 50 ? '...' : '') : 'Không có tiêu đề';

                    // Xử lý ảnh từ trường file
                    let imageUrl = null;
                    if (post.file) {
                        if (post.file.startsWith('http')) {
                            imageUrl = post.file;
                        } else {
                            imageUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/storage/v1/object/public/upload/${post.file}`;
                        }
                    }

                    // Load user data từ database cho từng post
                    let postUser = {
                        id: user.id,
                        name: user.name,
                        image: user.image
                    };

                    try {
                        console.log('🔍 Loading user data for post userId:', post.userId);
                        const userUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/users?id=eq.${post.userId}`;
                        const userResponse = await fetch(userUrl, {
                            method: 'GET',
                            headers: {
                                'apikey': apiKey,
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (userResponse.ok) {
                            const userData = await userResponse.json();
                            console.log('📊 User data for post:', userData);
                            if (userData && userData.length > 0) {
                                postUser = {
                                    id: userData[0].id,
                                    name: userData[0].name || 'Unknown User',
                                    image: userData[0].image || null
                                };
                                console.log('✅ Post user updated:', postUser);
                            }
                        } else {
                            console.error('❌ Failed to load user data:', userResponse.status);
                        }
                    } catch (error) {
                        console.error('❌ Error loading user data for post:', error);
                        // Fallback to current user data
                    }

                    return {
                        ...post,
                        title: title,
                        content: cleanBody || 'Không có nội dung',
                        image: imageUrl,
                        user: postUser,
                        postLikes: postLikes,
                        comments: postComments,
                        likes_count: postLikes.length,
                        comments_count: postComments.length
                    };
                }));

                if (loadMore) {
                    // Append posts to existing list
                    setUserPosts(prev => [...prev, ...formattedPosts]);
                } else {
                    // Replace posts for initial load
                    setUserPosts(formattedPosts);
                }

                // hasMore: còn nữa khi trả về đủ pageSize
                setHasMore(postsData.length === pageSize);
            }
        } catch (error) {
            console.error('Error loading user posts:', error);
        } finally {
            // Kết thúc trạng thái loading
            setPostsLoading(false);
            setIsLoadingMore(false);
            isLoadingRef.current = false;
            isProcessingRef.current = false;
        }
    };

    const handleLoadMore = () => {
        if (!postsLoading && !isLoadingMore && hasMore && !isProcessingRef.current) {
            // Lưu khoảng cách so với đáy trước khi load để tránh nhảy
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollY = window.pageYOffset;
            preserveFromBottomRef.current = scrollHeight - scrollY;
            console.log('📌 Preserve distance from bottom:', preserveFromBottomRef.current);

            console.log('🔄 Loading more posts via IntersectionObserver...');
            isProcessingRef.current = true;
            setIsLoadingMore(true);
            loadUserPosts(true);
        }
    };





    // IntersectionObserver để tự động load more khi scroll đến cuối
    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    const canLoad = hasMoreRef.current && !isLoadingMoreRef.current && !postsLoadingRef.current && !isProcessingRef.current;
                    if (canLoad) {
                        console.log('🔍 IntersectionObserver triggered - loading more posts');
                        handleLoadMore();
                    }
                }
            },
            { 
                threshold: 0.1,
                rootMargin: '400px' // Prefetch sớm hơn
            }
        );

        observer.observe(el);
        console.log('👁️ IntersectionObserver attached to loadMoreRef');

        return () => {
            observer.unobserve(el);
            observer.disconnect();
            console.log('👁️ IntersectionObserver disconnected');
        };
    }, [hasMore, userPosts.length]);

    // Nếu nội dung chưa đủ cao để có thể scroll, tự động load thêm cho đủ màn hình
    useEffect(() => {
        const ensureFilledViewport = () => {
            const pageHeight = document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const canLoad = hasMoreRef.current && !isLoadingMoreRef.current && !postsLoadingRef.current && !isProcessingRef.current;
            if (pageHeight <= viewportHeight + 40 && canLoad) {
                console.log('⬇️ Content below viewport height, auto-loading more');
                handleLoadMore();
            }
        };
        // chạy sau render
        const id = requestAnimationFrame(ensureFilledViewport);
        return () => cancelAnimationFrame(id);
    }, [userPosts.length]);

    useEffect(() => {
        if (user?.id && !initialLoadRef.current) {
            console.log('🔄 Initial load triggered for user:', user.id);
            initialLoadRef.current = true;
            setHasLoaded(true);
            loadUserPosts();
        }
    }, [user?.id]); // Chỉ depend vào user?.id

    // Sau khi số lượng posts thay đổi và loadMore kết thúc, khôi phục vị trí theo khoảng cách với đáy
    useLayoutEffect(() => {
        if (!isLoadingMoreRef.current && preserveFromBottomRef.current != null) {
            const newScrollHeight = document.documentElement.scrollHeight;
            const newScrollTop = newScrollHeight - preserveFromBottomRef.current;
            window.scrollTo({ top: newScrollTop, behavior: 'instant' });
            console.log('🎯 Restored position keeping bottom distance. New top:', newScrollTop);
            preserveFromBottomRef.current = null;
        }
    }, [userPosts.length, isLoadingMore]);

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        setLoading(true);
        try {
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

            const updateUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/users?id=eq.${user.id}`;
            const response = await fetch(updateUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    name: formData.name,
                    bio: formData.bio,
                    image: formData.image,
                    address: formData.address,
                    phoneNumber: formData.phoneNumber
                })
            });

            if (response.ok) {
                console.log('✅ Profile updated successfully');
            // Update local user data
            setUserData({
                    ...user,
                name: formData.name,
                bio: formData.bio,
                image: formData.image,
                address: formData.address,
                phoneNumber: formData.phoneNumber
            });
            setEditing(false);
            } else {
                console.error('❌ Error updating profile:', response.status);
            }
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
                <div className="profile-header-top">
                    <button 
                        className="btn btn-secondary back-button"
                        onClick={() => navigate('/')}
                    >
                        ← Quay lại
                    </button>
                    <h2>Hồ sơ cá nhân</h2>
                </div>
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
                            {userPosts.map((post, index) => (
                                <div key={`post-${post.id}-${index}`} className="post-card">
                                    <div className="post-header">
                                        <div className="post-author">
                                            <Avatar
                                                src={post.user?.image}
                                                name={post.user?.name}
                                                size={40}
                                            />
                                            <div className="author-info">
                                                <h4 className="author-name">
                                                    {post.user?.name || 'Người dùng'}
                                                </h4>
                                                <span className="post-time">
                                                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="post-content">
                                        <p className="post-text">{post.content}</p>
                                        {post.image && (
                                            <div className="post-image">
                                                <img
                                                    src={post.image}
                                                    alt={post.title}
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="post-actions">
                                        <button className="action-button like-button">
                                            ❤️ {post.likes_count || 0}
                                        </button>
                                        <button className="action-button comment-button">
                                            💬 {post.comments_count || 0}
                                        </button>
                                        <button className="action-button share-button">
                                            📤 Chia sẻ
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Loading indicator cho infinite scroll - chỉ hiển thị khi không có trigger */}
                            {isLoadingMore && !hasMore && (
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
                            
                            {/* IntersectionObserver Trigger */}
                            {hasMore && (
                                <div 
                                    ref={loadMoreRef} 
                                    className="load-more-trigger"
                                    style={{
                                        height: '20px',
                                        width: '100%',
                                        margin: '20px 0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {isLoadingMore && (
                                        <div className="loading-indicator">
                                            <div className="loading-spinner">⏳</div>
                                            <p>Đang tải thêm bài đăng...</p>
                                        </div>
                                    )}
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