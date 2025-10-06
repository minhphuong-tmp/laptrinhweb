// Service để xử lý ảnh từ Supabase Storage
import { supabase } from '../lib/supabase';

const supabaseUrl = 'https://oqtlakdvlmkaalymgrwd.supabase.co';

// Cache để tránh request trùng lặp
const imageCache = new Map();
const bucketCache = new Set();

// Kiểm tra bucket có tồn tại không
const checkBucketExists = async (bucketName) => {
    if (bucketCache.has(bucketName)) {
        return true;
    }
    
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (!error && data) {
            const bucketExists = data.some(bucket => bucket.name === bucketName);
            if (bucketExists) {
                bucketCache.add(bucketName);
            }
            return bucketExists;
        }
    } catch (err) {
        console.log(`❌ Error checking bucket ${bucketName}:`, err.message);
    }
    
    return false;
};

export const getUserImageSrc = async (imagePath, name = 'User', size = 100) => {
    if (!imagePath) return null;
    
    // Kiểm tra cache trước
    if (imageCache.has(imagePath)) {
        return imageCache.get(imagePath);
    }
    
    // Nếu imagePath đã là URL đầy đủ, trả về luôn
    if (imagePath.startsWith('http')) {
        imageCache.set(imagePath, imagePath);
        return imagePath;
    }
    
    // Xử lý path để tránh duplicate
    let cleanPath = imagePath;
    if (imagePath.startsWith('profiles/')) {
        cleanPath = imagePath.replace('profiles/', '');
    }
    
    console.log(`🔍 Looking for image: ${cleanPath}`);
    
    // Thử các bucket và thư mục con
    const searchPaths = [
        { bucket: 'upload', path: `profiles/${cleanPath}` },
        { bucket: 'upload', path: cleanPath },
        { bucket: 'profiles', path: cleanPath },
        { bucket: 'avatars', path: cleanPath },
        { bucket: 'images', path: cleanPath }
    ];
    
    for (const { bucket, path } of searchPaths) {
        try {
            console.log(`🔍 Checking bucket: ${bucket}, path: ${path}`);
            
            // Kiểm tra bucket có tồn tại không trước
            const bucketExists = await checkBucketExists(bucket);
            if (!bucketExists) {
                console.log(`❌ Bucket ${bucket} does not exist, skipping`);
                continue;
            }
            
            // Thử tạo signed URL với thời gian dài hơn
            const signedUrlPromise = supabase.storage
                .from(bucket)
                .createSignedUrl(path, 86400); // 24 giờ
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
            );
            
            const { data, error } = await Promise.race([signedUrlPromise, timeoutPromise]);
            
            if (!error && data?.signedUrl) {
                console.log(`✅ Found image in bucket: ${bucket}, path: ${path}`);
                imageCache.set(imagePath, data.signedUrl);
                return data.signedUrl;
            } else if (error) {
                console.log(`❌ Bucket ${bucket}, path ${path} error:`, error.message);
            }
        } catch (bucketError) {
            console.log(`❌ Bucket ${bucket}, path ${path} exception:`, bucketError.message);
        }
    }
    
    // Nếu không tìm thấy qua signed URL, thử getPublicUrl
    for (const { bucket, path } of searchPaths) {
        try {
            console.log(`🔍 Trying getPublicUrl for bucket: ${bucket}, path: ${path}`);
            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(path);
            
            if (data?.publicUrl) {
                console.log(`✅ getPublicUrl works: ${data.publicUrl}`);
                imageCache.set(imagePath, data.publicUrl);
                return data.publicUrl;
            }
        } catch (getPublicUrlError) {
            console.log(`❌ getPublicUrl failed for bucket ${bucket}, path ${path}:`, getPublicUrlError.message);
        }
    }
    
    // Fallback: thử public URL trực tiếp
    for (const { bucket, path } of searchPaths) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
        
        try {
            console.log(`🔍 Checking public URL: ${publicUrl}`);
            const response = await fetch(publicUrl, { 
                method: 'HEAD',
                timeout: 3000 
            });
            
            if (response.ok) {
                console.log(`✅ Public URL works: ${publicUrl}`);
                imageCache.set(imagePath, publicUrl);
                return publicUrl;
            }
        } catch (fetchError) {
            console.log(`❌ Public URL failed: ${publicUrl}`, fetchError.message);
        }
    }
    
    console.log('❌ No image found, returning null');
    // Trả về null để Avatar component có thể fallback về placeholder
    imageCache.set(imagePath, null);
    return null;
};

export const getSupabaseFileUrl = (filePath) => {
    if (!filePath) return null;
    
    if (filePath.startsWith('http')) {
        return filePath;
    }
    
    return `${supabaseUrl}/storage/v1/object/public/${filePath}`;
};

// Debug function để kiểm tra Supabase Storage
export const debugSupabaseStorage = async () => {
    console.log('🔍 Debugging Supabase Storage...');
    
    try {
        // Kiểm tra buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
            console.error('❌ Error listing buckets:', bucketsError);
        } else {
            console.log('✅ Available buckets:', buckets?.map(b => b.name) || []);
            
            // Kiểm tra files trong mỗi bucket
            for (const bucket of buckets || []) {
                try {
                    const { data: files, error: filesError } = await supabase.storage
                        .from(bucket.name)
                        .list('', { limit: 10 });
                    
                    if (filesError) {
                        console.log(`❌ Error listing files in ${bucket.name}:`, filesError.message);
                    } else {
                        console.log(`✅ Files in ${bucket.name}:`, files?.map(f => f.name) || []);
                    }
                } catch (listError) {
                    console.log(`❌ Exception listing files in ${bucket.name}:`, listError.message);
                }
            }
        }
        
        // Kiểm tra quyền truy cập
        const { data: session } = await supabase.auth.getSession();
        console.log('✅ Current session:', session?.session ? 'Authenticated' : 'Not authenticated');
        
        return { buckets, session };
    } catch (error) {
        console.error('❌ Debug error:', error);
        return { error };
    }
};

// Function để tạo bucket profiles nếu chưa có
export const createProfilesBucket = async () => {
    try {
        console.log('🔧 Creating profiles bucket...');
        
        const { data, error } = await supabase.storage.createBucket('profiles', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });
        
        if (error) {
            console.error('❌ Error creating bucket:', error);
            return { success: false, error };
        }
        
        console.log('✅ Profiles bucket created successfully');
        return { success: true, data };
    } catch (err) {
        console.error('❌ Exception creating bucket:', err);
        return { success: false, error: err };
    }
};

// Function để upload avatar
export const uploadAvatar = async (file, userId) => {
    try {
        console.log('📤 Uploading avatar...');
        
        // Tạo bucket nếu chưa có
        await createProfilesBucket();
        
        const fileName = `${userId}.png`;
        
        const { data, error } = await supabase.storage
            .from('profiles')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });
        
        if (error) {
            console.error('❌ Error uploading avatar:', error);
            return { success: false, error };
        }
        
        console.log('✅ Avatar uploaded successfully:', data);
        
        // Cập nhật userData trong database
        const { error: updateError } = await supabase
            .from('users')
            .update({ image: `profiles/${fileName}` })
            .eq('id', userId);
        
        if (updateError) {
            console.error('❌ Error updating user image:', updateError);
        } else {
            console.log('✅ User image updated in database');
        }
        
        return { success: true, data };
    } catch (err) {
        console.error('❌ Exception uploading avatar:', err);
        return { success: false, error: err };
    }
};
