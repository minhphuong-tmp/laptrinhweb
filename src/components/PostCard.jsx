import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getSupabaseFileUrl } from '../services/imageService';
import { createPostLike, removePostLike } from '../services/postService';
import { scrollReveal, cardHover, cardTap } from '../utils/animations';
import Avatar from './Avatar';
import './PostCard.css';

const PostCard = ({
    item,
    currentUser,
    hasShadow = true,
    showMoreIcon = true,
    showDelete = false,
    onDelete = () => { },
    onEdit = () => { },
}) => {
    const navigate = useNavigate();
    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Support both 'likes' and 'postLikes' for compatibility
        setLikes(item?.likes || item?.postLikes || []);
    }, [item]);

    const openPostDetails = () => {
        if (!showMoreIcon) return null;
        navigate(`/post/${item?.id}`);
    };

    const onLike = async () => {
        try {
            if (liked) {
                const updatedLikes = likes.filter(like => like.userId !== currentUser?.id);
                setLikes([...updatedLikes]);

                const res = await removePostLike(item?.id, currentUser?.id);
                if (!res.success) {
                    setLikes([...likes]); // Revert on error
                    console.error('Remove like failed:', res.msg);
                }
            } else {
                const data = {
                    userId: currentUser?.id,
                    postId: item?.id,
                };
                setLikes([...likes, data]);

                const res = await createPostLike(data);
                if (!res.success) {
                    setLikes(likes.filter(like => like.userId !== currentUser?.id)); // Revert on error
                    console.error('Add like failed:', res.msg);
                }
            }
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handlePostEdit = () => {
        onEdit(item);
    };

    const handlePostDelete = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
            onDelete(item);
        }
    };

    const onShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Bài đăng từ LinkUp',
                    text: item?.body?.replace(/<[^>]*>/g, '') || '',
                    url: window.location.href,
                });
            } catch (error) {
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link đã được copy vào clipboard!');
        }
    };

    const createdAt = new Date(item?.createdAt || item?.created_at).toLocaleDateString('vi-VN');
    const liked = likes.some(like => like.userId === currentUser?.id);

    return (
        <motion.div
            className={`post-card ${hasShadow ? 'post-card-shadow' : ''}`}
            data-post-id={item?.id}
            id={`post-${item?.id}`}
            {...scrollReveal}
            whileHover={cardHover}
            whileTap={cardTap}
        >
            <div className="post-header">
                <div className="post-user-info">
                    <Avatar
                        src={item?.users?.image || item?.user?.image}
                        name={item?.users?.name || item?.user?.name || 'Unknown User'}
                        size={40}
                    />
                    <div className="post-user-details">
                        <div className="post-username">
                            {item?.users?.name || item?.user?.name || 'Unknown User'}
                        </div>
                        <div className="post-time">{createdAt}</div>
                    </div>
                </div>

                {showMoreIcon && (
                    <button
                        className="post-more-btn"
                        onClick={openPostDetails}
                    >
                        ⋯
                    </button>
                )}

                {showDelete && currentUser?.id === (item?.users?.id || item?.user?.id) && (
                    <div className="post-actions">
                        <button
                            className="post-action-btn"
                            onClick={handlePostEdit}
                        >
                            ✏️
                        </button>
                        <button
                            className="post-action-btn post-delete-btn"
                            onClick={handlePostDelete}
                        >
                            🗑️
                        </button>
                    </div>
                )}
            </div>

            <div className="post-content">
                <div className="post-body">
                    {item?.body && (
                        <div
                            className="post-text"
                            dangerouslySetInnerHTML={{ __html: item.body }}
                        />
                    )}
                </div>

                {/* Hiển thị ảnh/video */}
                {item?.file && (
                    <>
                        {item.file.includes('postImages') || item.file.includes('.png') || item.file.includes('.jpg') || item.file.includes('.jpeg') ? (
                            <motion.img
                                src={item.file}
                                alt="Post image"
                                className="post-media"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                                onLoad={() => {
                                }}
                            />
                        ) : item.file.includes('postVideos') || item.file.includes('.mp4') || item.file.includes('.mov') ? (
                            <video
                                src={item.file}
                                controls
                                className="post-media post-video"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="post-media post-unknown">
                                <p>Unsupported file type</p>
                                <a href={item.file} target="_blank" rel="noopener noreferrer">
                                    View file
                                </a>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="post-footer">
                <div className="post-footer-btn">
                    <motion.button
                        className={`post-action-btn ${liked ? 'liked' : ''}`}
                        onClick={onLike}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {liked ? '❤️' : '🤍'}
                    </motion.button>
                    <span className="post-count">{likes.length}</span>
                </div>

                <div className="post-footer-btn">
                    <motion.button
                        className="post-action-btn"
                        onClick={openPostDetails}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        💬
                    </motion.button>
                    <span className="post-count">
                        {item?.comments?.[0]?.count || item?.comments?.length || 0}
                    </span>
                </div>

                <div className="post-footer-btn">
                    {loading ? (
                        <div className="post-loading">⏳</div>
                    ) : (
                        <motion.button
                            className="post-action-btn"
                            onClick={onShare}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            📤
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PostCard;

