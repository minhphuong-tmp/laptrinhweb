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
                if (session) {
                    console.log('Setting user:', session.user);
                    setUser(session.user);

                    // Tạm thời skip database query và dùng user metadata
                    console.log('Using user metadata instead of database query...');
                    setUserData({
                        id: session.user.id,
                        name: session.user.user_metadata?.name || 'User',
                        email: session.user.email,
                        avatar: session.user.user_metadata?.avatar_url || null
                    });
                    console.log('User data set from metadata:', {
                        id: session.user.id,
                        name: session.user.user_metadata?.name || 'User',
                        email: session.user.email
                    });
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

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        setUser,
        setUserData: (data) => setUser(prev => ({ ...prev, ...data })), // Giống mobile app
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
