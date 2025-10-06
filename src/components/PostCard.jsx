import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getSupabaseFileUrl } from '../services/imageService';
import Avatar from './Avatar';
import './PostCard.css';

const PostCard = ({
    item,
    currentUser,
    hasShadow = true,
    showMoreIcon = true,
    showDelete = false,
    onDelete = () => {},
    onEdit = () => {},
}) => {
    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLikes(item?.likes || []);
    }, [item]);

    const openPostDetails = () => {
        if (!showMoreIcon) return null;
        // Navigate to post details if needed
        console.log('Open post details:', item?.id);
    };

    const onLike = async () => {
        try {
            if (liked) {
                const updatedLikes = likes.filter(like => like.userId !== currentUser?.id);
                setLikes([...updatedLikes]);
                
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('postId', item?.id)
                    .eq('userId', currentUser?.id);

                if (error) {
                    setLikes([...likes]); // Revert on error
                    console.error('Remove like failed:', error);
                }
            } else {
                const data = {
                    userId: currentUser?.id,
                    postId: item?.id,
                };
                setLikes([...likes, data]);
                
                const { error } = await supabase
                    .from('likes')
                    .insert(data);

                if (error) {
                    setLikes(likes.filter(like => like.userId !== currentUser?.id)); // Revert on error
                    console.error('Add like failed:', error);
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
                console.log('Share cancelled');
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
        <div className={`post-card ${hasShadow ? 'post-card-shadow' : ''}`}>
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
                
                {item?.file && item?.file.includes('postImages') && (
                    <img
                        src={getSupabaseFileUrl(item?.file)}
                        alt="Post image"
                        className="post-media"
                    />
                )}
                
                {item?.file && item?.file.includes('postVideos') && (
                    <video
                        src={getSupabaseFileUrl(item?.file)}
                        controls
                        className="post-media post-video"
                    />
                )}
            </div>

            <div className="post-footer">
                <div className="post-footer-btn">
                    <button 
                        className={`post-action-btn ${liked ? 'liked' : ''}`}
                        onClick={onLike}
                    >
                        {liked ? '❤️' : '🤍'}
                    </button>
                    <span className="post-count">{likes.length}</span>
                </div>
                
                <div className="post-footer-btn">
                    <button 
                        className="post-action-btn"
                        onClick={openPostDetails}
                    >
                        💬
                    </button>
                    <span className="post-count">{item?.comments?.[0]?.count || 0}</span>
                </div>
                
                <div className="post-footer-btn">
                    {loading ? (
                        <div className="post-loading">⏳</div>
                    ) : (
                        <button 
                            className="post-action-btn"
                            onClick={onShare}
                        >
                            📤
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostCard;

