import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserNotifications, markNotificationAsRead } from '../services/notificationService';
import Avatar from './Avatar';
import './NotificationDropdown.css';

const NotificationDropdown = ({ isOpen, onClose, onNotificationRead }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const dropdownRef = useRef(null);
    const contentRef = useRef(null);


    useEffect(() => {
        if (isOpen && user) {
            // Reset state when opening dropdown
            setNotifications([]);
            setCurrentPage(1);
            setHasMore(true); // Always start with true
            console.log('🔄 Opening dropdown, resetting state');
            loadNotifications(1);
        }
    }, [isOpen, user]);

    const loadNotifications = async (page = 1, append = false) => {
        if (!user) return;
        
        if (page === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        
        try {
            const data = await getUserNotifications(user.id, page);
            if (append) {
                // Deduplicate: only add notifications that don't already exist
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.id));
                    const newNotifications = (data || []).filter(n => !existingIds.has(n.id));
                    return [...prev, ...newNotifications];
                });
            } else {
                setNotifications(data || []);
            }
            
            // Check if there are more notifications (assuming 20 per page)
            const dataLength = (data || []).length;
            const hasMoreData = dataLength >= 20;
            
            // For first page, always assume there might be more unless we get less than 20
            if (page === 1) {
                setHasMore(dataLength >= 20 || dataLength > 0);
            } else {
                setHasMore(hasMoreData);
            }
            
            console.log('📊 Notifications loaded:', {
                page,
                count: dataLength,
                hasMore: hasMoreData,
                finalHasMore: page === 1 ? (dataLength >= 20 || dataLength > 0) : hasMoreData,
                totalNotifications: append ? notifications.length + dataLength : dataLength
            });
        } catch (error) {
            console.error('Error loading notifications:', error);
            if (!append) {
                setNotifications([]);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !user) return;
        
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        setLoadingMore(true);
        
        try {
            const data = await getUserNotifications(user.id, nextPage);
            
            if (data && data.length > 0) {
                // Deduplicate: only add notifications that don't already exist
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.id));
                    const newNotifications = data.filter(n => !existingIds.has(n.id));
                    return [...prev, ...newNotifications];
                });
                setHasMore(data.length >= 20);
                console.log('📄 Loaded more notifications:', {
                    page: nextPage,
                    count: data.length,
                    hasMore: data.length >= 20
                });
            } else {
                setHasMore(false);
                console.log('📭 No more notifications available');
            }
        } catch (error) {
            console.error('Error loading more notifications:', error);
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    }, [currentPage, loadingMore, hasMore, user]);

    const handleClickOutside = (event) => {
        // Don't close if clicking on the notification button or its children
        if (event.target.closest('.notification-container') || 
            event.target.closest('.topbar-btn') ||
            event.target.classList.contains('topbar-btn')) {
            return;
        }
        
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Add small delay to prevent immediate closing
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);
            
            return () => {
                clearTimeout(timer);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen]);

    // Infinite scroll: auto load more when scrolling near bottom
    useEffect(() => {
        if (!isOpen || !contentRef.current || !hasMore || loadingMore || loading) {
            return;
        }

        const handleScroll = () => {
            const element = contentRef.current;
            if (!element) return;

            // Check if scrolled near bottom (within 50px)
            const scrollTop = element.scrollTop;
            const scrollHeight = element.scrollHeight;
            const clientHeight = element.clientHeight;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

            // Load more when within 50px of bottom
            if (distanceFromBottom < 50 && hasMore && !loadingMore && !loading) {
                handleLoadMore();
            }
        };

        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener('scroll', handleScroll);
            return () => {
                contentElement.removeEventListener('scroll', handleScroll);
            };
        }
    }, [isOpen, hasMore, loadingMore, loading, handleLoadMore]);

    const handleNotificationClick = async (notification) => {
        console.log('🔔 Notification clicked:', notification);
        
        try {
            // Close dropdown first
            onClose();
            
            // Use new fields directly: postId, commentId, type, is_read
            // Also check data for backward compatibility
            let dataObj = notification.data || {};
            if (typeof notification.data === 'string') {
                try {
                    dataObj = JSON.parse(notification.data);
                } catch (e) {
                    console.warn('Failed to parse notification.data:', e);
                    dataObj = {};
                }
            }
            
            // Prefer direct fields over data object
            const postId = notification.postId || dataObj?.postId || dataObj?.post_id;
            const commentId = notification.commentId || dataObj?.commentId || dataObj?.comment_id;
            const type = notification.type || dataObj?.type;
            const isRead = notification.is_read !== undefined ? notification.is_read : (dataObj?.is_read || false);
            
            // Debug: Log data structure
            console.log('📋 Notification data structure:', {
                'postId (direct)': notification.postId,
                'commentId (direct)': notification.commentId,
                'type (direct)': notification.type,
                'is_read (direct)': notification.is_read,
                'dataObj': dataObj,
                'final postId': postId,
                'final commentId': commentId,
                'final type': type,
                'final is_read': isRead
            });
            
            // Check if this is an announcement notification
            // Use type field or check title pattern
            const announcementId = notification.announcementId || 
                                  notification.announcement_id ||
                                  dataObj?.announcementId || 
                                  dataObj?.announcement_id ||
                                  null;
            
            // Also check if type is 'announcement' or title indicates this is an announcement notification
            const isAnnouncementNotification = type === 'announcement' || 
                (notification.title && 
                 (notification.title.includes('thông báo') || 
                  notification.title.includes('đăng một thông báo')));
            
            console.log('🔍 Announcement check:', {
                announcementId,
                type,
                isAnnouncementNotification,
                title: notification.title
            });
            
            // If this is an announcement notification, navigate to announcements page
            if (announcementId || isAnnouncementNotification) {
                // If we have announcementId, use it; otherwise try to find it from data
                let targetAnnouncementId = announcementId;
                
                if (!targetAnnouncementId && isAnnouncementNotification) {
                    // Try to extract announcementId from data object
                    // Check all possible keys
                    targetAnnouncementId = dataObj?.announcementId || 
                                         dataObj?.announcement_id ||
                                         dataObj?.id ||
                                         null;
                    
                    console.log('🔍 Trying to find announcementId from data:', {
                        dataObj,
                        targetAnnouncementId
                    });
                    
                    // If still not found, try to query database based on notification metadata
                    if (!targetAnnouncementId && notification.senderId && notification.created_at) {
                        console.log('🔍 Querying database to find announcement based on notification metadata');
                        try {
                            // Calculate time window: notification.created_at ± 5 minutes (wider window for better matching)
                            const notificationTime = new Date(notification.created_at);
                            const timeWindowStart = new Date(notificationTime.getTime() - 5 * 60 * 1000).toISOString();
                            const timeWindowEnd = new Date(notificationTime.getTime() + 5 * 60 * 1000).toISOString();
                            
                            const response = await fetch(
                                `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/notifications_clb?created_by=eq.${notification.senderId}&created_at=gte.${timeWindowStart}&created_at=lte.${timeWindowEnd}&select=id,created_at&order=created_at.desc&limit=5`,
                                {
                                    headers: {
                                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY',
                                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY'
                                    }
                                }
                            );
                            
                            if (response.ok) {
                                const announcements = await response.json();
                                if (announcements && announcements.length > 0) {
                                    // Find the closest match by timestamp
                                    let closestAnnouncement = announcements[0];
                                    let minTimeDiff = Math.abs(new Date(announcements[0].created_at) - notificationTime);
                                    
                                    for (const ann of announcements) {
                                        const timeDiff = Math.abs(new Date(ann.created_at) - notificationTime);
                                        if (timeDiff < minTimeDiff) {
                                            minTimeDiff = timeDiff;
                                            closestAnnouncement = ann;
                                        }
                                    }
                                    
                                    targetAnnouncementId = closestAnnouncement.id;
                                    console.log('✅ Found announcement from database:', targetAnnouncementId, 'time diff:', minTimeDiff, 'ms');
                                } else {
                                    console.log('⚠️ No announcements found in time window');
                                }
                            } else {
                                console.error('❌ Failed to query announcements:', response.status);
                            }
                        } catch (err) {
                            console.error('❌ Error querying announcements:', err);
                        }
                    }
                    
                    // If still not found, navigate to announcements page anyway
                    // User can see all announcements
                    if (!targetAnnouncementId) {
                        console.log('⚠️ No announcementId found, navigating to announcements page without scroll');
                        const timestamp = Date.now();
                        navigate('/announcements', { 
                            replace: false,
                            state: { 
                                scrollTimestamp: timestamp
                            } 
                        });
                        
                        // Mark as read in background
                        if (!isRead) {
                            markNotificationAsRead(notification.id).then(() => {
                                setNotifications(prev => 
                                    prev.map(notif => 
                                        notif.id === notification.id 
                                            ? { ...notif, is_read: true }
                                            : notif
                                    )
                                );
                                if (onNotificationRead) {
                                    onNotificationRead();
                                }
                            }).catch(err => {
                                console.error('Error marking notification as read:', err);
                            });
                        }
                        return;
                    }
                }
                
                console.log('📢 Navigating to announcement:', targetAnnouncementId);
                // Force navigation by using replace: false and adding unique timestamp
                // Each click will have a different timestamp, ensuring useEffect runs again
                const timestamp = Date.now();
                navigate('/announcements', { 
                    replace: false, // Don't replace to ensure new navigation entry
                    state: { 
                        scrollToAnnouncementId: targetAnnouncementId,
                        scrollTimestamp: timestamp // Unique timestamp for each click
                    } 
                });
                
                // Mark as read in background
                if (!isRead) {
                    markNotificationAsRead(notification.id).then(() => {
                        setNotifications(prev => 
                            prev.map(notif => 
                                notif.id === notification.id 
                                    ? { ...notif, is_read: true }
                                    : notif
                            )
                        );
                        if (onNotificationRead) {
                            onNotificationRead();
                        }
                    }).catch(err => {
                        console.error('Error marking notification as read:', err);
                    });
                }
                return;
            }
            
            // Use postId and commentId from direct fields (preferred) or dataObj (backward compatibility)
            // Already extracted above, but log for clarity
            console.log('📋 Post/Comment navigation:', {
                'postId': postId,
                'commentId': commentId,
                'type': type
            });
            
            // If no postId found, try to get it from commentId if available
            if (!postId && commentId) {
                
                if (commentId) {
                    // Query the specific comment to get its postId
                    console.log('🔍 Looking up postId from commentId:', commentId);
                    fetch(
                        `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments?id=eq.${commentId}&select=postId`,
                        {
                            headers: {
                                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY',
                                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY'
                            }
                        }
                    )
                    .then(response => response.json())
                    .then(comments => {
                        if (comments && comments.length > 0 && comments[0].postId) {
                            const resolvedPostId = comments[0].postId;
                            const resolvedCommentId = comments[0].id || commentId;
                            console.log('✅ Resolved postId from commentId:', { postId: resolvedPostId, commentId: resolvedCommentId });
                            navigate('/home', { 
                                state: { 
                                    scrollToPostId: resolvedPostId,
                                    scrollToCommentId: resolvedCommentId 
                                } 
                            });
                        } else {
                            console.warn('⚠️ Comment not found or has no postId:', commentId);
                        }
                    })
                    .catch(err => {
                        console.error('❌ Error resolving postId from commentId:', err);
                    });
                    return; // Exit early, navigation will happen in async callback
                } else {
                    // Fallback: Try to find postId by matching notification timestamp with comment/like timestamp
                    const isComment = notification.title === 'comment' || 
                                    notification.title === 'Đã bình luận vào bài viết của bạn' ||
                                    notification.title.includes('bình luận');
                    const isLike = notification.title === 'like' || 
                                  notification.title === 'Đã thích bài viết của bạn' ||
                                  notification.title.includes('thích');
                    
                    if ((isComment || isLike) && notification.senderId && notification.receiverId) {
                        // Calculate time window: notification.created_at ± 5 minutes
                        const notificationTime = new Date(notification.created_at);
                        const timeWindowStart = new Date(notificationTime.getTime() - 5 * 60 * 1000).toISOString();
                        const timeWindowEnd = new Date(notificationTime.getTime() + 5 * 60 * 1000).toISOString();
                        
                        console.log('🔍 Fallback: Searching for comment/like near notification time:', {
                            notificationTime: notification.created_at,
                            window: { start: timeWindowStart, end: timeWindowEnd }
                        });
                        
                        if (isComment) {
                            // Find comment by senderId on receiver's posts, created near notification time
                            fetch(
                                `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/posts?userId=eq.${notification.receiverId}&select=id`,
                                {
                                    headers: {
                                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY',
                                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY'
                                    }
                                }
                            )
                            .then(postsResponse => postsResponse.json())
                            .then(posts => {
                                if (!posts || posts.length === 0) {
                                    console.warn('⚠️ No posts found for receiver in fallback');
                                    return;
                                }
                                const postIds = posts.map(p => p.id).join(',');
                                // Find comments by senderId on receiver's posts, created near notification time
                                // Get multiple comments to find the one closest to notification time
                                return fetch(
                                    `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments?userId=eq.${notification.senderId}&postId=in.(${postIds})&created_at=gte.${timeWindowStart}&created_at=lte.${timeWindowEnd}&order=created_at.desc&limit=20&select=id,postId,created_at`,
                                    {
                                        headers: {
                                            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY',
                                            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY'
                                        }
                                    }
                                );
                            })
                            .then(commentResponse => commentResponse ? commentResponse.json() : null)
                            .then(commentData => {
                                if (commentData && commentData.length > 0) {
                                    // Find comment with created_at closest to notification.created_at
                                    const notificationTime = new Date(notification.created_at).getTime();
                                    let closestComment = commentData[0];
                                    let minTimeDiff = Math.abs(new Date(commentData[0].created_at).getTime() - notificationTime);
                                    
                                    for (const comment of commentData) {
                                        const timeDiff = Math.abs(new Date(comment.created_at).getTime() - notificationTime);
                                        if (timeDiff < minTimeDiff) {
                                            minTimeDiff = timeDiff;
                                            closestComment = comment;
                                        }
                                    }
                                    
                                    if (closestComment.postId) {
                                        const resolvedPostId = closestComment.postId;
                                        const resolvedCommentId = closestComment.id;
                                        console.log('✅ Fallback: Found postId from closest comment timestamp match:', {
                                            postId: resolvedPostId,
                                            commentId: resolvedCommentId,
                                            commentTime: closestComment.created_at,
                                            notificationTime: notification.created_at,
                                            timeDiffSeconds: Math.round(minTimeDiff / 1000)
                                        });
                                        navigate('/home', { 
                                            state: { 
                                                scrollToPostId: resolvedPostId,
                                                scrollToCommentId: resolvedCommentId 
                                            } 
                                        });
                                    } else {
                                        console.warn('⚠️ Fallback: Closest comment has no postId');
                                    }
                                } else {
                                    console.warn('⚠️ Fallback: No matching comment found near notification time');
                                }
                            })
                            .catch(err => {
                                console.error('❌ Error in fallback comment search:', err);
                            });
                        } else if (isLike) {
                            // Find like by senderId on receiver's posts, created near notification time
                            fetch(
                                `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/posts?userId=eq.${notification.receiverId}&select=id`,
                                {
                                    headers: {
                                        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY',
                                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY'
                                    }
                                }
                            )
                            .then(postsResponse => postsResponse.json())
                            .then(posts => {
                                if (!posts || posts.length === 0) {
                                    console.warn('⚠️ No posts found for receiver in fallback');
                                    return;
                                }
                                const postIds = posts.map(p => p.id).join(',');
                                // Find likes by senderId on receiver's posts, created near notification time
                                // Get multiple likes to find the one closest to notification time
                                return fetch(
                                    `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/postLikes?userId=eq.${notification.senderId}&postId=in.(${postIds})&created_at=gte.${timeWindowStart}&created_at=lte.${timeWindowEnd}&order=created_at.desc&limit=20&select=postId,created_at`,
                                    {
                                        headers: {
                                            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY',
                                            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY'
                                        }
                                    }
                                );
                            })
                            .then(likeResponse => likeResponse ? likeResponse.json() : null)
                            .then(likeData => {
                                if (likeData && likeData.length > 0) {
                                    // Find like with created_at closest to notification.created_at
                                    const notificationTime = new Date(notification.created_at).getTime();
                                    let closestLike = likeData[0];
                                    let minTimeDiff = Math.abs(new Date(likeData[0].created_at).getTime() - notificationTime);
                                    
                                    for (const like of likeData) {
                                        const timeDiff = Math.abs(new Date(like.created_at).getTime() - notificationTime);
                                        if (timeDiff < minTimeDiff) {
                                            minTimeDiff = timeDiff;
                                            closestLike = like;
                                        }
                                    }
                                    
                                    if (closestLike.postId) {
                                        const resolvedPostId = closestLike.postId;
                                        console.log('✅ Fallback: Found postId from closest like timestamp match:', {
                                            postId: resolvedPostId,
                                            likeTime: closestLike.created_at,
                                            notificationTime: notification.created_at,
                                            timeDiffSeconds: Math.round(minTimeDiff / 1000)
                                        });
                                        navigate('/home', { state: { scrollToPostId: resolvedPostId } });
                                    } else {
                                        console.warn('⚠️ Fallback: Closest like has no postId');
                                    }
                                } else {
                                    console.warn('⚠️ Fallback: No matching like found near notification time');
                                }
                            })
                            .catch(err => {
                                console.error('❌ Error in fallback like search:', err);
                            });
                        } else {
                            console.warn('⚠️ Notification has no postId or commentId and cannot determine type:', {
                                notificationId: notification.id,
                                title: notification.title,
                                dataKeys: Object.keys(dataObj || {}),
                                dataObj
                            });
                        }
                        return; // Exit early, navigation will happen in async callback
                    } else {
                        // No postId and no commentId - cannot navigate accurately
                        console.warn('⚠️ Notification has no postId or commentId, cannot navigate:', {
                            notificationId: notification.id,
                            title: notification.title,
                            dataKeys: Object.keys(dataObj || {}),
                            dataObj
                        });
                        return;
                    }
                }
            }
            
            // If we have postId, navigate immediately
            if (postId) {
                // Use type field or check title pattern
                const isComment = type === 'comment' || 
                                notification.title === 'comment' || 
                                notification.title === 'Đã bình luận vào bài viết của bạn' ||
                                notification.title.includes('bình luận');
                const isLike = type === 'like' || 
                              notification.title === 'like' || 
                              notification.title === 'Đã thích bài viết của bạn' ||
                              notification.title.includes('thích');
                
                console.log('📍 Navigating to post:', postId, 'isComment:', isComment, 'isLike:', isLike, 'commentId:', commentId, 'type:', type);
                
                // Navigate to home page with state to trigger post fetch and scroll
                navigate('/home', { 
                    state: { 
                        scrollToPostId: postId,
                        scrollToCommentId: commentId || undefined 
                    } 
                });
                
                // Mark as read in background (don't wait for it)
                if (!isRead) {
                    markNotificationAsRead(notification.id).then(() => {
                        // Update local state after marking as read
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notification.id 
                            ? { ...notif, is_read: true }
                            : notif
                    )
                );
                
                // Notify parent to update unread count
                if (onNotificationRead) {
                    onNotificationRead();
                }
                    }).catch(err => {
                        console.error('Error marking notification as read:', err);
                    });
                }
            } else {
                console.warn('⚠️ Notification has no postId:', notification);
            }
        } catch (error) {
            console.error('❌ Error handling notification click:', error);
        }
    };

    const getNotificationIcon = (title) => {
        switch (title) {
            case 'like':
                return '👍';
            case 'comment':
                return '💬';
            default:
                return '🔔';
        }
    };

    const getNotificationText = (notification) => {
        const senderName = notification.sender?.name || 'Ai đó';
        
        // Always use sender name + custom text
        if (notification.title && notification.title.includes('bình luận')) {
            return `${senderName} đã bình luận bài viết của bạn`;
        }
        if (notification.title && notification.title.includes('thích')) {
            return `${senderName} đã thích bài viết của bạn`;
        }
        
        // New format with short titles
        switch (notification.title) {
            case 'like':
                return `${senderName} đã thích bài viết của bạn`;
            case 'comment':
                return `${senderName} đã bình luận bài viết của bạn`;
            default:
                return `${senderName} - ${notification.title || 'Thông báo mới'}`;
        }
    };

    const formatTime = (createdAt) => {
        const now = new Date();
        const notificationTime = new Date(createdAt);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} ngày trước`;
    };

    // Deduplicate notifications by ID before rendering
    const uniqueNotifications = useMemo(() => {
        const seen = new Set();
        return notifications.filter(notification => {
            if (!notification.id) return false; // Skip notifications without ID
            if (seen.has(notification.id)) {
                console.warn('⚠️ Duplicate notification ID found:', notification.id);
                return false;
            }
            seen.add(notification.id);
            return true;
        });
    }, [notifications]);

    if (!isOpen) return null;

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            <div className="notification-header">
                <h3>Thông báo</h3>
            </div>
            <div className="notification-content" ref={contentRef}>
                {loading ? (
                    <div className="notification-loading">
                        <div className="loading-spinner"></div>
                        <span>Đang tải thông báo...</span>
                    </div>
                ) : uniqueNotifications.length === 0 ? (
                    <div className="notification-empty">
                        <p>Chưa có thông báo nào</p>
                    </div>
                ) : (
                    <>
                        {uniqueNotifications.map((notification, index) => (
                            <div 
                                key={notification.id || `notification-${index}-${notification.created_at}`} 
                                className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="notification-avatar">
                                    <Avatar 
                                        src={notification.sender?.image || null} 
                                        name={notification.sender?.name || 'Người dùng'}
                                        size={32}
                                    />
                                </div>
                                <div className="notification-text">
                                    <p>{getNotificationText(notification)}</p>
                                    <span className="notification-time">
                                        {formatTime(notification.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {uniqueNotifications.length > 0 && (
                            <div className="notification-view-more">
                                    {loadingMore ? (
                                    <div className="notification-loading-more">
                                            <div className="loading-spinner-small"></div>
                                        <span>Đang tải thêm...</span>
                                    </div>
                                ) : !hasMore ? (
                                    <div className="notification-end">
                                        <span>Đã xem hết thông báo</span>
                                    </div>
                                ) : (
                                    <div className="notification-hint">
                                        <span>Cuộn xuống để xem thêm</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;




