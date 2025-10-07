import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

    // Helper function để update user data
    const setUserData = (data) => {
        setUser(prev => ({ ...prev, ...data }));
    };

    console.log('AuthContext state:', { 
        user: user ? { id: user.id, email: user.email, name: user.name, image: user.image } : null, 
        loading 
    });

    // Effect để handle navigation sau khi login thành công
    useEffect(() => {
        if (user && !loading) {
            console.log('User authenticated, checking if we need to navigate...');
            // Có thể thêm logic navigation ở đây nếu cần
        }
    }, [user, loading]);

    useEffect(() => {
        let isMounted = true; // Flag để tránh memory leak
        
        // Fallback timeout để tránh loading mãi mãi
        const fallbackTimeout = setTimeout(() => {
            if (isMounted) {
                console.log('Fallback timeout: forcing loading to false');
                setLoading(false);
            }
        }, 3000); // Giảm xuống 3 giây vì đã có fallback tốt

        // Lấy session hiện tại
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                // Lấy thông tin user từ database
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                setUserData(data);
            }
            setLoading(false);
        };

        getSession();

        // Lắng nghe thay đổi auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session);
                if (session && session.user) {
                    console.log('Setting user:', session.user);
                    setUser(session.user);

                    // Lấy thông tin user từ database hoặc metadata
                    try {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        if (userData) {
                            console.log('User data from database:', userData);
                            setUserData({
                                id: session.user.id,
                                name: userData.name || session.user.user_metadata?.name || 'User',
                                email: session.user.email,
                                image: userData.image || session.user.user_metadata?.avatar_url || null,
                                bio: userData.bio || null
                            });
                        } else {
                            // Fallback to session user with metadata
                            console.log('No user data in database, using metadata');
                            setUserData({
                                id: session.user.id,
                                name: session.user.user_metadata?.name || 'User',
                                email: session.user.email,
                                image: session.user.user_metadata?.avatar_url || null
                            });
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                        // Fallback to session user with metadata
                        setUserData({
                            id: session.user.id,
                            name: session.user.user_metadata?.name || 'User',
                            email: session.user.email,
                            image: session.user.user_metadata?.avatar_url || null
                        });
                    }
                } else {
                    console.log('No session, clearing user data');
                    setUser(null);
                    setUserData(null);
                }
                setLoading(false);
            }
        );

        return () => {
            isMounted = false;
            clearTimeout(fallbackTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email, password) => {
        console.log('AuthContext signIn called with:', email);

        try {
            console.log('Calling supabase.auth.signInWithPassword...');

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            console.log('Supabase signIn response:', { data, error });

                if (data?.user) {
                    // Lấy thông tin user từ database
                    try {
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', data.user.id)
                            .single();

                        if (userError) {
                            console.error('Error fetching user data in signIn:', userError);
                            // Fallback to session user with metadata
                            const fallbackUser = {
                                ...data.user,
                                name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                                image: data.user.user_metadata?.avatar_url || null
                            };
                            console.log('Using fallback user in signIn:', fallbackUser);
                            setUser(fallbackUser);
                        } else {
                            console.log('User data from database:', userData);
                            // Merge database data with session user
                            const mergedUser = {
                                ...data.user,
                                ...userData
                            };
                            setUser(mergedUser);
                        }
                    } catch (dbError) {
                        console.error('Database error in signIn:', dbError);
                        // Fallback to session user with metadata
                        const fallbackUser = {
                            ...data.user,
                            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                            image: data.user.user_metadata?.avatar_url || null
                        };
                        console.log('Using fallback user in signIn (catch):', fallbackUser);
                        setUser(fallbackUser);
                    }
                }

            return { data, error };
        } catch (err) {
            console.error('Supabase signIn error:', err);
            return { data: null, error: err };
        }
    };

    const signUp = async (email, password, userData) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (data.user && !error) {
            // Tạo user record trong database
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: data.user.email,
                    ...userData
                });

            if (insertError) {
                console.error('Error creating user:', insertError);
            }
        }

        return { data, error };
    };

    const clearSession = async () => {
        try {
            console.log('Starting to clear session...');
            
            // Clear all Supabase sessions
            await supabase.auth.signOut();
            
            // Clear all localStorage items related to Supabase
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.includes('supabase')) {
                    localStorage.removeItem(key);
                    console.log('Removed from localStorage:', key);
                }
            });
            
            // Clear session storage
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('sb-') || key.includes('supabase')) {
                    sessionStorage.removeItem(key);
                    console.log('Removed from sessionStorage:', key);
                }
            });
            
            // Reset state immediately
            setUser(null);
            setUserData(null);
            setLoading(false);
            
            console.log('Session cleared completely, user should be null now');
            
            // Force a small delay to ensure state updates
            setTimeout(() => {
                console.log('Final state check - user:', user, 'loading:', loading);
            }, 100);
            
            return { success: true };
        } catch (error) {
            console.error('Error clearing session:', error);
            return { success: false, error };
        }
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut: clearSession,
        setUser,
        setUserData,
        clearSession,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
