import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { fetchAllPosts } from '../services/postsService';
import { getUserImageSrc } from '../services/imageService';
import './Home.css';
import './FacebookLayout.css';

const Home = () => {
    const { user, signOut, debugSession } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liking, setLiking] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [showComments, setShowComments] = useState({});
    const [comments, setComments] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [submittingComment, setSubmittingComment] = useState({});
    const postsPerPage = 15;


    useEffect(() => {

        // Tránh multiple loads
        if (isLoadingPosts) {
            return;
        }

        const loadPosts = async () => {
            setIsLoadingPosts(true);
            try {
                // Load posts từ REST API với phân trang
                try {
                    const offset = (currentPage - 1) * postsPerPage;
                    const postsUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/posts?limit=${postsPerPage}&offset=${offset}&order=created_at.desc`;
                    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

                    const response = await fetch(postsUrl, {
                        method: 'GET',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const postsData = await response.json();

                        // Lấy tổng số posts để tính totalPages
                        const countUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/posts?select=count';
                        const countResponse = await fetch(countUrl, {
                            method: 'HEAD',
                            headers: {
                                'apikey': apiKey,
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        let totalCount = 0;
                        if (countResponse.ok) {
                            const countHeader = countResponse.headers.get('content-range');
                            if (countHeader) {
                                const match = countHeader.match(/\/(\d+)/);
                                if (match) {
                                    totalCount = parseInt(match[1]);
                                }
                            }
                        }

                        const calculatedTotalPages = Math.ceil(totalCount / postsPerPage);
                        setTotalPages(calculatedTotalPages);

                        // Load users để map với posts
                        const usersUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/users';
                        const usersResponse = await fetch(usersUrl, {
                            method: 'GET',
                            headers: {
                                'apikey': apiKey,
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        let usersData = [];
                        if (usersResponse.ok) {
                            usersData = await usersResponse.json();
                        }

                        // Load likes cho tất cả posts
                        const likesUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/postLikes';
                        const likesResponse = await fetch(likesUrl, {
                            method: 'GET',
                            headers: {
                                'apikey': apiKey,
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        let likesData = [];
                        if (likesResponse.ok) {
                            likesData = await likesResponse.json();
                        }

                        // Load comments count cho tất cả posts
                        const commentsUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments';
                        const commentsResponse = await fetch(commentsUrl, {
                            method: 'GET',
                            headers: {
                                'apikey': apiKey,
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        let commentsData = [];
                        if (commentsResponse.ok) {
                            commentsData = await commentsResponse.json();
                        }

                        // Chuyển đổi dữ liệu posts thành format phù hợp
                        const formattedPosts = await Promise.all(postsData.map(async (post) => {
                            const postUser = usersData.find(u => u.id === post.userId);
                            const postLikes = likesData.filter(like => like.postId === post.id);
                            const postComments = commentsData.filter(comment => comment.postId === post.id);
                            const isLiked = user ? postLikes.some(like => like.userId === user.id) : false;

                            // Xử lý HTML tags trong body
                            const cleanBody = post.body ? post.body.replace(/<[^>]*>/g, '') : '';
                            const title = cleanBody ? cleanBody.substring(0, 50) + (cleanBody.length > 50 ? '...' : '') : 'Không có tiêu đề';

                            // Xử lý ảnh từ trường file
                            let imageUrl = null;
                            if (post.file) {
                                // Nếu file đã là URL đầy đủ, sử dụng trực tiếp
                                if (post.file.startsWith('http')) {
                                    imageUrl = post.file;
                                } else {
                                    // Nếu chỉ là tên file, tạo URL public
                                    imageUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/storage/v1/object/public/upload/${post.file}`;
                                }
                            } else {
                            }

                            return {
                                ...post,
                                title: title,
                                content: cleanBody || 'Không có nội dung',
                                image: imageUrl,
                                user: {
                                    id: post.userId || 'unknown',
                                    name: postUser?.name || 'Unknown User',
                                    image: postUser?.image || null
                                },
                                postLikes: postLikes,
                                comments: [{ count: postComments.length }],
                                is_liked: isLiked,
                                likes_count: postLikes.length,
                                comments_count: postComments.length
                            };
                        }));

                        // Append posts thay vì replace
                        if (currentPage === 1) {
                            setPosts(formattedPosts);
                        } else {
                            setPosts(prevPosts => [...prevPosts, ...formattedPosts]);
                        }

                        // Kiểm tra còn posts không
                        setHasMorePosts(formattedPosts.length === postsPerPage);
                    } else {
                        console.error('❌ Failed to load posts:', response.status, response.statusText);
                    }
                } catch (error) {
                    console.error('❌ Error loading posts:', error);
                }

            } catch (error) {
                console.error('❌ Error loading posts:', error);
                setPosts([]);
            } finally {
                setLoading(false);
                setIsLoadingPosts(false);
            }
        };

        loadPosts();
    }, [currentPage, isLoadingPosts]); // Load lại khi currentPage thay đổi

    // Scroll listener cho infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
                loadMorePosts();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLoadingPosts, hasMorePosts]);

    const loadMorePosts = () => {
        if (!isLoadingPosts && hasMorePosts) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo(0, 0); // Scroll to top when changing page
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    const handleSignOut = async () => {
        const result = await signOut();
        if (result.success) {
            // Navigate to login page after successful logout
            navigate('/login', { replace: true });
        }
    };

    const handleLike = async (postId) => {
        if (liking) return;

        setLiking(postId);
        try {
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

            // Kiểm tra xem user đã like post này chưa
            const checkLikeUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/postLikes?postId=eq.${postId}&userId=eq.${user.id}`;
            const checkResponse = await fetch(checkLikeUrl, {
                method: 'GET',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (checkResponse.ok) {
                const existingLikes = await checkResponse.json();

                if (existingLikes.length > 0) {
                    // Unlike - xóa like
                    const deleteUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/postLikes?id=eq.${existingLikes[0].id}`;
                    const deleteResponse = await fetch(deleteUrl, {
                        method: 'DELETE',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (deleteResponse.ok) {
                        // Real-time update UI
                        setPosts(prevPosts =>
                            prevPosts.map(post => {
                                if (post.id === postId) {
                                    return {
                                        ...post,
                                        postLikes: post.postLikes.filter(like => like.userId !== user.id),
                                        likes_count: post.likes_count - 1,
                                        is_liked: false
                                    };
                                }
                                return post;
                            })
                        );
                    }
                } else {
                    // Like - thêm like mới
                    const addLikeUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/postLikes';
                    const addResponse = await fetch(addLikeUrl, {
                        method: 'POST',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            postId: postId,
                            userId: user.id
                        })
                    });

                    if (addResponse.ok) {
                        // Real-time update UI
                        setPosts(prevPosts =>
                            prevPosts.map(post => {
                                if (post.id === postId) {
                                    return {
                                        ...post,
                                        postLikes: [...post.postLikes, { userId: user.id, postId: postId }],
                                        likes_count: post.likes_count + 1,
                                        is_liked: true
                                    };
                                }
                                return post;
                            })
                        );
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error toggling like:', error);
        } finally {
            setLiking(null);
        }
    };

    const handleShowComments = async (postId) => {
        if (showComments[postId]) {
            // Đóng comments
            setShowComments(prev => ({ ...prev, [postId]: false }));
            return;
        }

        // Mở comments và load nếu chưa có
        setShowComments(prev => ({ ...prev, [postId]: true }));

        if (!comments[postId]) {
            setLoadingComments(prev => ({ ...prev, [postId]: true }));
            try {
                const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

                // Load comments với user info
                const commentsUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments?postId=eq.${postId}&order=created_at.asc`;
                const commentsResponse = await fetch(commentsUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': apiKey,
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (commentsResponse.ok) {
                    const commentsData = await commentsResponse.json();

                    // Load users để map với comments
                    const usersUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/users';
                    const usersResponse = await fetch(usersUrl, {
                        method: 'GET',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    let usersData = [];
                    if (usersResponse.ok) {
                        usersData = await usersResponse.json();
                    }

                    // Format comments với user info
                    const formattedComments = commentsData.map(comment => {
                        const user = usersData.find(u => u.id === comment.userId);
                        return {
                            ...comment,
                            content: comment.content || comment.body || comment.text || 'Không có nội dung',
                            user: {
                                id: comment.userId,
                                name: user?.name || 'Unknown User',
                                image: user?.image || null
                            }
                        };
                    });

                    setComments(prev => ({ ...prev, [postId]: formattedComments }));

                    // Test: Thêm comment giả để test hiển thị
                    if (formattedComments.length === 0) {
                        const testComment = {
                            id: 'test-' + postId,
                            content: 'Đây là comment test để kiểm tra hiển thị',
                            userId: user.id,
                            postId: postId,
                            created_at: new Date().toISOString(),
                            user: {
                                id: user.id,
                                name: user.name,
                                image: user.image
                            }
                        };
                        setComments(prev => ({ ...prev, [postId]: [testComment] }));
                    }
                }
            } catch (error) {
                console.error('❌ Error loading comments:', error);
            } finally {
                setLoadingComments(prev => ({ ...prev, [postId]: false }));
            }
        }
    };

    const handleCommentChange = (postId, value) => {
        setNewComment(prev => ({ ...prev, [postId]: value }));

        // Auto-resize textarea
        const textarea = document.querySelector(`textarea[data-post-id="${postId}"]`);
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    };

    const handleSubmitComment = async (postId) => {
        const commentText = newComment[postId]?.trim();

        if (!commentText || !user) {
            return;
        }

        setSubmittingComment(prev => ({ ...prev, [postId]: true }));

        try {
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

            // Lấy access token từ localStorage
            const storedToken = localStorage.getItem('sb-oqtlakdvlmkaalymgrwd-auth-token');
            let accessToken = apiKey; // fallback

            if (storedToken) {
                try {
                    const authData = JSON.parse(storedToken);
                    accessToken = authData.access_token || apiKey;
                } catch (e) {
                }
            }

            const commentUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments';
            const response = await fetch(commentUrl, {
                method: 'POST',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    postId: postId,
                    userId: user.id,
                    content: commentText,
                    created_at: new Date().toISOString()
                })
            });


            if (response.ok) {

                // Test: Kiểm tra xem comment có thực sự được lưu không
                setTimeout(async () => {
                    try {
                        const testUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments?postId=eq.${postId}&order=created_at.desc&limit=1`;
                        const testResponse = await fetch(testUrl, {
                            headers: {
                                'apikey': apiKey,
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (testResponse.ok) {
                            const testData = await testResponse.json();
                        }
                    } catch (testError) {
                        console.error('❌ Test query failed:', testError);
                    }
                }, 2000);

                // Tạo comment mới để thêm vào UI ngay lập tức
                const newCommentData = {
                    id: 'temp-' + Date.now(),
                    postId: postId,
                    userId: user.id,
                    content: commentText,
                    created_at: new Date().toISOString(),
                    user: {
                        id: user.id,
                        name: user.name,
                        image: user.image
                    }
                };


                // Cập nhật comments state với hiệu ứng
                setComments(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), newCommentData]
                }));

                // Cập nhật comments count trong posts
                setPosts(prevPosts =>
                    prevPosts.map(post => {
                        if (post.id === postId) {
                            return {
                                ...post,
                                comments_count: (post.comments_count || 0) + 1
                            };
                        }
                        return post;
                    })
                );


                // Hiển thị thông báo thành công
                const successMessage = document.createElement('div');
                successMessage.textContent = '✅ Bình luận đã được gửi!';
                successMessage.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    animation: slideInNotification 0.3s ease-out;
                `;
                document.body.appendChild(successMessage);

                // Xóa thông báo sau 2 giây
                setTimeout(() => {
                    successMessage.remove();
                }, 2000);

                // Xóa input
                setNewComment(prev => ({ ...prev, [postId]: '' }));

                // Đóng khung bình luận sau khi gửi thành công
                setTimeout(() => {
                    setShowComments(prev => ({ ...prev, [postId]: false }));
                }, 1000); // Đóng sau 1 giây để user thấy comment xuất hiện
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to submit comment:', response.status, response.statusText);
                console.error('❌ Error details:', errorText);

                // Hiển thị thông báo lỗi
                const errorMessage = document.createElement('div');
                errorMessage.textContent = '❌ Lỗi khi gửi bình luận!';
                errorMessage.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ef4444;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                `;
                document.body.appendChild(errorMessage);

                setTimeout(() => {
                    errorMessage.remove();
                }, 3000);
            }
        } catch (error) {
            console.error('❌ Error submitting comment:', error);
        } finally {
            setSubmittingComment(prev => ({ ...prev, [postId]: false }));
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Vừa xong';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
        return date.toLocaleDateString('vi-VN');
    };

    if (loading) {
        return (
            <div className="facebook-layout">
                <Sidebar />
                <TopBar />
                <div className="main-content">
                    <div className="content-wrapper">
                        <div className="loading">Đang tải bài viết...</div>
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
                    {/* Create Post Section */}
                    <div className="create-post-section">
                        <div className="create-post-header">
                            <Avatar
                                src={user?.image}
                                name={user?.name}
                                size={40}
                            />
                            <div className="create-post-input">
                                <input 
                                    type="text" 
                                    placeholder={`${user?.name || 'Bạn'} đang nghĩ gì?`}
                                    onClick={() => navigate('/posts')}
                                />
                            </div>
                        </div>
                        <div className="create-post-actions">
                            <button className="action-btn photo-btn" onClick={() => navigate('/posts')}>
                                <span className="btn-icon">📷</span>
                                <span className="btn-text">Ảnh/Video</span>
                            </button>
                            <button className="action-btn feeling-btn" onClick={() => navigate('/posts')}>
                                <span className="btn-icon">😊</span>
                                <span className="btn-text">Cảm xúc</span>
                            </button>
                        </div>
                    </div>

                    {/* Posts Feed */}
                    <div className="posts-feed">
                        {posts.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📝</div>
                                <h3>Chưa có bài viết nào</h3>
                                <p>Hãy tạo bài viết đầu tiên của bạn!</p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => navigate('/posts')}
                                >
                                    Tạo bài viết
                                </button>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <div key={post.id} className="post-card">
                                    <div className="post-header">
                                        <Avatar
                                            src={post.user?.image}
                                            name={post.user?.name}
                                            size={40}
                                        />
                                        <div className="post-author-info">
                                            <h4 className="post-author-name">
                                                {post.user?.name || 'Unknown User'}
                                            </h4>
                                            <span className="post-time">
                                                {formatTime(post.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="post-content">
                                        <p>{post.content || post.body || 'Không có nội dung'}</p>
                                        {post.image && (
                                            <div className="post-image">
                                                <img 
                                                    src={post.image} 
                                                    alt="Post content" 
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="post-stats">
                                        <div className="post-likes">
                                            {post.likes_count > 0 && (
                                                <span className="likes-count">
                                                    👍 {post.likes_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="post-comments-count">
                                            {post.comments_count > 0 && (
                                                <span className="comments-count">
                                                    💬 {post.comments_count} bình luận
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="post-actions">
                                        <button 
                                            className={`action-button like-btn ${post.isLiked ? 'liked' : ''}`}
                                            onClick={() => handleLike(post.id)}
                                            disabled={liking === post.id}
                                        >
                                            <span className="action-icon">
                                                {post.isLiked ? '❤️' : '🤍'}
                                            </span>
                                            <span className="action-text">Thích</span>
                                        </button>
                                        <button 
                                            className="action-button comment-btn"
                                            onClick={() => handleShowComments(post.id)}
                                        >
                                            <span className="action-icon">💬</span>
                                            <span className="action-text">Bình luận</span>
                                        </button>
                                        <button className="action-button share-btn">
                                            <span className="action-icon">📤</span>
                                            <span className="action-text">Chia sẻ</span>
                                        </button>
                                    </div>

                                    {/* Comments Section */}
                                    {showComments[post.id] && (
                                        <div className="comments-section">
                                            <div className="comments-header">
                                                <h4>Bình luận</h4>
                                                <button 
                                                    className="close-comments-btn"
                                                    onClick={() => setShowComments(prev => ({ ...prev, [post.id]: false }))}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            
                                            <div className="comment-input-section">
                                                <div className="comment-input-header">
                                                    <Avatar
                                                        src={user?.image}
                                                        name={user?.name}
                                                        size={32}
                                                    />
                                                    <span className="comment-user-name">{user?.name}</span>
                                                </div>
                                                <div className="comment-input-wrapper">
                                                    <textarea
                                                        placeholder="Viết bình luận..."
                                                        value={newComment[post.id] || ''}
                                                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                                        className="comment-textarea"
                                                        rows="2"
                                                    />
                                                    <button 
                                                        className="comment-submit-btn"
                                                        onClick={() => handleSubmitComment(post.id)}
                                                        disabled={!newComment[post.id]?.trim() || submittingComment[post.id]}
                                                    >
                                                        {submittingComment[post.id] ? 'Đang gửi...' : 'Gửi'}
                                                    </button>
                                                </div>
                                            </div>

                                            {loadingComments[post.id] ? (
                                                <div className="loading-comments">
                                                    <div className="loading-spinner"></div>
                                                    <p>Đang tải bình luận...</p>
                                                </div>
                                            ) : comments[post.id] && comments[post.id].length > 0 ? (
                                                <div className="comments-list">
                                                    {comments[post.id].map((comment, index) => (
                                                        <div key={`comment-${comment.id}-${index}`} className="comment-item">
                                                            <div className="comment-author">
                                                                <Avatar
                                                                    src={comment.user?.image}
                                                                    name={comment.user?.name}
                                                                    size={30}
                                                                />
                                                                <div className="comment-info">
                                                                    <span className="comment-author-name">
                                                                        {comment.user?.name || 'Unknown User'}
                                                                    </span>
                                                                    <span className="comment-time">
                                                                        {formatTime(comment.created_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="comment-content">
                                                                <p>{comment.content || comment.body || comment.text || 'Không có nội dung'}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="no-comments">
                                                    <p>Chưa có bình luận nào</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Loading indicator */}
                    {isLoadingPosts && (
                        <div className="loading-indicator">
                            <div className="loading-spinner"></div>
                            <p>Đang tải thêm bài viết...</p>
                        </div>
                    )}

                    {/* End of posts indicator */}
                    {!hasMorePosts && posts.length > 0 && (
                        <div className="end-of-posts">
                            <p>Đã hiển thị tất cả bài viết</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Right Sidebar - Conversations */}
            <div className="right-sidebar">
                <div className="right-sidebar-content">
                    <h3>Cuộc trò chuyện</h3>
                    <div className="conversations-list">
                        <div className="conversation-item">
                            <div className="conversation-avatar">
                                <div className="avatar-placeholder">👤</div>
                            </div>
                            <div className="conversation-info">
                                <div className="conversation-name">Người dùng 1</div>
                                <div className="conversation-preview">Tin nhắn mới nhất...</div>
                            </div>
                            <div className="conversation-time">2h</div>
                        </div>
                        
                        <div className="conversation-item">
                            <div className="conversation-avatar">
                                <div className="avatar-placeholder">👤</div>
                            </div>
                            <div className="conversation-info">
                                <div className="conversation-name">Người dùng 2</div>
                                <div className="conversation-preview">Đang hoạt động</div>
                            </div>
                            <div className="conversation-time">5h</div>
                        </div>
                        
                        <div className="conversation-item">
                            <div className="conversation-avatar">
                                <div className="avatar-placeholder">👤</div>
                            </div>
                            <div className="conversation-info">
                                <div className="conversation-name">Người dùng 3</div>
                                <div className="conversation-preview">Hẹn gặp lại!</div>
                            </div>
                            <div className="conversation-time">1d</div>
                        </div>
                    </div>
                    
                    <div className="right-sidebar-footer">
                        <button className="new-chat-btn">
                            <span className="btn-icon">💬</span>
                            <span>Tạo cuộc trò chuyện</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;