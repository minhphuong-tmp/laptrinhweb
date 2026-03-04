import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserData, syncUserWithAuth } from '../services/userService';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const isSigningIn = useRef(false); // Guard: ngăn restoreSession override signIn

    // Helper: tạo basic user từ Supabase session user
    const createBasicUserFromSession = (sessionUser) => ({
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
        image: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.image || null,
        bio: sessionUser.user_metadata?.bio || null,
        address: sessionUser.user_metadata?.address || null,
        phoneNumber: sessionUser.user_metadata?.phoneNumber || null,
        created_at: sessionUser.created_at,
        updated_at: sessionUser.updated_at,
    });

    // Helper: load full user từ DB, giữ basicUser nếu thất bại — KHÔNG BAO GIỜ set null
    const loadFullUser = async (userId, basicUser) => {
        try {
            const result = await getUserData(userId);
            if (result.success && result.data) {
                setUser(result.data);
                return result.data;
            }
        } catch (err) {
            console.error('loadFullUser error:', err);
        }
        // Giữ basicUser — không logout
        if (basicUser) setUser(basicUser);
        return basicUser;
    };

    useEffect(() => {
        let cancelled = false;

        const restoreSession = async () => {
            try {
                // Chờ chút để signIn có cơ hội set flag trước
                await new Promise(r => setTimeout(r, 50));
                if (cancelled || isSigningIn.current) return;

                // Thử Supabase session (CLB login)
                const { data: { session } } = await supabase.auth.getSession();
                if (cancelled || isSigningIn.current) return;

                if (session?.user) {
                    const basicUser = createBasicUserFromSession(session.user);
                    setUser(basicUser);
                    setLoading(false);
                    loadFullUser(session.user.id, basicUser);
                    return;
                }

                // Fallback: Custom session (QLDT / Microsoft) — dùng key riêng, KHÔNG dùng key Supabase
                // Migration: chuyển token cũ từ key Supabase sang key mới nếu có
                const oldKey = 'sb-tguxydfhxcmqvcrenqbl-auth-token';
                const oldStored = localStorage.getItem(oldKey);
                if (oldStored) {
                    try {
                        const oldData = JSON.parse(oldStored);
                        const uid = oldData?.user?.id;
                        if (uid && (uid.startsWith('qldt_') || uid.startsWith('ms_')) && oldData?.access_token) {
                            localStorage.setItem('clb_custom_session', oldStored);
                            localStorage.removeItem(oldKey);
                            console.log('🔄 Migrated custom session from old key to clb_custom_session');
                        }
                    } catch (_) { }
                }

                const stored = localStorage.getItem('clb_custom_session');
                if (stored) {
                    const authData = JSON.parse(stored);
                    if (authData?.user?.id && authData?.access_token) {
                        const u = authData.user;
                        if (cancelled || isSigningIn.current) return;
                        setUser({
                            id: u.id,
                            email: u.email,
                            name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
                            image: null,
                            type: u.id?.startsWith('qldt_') ? 'qldt'
                                : u.id?.startsWith('ms_') ? 'microsoft' : 'custom',
                        });
                        setLoading(false);
                        return;
                    }
                }

                if (cancelled || isSigningIn.current) return;
                setUser(null);
                setLoading(false);
            } catch (err) {
                console.error('restoreSession error:', err);
                if (!cancelled && !isSigningIn.current) {
                    setUser(null);
                    setLoading(false);
                }
            }
        };

        restoreSession();

        // Lắng nghe SIGNED_OUT và SIGNED_IN từ Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                // Kiểm tra custom session (QLDT/Microsoft) — dùng key RIÊNG, không phải key Supabase
                // (Supabase xóa key của nó TRƯỚC khi fire SIGNED_OUT nên phải dùng key khác)
                const stored = localStorage.getItem('clb_custom_session');
                if (stored) {
                    try {
                        const authData = JSON.parse(stored);
                        if (authData?.user?.id && authData?.access_token) {
                            console.log('🔔 Supabase SIGNED_OUT nhưng còn custom session QLDT/Microsoft, giữ nguyên user');
                            return; // Không logout
                        }
                    } catch (_) { }
                }
                // Không có custom session → thực sự logout
                isSigningIn.current = false;
                setUser(null);
                setLoading(false);
            } else if (event === 'SIGNED_IN' && session?.user && !isSigningIn.current) {
                // Chỉ xử lý nếu không phải đang trong luồng signIn (tránh double set)
                const basicUser = createBasicUserFromSession(session.user);
                setUser(basicUser);
                setLoading(false);
                loadFullUser(session.user.id, basicUser);
            }
        });

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, []);

    // ── signIn: CLB (Supabase) ────────────────────────────────────────────────
    const signIn = async (email, password) => {
        try {
            isSigningIn.current = true; // Ngăn restoreSession override
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            });

            if (error) {
                isSigningIn.current = false;
                setLoading(false);
                return { success: false, error: { message: error.message || 'Đăng nhập thất bại' } };
            }

            const supaUser = data.user;
            if (supaUser) {
                const basicUser = createBasicUserFromSession(supaUser);
                setUser(basicUser);
                isSigningIn.current = false; // Reset sau khi đã set user
                setLoading(false);
                loadFullUser(supaUser.id, basicUser);
            } else {
                isSigningIn.current = false;
                setLoading(false);
            }

            return { success: true, data: data.session };
        } catch (err) {
            console.error('signIn error:', err);
            isSigningIn.current = false;
            setLoading(false);
            return { success: false, error: err };
        }
    };

    // ── signUp ─────────────────────────────────────────────────────────────────
    const signUp = async (email, password, userData) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: { data: { name: userData.name?.trim() } },
            });

            if (error) return { success: false, error };

            if (data.user) {
                const newUserData = {
                    id: data.user.id,
                    email: data.user.email,
                    name: userData.name?.trim() || data.user.email?.split('@')[0] || 'User',
                    image: null,
                    bio: null,
                    address: null,
                    phoneNumber: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                const { error: insertError } = await supabase.from('users').insert([newUserData]);
                if (insertError) console.error('Error creating user:', insertError);
            }

            return { success: true, data };
        } catch (error) {
            console.error('signUp error:', error);
            return { success: false, error };
        }
    };

    // ── signOut ────────────────────────────────────────────────────────────────
    const signOut = async () => {
        try {
            localStorage.removeItem('clb_custom_session'); // Custom session key
            await supabase.auth.signOut();
            setUser(null);
            setLoading(false);
            return { success: true };
        } catch (error) {
            console.error('signOut error:', error);
            setUser(null);
            setLoading(false);
            return { success: true };
        }
    };

    const setAuth = (authUser) => setUser(authUser);
    const setUserData = (userData) => setUser({ ...userData });

    const debugSession = async () => {
        console.log('=== DEBUG SESSION ===');
        console.log('user:', user, 'loading:', loading);
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Supabase session:', session);
        const stored = localStorage.getItem('clb_custom_session');
        console.log('Custom session (QLDT/Microsoft):', stored ? JSON.parse(stored) : null);
        console.log('=== END DEBUG ===');
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setAuth, setUserData, debugSession }}>
            {children}
        </AuthContext.Provider>
    );
};
