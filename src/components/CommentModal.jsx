import { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import RealtimeTime from './RealtimeTime';
import useRealtimeComments from '../hooks/useRealtimeComments';
import './CommentModal.css';

const CommentModal = ({ 
    isOpen, 
    onClose, 
    post, 
    currentUser
}) => {
    const [newComment, setNewComment] = useState('');
    const commentsEndRef = useRef(null);
    const commentsStartRef = useRef(null);

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

    // Debug post data
    useEffect(() => {
        if (isOpen && post) {
            console.log('🔍 CommentModal - Post data:', post);
            console.log('🔍 CommentModal - Post keys:', Object.keys(post));
            console.log('🔍 CommentModal - Post images:', post.images);
            console.log('🔍 CommentModal - Post image:', post.image);
            console.log('🔍 CommentModal - Post video:', post.video);
            console.log('🔍 CommentModal - Post content:', post.content);
            console.log('🔍 CommentModal - Post body:', post.body);
            console.log('🔍 CommentModal - Post isLiked:', post.isLiked);
            console.log('🔍 CommentModal - Post likes_count:', post.likes_count);
            console.log('🔍 CommentModal - Comments:', comments);
        }
    }, [isOpen, post, comments]);

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
                                    {post.images.map((image, index) => (
                                        <img 
                                            key={index}
                                            src={image} 
                                            alt={`Post image ${index + 1}`}
                                            className="post-image"
                                            onError={(e) => {
                                                console.error('Failed to load image:', image);
                                                e.target.style.display = 'none';
                                            }}
                                            onLoad={() => {
                                                console.log('Image loaded successfully:', image);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            
                            {/* Single Post Image */}
                            {post?.image && !post?.images && (
                                <div className="post-images">
                                    <img 
                                        src={post.image} 
                                        alt="Post content"
                                        className="post-image"
                                        onError={(e) => {
                                            console.error('Failed to load image:', post.image);
                                            e.target.style.display = 'none';
                                        }}
                                        onLoad={() => {
                                            console.log('Image loaded successfully:', post.image);
                                        }}
                                    />
                                </div>
                            )}
                            
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
                                {post?.likes_count > 0 && (
                                    <span className="likes-count">
                                        <span className={`heart-icon ${post?.isLiked ? 'liked' : ''}`}>♥</span> {post.likes_count} lượt thích
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
                            <button className="action-button like-btn">
                                <span className="action-icon">♥</span>
                                <span className="action-text">Thích</span>
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


