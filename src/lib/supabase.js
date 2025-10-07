import { createClient } from '@supabase/supabase-js';

// Supabase configuration - sử dụng cùng với mobile app
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://oqtlakdvlmkaalymgrwd.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY'


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

console.log('Supabase client created:', supabase);

// Test connection với timeout
console.log('Testing Supabase connection...');
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
