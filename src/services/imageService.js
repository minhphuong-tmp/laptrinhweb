// Service để xử lý ảnh từ Supabase Storage - Optimized for mobile
import { supabase } from '../lib/supabase';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://tguxydfhxcmqvcrenqbl.supabase.co';

// Cache để tránh request trùng lặp
const imageCache = new Map();
const bucketCache = new Set();

// Mobile-optimized image sizes
const MOBILE_SIZES = {
    avatar: { width: 150, height: 150, quality: 80 },
    thumbnail: { width: 300, height: 200, quality: 75 },
    full: { width: 800, height: 600, quality: 85 }
};

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
    }

    return false;
};

export const getUserImageSrc = async (imagePath, name = 'User', size = 'avatar') => {
    if (!imagePath) {
        return '/images/defaultUser.png';
    }

    // Tạo cache key với size
    const cacheKey = `${imagePath}_${size}`;

    // Kiểm tra cache trước
    if (imageCache.has(cacheKey)) {
        return imageCache.get(cacheKey);
    }

    // Nếu imagePath đã là URL đầy đủ, trả về luôn
    if (imagePath.startsWith('http')) {
        imageCache.set(cacheKey, imagePath);
        return imagePath;
    }

    // Xử lý path để tránh duplicate
    let cleanPath = imagePath;
    if (imagePath.startsWith('profiles/')) {
        cleanPath = imagePath.replace('profiles/', '');
    }


    // Thử các bucket và thư mục con
    const searchPaths = [
        { bucket: 'upload', path: `profiles/${cleanPath}` },
        { bucket: 'upload', path: `profile/${cleanPath}` },
        { bucket: 'upload', path: `postImages/${cleanPath}` },
        { bucket: 'upload', path: `postVideo/${cleanPath}` },
        { bucket: 'upload', path: cleanPath },
        { bucket: 'profiles', path: cleanPath },
        { bucket: 'avatars', path: cleanPath }
    ];

    for (const { bucket, path } of searchPaths) {
        try {
            // Kiểm tra bucket có tồn tại không trước (skip check cho upload bucket)
            if (bucket !== 'upload') {
                const bucketExists = await checkBucketExists(bucket);
                if (!bucketExists) {
                    continue;
                }
            } else {
            }

            // Thử public URL trước (nhanh nhất)
            const publicUrl = `https://tguxydfhxcmqvcrenqbl.supabase.co/storage/v1/object/public/${bucket}/${path}`;

            // Test URL bằng fetch với timeout
            const testPromise = fetch(publicUrl, { method: 'HEAD' });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            try {
                const response = await Promise.race([testPromise, timeoutPromise]);

                if (response.ok) {

                    // Optimize URL for mobile if needed
                    let optimizedUrl = publicUrl;
                    if (size !== 'full' && MOBILE_SIZES[size]) {
                        optimizedUrl = addImageOptimization(publicUrl, MOBILE_SIZES[size]);
                    }

                    imageCache.set(cacheKey, optimizedUrl);
                    return optimizedUrl;
                }
            } catch (testError) {
                console.log(`❌ Public URL test failed for ${bucket}/${path}:`, testError.message);
            }

            // Nếu public URL không work, thử signed URL bằng REST API
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';
            const signedUrlApi = `https://tguxydfhxcmqvcrenqbl.supabase.co/storage/v1/object/sign/${bucket}/${path}`;
            const signedResponse = await fetch(signedUrlApi, {
                method: 'POST',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ expiresIn: 86400 }) // 24 giờ
            });

            if (signedResponse.ok) {
                const signedData = await signedResponse.json();
                if (signedData.signedURL) {

                    // Optimize URL for mobile if needed
                    let optimizedUrl = signedData.signedURL;
                    if (size !== 'full' && MOBILE_SIZES[size]) {
                        optimizedUrl = addImageOptimization(signedData.signedURL, MOBILE_SIZES[size]);
                    }

                    imageCache.set(cacheKey, optimizedUrl);
                    return optimizedUrl;
                }
            }
        } catch (bucketError) {
            console.log(`❌ Bucket ${bucket}, path ${path} exception:`, bucketError.message);
        }
    }

    console.log('❌ No image found, returning default');
    return '/images/defaultUser.png';
};

// Helper function để thêm image optimization parameters
const addImageOptimization = (url, sizeConfig) => {
    // Nếu URL đã có query parameters, thêm vào
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${sizeConfig.width}&height=${sizeConfig.height}&quality=${sizeConfig.quality}&format=webp`;
};

// Helper function để detect device type
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Optimized image loading với lazy loading
export const loadOptimizedImage = async (imagePath, options = {}) => {
    const {
        size = isMobileDevice() ? 'thumbnail' : 'full',
        lazy = true,
        fallback = null
    } = options;

    try {
        const imageUrl = await getUserImageSrc(imagePath, 'Image', size);

        if (!imageUrl) {
            return fallback;
        }

        // Return image object with optimization info
        return {
            src: imageUrl,
            alt: options.alt || 'Image',
            loading: lazy ? 'lazy' : 'eager',
            width: MOBILE_SIZES[size]?.width,
            height: MOBILE_SIZES[size]?.height,
            style: {
                maxWidth: '100%',
                height: 'auto'
            }
        };
    } catch (error) {
        console.error('Error loading optimized image:', error);
        return fallback;
    }
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

// Function để upload avatar bằng REST API
export const uploadAvatar = async (file, userId) => {
    try {
        console.log('📤 Uploading avatar via REST API...');

        const fileName = `${userId}.png`;
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

        // Upload file bằng REST API
        const uploadUrl = `https://tguxydfhxcmqvcrenqbl.supabase.co/storage/v1/object/profiles/${fileName}`;

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': file.type,
                'Cache-Control': '3600',
                'x-upsert': 'true'
            },
            body: file
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('❌ Error uploading avatar:', uploadResponse.status, errorText);
            return { success: false, error: { message: errorText, status: uploadResponse.status } };
        }

        const uploadData = await uploadResponse.json();
        console.log('✅ Avatar uploaded successfully via REST API:', uploadData);

        // Cập nhật userData trong database bằng REST API
        const updateUrl = 'https://tguxydfhxcmqvcrenqbl.supabase.co/rest/v1/users';
        const updateResponse = await fetch(`${updateUrl}?id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ image: `profiles/${fileName}` })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('❌ Error updating user image:', updateResponse.status, errorText);
        } else {
            console.log('✅ User image updated in database via REST API');
        }

        return { success: true, data: uploadData };
    } catch (err) {
        console.error('❌ Exception uploading avatar:', err);
        return { success: false, error: err };
    }
};

// Test function để kiểm tra bucket upload
export const testUploadBucket = async () => {
    try {

        // Test list files trong upload bucket
        const { data: files, error: filesError } = await supabase.storage
            .from('upload')
            .list('', { limit: 20 });

        if (filesError) {
            console.log('❌ Error listing upload bucket:', filesError);
            return { success: false, error: filesError };
        }

        console.log('📁 Files in upload bucket:', files?.map(f => f.name) || []);

        // Test các thư mục con
        const folders = ['profiles', 'profile', 'postImages', 'postVideo'];
        for (const folder of folders) {
            try {
                const { data: folderFiles, error: folderError } = await supabase.storage
                    .from('upload')
                    .list(folder, { limit: 10 });

                if (folderError) {
                    console.log(`❌ Error listing ${folder}:`, folderError);
                } else {
                    console.log(`📁 Files in upload/${folder}:`, folderFiles?.map(f => f.name) || []);
                }
            } catch (err) {
                console.log(`❌ Exception checking ${folder}:`, err);
            }
        }

        return { success: true, data: files };
    } catch (error) {
        console.log('❌ Error testing upload bucket:', error);
        return { success: false, error };
    }
};

// Test function để load ảnh cụ thể
export const testLoadImage = async (imagePath) => {
    try {

        // Xử lý path để tránh duplicate (giống getUserImageSrc)
        let cleanPath = imagePath;
        if (imagePath.startsWith('profiles/')) {
            cleanPath = imagePath.replace('profiles/', '');
        }

        console.log(`🔍 Clean path: ${cleanPath}`);

        const searchPaths = [
            { bucket: 'upload', path: `profiles/${cleanPath}` },
            { bucket: 'upload', path: `profile/${cleanPath}` },
            { bucket: 'upload', path: `postImages/${cleanPath}` },
            { bucket: 'upload', path: `postVideo/${cleanPath}` },
            { bucket: 'upload', path: cleanPath }
        ];

        for (const { bucket, path } of searchPaths) {
            try {
                console.log(`🔍 Testing: ${bucket}/${path}`);

                const { data, error } = await supabase.storage
                    .from(bucket)
                    .createSignedUrl(path, 3600);

                if (!error && data) {
                    console.log(`🔗 URL: ${data.signedUrl}`);
                    return { success: true, url: data.signedUrl, bucket, path };
                } else {
                    console.log(`❌ Not found at: ${bucket}/${path}`, error?.message);
                }
            } catch (err) {
                console.log(`❌ Error testing ${bucket}/${path}:`, err);
            }
        }

        console.log(`❌ Image not found: ${imagePath}`);
        return { success: false, error: 'Image not found' };
    } catch (error) {
        console.log('❌ Error testing load image:', error);
        return { success: false, error };
    }
};
export const debugBuckets = async () => {
    try {
        console.log('🔍 Listing all buckets...');
        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
            console.log('❌ Error listing buckets:', error);
            return [];
        }

        if (data && data.length > 0) {
            console.log('📦 Available buckets:', data.map(b => b.name));

            // Kiểm tra từng bucket
            for (const bucket of data) {
                console.log(`🔍 Checking bucket: ${bucket.name}`);
                try {
                    const { data: files, error: filesError } = await supabase.storage
                        .from(bucket.name)
                        .list('', { limit: 10 });

                    if (filesError) {
                        console.log(`❌ Error listing files in ${bucket.name}:`, filesError);
                    } else {
                        console.log(`📁 Files in ${bucket.name}:`, files?.map(f => f.name) || []);
                    }
                } catch (err) {
                    console.log(`❌ Exception checking ${bucket.name}:`, err);
                }
            }

            return data.map(b => b.name);
        } else {
            console.log('📦 No buckets found or empty response');
            return [];
        }
    } catch (error) {
        console.log('❌ Error listing buckets:', error);
        return [];
    }
};