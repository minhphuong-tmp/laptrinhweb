import { supabase } from '../lib/supabase';

// Lấy danh sách documents
export const getDocuments = async (filters = {}) => {
    try {
        let query = supabase
            .from('documents')
            .select(`
                *,
                uploader:uploader_id(
                    id,
                    name,
                    image
                )
            `)
            .order('upload_date', { ascending: false });

        // Áp dụng filters
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        if (filters.searchTerm) {
            query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%,tags.cs.{${filters.searchTerm}}`);
        }

        if (filters.uploaderId) {
            query = query.eq('uploader_id', filters.uploaderId);
        }

        const { data, error } = await query;
        return { data, error };
    } catch (error) {
        console.error('Error fetching documents:', error);
        return { data: null, error };
    }
};

// Lấy document theo ID
export const getDocumentById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('documents')
            .select(`
                *,
                uploader:uploader_id(
                    id,
                    name,
                    image
                )
            `)
            .eq('id', id)
            .single();

        return { data, error };
    } catch (error) {
        console.error('Error fetching document:', error);
        return { data: null, error };
    }
};

// Upload document
export const uploadDocument = async (file, metadata) => {
    try {
        // Kiểm tra bucket có tồn tại không
        const { data: buckets } = await supabase.storage.listBuckets();
        const documentsBucket = buckets?.find(bucket => bucket.name === 'documents');
        
        if (!documentsBucket) {
            // Tạo bucket nếu chưa có
            const { error: createError } = await supabase.storage.createBucket('documents', {
                public: true,
                allowedMimeTypes: [
                    // Documents
                    'application/pdf', 
                    'application/msword', 
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-powerpoint', 
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/plain',
                    // Archives
                    'application/zip', 
                    'application/x-rar-compressed',
                    'application/x-7z-compressed',
                    // Images
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/bmp',
                    'image/svg+xml',
                    // Videos
                    'video/mp4',
                    'video/avi',
                    'video/quicktime',
                    'video/x-msvideo',
                    'video/webm',
                    // Audio
                    'audio/mpeg',
                    'audio/wav',
                    'audio/flac',
                    'audio/aac'
                ],
                fileSizeLimit: 200 * 1024 * 1024 // 200MB (cho video)
            });
            
            if (createError) {
                console.error('Error creating bucket:', createError);
                // Không throw error, tiếp tục thử upload
                console.log('Bucket creation failed, but continuing with upload...');
            }
        }

        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        console.log('📤 Uploading file:', {
            name: file.name,
            size: file.size,
            type: file.type,
            path: filePath
        });

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        // Lấy public URL
        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

        // Lưu metadata vào database
        const { data: insertData, error: insertError } = await supabase
            .from('documents')
            .insert({
                title: metadata.title,
                description: metadata.description,
                category: metadata.category,
                file_type: fileExt.toUpperCase(),
                file_size: file.size,
                file_path: filePath,
                uploader_id: metadata.uploaderId,
                tags: metadata.tags || [],
                is_public: metadata.isPublic !== false
            })
            .select()
            .single();

        if (insertError) {
            // Nếu insert thất bại, xóa file đã upload
            await supabase.storage.from('documents').remove([filePath]);
            throw insertError;
        }

        return { data: insertData, error: null };
    } catch (error) {
        console.error('Error uploading document:', error);
        return { data: null, error };
    }
};

// Cập nhật document
export const updateDocument = async (id, updates) => {
    try {
        const { data, error } = await supabase
            .from('documents')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    } catch (error) {
        console.error('Error updating document:', error);
        return { data: null, error };
    }
};

// Xóa document
export const deleteDocument = async (id) => {
    try {
        // Lấy file path trước khi xóa
        const { data: document } = await getDocumentById(id);
        
        if (document?.data?.file_path) {
            // Xóa file từ storage
            await supabase.storage
                .from('documents')
                .remove([document.data.file_path]);
        }

        // Xóa record từ database
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        return { error };
    } catch (error) {
        console.error('Error deleting document:', error);
        return { error };
    }
};

// Tăng download count sử dụng RPC function hoặc fallback
export const incrementDownloadCount = async (id) => {
    try {
        console.log('📊 Incrementing download count for document:', id);
        
        // Thử gọi RPC function trước
        const { data: newCount, error } = await supabase.rpc('increment_download_count', {
            doc_id: id
        });

        if (error) {
            console.warn('⚠️ RPC function failed, trying direct update:', error);
            
            // Fallback: Update trực tiếp
            const { data: currentDoc, error: fetchError } = await supabase
                .from('documents')
                .select('download_count')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error('Error fetching current download count:', fetchError);
                return { error: fetchError };
            }

            const newCount = (currentDoc.download_count || 0) + 1;
            
            const { error: updateError } = await supabase
                .from('documents')
                .update({ 
                    download_count: newCount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (updateError) {
                console.error('Error updating download count:', updateError);
                return { error: updateError };
            }

            console.log('✅ Download count updated via fallback. New count:', newCount);
            return { data: newCount, error: null };
        }

        console.log('✅ Download count updated via RPC. New count:', newCount);
        return { data: newCount, error: null };
    } catch (error) {
        console.error('Error incrementing download count:', error);
        return { error };
    }
};

// Lấy download count của một document
export const getDownloadCount = async (id) => {
    try {
        const { data: count, error } = await supabase.rpc('get_download_count', {
            doc_id: id
        });

        if (error) {
            console.error('Error getting download count:', error);
            return { data: 0, error };
        }

        return { data: count, error: null };
    } catch (error) {
        console.error('Error getting download count:', error);
        return { data: 0, error };
    }
};

// Cập nhật rating
export const updateDocumentRating = async (id, rating) => {
    try {
        const { error } = await supabase
            .from('documents')
            .update({ rating })
            .eq('id', id);

        return { error };
    } catch (error) {
        console.error('Error updating rating:', error);
        return { error };
    }
};

// Lấy download URL
export const getDownloadUrl = async (filePath) => {
    try {
        const { data } = await supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 3600); // 1 hour expiry

        return { data, error: null };
    } catch (error) {
        console.error('Error getting download URL:', error);
        return { data: null, error };
    }
};

// API cho app điện thoại - lấy tất cả documents với download count
export const getDocumentsForMobile = async () => {
    try {
        const { data, error } = await supabase
            .from('documents')
            .select(`
                id,
                title,
                description,
                category,
                file_type,
                file_size,
                file_path,
                uploader_id,
                upload_date,
                download_count,
                rating,
                tags,
                is_public,
                uploader:uploader_id(name, image)
            `)
            .eq('is_public', true)
            .order('upload_date', { ascending: false });

        if (error) {
            console.error('Error fetching documents for mobile:', error);
            return { data: [], error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching documents for mobile:', error);
        return { data: [], error };
    }
};

// Test function để kiểm tra RPC function
export const testRPCFunction = async (docId) => {
    try {
        console.log('🧪 Testing RPC function for document:', docId);
        
        // Test get_download_count
        const { data: currentCount, error: getError } = await supabase.rpc('get_download_count', {
            doc_id: docId
        });
        
        if (getError) {
            console.error('❌ Error calling get_download_count:', getError);
            return { error: getError };
        }
        
        console.log('📊 Current download count:', currentCount);
        
        // Test increment_download_count
        const { data: newCount, error: incError } = await supabase.rpc('increment_download_count', {
            doc_id: docId
        });
        
        if (incError) {
            console.error('❌ Error calling increment_download_count:', incError);
            return { error: incError };
        }
        
        console.log('📈 New download count:', newCount);
        
        return { 
            data: { 
                currentCount, 
                newCount 
            }, 
            error: null 
        };
    } catch (error) {
        console.error('❌ Error testing RPC function:', error);
        return { error };
    }
};
