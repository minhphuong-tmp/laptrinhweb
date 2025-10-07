import { supabase } from '../lib/supabase';

// ===== NOTES SERVICE =====

// Lấy tất cả notes của user
export const getNotes = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, msg: 'Không thể lấy danh sách ghi chú' };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        return { success: false, msg: 'Không thể lấy danh sách ghi chú' };
    }
};

// Tạo note mới
export const createNote = async (noteData) => {
    try {
        const { data, error } = await supabase
            .from('notes')
            .insert(noteData)
            .select()
            .single();

        if (error) {
            return { success: false, msg: 'Không thể tạo ghi chú' };
        }

        return { success: true, data, msg: 'Tạo ghi chú thành công' };
    } catch (error) {
        return { success: false, msg: 'Không thể tạo ghi chú' };
    }
};

// Cập nhật note
export const updateNote = async (noteId, updates) => {
    try {
        const { data, error } = await supabase
            .from('notes')
            .update(updates)
            .eq('id', noteId)
            .select()
            .single();

        if (error) {
            return { success: false, msg: 'Không thể cập nhật ghi chú' };
        }

        return { success: true, data, msg: 'Cập nhật ghi chú thành công' };
    } catch (error) {
        return { success: false, msg: 'Không thể cập nhật ghi chú' };
    }
};

// Xóa note
export const deleteNote = async (noteId) => {
    try {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);

        if (error) {
            return { success: false, msg: 'Không thể xóa ghi chú' };
        }

        return { success: true, msg: 'Xóa ghi chú thành công' };
    } catch (error) {
        return { success: false, msg: 'Không thể xóa ghi chú' };
    }
};

// Lấy note theo ID
export const getNoteById = async (noteId) => {
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('id', noteId)
            .single();

        if (error) {
            return { success: false, msg: 'Không thể lấy ghi chú' };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, msg: 'Không thể lấy ghi chú' };
    }
};

// Tìm kiếm notes
export const searchNotes = async (userId, query) => {
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, msg: 'Không thể tìm kiếm ghi chú' };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        return { success: false, msg: 'Không thể tìm kiếm ghi chú' };
    }
};

// Lấy notes theo category
export const getNotesByCategory = async (userId, category) => {
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, msg: 'Không thể lấy ghi chú theo danh mục' };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        return { success: false, msg: 'Không thể lấy ghi chú theo danh mục' };
    }
};

// Đánh dấu note là favorite
export const toggleFavorite = async (noteId, isFavorite) => {
    try {
        const { data, error } = await supabase
            .from('notes')
            .update({ is_favorite: isFavorite })
            .eq('id', noteId)
            .select()
            .single();

        if (error) {
            return { success: false, msg: 'Không thể cập nhật trạng thái yêu thích' };
        }

        return { success: true, data, msg: 'Cập nhật trạng thái yêu thích thành công' };
    } catch (error) {
        return { success: false, msg: 'Không thể cập nhật trạng thái yêu thích' };
    }
};

// Lấy notes yêu thích
export const getFavoriteNotes = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .eq('is_favorite', true)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, msg: 'Không thể lấy ghi chú yêu thích' };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        return { success: false, msg: 'Không thể lấy ghi chú yêu thích' };
    }
};
