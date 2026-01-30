import { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import RealtimeTime from './RealtimeTime';
import useRealtimeComments from '../hooks/useRealtimeComments';
import './CommentModal.css';

const CommentModal = ({ 
    isOpen, 
    onClose, 
    post, 
    currentUser,
    onPostUpdate
}) => {
    const [newComment, setNewComment] = useState('');
    const commentsEndRef = useRef(null);
    const commentsStartRef = useRef(null);
    const [isLiked, setIsLiked] = useState(post?.isLiked || false);
    const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
    const [liking, setLiking] = useState(false);

    // Use real-time comments hook
    const {
        comments,
        loading: loadingComments,
        error,
        addComment,
        addReply,
        likeComment,
        deleteComment
    } = useRealtimeComments(post?.id, currentUser, []);

    // Sync state with post prop
    useEffect(() => {
        if (post) {
            setIsLiked(post.isLiked || false);
            setLikesCount(post.likes_count || 0);
        }
    }, [post]);

    // Debug post data
    useEffect(() => {
        if (isOpen && post) {
        }
    }, [isOpen, post, comments]);

    // Handle like/unlike post
    const handleLike = async () => {
        if (!post || !currentUser || liking) return;

        setLiking(true);
        
        // Optimistic update
        const newIsLiked = !isLiked;
        const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
        setIsLiked(newIsLiked);
        setLikesCount(newLikesCount);
        
        // Notify parent immediately for real-time update
        if (onPostUpdate) {
            onPostUpdate({
                ...post,
                isLiked: newIsLiked,
                likes_count: newLikesCount
            });
        }

        try {
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

            // Check if user already liked
            const checkLikeUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/postLikes?postId=eq.${post.id}&userId=eq.${currentUser.id}`;
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
                    // Unlike - delete like (user already liked, so we're unliking)
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
                        console.log('✅ Unlike successful');
                        // Callback already called after optimistic update, no need to call again
                    } else {
                        // Rollback on error
                        setIsLiked(!newIsLiked);
                        setLikesCount(likesCount);
                        // Rollback in parent as well
                        if (onPostUpdate) {
                            onPostUpdate({
                                ...post,
                                isLiked: !newIsLiked,
                                likes_count: likesCount
                            });
                        }
                    }
                } else {
                    // Like - add new like (user hasn't liked yet, so we're liking)
                    const addLikeUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1/postLikes';
                    const addResponse = await fetch(addLikeUrl, {
                        method: 'POST',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            postId: post.id,
                            userId: currentUser.id
                        })
                    });

                    if (addResponse.ok) {
                        console.log('✅ Like successful');
                        // Callback already called after optimistic update, no need to call again
                    } else {
                        // Rollback on error
                        setIsLiked(!newIsLiked);
                        setLikesCount(likesCount);
                        // Rollback in parent as well
                        if (onPostUpdate) {
                            onPostUpdate({
                                ...post,
                                isLiked: !newIsLiked,
                                likes_count: likesCount
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error toggling like:', error);
            // Rollback on error
            setIsLiked(!newIsLiked);
            setLikesCount(likesCount);
            // Rollback in parent as well
            if (onPostUpdate) {
                onPostUpdate({
                    ...post,
                    isLiked: !newIsLiked,
                    likes_count: likesCount
                });
            }
        } finally {
            setLiking(false);
        }
    };

    const scrollToComments = () => {
        // Scroll to the comments section
        setTimeout(() => {
            const commentsSection = document.querySelector('.comment-modal-comments');
            if (commentsSection) {
                commentsSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 100);
    };

    useEffect(() => {
        if (isOpen) {
            scrollToComments();
            // Disable body scroll
            document.body.classList.add('modal-open');
        } else {
            // Enable body scroll
            document.body.classList.remove('modal-open');
        }
        
        // Cleanup on unmount
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [comments, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newComment.trim() && currentUser) {
            try {
                await addComment(newComment.trim());
                setNewComment('');
                scrollToComments();
            } catch (error) {
                console.error('Error adding comment:', error);
            }
        }
    };

    return (
        <div className="comment-modal-overlay" onClick={onClose}>
            <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="comment-modal-header">
                    <h2 className="comment-modal-title">Bình luận</h2>
                    <button 
                        className="comment-modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="comment-modal-content">
                    {/* Post Content */}
                    <div className="comment-modal-post">
                        <div className="post-header">
                            <Avatar 
                                src={post?.user?.image || post?.users?.image} 
                                name={post?.user?.name || post?.users?.name} 
                                size={40} 
                            />
                            <div className="post-user-info">
                                <span className="post-user-name">
                                    {post?.user?.name || post?.users?.name || 'Unknown User'}
                                </span>
                                <RealtimeTime 
                                    timestamp={post?.created_at}
                                    className="post-time"
                                />
                            </div>
                        </div>
                        
                        <div className="post-content">
                            <p className="post-text">{post?.content || post?.body || 'Không có nội dung'}</p>
                            
                            {/* Post Images */}
                            {post?.images && post.images.length > 0 && (
                                <div className="post-images">
                                    {post.images.map((image, index) => {
                                        // Process image URL - handle both full URLs and relative paths
                                        let imageUrl = image;
                                        if (imageUrl && !imageUrl.startsWith('http')) {
                                            // If it's a relative path, construct full Supabase storage URL
                                            if (imageUrl.startsWith('postImages/') || imageUrl.startsWith('upload/')) {
                                                imageUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/storage/v1/object/public/upload/${imageUrl}`;
                                            } else {
                                                // Fallback: try upload bucket
                                                imageUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/storage/v1/object/public/upload/${imageUrl}`;
                                            }
                                        }
                                        
                                        return (
                                            <img 
                                                key={index}
                                                src={imageUrl} 
                                                alt={`Post image ${index + 1}`}
                                                className="post-image"
                                                onError={(e) => {
                                                    console.error('Failed to load image:', imageUrl, 'Original:', image);
                                                    e.target.style.display = 'none';
                                                }}
                                                onLoad={() => {
                                                    console.log('Image loaded successfully:', imageUrl);
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* Single Post Image */}
                            {post?.image && !post?.images && (() => {
                                // Process image URL - handle both full URLs and relative paths
                                let imageUrl = post.image;
                                if (imageUrl && !imageUrl.startsWith('http')) {
                                    // If it's a relative path, construct full Supabase storage URL
                                    if (imageUrl.startsWith('postImages/') || imageUrl.startsWith('upload/')) {
                                        imageUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/storage/v1/object/public/upload/${imageUrl}`;
                                    } else {
                                        // Fallback: try upload bucket
                                        imageUrl = `https://oqtlakdvlmkaalymgrwd.supabase.co/storage/v1/object/public/upload/${imageUrl}`;
                                    }
                                }
                                
                                return (
                                    <div className="post-images">
                                        <img 
                                            src={imageUrl} 
                                            alt="Post content"
                                            className="post-image"
                                            onError={(e) => {
                                                console.error('Failed to load image:', imageUrl, 'Original:', post.image);
                                                e.target.style.display = 'none';
                                            }}
                                            onLoad={() => {
                                                console.log('Image loaded successfully:', imageUrl);
                                            }}
                                        />
                                    </div>
                                );
                            })()}
                            
                            {/* Debug: Show if no images */}
                            {(!post?.images || post.images.length === 0) && !post?.image && (
                                <div style={{fontSize: '12px', color: '#999', marginTop: '8px'}}>
                                    Debug: No images found. Post.images = {JSON.stringify(post?.images)}, Post.image = {JSON.stringify(post?.image)}
                                </div>
                            )}
                            
                            {/* Post Video */}
                            {post?.video && (
                                <div className="post-video">
                                    <video 
                                        src={post.video} 
                                        controls
                                        className="post-video-player"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}
                        </div>
                        
                        {/* Post Stats */}
                        <div className="post-stats">
                            <div className="post-likes">
                                {likesCount > 0 && (
                                    <span className="likes-count">
                                        <span className={`heart-icon ${isLiked ? 'liked' : ''}`}>♥</span> {likesCount} lượt thích
                                    </span>
                                )}
                            </div>
                            <div className="post-comments-count">
                                {post?.comments_count > 0 && (
                                    <span className="comments-count">
                                        💬 {post.comments_count} bình luận
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Post Actions */}
                        <div className="post-actions">
                            <button 
                                className={`action-button like-btn ${isLiked ? 'liked' : ''}`}
                                onClick={handleLike}
                                disabled={liking || !currentUser}
                            >
                                <span className="action-icon">
                                    <span className={`heart-icon ${isLiked ? 'liked' : ''}`}>♥</span>
                                </span>
                                <span className="action-text">{isLiked ? 'Đã thích' : 'Thích'}</span>
                            </button>
                            <button className="action-button comment-btn">
                                <span className="action-icon">💬</span>
                                <span className="action-text">Bình luận</span>
                            </button>
                            <button className="action-button share-btn">
                                <span className="action-icon">📤</span>
                                <span className="action-text">Chia sẻ</span>
                            </button>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="comment-modal-comments">
                        {loadingComments ? (
                            <div className="loading-comments">
                                <p>Đang tải bình luận...</p>
                            </div>
                        ) : error ? (
                            <div className="error-comments">
                                <p>Lỗi khi tải bình luận: {error}</p>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="no-comments">
                                <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                            </div>
                        ) : (
                            <div className="comments-list">
                                {comments.map((comment, index) => (
                                    <div 
                                        key={comment.id} 
                                        id={`comment-${comment.id}`}
                                        data-comment-id={comment.id}
                                        className="comment-item"
                                        ref={index === 0 ? commentsStartRef : null}
                                    >
                                        <div className="comment-header">
                                            <Avatar 
                                                src={comment.user?.image || comment.users?.image} 
                                                name={comment.user?.name || comment.users?.name} 
                                                size={32} 
                                            />
                                            <div className="comment-content">
                                                <div className="comment-user-info">
                                                    <span className="comment-user-name">
                                                        {comment.user?.name || comment.users?.name || 'Unknown User'}
                                                    </span>
                                                </div>
                                                <p>{comment.content}</p>
                                            </div>
                                        </div>
                                        <div className="comment-actions">
                                            <RealtimeTime 
                                                timestamp={comment.created_at}
                                                className="comment-time"
                                            />
                                            <button 
                                                className="comment-action-btn"
                                                onClick={() => likeComment(comment.id)}
                                            >
                                                <span className={`heart-icon ${comment.isLiked ? 'liked' : ''}`}>♥</span>
                                                <span>Thích</span>
                                                {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                                            </button>
                                            <button className="comment-action-btn">
                                                💬 Trả lời
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div ref={commentsEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Comment Input */}
                    <div className="comment-modal-input">
                        <form onSubmit={handleSubmit} className="comment-input-wrapper">
                            <Avatar 
                                src={currentUser?.image} 
                                name={currentUser?.name} 
                                size={32}
                                style={{ 
                                    marginTop: '10px',
                                    alignSelf: 'flex-start'
                                }}
                            />
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Viết bình luận..."
                                className="comment-input-textarea"
                                rows="1"
                            />
                            <button 
                                type="submit"
                                className="comment-input-send"
                                disabled={!newComment.trim()}
                            >
                                ➤
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentModal;


