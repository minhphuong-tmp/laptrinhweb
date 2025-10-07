// Service để xử lý ảnh từ Supabase Storage - Optimized for mobile
import { supabase } from '../lib/supabase';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://oqtlakdvlmkaalymgrwd.supabase.co';

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
        console.log(`❌ Error checking bucket ${bucketName}:`, err.message);
    }

    return false;
};

export const getUserImageSrc = async (imagePath, name = 'User', size = 'avatar') => {
    if (!imagePath) {
        console.log('❌ No image path provided, using default');
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

    console.log(`🔍 Looking for image: ${cleanPath} (size: ${size})`);

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
            console.log(`🔍 Checking bucket: ${bucket}, path: ${path}`);

            // Kiểm tra bucket có tồn tại không trước (skip check cho upload bucket)
            if (bucket !== 'upload') {
                const bucketExists = await checkBucketExists(bucket);
                if (!bucketExists) {
                    console.log(`❌ Bucket ${bucket} does not exist, skipping`);
                    continue;
                }
            } else {
                console.log(`✅ Skipping bucket check for upload bucket`);
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

                // Optimize URL for mobile if needed
                let optimizedUrl = data.signedUrl;
                if (size !== 'full' && MOBILE_SIZES[size]) {
                    optimizedUrl = addImageOptimization(data.signedUrl, MOBILE_SIZES[size]);
                }

                imageCache.set(cacheKey, optimizedUrl);
                return optimizedUrl;
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

                // Optimize URL for mobile if needed
                let optimizedUrl = data.publicUrl;
                if (size !== 'full' && MOBILE_SIZES[size]) {
                    optimizedUrl = addImageOptimization(data.publicUrl, MOBILE_SIZES[size]);
                }

                imageCache.set(cacheKey, optimizedUrl);
                return optimizedUrl;
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

                // Optimize URL for mobile if needed
                let optimizedUrl = publicUrl;
                if (size !== 'full' && MOBILE_SIZES[size]) {
                    optimizedUrl = addImageOptimization(publicUrl, MOBILE_SIZES[size]);
                }

                imageCache.set(cacheKey, optimizedUrl);
                return optimizedUrl;
            }
        } catch (fetchError) {
            console.log(`❌ Public URL failed: ${publicUrl}`, fetchError.message);
        }
    }

    console.log('❌ No image found, returning null');
    // Trả về null để Avatar component có thể fallback về placeholder
    imageCache.set(cacheKey, null);
    console.log('❌ All methods failed, using default avatar');
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

// Test function để kiểm tra bucket upload
export const testUploadBucket = async () => {
    try {
        console.log('🔍 Testing upload bucket...');

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
        console.log(`🔍 Testing load image: ${imagePath}`);

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
                    console.log(`✅ Found image at: ${bucket}/${path}`);
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