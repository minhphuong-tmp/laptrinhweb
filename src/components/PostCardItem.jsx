import React from 'react';
import Avatar from './Avatar';

const PostCardItem = React.memo(({ post, index }) => {
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Vừa xong';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} ngày trước`;
        if (diff < 2592000000) return `${Math.floor(diff / 604800000)} tuần trước`;
        return `${Math.floor(diff / 2592000000)} tháng trước`;
    };

    return (
        <div className="post-card" data-post-index={index}>
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
                <p className="post-text">{post.content || post.body || 'Không có nội dung'}</p>
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
                <div className="likes-count">
                    <span className="heart-icon">👍</span>
                    <span>{post.likes_count || 0}</span>
                </div>
                <div className="comments-count">
                    <span>💬</span>
                    <span>{post.comments_count || 0}</span>
                </div>
                <div className="shares-count">
                    <span>📤</span>
                    <span>0</span>
                </div>
            </div>

            <div className="post-actions">
                <button className="action-button like-btn">
                    <span className="action-icon">👍</span>
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
    );
});

PostCardItem.displayName = 'PostCardItem';

export default PostCardItem;


