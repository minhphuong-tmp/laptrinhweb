import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './Posts.css';

const Posts = () => {
    const { userData } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewPost, setShowNewPost] = useState(false);
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        image: null
    });

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    users:user_id (
                        id,
                        name,
                        image
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.title.trim() || !newPost.content.trim()) return;

        try {
            const { error } = await supabase
                .from('posts')
                .insert({
                    title: newPost.title,
                    content: newPost.content,
                    user_id: userData.id,
                    image: newPost.image
                })
                .select();

            if (error) throw error;

            setNewPost({ title: '', content: '', image: null });
            setShowNewPost(false);
            loadPosts();
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    const handleLike = async (postId) => {
        try {
            const { error } = await supabase
                .from('post_likes')
                .insert({
                    post_id: postId,
                    user_id: userData.id
                });

            if (error) throw error;
            loadPosts();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    if (loading) {
        return (
            <div className="posts-container">
                <div className="loading">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="posts-container">
            <div className="posts-header">
                <h2>Bài viết</h2>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowNewPost(true)}
                >
                    + Tạo bài viết
                </button>
            </div>

            {showNewPost && (
                <div className="new-post-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Tạo bài viết mới</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowNewPost(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreatePost} className="new-post-form">
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Tiêu đề bài viết..."
                                    value={newPost.title}
                                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <textarea
                                    placeholder="Nội dung bài viết..."
                                    value={newPost.content}
                                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                                    className="form-textarea"
                                    rows="6"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button 
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowNewPost(false)}
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Đăng bài
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="posts-list">
                {posts.length === 0 ? (
                    <div className="empty-state">
                        <p>Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="post-card">
                            <div className="post-header">
                                <div className="post-author">
                                    <Avatar 
                                        src={post.users?.image}
                                        name={post.users?.name}
                                        size={40}
                                        className="author-avatar"
                                    />
                                    <div className="author-info">
                                        <h4>{post.users?.name}</h4>
                                        <span className="post-date">
                                            {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="post-content">
                                <h3 className="post-title">{post.title}</h3>
                                <p className="post-text">{post.content}</p>
                                {post.image && (
                                    <img src={post.image} alt="Post" className="post-image" />
                                )}
                            </div>
                            
                            <div className="post-actions">
                                <button 
                                    className="action-btn"
                                    onClick={() => handleLike(post.id)}
                                >
                                    ❤️ {post.likes_count || 0}
                                </button>
                                <button className="action-btn">
                                    💬 {post.comments_count || 0}
                                </button>
                                <button className="action-btn">
                                    🔗 Chia sẻ
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Posts;
