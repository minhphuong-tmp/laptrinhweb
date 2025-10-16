import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import GroupAvatar from '../components/GroupAvatar';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ChatPopup from '../components/ChatPopup';
import CommentModal from '../components/CommentModal';
import { useAuth } from '../context/AuthContext';
import { fetchAllPosts } from '../services/postsService';
import { getUserImageSrc } from '../services/imageService';
import { getConversations } from '../services/chatService';
import { getAllUnreadMessageCounts, markConversationAsRead } from '../services/unreadMessagesService';
import './Home.css';
import './FacebookLayout.css';


const Home = () => {
    const { user, signOut, debugSession } = useAuth();
    
    // Debug user data
    useEffect(() => {
        console.log('🔍 Home - User data:', user);
        console.log('🔍 Home - User image:', user?.image, 'type:', typeof user?.image);
        console.log('🔍 Home - User name:', user?.name);
        console.log('🔍 Home - User keys:', user ? Object.keys(user) : 'No user');
    }, [user]);
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liking, setLiking] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [chatPopupOpen, setChatPopupOpen] = useState(false);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const postsPerPage = 15;

    // Load conversations cho right sidebar
    const loadConversations = async (showLoading = false) => {
        if (!user?.id) return;
        
        try {
            if (showLoading) {
                setConversationsLoading(true);
            }
            const result = await getConversations(user.id);
            if (result.success) {
                setConversations(result.data.slice(0, 5)); // Chỉ hiển thị 5 cuộc trò chuyện gần nhất
                // Load unread counts sau khi load conversations
                loadUnreadCounts();
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            if (showLoading) {
                setConversationsLoading(false);
            }
        }
    };

    // Load unread message counts
    const loadUnreadCounts = async () => {
        if (!user?.id) return;
        
        try {
            const counts = await getAllUnreadMessageCounts(user.id);
            setUnreadCounts(counts);
            
            // Tính tổng số tin nhắn chưa đọc
            const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
            setTotalUnreadCount(total);
            
            console.log('📊 Unread counts loaded:', counts, 'Total:', total);
        } catch (error) {
            console.error('Error loading unread counts:', error);
        }
    };


    const formatConversationTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) {
            return 'Vừa xong';
        } else if (diffHours < 24) {
            return `${diffHours}h`;
        } else if (diffDays < 7) {
            return `${diffDays}d`;
        } else {
            return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
        }
    };

    const getConversationName = (conversation) => {
        if (conversation.type === 'group') {
            return conversation.name || 'Nhóm chat';
        }

        const otherMember = conversation.conversation_members?.find(
            member => member.user_id !== user.id
        );
        return otherMember?.user?.name || 'Người dùng';
    };

    const getConversationAvatar = (conversation) => {
        if (conversation.type === 'group') {
            return <GroupAvatar members={conversation.conversation_members || []} size={32} />;
        }

        const otherMember = conversation.conversation_members?.find(
            member => member.user_id !== user.id
        );
        return (
            <Avatar
                src={otherMember?.user?.image}
                name={otherMember?.user?.name || 'User'}
                size={32}
            />
        );
    };

    const handleOpenChatPopup = async (conversationId) => {
        setSelectedConversationId(conversationId);
        setChatPopupOpen(true);
        
        // Đánh dấu conversation là đã đọc
        try {
            await markConversationAsRead(conversationId, user.id);
            // Cập nhật unread counts
            setUnreadCounts(prev => ({
                ...prev,
                [conversationId]: 0
            }));
            // Cập nhật tổng unread count
            setTotalUnreadCount(prev => prev - (prev[conversationId] || 0));
            console.log('✅ Marked conversation as read:', conversationId);
        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    };

    const handleCloseChatPopup = () => {
        setChatPopupOpen(false);
        setSelectedConversationId(null);
    };

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
                            console.log('🔍 Likes data loaded:', likesData.length, 'likes');
                            console.log('🔍 Current user:', user?.id);
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
                            
                            // Debug log cho từng post
                            if (post.id === postsData[0]?.id) { // Chỉ log post đầu tiên để tránh spam
                                console.log('🔍 Post:', post.id, 'likes:', postLikes.length, 'isLiked:', isLiked);
                                console.log('🔍 Post likes:', postLikes);
                            }

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
                                isLiked: isLiked,
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
    }, [currentPage]); // Chỉ depend vào currentPage

    // Load conversations khi user thay đổi
    useEffect(() => {
        if (user?.id) {
            loadConversations(true); // Hiển thị loading lần đầu
        }
    }, [user?.id]);

    // Polling để cập nhật conversations real time
    useEffect(() => {
        if (!user?.id) return;

        const pollInterval = setInterval(() => {
            loadConversations(false); // Không hiển thị loading khi polling
        }, 1000); // Poll mỗi 1 giây để real time

        return () => {
            clearInterval(pollInterval);
        };
    }, [user?.id]);

    // Polling để cập nhật unread counts
    useEffect(() => {
        if (!user?.id) return;

        const unreadPolling = setInterval(() => {
            loadUnreadCounts();
        }, 5000); // Poll mỗi 5 giây

        return () => {
            clearInterval(unreadPolling);
        };
    }, [user?.id]);


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
        console.log('🔍 handleLike called for post:', postId);
        if (liking) {
            console.log('🚫 Like blocked - already liking:', liking);
            return;
        }

        setLiking(postId);
        
        // Update UI ngay lập tức - optimistic update
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId) {
                    const isCurrentlyLiked = post.isLiked;
                    const newIsLiked = !isCurrentlyLiked;
                    const newLikesCount = isCurrentlyLiked ? post.likes_count - 1 : post.likes_count + 1;
                    console.log('🔍 Optimistic update for postId', postId, ':', {
                        wasLiked: isCurrentlyLiked,
                        nowLiked: newIsLiked,
                        oldCount: post.likes_count,
                        newCount: newLikesCount
                    });
                    return {
                        ...post,
                        isLiked: newIsLiked,
                        likes_count: newLikesCount
                    };
                }
                return post;
            })
        );

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
                console.log('🔍 Existing likes for postId', postId, ':', existingLikes);

                if (existingLikes.length > 0) {
                    // Unlike - xóa like
                    console.log('🔍 Unlike: Deleting like with id:', existingLikes[0].id);
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
                        // UI đã được update rồi, không cần update lại
                        console.log('✅ Unlike successful');
                    }
                } else {
                    // Like - thêm like mới
                    console.log('🔍 Like: Adding new like for postId', postId);
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
                        // UI đã được update rồi, không cần update lại
                        console.log('✅ Like successful');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error toggling like:', error);
            // Rollback UI nếu API fail
            setPosts(prevPosts =>
                prevPosts.map(post => {
                    if (post.id === postId) {
                        const isCurrentlyLiked = post.isLiked;
                        return {
                            ...post,
                            isLiked: !isCurrentlyLiked,
                            likes_count: isCurrentlyLiked ? post.likes_count + 1 : post.likes_count - 1
                        };
                    }
                    return post;
                })
            );
        } finally {
            setLiking(null);
        }
    };


    const handleShowComments = (postId) => {
        console.log('🔍 handleShowComments - postId:', postId);
        console.log('🔍 handleShowComments - posts array:', posts);
        
        const post = posts.find(p => p.id === postId);
        if (!post) {
            console.error('❌ Post not found for postId:', postId);
            return;
        }

        console.log('🔍 handleShowComments - found post:', post);
        setSelectedPost(post);
        setCommentModalOpen(true);
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
                <TopBar totalUnreadCount={totalUnreadCount} />
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
            <TopBar totalUnreadCount={totalUnreadCount} />
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
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px'}}>
                                        <Avatar
                                            src={post.user?.image}
                                            name={post.user?.name}
                                            size={40}
                                        />
                                        <div>
                                            <h4 style={{margin: '0 0 0px 0', fontSize: '16px', fontWeight: '600', color: '#1c1e21'}}>
                                                {post.user?.name || 'Unknown User'}
                                            </h4>
                                            <span style={{fontSize: '14px', color: '#65676b'}}>
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
                                                    <span className={`heart-icon ${post.isLiked ? 'liked' : ''}`}>♥</span> {post.likes_count}
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
                                            onClick={(e) => {
                                                console.log('🔍 Like button clicked for post:', post.id, 'isLiked:', post.isLiked);
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleLike(post.id);
                                            }}
                                            disabled={liking === post.id}
                                        >
                                            <span className="action-icon">
                                                <span 
                                                    className={`heart-icon ${post.isLiked ? 'liked' : ''}`}
                                                >
                                                    ♥
                                                </span>
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
                    <div className="sidebar-header">
                        <div className="sidebar-title">
                            <h3>Cuộc trò chuyện</h3>
                        </div>
                        <button 
                            className="create-group-btn"
                            onClick={() => navigate('/new-chat')}
                            title="Tạo nhóm mới"
                        >
                            <span className="create-group-icon">👥</span>
                        </button>
                    </div>
                    <div className="conversations-list">
                        {conversationsLoading ? (
                            <div className="loading-conversations">
                                <div className="loading-spinner">⏳</div>
                                <p>Đang tải...</p>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="no-conversations">
                                <div className="empty-icon">💬</div>
                                <p>Chưa có cuộc trò chuyện nào</p>
                            </div>
                        ) : (
                            conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className="conversation-item"
                                    onClick={() => handleOpenChatPopup(conversation.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="conversation-avatar">
                                        {getConversationAvatar(conversation)}
                                    </div>
                                    <div className="conversation-info">
                                        <div className="conversation-name">
                                            {getConversationName(conversation)}
                                        </div>
                                        <div className="conversation-preview">
                                            {(() => {
                                                if (conversation.last_message) {
                                                    return (
                                                        <>
                                                            <span className="conversation-sender">
                                                                {conversation.last_message.sender?.name || 'Người dùng'}: 
                                                            </span>
                                                            <span className="conversation-content">
                                                                {conversation.last_message.content}
                                                            </span>
                                                        </>
                                                    );
                                                } else if (conversation.messages && conversation.messages.length > 0) {
                                                    const lastMsg = conversation.messages[conversation.messages.length - 1];
                                                    return (
                                                        <>
                                                            <span className="conversation-sender">
                                                                {lastMsg.sender?.name || 'Người dùng'}: 
                                                            </span>
                                                            <span className="conversation-content">
                                                                {lastMsg.content}
                                                            </span>
                                                        </>
                                                    );
                                                } else {
                                                    return 'Chưa có tin nhắn';
                                                }
                                            })()}
                                        </div>
                                    </div>
                                    <div className="conversation-right">
                                        <div className="conversation-time">
                                            {conversation.last_message?.created_at 
                                                ? formatConversationTime(conversation.last_message.created_at)
                                                : formatConversationTime(conversation.updated_at)
                                            }
                                        </div>
                                        {unreadCounts[conversation.id] > 0 && (
                                            <div className="unread-badge">
                                                {unreadCounts[conversation.id] > 99 ? '99+' : unreadCounts[conversation.id]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="right-sidebar-footer">
                        <button 
                            className="new-chat-btn"
                            onClick={() => navigate('/chat')}
                        >
                            <span className="btn-icon">💬</span>
                            <span>Xem tất cả</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Popup */}
            {chatPopupOpen && (
                <ChatPopup
                    conversationId={selectedConversationId}
                    onClose={handleCloseChatPopup}
                />
            )}

            {/* Comment Modal */}
            {commentModalOpen && selectedPost && (
                <CommentModal
                    isOpen={commentModalOpen}
                    onClose={() => {
                        setCommentModalOpen(false);
                        setSelectedPost(null);
                    }}
                    post={selectedPost}
                    currentUser={user}
                />
            )}
        </div>
    );
};

export default Home;