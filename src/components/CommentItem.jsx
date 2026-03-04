import React from 'react';
import Avatar from './Avatar';
import './CommentItem.css';

const CommentItem = ({
    item,
    canDelete = false,
    onDelete = () => { },
    highlight = false,
}) => {
    const createdAt = new Date(item?.created_at).toLocaleDateString('vi-VN');

    const handleDelete = () => {
        if (window.confirm('Bạn có chắc muốn xoá bình luận này?')) {
            onDelete(item);
        }
    };

    return (
        <div 
            className={`comment-item ${highlight ? 'highlight' : ''}`}
            data-comment-id={item?.id}
            id={`comment-${item?.id}`}
        >
            <Avatar uri={item?.user?.image} size={32} />
            <div className="comment-content">
                <div className="comment-header">
                    <div className="comment-name-container">
                        <span className="comment-name">{item?.user?.name}</span>
                        <span className="comment-separator">•</span>
                        <span className="comment-time">{createdAt}</span>
                    </div>

                    {canDelete && (
                        <button className="comment-delete-btn" onClick={handleDelete}>
                            🗑️
                        </button>
                    )}
                </div>
                <p className="comment-text">{item?.text}</p>
            </div>
        </div>
    );
};

export default CommentItem;

