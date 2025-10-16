import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const useRealtimeComments = (postId, currentUser, initialComments = []) => {
    const [comments, setComments] = useState(initialComments);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load comments from Supabase when postId changes
    useEffect(() => {
        if (!postId) return;

        const loadComments = async () => {
            setLoading(true);
            setError(null);

            try {
                const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

                // Load comments
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
                    
                    // Load users
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

                    // Format comments with user info
                    const formattedComments = commentsData.map(comment => {
                        const user = usersData.find(u => u.id === comment.userId);
                        return {
                            ...comment,
                            content: comment.text || comment.content || 'Không có nội dung',
                            user: {
                                id: comment.userId,
                                name: user?.name || 'Unknown User',
                                image: user?.image || null
                            },
                            likes: comment.likes || 0,
                            replies: comment.replies || []
                        };
                    });

                    
                    // If no comments, add a test comment for demo
                    if (formattedComments.length === 0) {
                        const testComment = {
                            id: 'test-' + Date.now(),
                            content: 'Đây là comment test để kiểm tra hiển thị',
                            user: {
                                id: currentUser?.id || 'test-user',
                                name: currentUser?.name || 'Test User',
                                image: currentUser?.image || null
                            },
                            created_at: new Date().toISOString(),
                            likes: 0,
                            replies: []
                        };
                        setComments([testComment]);
                    } else {
                        setComments(formattedComments);
                    }
                } else {
                    console.error('Failed to load comments:', commentsResponse.status);
                    const errorText = await commentsResponse.text();
                    console.error('Error details:', errorText);
                    setError('Không thể tải bình luận');
                }
            } catch (err) {
                console.error('Error loading comments:', err);
                setError('Không thể tải bình luận');
            } finally {
                setLoading(false);
            }
        };

        loadComments();
    }, [postId]);

    const addComment = useCallback(async (content, image = null, video = null) => {
        setLoading(true);
        setError(null);

        try {
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            // Prepare comment data
            const commentData = {
                postId: postId,
                userId: currentUser.id,
                text: content.trim(),
                created_at: new Date().toISOString()
            };

            // Add image/video if provided
            if (image) {
                commentData.image = 'placeholder-image-url';
            }
            if (video) {
                commentData.video = 'placeholder-video-url';
            }

            // Submit comment to Supabase
            const response = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments', {
                method: 'POST',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            });

            if (response.ok) {
                // Create new comment object for immediate UI update
                const newComment = {
                    id: Date.now().toString(),
                    content,
                    user: {
                        id: currentUser.id,
                        name: currentUser.name || 'Bạn',
                        image: currentUser.image || null
                    },
                    created_at: new Date().toISOString(),
                    image,
                    video,
                    likes: 0,
                    replies: []
                };

                setComments(prev => [...prev, newComment]);

                // Tạo thông báo comment (cần lấy post owner)

                return newComment;
            } else {
                const errorText = await response.text();
                console.error('Failed to submit comment:', errorText);
                throw new Error('Failed to submit comment');
            }
        } catch (err) {
            setError('Không thể thêm bình luận');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [postId]);

    const addReply = useCallback(async (commentId, content) => {
        setLoading(true);
        setError(null);

        try {
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

            // For now, we'll add replies as new comments with parent_id
            // In a real app, you might have a separate replies table
            const replyData = {
                postId: postId,
                userId: currentUser.id,
                text: content.trim(),
                parent_id: commentId,
                created_at: new Date().toISOString()
            };

            const response = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments', {
                method: 'POST',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(replyData)
            });

            if (response.ok) {
                const newReply = {
                    id: Date.now().toString(),
                    content,
                    user: {
                        id: currentUser.id,
                        name: currentUser.name || 'Bạn',
                        image: currentUser.image || null
                    },
                    created_at: new Date().toISOString(),
                    parent_id: commentId
                };

                setComments(prev => 
                    prev.map(comment => 
                        comment.id === commentId 
                            ? { ...comment, replies: [...(comment.replies || []), newReply] }
                            : comment
                    )
                );

                return newReply;
            } else {
                const errorText = await response.text();
                console.error('Failed to submit reply:', errorText);
                throw new Error('Failed to submit reply');
            }
        } catch (err) {
            setError('Không thể thêm phản hồi');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [postId, currentUser]);

    const likeComment = useCallback(async (commentId) => {
        try {
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

            // Update likes in Supabase
            const response = await fetch(`https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments?id=eq.${commentId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    likes: (comments.find(c => c.id === commentId)?.likes || 0) + 1
                })
            });

            if (response.ok) {
                setComments(prev => 
                    prev.map(comment => 
                        comment.id === commentId 
                            ? { ...comment, likes: (comment.likes || 0) + 1 }
                            : comment
                    )
                );
            } else {
                console.error('Failed to like comment');
            }
        } catch (err) {
            setError('Không thể thích bình luận');
        }
    }, [comments]);

    const deleteComment = useCallback(async (commentId) => {
        try {
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

            const response = await fetch(`https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/comments?id=eq.${commentId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setComments(prev => prev.filter(comment => comment.id !== commentId));
            } else {
                console.error('Failed to delete comment');
                setError('Không thể xóa bình luận');
            }
        } catch (err) {
            setError('Không thể xóa bình luận');
        }
    }, []);

    return {
        comments,
        loading,
        error,
        addComment,
        addReply,
        likeComment,
        deleteComment
    };
};

export default useRealtimeComments;
