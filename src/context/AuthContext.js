import { createContext, useContext, useEffect, useState } from 'react';
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

    console.log('AuthContext state:', {
        user: user ? { id: user.id, email: user.email, name: user.name, image: user.image } : null,
        loading
    });

    // Helper function để tạo basic user object từ session
    const createBasicUserFromSession = (sessionUser) => {
        return {
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
            image: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.image || null,
            bio: sessionUser.user_metadata?.bio || null,
            address: sessionUser.user_metadata?.address || null,
            phoneNumber: sessionUser.user_metadata?.phoneNumber || null,
            created_at: sessionUser.created_at,
            updated_at: sessionUser.updated_at
        };
    };

    useEffect(() => {
        // Kiểm tra session khi component mount
        const checkSession = async () => {
            try {
                setLoading(true);
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.log('Session error:', error);
                    setUser(null);
                    return;
                }

                if (session) {
                    // Tạo user object cơ bản từ session trước
                    const basicUser = createBasicUserFromSession(session.user);

                    // Set user ngay lập tức để tránh loading
                    setUser(basicUser);
                    setLoading(false);

                    console.log('🎉 LOGIN SUCCESS - Basic user:', {
                        id: basicUser.id,
                        email: basicUser.email,
                        name: basicUser.name,
                        image: basicUser.image,
                        bio: basicUser.bio,
                        address: basicUser.address,
                        phoneNumber: basicUser.phoneNumber
                    });

                    // Sau đó thử lấy thông tin chi tiết từ database (async, không block)
                    try {
                        const userRes = await getUserData(session.user.id);
                        if (userRes.success) {
                            setUser(userRes.data);

                            console.log('🎉 LOGIN SUCCESS - Detailed user:', {
                                id: userRes.data.id,
                                email: userRes.data.email,
                                name: userRes.data.name,
                                image: userRes.data.image,
                                bio: userRes.data.bio,
                                address: userRes.data.address,
                                phoneNumber: userRes.data.phoneNumber,
                                created_at: userRes.data.created_at,
                                updated_at: userRes.data.updated_at
                            });
                        }
                    } catch (error) {
                        // Silent error
                    }
                } else {
                    setUser(null);
                    setLoading(false);
                }
            } catch (error) {
                console.log('Check session error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Lắng nghe thay đổi auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session);

                if (session) {
                    // Tạo user object cơ bản từ session trước
                    const basicUser = createBasicUserFromSession(session.user);

                    // Set user ngay lập tức để tránh loading
                    setUser(basicUser);
                    setLoading(false);

                    console.log('🎉 LOGIN SUCCESS - Basic user (auth change):', {
                        id: basicUser.id,
                        email: basicUser.email,
                        name: basicUser.name,
                        image: basicUser.image,
                        bio: basicUser.bio,
                        address: basicUser.address,
                        phoneNumber: basicUser.phoneNumber
                    });

                    // Sau đó thử lấy thông tin chi tiết từ database (async, không block)
                    try {
                        const userRes = await getUserData(session.user.id);
                        if (userRes.success) {
                            setUser(userRes.data);

                            console.log('🎉 LOGIN SUCCESS - Detailed user (auth change):', {
                                id: userRes.data.id,
                                email: userRes.data.email,
                                name: userRes.data.name,
                                image: userRes.data.image,
                                bio: userRes.data.bio,
                                address: userRes.data.address,
                                phoneNumber: userRes.data.phoneNumber,
                                created_at: userRes.data.created_at,
                                updated_at: userRes.data.updated_at
                            });
                        }
                    } catch (error) {
                        // Silent error
                    }
                } else {
                    setUser(null);
                    setLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []); // Chỉ chạy một lần khi mount

    const setAuth = (authUser) => {
        setUser(authUser);
    };

    const setUserData = (userData) => {
        setUser({ ...userData });
    };

    const signIn = async (email, password) => {
        console.log('AuthContext signIn called with:', email);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            });

            if (error) {
                return { success: false, error };
            }

            if (data?.user) {
                // Lấy thông tin user từ database
                try {
                    const userRes = await getUserData(data.user.id);
                    if (userRes.success) {
                        console.log('User data loaded successfully:', userRes.data);
                        setUser(userRes.data);
                    } else {
                        console.log('Failed to get user data, using session user:', userRes.msg);
                        // Fallback: sử dụng session.user với thông tin cơ bản
                        setUser({
                            id: data.user.id,
                            email: data.user.email,
                            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                            image: data.user.user_metadata?.avatar_url || null,
                            created_at: data.user.created_at,
                            updated_at: data.user.updated_at
                        });
                    }
                } catch (error) {
                    console.error('Error getting user data:', error);
                    // Fallback: sử dụng session.user
                    setUser({
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                        image: data.user.user_metadata?.avatar_url || null,
                        created_at: data.user.created_at,
                        updated_at: data.user.updated_at
                    });
                }
            }

            return { success: true, data };
        } catch (err) {
            console.error('Supabase signIn error:', err);
            return { success: false, error: err };
        }
    };

    const signUp = async (email, password, userData) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: {
                    data: {
                        name: userData.name?.trim(),
                    }
                }
            });

            if (error) {
                return { success: false, error };
            }

            if (data.user) {
                // Tạo user record trong database
                const newUserData = {
                    id: data.user.id,
                    email: data.user.email,
                    name: userData.name?.trim() || data.user.email?.split('@')[0] || 'User',
                    image: null,
                    bio: null,
                    address: null,
                    phoneNumber: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const { error: insertError } = await supabase
                    .from('users')
                    .insert([newUserData]);

                if (insertError) {
                    console.error('Error creating user:', insertError);
                }
            }

            return { success: true, data };
        } catch (error) {
            console.error('SignUp error:', error);
            return { success: false, error };
        }
    };

    const signOut = async () => {
        try {
            console.log('🚪 Starting to clear session...');

            // Tạo timeout promise để tránh treo
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('SignOut timeout after 5 seconds')), 5000);
            });

            // Clear all Supabase sessions với timeout
            const signOutPromise = supabase.auth.signOut();
            const { error } = await Promise.race([signOutPromise, timeoutPromise]);

            if (error) {
                console.log('❌ Supabase signOut error:', error);
                // Không return error, tiếp tục clear local data
            } else {
                console.log('✅ Supabase signOut successful');
            }

            // Clear all localStorage items related to Supabase
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.includes('supabase')) {
                    localStorage.removeItem(key);
                    console.log('🗑️ Removed from localStorage:', key);
                }
            });

            // Clear session storage
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('sb-') || key.includes('supabase')) {
                    sessionStorage.removeItem(key);
                    console.log('🗑️ Removed from sessionStorage:', key);
                }
            });

            // Reset state immediately
            setUser(null);
            setLoading(false);

            console.log('✅ Session cleared completely, user should be null now');

            return { success: true };
        } catch (error) {
            console.log('❌ SignOut error:', error);

            // Fallback: Clear local data anyway
            console.log('🔄 Fallback: Clearing local data...');

            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.includes('supabase')) {
                    localStorage.removeItem(key);
                    console.log('🗑️ Fallback removed from localStorage:', key);
                }
            });

            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('sb-') || key.includes('supabase')) {
                    sessionStorage.removeItem(key);
                    console.log('🗑️ Fallback removed from sessionStorage:', key);
                }
            });

            setUser(null);
            setLoading(false);

            console.log('✅ Fallback: Session cleared locally');
            return { success: true };
        }
    };

    const debugSession = async () => {
        console.log('=== DEBUG SESSION ===');
        console.log('Current user state:', user);
        console.log('Current loading state:', loading);

        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log('Supabase session:', session);
            console.log('Session error:', error);

            if (session) {
                console.log('Session user:', session.user);
                console.log('Session expires at:', new Date(session.expires_at * 1000));
                console.log('Session is expired:', new Date() > new Date(session.expires_at * 1000));
            }

            console.log('LocalStorage Supabase keys:', Object.keys(localStorage).filter(key => key.startsWith('sb-')));
            console.log('SessionStorage Supabase keys:', Object.keys(sessionStorage).filter(key => key.startsWith('sb-')));
        } catch (error) {
            console.error('Debug session error:', error);
        }
        console.log('=== END DEBUG ===');
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        setAuth,
        setUserData,
        debugSession,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
