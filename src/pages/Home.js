import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Avatar from '../components/Avatar';
import GroupAvatar from '../components/GroupAvatar';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ChatPopup from '../components/ChatPopup';
import CommentModal from '../components/CommentModal';
import CreatePostModal from '../components/CreatePostModal';
import { useAuth } from '../context/AuthContext';
import { fetchAllPosts, fetchPostById as fetchPostByIdService } from '../services/postsService';
import { supabase } from '../lib/supabase';
import { getUserImageSrc } from '../services/imageService';
import { getConversations } from '../services/chatService';
import { getAllUnreadMessageCounts, markConversationAsRead } from '../services/unreadMessagesService';
import './Home.css';
import './FacebookLayout.css';
import { getStudySessions, getTopRequestedSubjects } from '../services/studyService';

const Home = () => {
    const { user, signOut, debugSession } = useAuth();
    const location = useLocation();

    // Debug user data removed for production
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
    const [showCreatePostModal, setShowCreatePostModal] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [studySessions, setStudySessions] = useState([]);
    const [studySessionsLoading, setStudySessionsLoading] = useState(true);
    const [studyRequests, setStudyRequests] = useState([]);
    const [studyRequestsLoading, setStudyRequestsLoading] = useState(true);
    const postsPerPage = 15;

    // Load posts function
    const loadPosts = async () => {
        if (!user?.id) {
            console.log('No user ID, skipping posts load');
            return;
        }

        setIsLoadingPosts(true);
        try {
            // Load posts từ REST API với phân trang
            try {
                const offset = (currentPage - 1) * postsPerPage;
                const postsUrl = `https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1/posts?limit=${postsPerPage}&offset=${offset}&order=created_at.desc`;
                const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

                const response = await fetch(postsUrl, {
                    method: 'GET',
                    headers: {
                        'apikey': apiKey,
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('📝 Posts loaded from API:', data);

                if (currentPage === 1) {
                    setPosts(data);
                } else {
                    setPosts(prevPosts => [...prevPosts, ...data]);
                }

                setHasMorePosts(data.length === postsPerPage);
                setTotalPages(Math.ceil(data.length / postsPerPage));
            } catch (apiError) {
                console.error('API Error loading posts:', apiError);
                // Fallback to service
                const data = await fetchAllPosts();
                console.log('📝 Posts loaded from service:', data);

                if (currentPage === 1) {
                    setPosts(data);
                } else {
                    setPosts(prevPosts => [...prevPosts, ...data]);
                }
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setIsLoadingPosts(false);
        }
    };

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

        } catch (error) {
            console.error('Error loading unread counts:', error);
        }
    };

    // Load 5 latest announcements for club board
    const loadLatestAnnouncements = async () => {
        try {
            setAnnouncementsLoading(true);
            const { data, error } = await supabase
                .from('notifications_clb')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error('Error loading announcements:', error);
            } else {
                let finalData = data || [];
                // --- Mock Data ---
                if (finalData.length === 0) {
                    finalData = [
                        {
                            id: 'mock-ann-1',
                            title: '[THÔNG BÁO] Sinh hoạt định kì tuần 3 tháng 3',
                            created_at: new Date().toISOString(),
                            priority: 'high'
                        },
                        {
                            id: 'mock-ann-2',
                            title: 'Tuyển thành viên Ban Học Tập CLB IT',
                            created_at: new Date(Date.now() - 86400000).toISOString(),
                            priority: 'normal'
                        },
                        {
                            id: 'mock-ann-3',
                            title: 'Cập nhật danh sách điểm danh Big Game',
                            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
                            priority: 'normal'
                        }
                    ];
                }
                setAnnouncements(finalData);
            }
        } catch (error) {
            console.error('Error in loadLatestAnnouncements:', error);
        } finally {
            setAnnouncementsLoading(false);
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

    // Fetch a specific post by ID
    const fetchPostById = async (postId) => {
        try {
            // Use the service function which properly joins with users table
            const result = await fetchPostByIdService(postId);

            if (result.success && result.data) {
                const post = result.data;

                // Handle different user field names (user, users, or direct user_id)
                let userData = null;
                if (post.user) {
                    userData = post.user;
                } else if (post.users) {
                    userData = post.users;
                } else if (post.userId || post.user_id) {
                    // If no join result, user data might be missing - we'll need to fetch it separately
                    userData = {
                        id: post.userId || post.user_id,
                        name: 'Người dùng',
                        image: null
                    };
                }

                // Transform to match the expected format
                return {
                    id: post.id,
                    content: post.content || post.body,
                    created_at: post.created_at,
                    image: post.image || post.file,
                    user: userData || {
                        id: post.userId || post.user_id,
                        name: 'Người dùng',
                        image: null
                    },
                    likes_count: post.postLikes?.length || post.likes_count || 0,
                    comments_count: post.comments?.length || post.comments_count || 0,
                    isLiked: false
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching post by ID:', error);
            return null;
        }
    };

    // Handle scroll to specific post from notification
    useEffect(() => {
        const handleScrollToPost = async () => {
            const scrollToPostId = location.state?.scrollToPostId;
            const scrollToCommentId = location.state?.scrollToCommentId;
            if (!scrollToPostId) return;

            console.log('🔍 [Home] Scroll to post requested:', scrollToPostId, scrollToCommentId ? `comment: ${scrollToCommentId}` : '');

            // Check if post already exists in posts list
            const existingPost = posts.find(p => p.id === scrollToPostId || String(p.id) === String(scrollToPostId));

            // Helper: try to scroll to element, return true if success
            const tryScrollToElement = () => {
                const selector = `[id="post-${scrollToPostId}"][data-post-id="${scrollToPostId}"]`;
                const postElement = document.querySelector(selector) ||
                    document.getElementById(`post-${scrollToPostId}`) ||
                    document.querySelector(`[data-post-id="${scrollToPostId}"]`);
                if (!postElement) return false;
                postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                postElement.style.transition = 'box-shadow 0.3s ease';
                postElement.style.boxShadow = '0 0 20px rgba(24, 119, 242, 0.5)';
                setTimeout(() => { postElement.style.boxShadow = ''; }, 2000);
                return true;
            };

            // Helper: try to scroll to comment, return true if success
            const tryScrollToComment = () => {
                if (!scrollToCommentId) return false;

                // Try both string and number versions of commentId
                const commentIdStr = String(scrollToCommentId);
                const commentIdNum = Number(scrollToCommentId);

                // Try multiple selectors
                const selectors = [
                    `#comment-${commentIdStr}`,
                    `#comment-${commentIdNum}`,
                    `[data-comment-id="${commentIdStr}"]`,
                    `[data-comment-id="${commentIdNum}"]`,
                    `[id="comment-${commentIdStr}"]`,
                    `[id="comment-${commentIdNum}"]`
                ];

                let commentElement = null;
                for (const selector of selectors) {
                    commentElement = document.querySelector(selector);
                    if (commentElement) break;
                }

                if (!commentElement) {
                    // Log all available comment IDs for debugging
                    const allComments = document.querySelectorAll('[data-comment-id], [id^="comment-"]');
                    const commentIds = Array.from(allComments).map(el =>
                        el.id || el.getAttribute('data-comment-id')
                    ).filter(Boolean);
                    if (commentIds.length > 0) {
                        console.log('🔍 [Home] Available comment IDs in DOM:', commentIds);
                    }
                    return false;
                }

                commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                commentElement.style.transition = 'background-color 0.3s ease';
                commentElement.style.backgroundColor = 'rgba(24, 119, 242, 0.1)';
                setTimeout(() => { commentElement.style.backgroundColor = ''; }, 3000);
                return true;
            };

            if (existingPost) {
                console.log('✅ [Home] Post found in list, trying to scroll...');
                setTimeout(() => {
                    const ok = tryScrollToElement();
                    if (ok && scrollToCommentId) {
                        // Open comment modal to show the comment
                        console.log('📝 [Home] Opening comment modal for comment:', scrollToCommentId);
                        setSelectedPost(existingPost);
                        setCommentModalOpen(true);

                        // Wait for modal to open and comments to load, then scroll to comment
                        setTimeout(() => {
                            let commentAttempts = 0;
                            const retryComment = () => {
                                commentAttempts += 1;

                                // Check if modal is open and comments section exists
                                const modal = document.querySelector('.comment-modal');
                                const commentsList = document.querySelector('.comments-list');

                                if (!modal || !commentsList) {
                                    if (commentAttempts < 20) {
                                        setTimeout(retryComment, 200);
                                    }
                                    return;
                                }

                                const commentOk = tryScrollToComment();
                                if (!commentOk && commentAttempts < 20) {
                                    setTimeout(retryComment, 300);
                                } else if (commentOk) {
                                    console.log('✅ [Home] Scrolled to comment in modal:', scrollToCommentId);
                                } else {
                                    console.log('⚠️ [Home] Comment element not found in modal after', commentAttempts, 'attempts:', scrollToCommentId);
                                }
                            };
                            setTimeout(retryComment, 800); // Wait longer for modal and comments to render
                        }, 500);
                    }
                    if (!ok) {
                        console.log('⚠️ [Home] Post element not in DOM yet, will fetch to ensure presence');
                    }
                }, 300);
            }

            if (!existingPost || !document.getElementById(`post-${scrollToPostId}`)) {
                console.log('⚠️ [Home] Post not in list, fetching...');
                // Fetch the post
                const fetchedPost = await fetchPostById(scrollToPostId);
                if (fetchedPost) {
                    console.log('✅ [Home] Post fetched, adding to list');
                    // Add to posts list, ensuring no duplicates
                    setPosts(prevPosts => {
                        // Check if post already exists
                        const postExists = prevPosts.some(p =>
                            String(p.id) === String(fetchedPost.id)
                        );

                        if (postExists) {
                            console.log('⚠️ [Home] Post already exists in list, skipping add');
                            return prevPosts; // Don't add duplicate
                        }

                        // Use Map to deduplicate by id (handle both number and string)
                        const postMap = new Map();
                        prevPosts.forEach(p => {
                            const key = String(p.id);
                            if (!postMap.has(key)) {
                                postMap.set(key, p);
                            }
                        });
                        // Add fetched post
                        const fetchedKey = String(fetchedPost.id);
                        postMap.set(fetchedKey, fetchedPost);

                        // Convert back to array and sort by created_at
                        const sortedPosts = Array.from(postMap.values()).sort((a, b) =>
                            new Date(b.created_at) - new Date(a.created_at)
                        );
                        return sortedPosts;
                    });

                    // Scroll to post after it's added (with small retries)
                    let attempts = 0;
                    const retry = () => {
                        attempts += 1;
                        const ok = tryScrollToElement();
                        if (ok && scrollToCommentId) {
                            // Open comment modal to show the comment
                            console.log('📝 [Home] Opening comment modal for comment:', scrollToCommentId);
                            setSelectedPost(fetchedPost);
                            setCommentModalOpen(true);

                            // Wait for modal to open and comments to load, then scroll to comment
                            setTimeout(() => {
                                let commentAttempts = 0;
                                const retryComment = () => {
                                    commentAttempts += 1;

                                    // Check if modal is open and comments section exists
                                    const modal = document.querySelector('.comment-modal');
                                    const commentsList = document.querySelector('.comments-list');

                                    if (!modal || !commentsList) {
                                        if (commentAttempts < 20) {
                                            setTimeout(retryComment, 200);
                                        }
                                        return;
                                    }

                                    const commentOk = tryScrollToComment();
                                    if (!commentOk && commentAttempts < 20) {
                                        setTimeout(retryComment, 300);
                                    } else if (commentOk) {
                                        console.log('✅ [Home] Scrolled to comment in modal:', scrollToCommentId);
                                    } else {
                                        console.log('⚠️ [Home] Comment element not found in modal after', commentAttempts, 'attempts:', scrollToCommentId);
                                    }
                                };
                                setTimeout(retryComment, 800); // Wait longer for modal and comments to render
                            }, 500);
                        }
                        if (!ok && attempts < 8) setTimeout(retry, 250);
                    };
                    setTimeout(retry, 300);
                } else {
                    console.error('❌ [Home] Failed to fetch post');
                }
            }

            // Clear state to prevent re-triggering
            navigate(location.pathname, { replace: true, state: null });
        };

        if (posts.length > 0 || location.state?.scrollToPostId) {
            handleScrollToPost();
        }
    }, [location.state?.scrollToPostId, location.state?.scrollToCommentId, posts.length, navigate, location.pathname]);

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
                    const postsUrl = `https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1/posts?limit=${postsPerPage}&offset=${offset}&order=created_at.desc`;
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
                        const countUrl = 'https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1/posts?select=count';
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
                        const usersUrl = 'https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1/users';
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
                        const likesUrl = 'https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1/postLikes';
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
                        const commentsUrl = 'https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1/comments';
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
                                    imageUrl = `https://tguxydfhxcmqvcrenqbl.supabase.co/storage/v1/object/public/upload/${post.file}`;
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
            loadConversations(true);
            loadLatestAnnouncements();
            // Load study sessions from DB
            getStudySessions().then(res => {
                if (res.data) setStudySessions(res.data.filter(s => s.status === 'upcoming' || s.status === 'ongoing').slice(0, 3));
                setStudySessionsLoading(false);
            });
            // Load top requested subjects
            getTopRequestedSubjects().then(res => {
                if (res.data) setStudyRequests(res.data.slice(0, 3));
                setStudyRequestsLoading(false);
            });
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

    // Handle hash navigation to scroll to specific post
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash && hash.startsWith('#post-')) {
                const postId = hash.replace('#post-', '');
                // Wait for posts to load
                setTimeout(() => {
                    const postElement = document.getElementById(`post-${postId}`) ||
                        document.querySelector(`[data-post-id="${postId}"]`);
                    if (postElement) {
                        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Highlight the post briefly
                        postElement.style.transition = 'box-shadow 0.3s ease';
                        postElement.style.boxShadow = '0 0 20px rgba(24, 119, 242, 0.5)';
                        setTimeout(() => {
                            postElement.style.boxShadow = '';
                        }, 2000);
                    }
                }, 500);
            }
        };

        // Handle hash on mount and when posts change
        handleHashChange();

        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [posts.length]); // Re-run when posts are loaded

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
            const checkLikeUrl = `https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1/postLikes?postId=eq.${postId}&userId=eq.${user.id}`;
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
                    const deleteUrl = `https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1/postLikes?id=eq.${existingLikes[0].id}`;
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
                    const addLikeUrl = 'https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1/postLikes';
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

        const post = posts.find(p => p.id === postId);
        if (!post) {
            console.error('❌ Post not found for postId:', postId);
            return;
        }

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
        <>
            <div className="facebook-layout">
                <Sidebar />
                <TopBar totalUnreadCount={totalUnreadCount} />
                <div className="main-content">
                    {/* Left Column for Announcements */}
                    <div className="announcement-sidebar">
                        <div className="announcement-board">
                            <div className="board-header">
                                <h3>📢 Thông báo CLB</h3>
                            </div>
                            <div className="board-content">
                                {announcementsLoading ? (
                                    <div className="loading-mini">Đang tải...</div>
                                ) : announcements.length === 0 ? (
                                    <div className="no-announcements-mini">Chưa có thông báo nào</div>
                                ) : (
                                    <div className="announcements-mini-list">
                                        {announcements.map((ann) => (
                                            <div key={ann.id} className={`announcement-mini-item priority-${ann.priority}`}>
                                                <div className="ann-mini-title">{ann.title}</div>
                                                <div className="ann-mini-meta">
                                                    {new Date(ann.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Study Support Block */}
                        <div className="announcement-board study-support-home-block">
                            <div className="board-header" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '12px' }}>
                                <h3>🤝 Hỗ trợ học tập</h3>
                            </div>
                            <div className="board-content">
                                {/* Phân vùng Phòng học sắp diễn ra */}
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ fontSize: '13px', color: '#65676b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Phòng học đang mở</h4>
                                    {studySessionsLoading ? (
                                        <div className="loading-mini">Đang tải...</div>
                                    ) : studySessions.length === 0 ? (
                                        <div style={{ fontSize: '0.82rem', color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>
                                            Chưa có phòng học nào đang mở.
                                        </div>
                                    ) : (
                                        studySessions.map(s => (
                                            <div key={s.id} className={`study-session-home-item ${s.status}`}>
                                                <div className="ss-subject">{s.subject_name}</div>
                                                <div className="ss-meta">
                                                    <span>⏰ {new Date(s.scheduled_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                    <span>👥 {s.member_count} người</span>
                                                </div>
                                                <Link to={`/study-room/${s.id}`} className="ss-join-btn">
                                                    {s.status === 'ongoing' ? '🔴 Đang diễn ra — Vào ngay' : '🎥 Tham gia'}
                                                </Link>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Phân vùng Các môn cần hỗ trợ nhiều nhất */}
                                <div>
                                    <h4 style={{ fontSize: '13px', color: '#65676b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Đang tìm mentor</h4>
                                    {studyRequestsLoading ? (
                                        <div className="loading-mini">Đang tải...</div>
                                    ) : studyRequests.length === 0 ? (
                                        <div style={{ fontSize: '0.82rem', color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>
                                            Chưa có yêu cầu hỗ trợ nào.
                                        </div>
                                    ) : (
                                        studyRequests.map((req, idx) => (
                                            <div key={idx} className="study-session-home-item" style={{ borderLeftColor: '#f59f00', paddingBottom: '12px' }}>
                                                <div className="ss-subject">{req.subject_name}</div>
                                                <div className="ss-meta">
                                                    <span style={{ color: '#d97706', fontWeight: '500' }}>📈 {req.count} bạn đang cần hỗ trợ</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <Link to="/study-support" className="ss-view-all" style={{ marginTop: '12px' }}>
                                    Xem tất cả & Đăng ký →
                                </Link>
                            </div>
                        </div>
                    </div>

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
                                    onClick={() => setShowCreatePostModal(true)}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="create-post-actions">
                            <button className="action-btn photo-btn" onClick={() => setShowCreatePostModal(true)}>
                                <span className="btn-icon">📷</span>
                                <span className="btn-text">Ảnh/Video</span>
                            </button>
                            <button className="action-btn feeling-btn" onClick={() => setShowCreatePostModal(true)}>
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
                                <div key={post.id} id={`post-${post.id}`} data-post-id={post.id} className="post-card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                        <div
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                                console.log('🖱️ Avatar clicked for user:', post.user?.name, 'ID:', post.user?.id);
                                                navigate(`/profile/${post.user?.id}`);
                                            }}
                                        >
                                            <Avatar
                                                src={post.user?.image}
                                                name={post.user?.name}
                                                size={40}
                                            />
                                        </div>
                                        <div>
                                            <h4
                                                style={{
                                                    margin: '0 0 0px 0',
                                                    fontSize: '16px',
                                                    fontWeight: '600',
                                                    color: '#1c1e21',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => {
                                                    console.log('🖱️ Name clicked for user:', post.user?.name, 'ID:', post.user?.id);
                                                    navigate(`/profile/${post.user?.id}`);
                                                }}
                                            >
                                                {post.user?.name || 'Unknown User'}
                                            </h4>
                                            <span style={{ fontSize: '14px', color: '#65676b' }}>
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
                </div> {/* end main-content */}

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
                </div> {/* end right-sidebar */}
            </div> {/* end facebook-layout */}

            {/* Chat Popup */}
            {
                chatPopupOpen && (
                    <ChatPopup
                        conversationId={selectedConversationId}
                        onClose={handleCloseChatPopup}
                    />
                )
            }

            {/* Comment Modal */}
            <CreatePostModal
                isOpen={showCreatePostModal}
                onClose={() => setShowCreatePostModal(false)}
                onPostCreated={() => {
                    // Reload posts after creating new post
                    setCurrentPage(1);
                    setPosts([]);
                    setHasMorePosts(true);
                    // Trigger useEffect to reload posts
                    window.location.reload();
                }}
            />

            {
                commentModalOpen && selectedPost && (
                    <CommentModal
                        isOpen={commentModalOpen}
                        onClose={() => {
                            setCommentModalOpen(false);
                            setSelectedPost(null);
                        }}
                        post={selectedPost}
                        currentUser={user}
                        onPostUpdate={(updatedPost) => {
                            console.log('🔄 [Home] Updating post from modal:', updatedPost);
                            // Update post in posts state
                            setPosts(prevPosts =>
                                prevPosts.map(p => {
                                    // Compare both string and number IDs
                                    if (String(p.id) === String(updatedPost.id) || p.id === updatedPost.id) {
                                        const updated = {
                                            ...p,
                                            isLiked: updatedPost.isLiked,
                                            likes_count: updatedPost.likes_count
                                        };
                                        console.log('✅ [Home] Post updated:', updated);
                                        return updated;
                                    }
                                    return p;
                                })
                            );
                            // Also update selectedPost if it's the same post
                            if (selectedPost && (String(selectedPost.id) === String(updatedPost.id) || selectedPost.id === updatedPost.id)) {
                                setSelectedPost({
                                    ...selectedPost,
                                    isLiked: updatedPost.isLiked,
                                    likes_count: updatedPost.likes_count
                                });
                                console.log('✅ [Home] Selected post updated');
                            }
                        }}
                    />
                )
            }
        </>
    );
};

export default Home;


