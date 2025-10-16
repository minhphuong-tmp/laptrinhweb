import { supabase } from '../lib/supabase';

const API_URL = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

const headers = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
};

// Tạo bài viết mới
export const createPost = async (postData) => {
    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers,
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Post created successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Error creating post:', error);
        return { success: false, error: error.message };
    }
};

// Upload ảnh lên Supabase Storage
export const uploadImage = async (file, userId) => {
    try {
        // Tạo tên file unique trong folder postImages
        const timestamp = Date.now();
        const fileName = `postImages/${userId}/${timestamp}_${file.name}`;
        
        console.log('📤 Uploading image to postImages folder:', fileName);
        
        // Upload lên Supabase Storage sử dụng client
        let { data, error } = await supabase.storage
            .from('upload')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ Storage upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }

        console.log('✅ Image uploaded successfully:', data);
        
        // Lấy public URL
        const { data: urlData } = supabase.storage
            .from('upload')
            .getPublicUrl(fileName);
        
        console.log('🔗 Public URL:', urlData.publicUrl);
        return urlData.publicUrl;
    } catch (error) {
        console.error('❌ Error uploading image:', error);
        throw error;
    }
};

// Tạo bài viết với ảnh
export const createPostWithImage = async (content, imageFile, userId) => {
    try {
        let imageUrl = null;
        
        // Upload ảnh nếu có
        if (imageFile) {
            try {
                imageUrl = await uploadImage(imageFile, userId);
                console.log('✅ Image uploaded successfully:', imageUrl);
            } catch (uploadError) {
                console.warn('⚠️ Image upload failed, creating post without image:', uploadError);
                // Tiếp tục tạo bài viết không có ảnh
            }
        }
        
        // Tạo bài viết
        const postData = {
            content: content.trim(),
            user_id: userId,
            image: imageUrl, // Sử dụng cột 'image' thay vì 'image_url'
            created_at: new Date().toISOString()
        };
        
        return await createPost(postData);
    } catch (error) {
        console.error('❌ Error creating post with image:', error);
        return { success: false, error: error.message };
    }
};

// Lấy chi tiết bài viết
export const fetchPostDetails = async (postId) => {
    try {
        const response = await fetch(`${API_URL}/posts?id=eq.${postId}`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, data: data[0] || null };
    } catch (error) {
        console.error('❌ Error fetching post details:', error);
        return { success: false, error: error.message };
    }
};

// Tạo like cho bài viết
export const createPostLike = async (postId, userId) => {
    try {
        const likeData = {
            post_id: postId,
            user_id: userId,
            created_at: new Date().toISOString()
        };

        const response = await fetch(`${API_URL}/postLikes`, {
            method: 'POST',
            headers,
            body: JSON.stringify(likeData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Post like created successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Error creating post like:', error);
        return { success: false, error: error.message };
    }
};

// Xóa like cho bài viết
export const removePostLike = async (postId, userId) => {
    try {
        const response = await fetch(`${API_URL}/postLikes?post_id=eq.${postId}&user_id=eq.${userId}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('✅ Post like removed successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Error removing post like:', error);
        return { success: false, error: error.message };
    }
};

// Tạo comment
export const createComment = async (postId, userId, content) => {
    try {
        const commentData = {
            post_id: postId,
            user_id: userId,
            content: content.trim(),
            created_at: new Date().toISOString()
        };

        const response = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers,
            body: JSON.stringify(commentData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Comment created successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Error creating comment:', error);
        return { success: false, error: error.message };
    }
};

// Xóa comment
export const removeComment = async (commentId) => {
    try {
        const response = await fetch(`${API_URL}/comments?id=eq.${commentId}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('✅ Comment removed successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Error removing comment:', error);
        return { success: false, error: error.message };
    }
};