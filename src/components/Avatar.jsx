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
        objectFit: 'cover',
        backgroundColor: '#00C26F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: size * 0.4,
        ...style
    };

    useEffect(() => {
        const loadImageUrl = async () => {
            console.log('Avatar useEffect - src:', src, 'name:', name);
            
            if (src && src.trim() !== '' && src !== 'null' && src !== 'undefined') {
                setLoading(true);
                setImageError(false);
                
                try {
                    const url = await getUserImageSrc(src, name, size);
                    console.log('Avatar src:', src, 'imageUrl:', url);
                    
                    if (url) {
                        // Kiểm tra ảnh có load được không trước khi set
                        try {
                            const response = await fetch(url, { method: 'HEAD' });
                            if (response.ok) {
                                console.log('Image URL verified:', url);
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
                console.log('No src provided, using placeholder');
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
            <img
                src={imageUrl}
                alt={name || 'Avatar'}
                className={className}
                style={avatarStyle}
                onError={(e) => {
                    console.log('Image load error for:', imageUrl);
                    console.log('Error details:', e);
                    setImageError(true);
                }}
                onLoad={() => {
                    console.log('Image loaded successfully:', imageUrl);
                }}
                crossOrigin="anonymous"
            />
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