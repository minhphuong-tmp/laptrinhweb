import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || 'https://tguxydfhxcmqvcrenqbl.supabase.co').trim();
const supabaseAnonKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    },
    realtime: {
        params: {
            eventsPerSecond: 5 // Giảm xuống để tránh quá tải
        }
    },
    global: {
        headers: {
            'X-Client-Info': 'web-app'
        }
    },
    db: {
        schema: 'public'
    }
})


// Test connection với timeout
const testConnection = async () => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Tăng lên 10 giây

        const result = await supabase.from('users').select('count').abortSignal(controller.signal);
        clearTimeout(timeoutId);
    } catch (err) {
        console.error('❌ Supabase connection test FAILED:', err);
        console.error('This might cause the runtime.lastError');
    }
};

// Test auth connection
const testAuth = async () => {
    try {
        const result = await supabase.auth.getSession();
    } catch (err) {
        console.error('❌ Supabase auth test failed:', err);
    }
};

testConnection();
testAuth();
