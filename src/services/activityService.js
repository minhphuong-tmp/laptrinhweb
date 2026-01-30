import { supabase } from '../lib/supabase';

// ===== ACTIVITIES API =====

// Lấy danh sách activities
export const getActivities = async (filters = {}) => {
    try {
        console.log('📂 Fetching activities with filters:', filters);
        
        let query = supabase
            .from('activities')
            .select(`
                *,
                organizer:organizer_id(
                    id,
                    name,
                    image
                )
            `)
            .order('start_date', { ascending: true });

        // Apply filters
        if (filters.activity_type && filters.activity_type !== 'all') {
            query = query.eq('activity_type', filters.activity_type);
        }
        
        if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }
        
        if (filters.search) {
            query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Error fetching activities:', error);
            return { data: [], error };
        }

        console.log('✅ Activities fetched successfully:', data?.length || 0);
        return { data: data || [], error: null };
    } catch (error) {
        console.error('❌ Error in getActivities:', error);
        return { data: [], error };
    }
};

// Lấy activity theo ID
export const getActivityById = async (id) => {
    try {
        console.log('📂 Fetching activity by ID:', id);
        
        const { data, error } = await supabase
            .from('activities')
            .select(`
                *,
                organizer:organizer_id(
                    id,
                    name,
                    image
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('❌ Error fetching activity:', error);
            return { data: null, error };
        }

        console.log('✅ Activity fetched successfully:', data?.title);
        return { data, error: null };
    } catch (error) {
        console.error('❌ Error in getActivityById:', error);
        return { data: null, error };
    }
};

// Tạo activity mới
export const createActivity = async (activityData) => {
    try {
        console.log('📝 Creating new activity:', activityData.title);
        
        // Remove id from activityData to let database generate it
        const { id, ...dataToInsert } = activityData;
        
        const { data, error } = await supabase
            .from('activities')
            .insert([dataToInsert])
            .select(`
                *,
                organizer:organizer_id(
                    id,
                    name,
                    image
                )
            `)
            .single();

        if (error) {
            console.error('❌ Error creating activity:', error);
            console.error('❌ Error details:', JSON.stringify(error, null, 2));
            console.error('❌ Data being inserted:', JSON.stringify(dataToInsert, null, 2));
            return { data: null, error };
        }

        console.log('✅ Activity created successfully:', data?.title);
        return { data, error: null };
    } catch (error) {
        console.error('❌ Error in createActivity:', error);
        return { data: null, error };
    }
};

// Cập nhật activity
export const updateActivity = async (id, updates) => {
    try {
        console.log('📝 Updating activity:', id);
        
        const { data, error } = await supabase
            .from('activities')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                organizer:organizer_id(
                    id,
                    name,
                    image
                )
            `)
            .single();

        if (error) {
            console.error('❌ Error updating activity:', error);
            return { data: null, error };
        }

        console.log('✅ Activity updated successfully:', data?.title);
        return { data, error: null };
    } catch (error) {
        console.error('❌ Error in updateActivity:', error);
        return { data: null, error };
    }
};

// Xóa activity
export const deleteActivity = async (id) => {
    try {
        console.log('🗑️ Deleting activity:', id);
        
        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Error deleting activity:', error);
            return { error };
        }

        console.log('✅ Activity deleted successfully');
        return { error: null };
    } catch (error) {
        console.error('❌ Error in deleteActivity:', error);
        return { error };
    }
};

// ===== PARTICIPANTS API =====

// Lấy danh sách participants của activity
export const getActivityParticipants = async (activityId) => {
    try {
        console.log('📂 Fetching participants for activity:', activityId);
        
        const { data, error } = await supabase
            .from('activity_participants')
            .select(`
                *,
                user:user_id(
                    id,
                    name,
                    image
                )
            `)
            .eq('activity_id', activityId)
            .order('registered_at', { ascending: true });

        if (error) {
            console.error('❌ Error fetching participants:', error);
            return { data: [], error };
        }

        console.log('✅ Participants fetched successfully:', data?.length || 0);
        return { data: data || [], error: null };
    } catch (error) {
        console.error('❌ Error in getActivityParticipants:', error);
        return { data: [], error };
    }
};

// Đăng ký tham gia activity
export const registerForActivity = async (activityId, userId) => {
    try {
        console.log('📝 Registering user for activity:', { activityId, userId });
        
        const { data, error } = await supabase
            .from('activity_participants')
            .insert([{
                activity_id: activityId,
                user_id: userId
            }])
            .select()
            .single();

        if (error) {
            console.error('❌ Error registering for activity:', error);
            return { data: null, error };
        }

        console.log('✅ User registered successfully');
        return { data, error: null };
    } catch (error) {
        console.error('❌ Error in registerForActivity:', error);
        return { data: null, error };
    }
};

// Hủy đăng ký activity
export const unregisterFromActivity = async (activityId, userId) => {
    try {
        console.log('📝 Unregistering user from activity:', { activityId, userId });
        
        const { error } = await supabase
            .from('activity_participants')
            .delete()
            .eq('activity_id', activityId)
            .eq('user_id', userId);

        if (error) {
            console.error('❌ Error unregistering from activity:', error);
            return { error };
        }

        console.log('✅ User unregistered successfully');
        return { error: null };
    } catch (error) {
        console.error('❌ Error in unregisterFromActivity:', error);
        return { error };
    }
};

// Kiểm tra user đã đăng ký activity chưa
export const isUserRegistered = async (activityId, userId) => {
    try {
        console.log('🔍 Checking if user is registered:', { activityId, userId });
        
        const { data, error } = await supabase
            .from('activity_participants')
            .select('id')
            .eq('activity_id', activityId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('❌ Error checking registration:', error);
            return { data: false, error };
        }

        const isRegistered = !!data;
        console.log('✅ Registration status:', isRegistered);
        return { data: isRegistered, error: null };
    } catch (error) {
        console.error('❌ Error in isUserRegistered:', error);
        return { data: false, error };
    }
};

// ===== UTILITY FUNCTIONS =====

// Lấy activities theo ngày (cho calendar)
export const getActivitiesByDate = async (date) => {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        console.log('📅 Fetching activities for date:', date);
        
        const { data, error } = await supabase
            .from('activities')
            .select(`
                *,
                organizer:organizer_id(
                    id,
                    name,
                    image
                )
            `)
            .gte('start_date', startOfDay.toISOString())
            .lte('start_date', endOfDay.toISOString())
            .order('start_date', { ascending: true });

        if (error) {
            console.error('❌ Error fetching activities by date:', error);
            return { data: [], error };
        }

        console.log('✅ Activities by date fetched:', data?.length || 0);
        return { data: data || [], error: null };
    } catch (error) {
        console.error('❌ Error in getActivitiesByDate:', error);
        return { data: [], error };
    }
};

// Lấy activities sắp tới
export const getUpcomingActivities = async (limit = 5) => {
    try {
        console.log('📂 Fetching upcoming activities, limit:', limit);
        
        const { data, error } = await supabase
            .from('activities')
            .select(`
                *,
                organizer:organizer_id(
                    id,
                    name,
                    image
                )
            `)
            .gte('start_date', new Date().toISOString())
            .eq('status', 'upcoming')
            .order('start_date', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('❌ Error fetching upcoming activities:', error);
            return { data: [], error };
        }

        console.log('✅ Upcoming activities fetched:', data?.length || 0);
        return { data: data || [], error: null };
    } catch (error) {
        console.error('❌ Error in getUpcomingActivities:', error);
        return { data: [], error };
    }
};
