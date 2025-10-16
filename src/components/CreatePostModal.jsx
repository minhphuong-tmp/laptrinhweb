import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserImageSrc } from '../services/imageService';
import { createPostWithImage } from '../services/postService';
import './CreatePostModal.css';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userImageUrl, setUserImageUrl] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(true);

    // Load user avatar
    useEffect(() => {
        if (!isOpen || !user) {
            setAvatarLoading(false);
            return;
        }

        const loadUserAvatar = async () => {
            setAvatarLoading(true);
            
            // Timeout để đảm bảo loading không bị stuck
            const timeout = setTimeout(() => {
                setAvatarLoading(false);
            }, 3000);

            try {
                if (user?.image) {
                    const imageSrc = await getUserImageSrc(user.image);
                    setUserImageUrl(imageSrc);
                } else {
                    setUserImageUrl(null);
                }
            } catch (error) {
                console.error('Error loading user avatar:', error);
                setUserImageUrl(null);
            } finally {
                clearTimeout(timeout);
                setAvatarLoading(false);
            }
        };

        loadUserAvatar();
    }, [isOpen, user?.image]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        
        if (!user?.id) {
            alert('Vui lòng đăng nhập để tạo bài viết!');
            return;
        }

        setLoading(true);
        try {
            console.log('Creating post:', { content, image, userId: user?.id });
            
            // Tạo bài viết với API thật
            const result = await createPostWithImage(content, image, user?.id);
            
            if (result.success) {
                console.log('✅ Post created successfully:', result.data);
                
                // Hiển thị thông báo thành công
                alert('Đăng bài viết thành công!');
                
                // Reset form
                setContent('');
                setImage(null);
                setImagePreview(null);
                
                // Close modal and notify parent
                onClose();
                if (onPostCreated) {
                    onPostCreated();
                }
            } else {
                console.error('❌ Failed to create post:', result.error);
                alert('Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setContent('');
            setImage(null);
            setImagePreview(null);
            setAvatarLoading(false);
            setUserImageUrl(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tạo bài viết mới</h2>
                    <button className="close-btn" onClick={handleClose} disabled={loading}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="post-author">
                        <div className="author-avatar">
                            {avatarLoading ? (
                                <div className="avatar-loading">
                                    <div className="loading-spinner"></div>
                                </div>
                            ) : (userImageUrl || user?.image) ? (
                                <img 
                                    src={userImageUrl || user.image} 
                                    alt={user?.name || 'User'} 
                                    onError={() => setUserImageUrl(null)}
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="author-info">
                            <div className="author-name">{user?.name || 'Người dùng'}</div>
                            <div className="post-privacy">
                                <span className="privacy-icon">🌍</span>
                                <span className="privacy-text">Công khai</span>
                            </div>
                        </div>
                    </div>

                    <div className="post-content">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Bạn đang nghĩ gì?"
                            className="post-textarea"
                            rows="4"
                            disabled={loading}
                        />
                        
                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Preview" />
                                <button 
                                    type="button" 
                                    className="remove-image-btn"
                                    onClick={() => {
                                        setImage(null);
                                        setImagePreview(null);
                                    }}
                                    disabled={loading}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="post-options">
                        <div className="option-group">
                            <label htmlFor="image-upload" className="option-btn">
                                <span className="option-icon">📷</span>
                                <span className="option-text">Ảnh/Video</span>
                            </label>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleImageChange}
                                disabled={loading}
                                style={{ display: 'none' }}
                            />
                            
                            <button type="button" className="option-btn" disabled={loading}>
                                <span className="option-icon">😊</span>
                                <span className="option-text">Cảm xúc</span>
                            </button>
                            
                            <button type="button" className="option-btn" disabled={loading}>
                                <span className="option-icon">📍</span>
                                <span className="option-text">Vị trí</span>
                            </button>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="post-btn"
                            disabled={!content.trim() || loading}
                        >
                            {loading ? 'Đang đăng...' : 'Đăng bài'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
