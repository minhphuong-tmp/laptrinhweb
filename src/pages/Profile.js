import { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { getUserImageSrc } from '../services/imageService';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
// import RightSidebar from '../components/RightSidebar'; // Removed to match Home layout
import './Profile.css';
import './FacebookLayout.css';

const Profile = () => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const { user, setUserData, signOut } = useAuth();
    const [editing, setEditing] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [isOtherUser, setIsOtherUser] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    
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
    const [postsLimit, setPostsLimit] = useState(8);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    
    // Refs để tránh stale closure
    const profileUserRef = useRef(null);
    const targetUserIdRef = useRef(null);
    const isLoadingRef = useRef(false);
    const isProcessingRef = useRef(false);
    const lastLoadTimeRef = useRef(0);
    const initialLoadRef = useRef(false);
    const loadMoreRef = useRef(null);
    
    // Cache for user data to avoid repeated API calls
    const userDataCache = useRef(new Map());

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
        if (profileUser) {
            setFormData({
                name: profileUser.name || '',
                bio: profileUser.bio || '',
                image: profileUser.image || null,
                address: profileUser.address || '',
                phoneNumber: profileUser.phoneNumber || ''
            });
            // Reset editing state when profile changes
            setEditing(false);
        }
    }, [profileUser]);

    // Scroll to top when component mounts or profile changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [userId, profileUser?.id]);

    // Clear any CSS conflicts when switching profiles (simplified)
    useEffect(() => {
        // Only add class if needed to avoid unnecessary DOM manipulation
        const profileContainer = document.querySelector('.facebook-layout');
        if (profileContainer) {
            profileContainer.classList.remove('profile-other-user', 'profile-current-user');
            if (isOtherUser) {
                profileContainer.classList.add('profile-other-user');
            } else {
                profileContainer.classList.add('profile-current-user');
            }
        }
    }, [isOtherUser]);

    // Check if viewing other user's profile
    useEffect(() => {
        console.log('🔍 URL parameter check:', { userId, currentUserId: user?.id, isOtherUser: userId !== user?.id });
        
        if (userId && userId !== user?.id) {
            console.log('🔄 Switching to other user profile:', userId);
            setIsOtherUser(true);
            // Cập nhật refs ngay lập tức
            targetUserIdRef.current = userId;
            // Đợi fetchUserProfile hoàn thành trước khi tiếp tục
            fetchUserProfile(userId).then(() => {
                console.log('✅ fetchUserProfile completed, profileUser should be updated');
            });
        } else {
            console.log('🔄 Using current user profile');
            setIsOtherUser(false);
            setProfileUser(user);
            // Cập nhật refs cho current user
            if (user) {
                profileUserRef.current = user;
                targetUserIdRef.current = user.id;
            }
        }
    }, [userId, user]);

    // Set profileUser when user changes
    useEffect(() => {
        if (!isOtherUser && user) {
            setProfileUser(user);
        }
    }, [user, isOtherUser]);

    // Reset posts when profileUser changes
    const prevProfileUserIdRef = useRef(null);
    useEffect(() => {
        if (profileUser && profileUser.id !== prevProfileUserIdRef.current) {
            console.log('🔄 ProfileUser changed, resetting posts for:', profileUser.name, 'from:', prevProfileUserIdRef.current, 'to:', profileUser.id);
            // Force clear posts immediately
            setUserPosts([]);
            setHasLoaded(false);
            initialLoadRef.current = false;
            lastLoadTimeRef.current = 0;
            // Block any ongoing loads
            isLoadingRef.current = false;
            isProcessingRef.current = false;
            prevProfileUserIdRef.current = profileUser.id;
            // Also clear refs to prevent stale data
            profileUserRef.current = profileUser;
            targetUserIdRef.current = profileUser.id;
        }
    }, [profileUser]);

    // Reset all state when userId changes (optimized)
    const prevUserIdRef = useRef(null);
    useEffect(() => {
        if (userId && userId !== prevUserIdRef.current) {
            console.log('🔄 UserId changed, resetting all state from:', prevUserIdRef.current, 'to:', userId);
            // Only reset essential states to avoid performance issues
            setUserPosts([]);
            setHasLoaded(false);
            setEditing(false);
            setPostsLoading(false);
            setIsLoadingMore(false);
            setHasMore(true);
            initialLoadRef.current = false;
            lastLoadTimeRef.current = 0;
            isLoadingRef.current = false;
            isProcessingRef.current = false;
            prevUserIdRef.current = userId;
        }
    }, [userId]);

    // Fetch other user's profile
    const fetchUserProfile = async (userId) => {
        console.log('🔍 fetchUserProfile called with userId:', userId);
        setProfileLoading(true);
        // Cập nhật refs ngay lập tức để tránh stale closure
        targetUserIdRef.current = userId;
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                return;
            }

            console.log('✅ User profile fetched:', data);
            setProfileUser(data);
            profileUserRef.current = data;
            targetUserIdRef.current = data.id;
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setProfileLoading(false);
        }
    };

    // Load user data for all posts at once
    const loadUserDataForPosts = async (posts) => {
        const uniqueUserIds = [...new Set(posts.map(post => post.userId))];
        const userDataMap = new Map();
        
        // Load user data for all unique user IDs
        for (const userId of uniqueUserIds) {
            if (userDataCache.current.has(userId)) {
                userDataMap.set(userId, userDataCache.current.get(userId));
            } else {
                try {
                    const userUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/users?id=eq.${userId}`;
                    const userResponse = await fetch(userUrl, {
                        method: 'GET',
                        headers: {
                            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY',
                            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        if (userData && userData.length > 0) {
                            const user = {
                                id: userData[0].id,
                                name: userData[0].name || 'Unknown User',
                                image: userData[0].image || null
                            };
                            userDataMap.set(userId, user);
                            userDataCache.current.set(userId, user);
                        }
                    }
                } catch (error) {
                    console.error('❌ Error loading user data:', error);
                }
            }
        }
        
        return userDataMap;
    };

    // Fetch posts của user với REST API
    const loadUserPosts = async (loadMore = false, targetUser = null) => {
        // Sử dụng targetUser nếu có, nếu không thì dùng profileUserRef
        const currentUser = targetUser || profileUserRef.current;
        // Cập nhật targetUserIdRef nếu targetUser có giá trị
        if (targetUser?.id) {
            targetUserIdRef.current = targetUser.id;
        }
        const targetUserId = targetUserIdRef.current;
        console.log('🔄 loadUserPosts called for user:', currentUser?.name, 'loadMore:', loadMore);
        
        // Validation: currentUser phải có giá trị
        if (!currentUser || !currentUser.id) {
            console.log('❌ No currentUser provided, skipping loadUserPosts');
            return;
        }
        
        // Simplified check to prevent race condition
        if (profileUserRef.current && profileUserRef.current.id !== targetUserId) {
            console.log('❌ ProfileUser changed, skipping loadUserPosts');
            return;
        }
        const now = Date.now();
        
        // Ngăn chặn multiple calls trong vòng 0.3 giây (faster)
        if (now - lastLoadTimeRef.current < 300) {
            console.log('🚫 Load blocked - too soon:', now - lastLoadTimeRef.current, 'ms ago');
            return;
        }
        
        if (!currentUser?.id || isLoadingRef.current) return;

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
            console.log('🔍 Loading posts for currentUser:', currentUser);
            console.log('🔍 Loading posts for currentUser.id:', currentUser?.id);
            console.log('🔍 currentUser.id type:', typeof currentUser?.id);
            console.log('🔍 currentUser.id value:', currentUser?.id);
            const postsUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/posts?userId=eq.${currentUser.id}&order=created_at.desc&limit=${pageSize}&offset=${offset}`;
            console.log('🔍 Posts URL:', postsUrl);
            console.log('🔍 URL userId part:', `userId=eq.${currentUser.id}`);
            console.log('🌐 Making request to:', postsUrl);
            const postsResponse = await fetch(postsUrl, {
                method: 'GET',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('🌐 Response status:', postsResponse.status);
            console.log('🌐 Response ok:', postsResponse.ok);

            if (postsResponse.ok) {
                const postsData = await postsResponse.json();
                console.log('✅ Raw posts loaded:', postsData.length, 'offset:', offset);
                
                // Filter chỉ posts của targetUserId (sử dụng ref để tránh stale closure)
                console.log('📊 Raw posts userIds:', postsData.map(p => ({ id: p.id, userId: p.userId })));
                console.log('📊 Raw posts full data:', postsData);
                console.log('🔍 Expected userId:', targetUserId);
                console.log('🔍 targetUserId type in filter:', typeof targetUserId);
                console.log('🔍 targetUserId value in filter:', targetUserId);
                console.log('🔍 targetUserId === fa17da7f-84f1-49c1-a8c3-e2bd31a29e07:', targetUserId === 'fa17da7f-84f1-49c1-a8c3-e2bd31a29e07');
                console.log('🔍 targetUserId === dfcb0f62-e29a-4613-bb77-9b78682027fe:', targetUserId === 'dfcb0f62-e29a-4613-bb77-9b78682027fe');
                console.log('🔍 Actual userIds in posts:', [...new Set(postsData.map(p => p.userId))]);
                const filteredPosts = postsData.filter(post => {
                    const isMatch = post.userId === targetUserId;
                    console.log(`🔍 Post ${post.id}: userId=${post.userId}, targetUserId=${targetUserId}, match=${isMatch}`);
                    return isMatch;
                });
                console.log('✅ Filtered posts for user:', filteredPosts.length);

                // Load user data for all posts at once
                const userDataMap = await loadUserDataForPosts(filteredPosts);

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
                const formattedPosts = await Promise.all(filteredPosts.map(async (post) => {
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

                    // Use cached user data
                    const postUser = userDataMap.get(post.userId) || {
                        id: profileUserRef.current?.id || user.id,
                        name: profileUserRef.current?.name || user.name,
                        image: profileUserRef.current?.image || user.image
                    };

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

                    // Check if this is a stale request before updating state
                    if (profileUserRef.current && profileUserRef.current.id !== targetUserId) {
                        console.log('❌ Stale state update blocked - profileUser changed during processing');
                        console.log('❌ Current profileUserRef:', profileUserRef.current?.id, 'Target:', targetUserId);
                        return;
                    }
                    
                    if (loadMore) {
                        // Append posts to existing list
                        console.log('📝 Appending posts, current count:', userPosts.length, 'new posts:', formattedPosts.length);
                        setUserPosts(prev => [...prev, ...formattedPosts]);
            } else {
                        // Replace posts for initial load
                        console.log('📝 Replacing posts, new count:', formattedPosts.length);
                        setUserPosts(formattedPosts);
                    }
                    
                    // Debug: Log final posts state
                    console.log('📊 Final posts state after update:', formattedPosts.length, 'posts for user:', currentUser.name);

                    // hasMore: còn nữa khi trả về đủ pageSize
                    setHasMore(filteredPosts.length === pageSize);
                    
                    // Debug: Log posts count for each user
                    console.log('📊 Posts loaded for user:', currentUser.name, 'ID:', currentUser.id, 'Count:', filteredPosts.length);
                    if (filteredPosts.length === 0) {
                        console.log('⚠️ No posts found for user:', currentUser.name, 'ID:', currentUser.id);
                    }
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
            // Check if profileUser is changing before loadMore
            if (profileUserRef.current && profileUserRef.current.id !== targetUserIdRef.current) {
                console.log('❌ LoadMore blocked - profileUser changed:', profileUserRef.current?.id, 'vs', targetUserIdRef.current);
                return;
            }
            
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
                handleLoadMore();
            }
        };
        // chạy sau render
        const id = requestAnimationFrame(ensureFilledViewport);
        return () => cancelAnimationFrame(id);
    }, [userPosts.length]);

    useEffect(() => {
        if (profileUser?.id && !initialLoadRef.current) {
            console.log('🚀 Triggering loadUserPosts for:', profileUser.name, 'ID:', profileUser.id);
            initialLoadRef.current = true;
            setHasLoaded(true);
            // Cập nhật refs trước khi gọi loadUserPosts
            profileUserRef.current = profileUser;
            targetUserIdRef.current = profileUser.id;
            // Gọi loadUserPosts với profileUser từ ref
            loadUserPosts(false, profileUser);
        }
    }, [profileUser?.id, profileUser]); // Depend vào cả profileUser?.id và profileUser

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

    if (profileLoading) {
        return (
            <div key={`profile-loading-${userId || 'current'}`} className="facebook-layout">
                <Sidebar />
                <TopBar />
                <div className="main-content">
                    <div className="content-wrapper">
                        <div className="profile-header">
                            <div className="profile-header-top">
                                <h2>Đang tải...</h2>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <div className="loading-spinner">⏳</div>
                            <p>Đang tải thông tin người dùng...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div key={`profile-error-${userId || 'current'}`} className="facebook-layout">
                <Sidebar />
                <TopBar />
                <div className="main-content">
                    <div className="content-wrapper">
                        <div className="profile-header">
                            <div className="profile-header-top">
                                <h2>Không tìm thấy người dùng</h2>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <p>Không thể tải thông tin người dùng này.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="facebook-layout">
            <Sidebar />
            <TopBar />
            <div className="main-content">
                <div className="content-wrapper">
                    {/* Profile Header */}
            <div className="profile-header">
                        <div className="profile-header-top">
                            <h2>{isOtherUser ? `Hồ sơ ${profileUser?.name || 'người dùng'}` : 'Hồ sơ cá nhân'}</h2>
                        </div>
            </div>

                    {/* Profile Content */}
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
                                    <p className="profile-email">{profileUser?.email}</p>
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
                                {!isOtherUser && !editing ? (
                            <button
                                className="btn btn-primary"
                                onClick={() => setEditing(true)}
                            >
                                ✏️ Chỉnh sửa hồ sơ
                            </button>
                                ) : !isOtherUser && editing ? (
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
                                ) : null}
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
                                    {console.log('🎨 Rendering posts:', userPosts.length, 'posts for user:', profileUser?.name)}
                                    {console.log('🎨 Posts data:', userPosts.map(p => ({ id: p.id, userId: p.userId, userName: p.user?.name, content: p.content?.substring(0, 50) })))}
                                    {console.log('🎨 ProfileUser ID:', profileUser?.id)}
                                    {console.log('🎨 Posts userIds:', userPosts.map(p => p.userId))}
                                    {console.log('🎨 Filter check:', userPosts.filter(p => p.userId === profileUser?.id).length, 'posts match profileUser')}
                                    {console.log('🎨 userPosts state:', userPosts)}
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
            </div>
        </div>
    );
}

export default Profile;