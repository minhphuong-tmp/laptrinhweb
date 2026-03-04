import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from '../components/PostCard';
import CommentItem from '../components/CommentItem';
import { fetchPostDetails, createComment, removeComment } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import './PostDetails.css';

const PostDetailsPage = () => {
    const { id: postId } = useParams();
    const { user } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentLoading, setCommentLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (postId) {
            getPostDetails();
        }
    }, [postId]);

    const getPostDetails = async () => {
        setLoading(true);
        try {
            const res = await fetchPostDetails(postId);
            if (res.success) {
                setPost(res.data);
            } else {
                console.error('Error fetching post details:', res.msg);
            }
        } catch (error) {
            console.error('Error fetching post details:', error);
        } finally {
            setLoading(false);
        }
    };

    const onNewComment = async () => {
        if (!newComment.trim() || !post) return;

        const data = {
            postId: post.id,
            userId: user?.id,
            text: newComment.trim()
        };

        setCommentLoading(true);
        try {
            const res = await createComment(data);
            if (res.success) {
                // Thêm comment mới vào state
                setPost(prevPost => ({
                    ...prevPost,
                    comments: [res.data, ...prevPost.comments]
                }));
                setNewComment('');
                if (inputRef.current) {
                    inputRef.current.value = '';
                }
            } else {
                console.error('Error creating comment:', res.msg);
            }
        } catch (error) {
            console.error('Error creating comment:', error);
        } finally {
            setCommentLoading(false);
        }
    };

    const onDeleteComment = async (comment) => {
        try {
            const res = await removeComment(comment?.id);
            if (res.success) {
                setPost(prevPost => ({
                    ...prevPost,
                    comments: prevPost.comments.filter(c => c.id !== comment.id)
                }));
            } else {
                console.error('Error deleting comment:', res.msg);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onNewComment();
        }
    };

    if (loading) {
        return (
            <div className="post-details-center">
                <div className="loading-spinner">⏳</div>
                <p>Đang tải...</p>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="post-details-center">
                <p className="not-found">Không tìm thấy bài đăng</p>
            </div>
        );
    }

    return (
        <div className="post-details-container">
            <div className="post-details-content">
                {/* Post Card */}
                <PostCard
                    item={{ ...post, comments: [{ count: post?.comments?.length }] }}
                    currentUser={user}
                    hasShadow={false}
                    showMoreIcon={false}
                    showDelete={true}
                />

                {/* Comment Input */}
                <div className="comment-input-container">
                    <div className="comment-input-wrapper">
                        <textarea
                            ref={inputRef}
                            placeholder="Nhập bình luận..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="comment-input"
                            rows="2"
                        />
                    </div>

                    {commentLoading ? (
                        <div className="comment-loading">
                            <div className="loading-spinner">⏳</div>
                        </div>
                    ) : (
                        <button
                            className="comment-send-btn"
                            onClick={onNewComment}
                            disabled={!newComment.trim()}
                        >
                            📤
                        </button>
                    )}
                </div>

                {/* Comments List */}
                <div className="comments-container">
                    <h3 className="comments-title">Bình luận ({post?.comments?.length || 0})</h3>

                    {post?.comments?.map((comment, index) => (
                        <CommentItem
                            key={`comment-${comment?.id}-${index}`}
                            item={comment}
                            onDelete={onDeleteComment}
                            canDelete={user?.id === comment?.userId || user?.id === post?.userId}
                        />
                    ))}

                    {post?.comments?.length === 0 && (
                        <p className="no-comments">
                            Hãy là người bình luận đầu tiên
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetailsPage;