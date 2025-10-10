import { useEffect, useState } from 'react';
import { debugSupabaseStorage, getUserImageSrc } from '../services/imageService';

const Avatar = ({
    src,
    name,
    size = 40,
    className = '',
    style = {}
}) => {
    const [imageError, setImageError] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    const avatarStyle = {
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#00C26F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: size * 0.4,
        overflow: 'hidden',
        ...style
    };

    const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%'
    };

    useEffect(() => {
        const loadImageUrl = async () => {
            console.log('🔍 Avatar loadImageUrl - src:', src, 'type:', typeof src);
            
            // Kiểm tra src có phải là string và không rỗng
            if (src && typeof src === 'string' && src.trim() !== '' && src !== 'null' && src !== 'undefined') {
                setLoading(true);
                setImageError(false);

                try {

                    const url = await getUserImageSrc(src, name, size);


                    if (url) {
                        // Kiểm tra ảnh có load được không trước khi set
                        try {
                            const response = await fetch(url, { method: 'HEAD' });
                            if (response.ok) {

                                setImageUrl(url);
                            } else {
                                console.log('Image URL verification failed:', response.status);
                                setImageError(true);
                            }
                        } catch (fetchError) {
                            console.log('Image URL fetch error:', fetchError);
                            setImageError(true);
                        }
                    } else {
                        setImageUrl(null);
                    }
                } catch (error) {
                    console.log('Error loading image URL:', error);
                    // Debug Supabase Storage khi có lỗi
                    debugSupabaseStorage();
                    setImageError(true);
                } finally {
                    setLoading(false);
                }
            } else {
                console.log('⚠️ Avatar - Invalid src:', src, 'type:', typeof src);
                setImageUrl(null);
                setImageError(false);
            }
        };

        loadImageUrl();
    }, [src, name, size]);

    // Nếu đang loading, hiển thị placeholder tạm thời
    if (loading) {
        return (
            <div
                className={className}
                style={{
                    ...avatarStyle,
                    backgroundColor: '#f0f0f0',
                    color: '#999'
                }}
            >
                ...
            </div>
        );
    }

    // Nếu có URL ảnh và chưa lỗi, hiển thị ảnh
    if (imageUrl && !imageError) {
        return (
            <div className={className} style={avatarStyle}>
                <img
                    src={imageUrl}
                    alt={name || 'Avatar'}
                    style={imageStyle}
                    onError={(e) => {
                        console.log('Image load error for:', imageUrl);
                        console.log('Error details:', e);
                        setImageError(true);
                    }}
                    onLoad={() => {
                    }}
                    crossOrigin="anonymous"
                />
            </div>
        );
    }

    // Fallback: Hiển thị placeholder với chữ cái đầu (chỉ khi không có ảnh)
    return (
        <div
            className={className}
            style={avatarStyle}
        >
            {getInitials(name)}
        </div>
    );
};

export default Avatar;