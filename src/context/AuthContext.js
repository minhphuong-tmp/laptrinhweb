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
        // Kiểm tra session từ localStorage
        const checkSession = async () => {
            try {
                setLoading(true);
                const storedToken = localStorage.getItem('sb-oqtlakdvlmkaalymgrwd-auth-token');

                if (storedToken) {
                    try {
                        const authData = JSON.parse(storedToken);
                        if (authData?.user && authData?.access_token) {
                            const basicUser = createBasicUserFromSession(authData.user);
                            setUser(basicUser);
                            
                            // Load full user data from database
                            try {
                                const userDataResult = await getUserData(authData.user.id);
                                if (userDataResult.success && userDataResult.data) {
                                    console.log('🔍 Loaded user data from database:', userDataResult.data);
                                    setUser(userDataResult.data);
                                } else {
                                    console.log('⚠️ Failed to load user data from database, keeping basic user');
                                }
                            } catch (dbError) {
                                console.error('Error loading user data from database:', dbError);
                                // Keep basic user if database fails
                            }
                        } else {
                            setUser(null);
                        }
                    } catch (parseError) {
                        console.error('Error parsing stored token:', parseError);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error in checkSession:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const setAuth = (authUser) => {
        setUser(authUser);
    };

    const setUserData = (userData) => {
        setUser({ ...userData });
    };

    const signIn = async (email, password) => {
        console.log('AuthContext signIn called with:', email);

        try {
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

            const signInResponse = await fetch('https://oqtlakdvlmkaalymgrwd.supabase.co/auth/v1/token?grant_type=password', {
                method: 'POST',
                headers: {
                    'apikey': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password.trim()
                }),
                mode: 'cors',
                credentials: 'omit'
            });

            if (!signInResponse.ok) {
                const errorData = await signInResponse.json();
                console.error('❌ Sign in error:', errorData);
                return { success: false, error: { message: errorData.error_description || errorData.msg || 'Sign in failed' } };
            }

            const authData = await signInResponse.json();

            // Lưu token vào localStorage
            localStorage.setItem('sb-oqtlakdvlmkaalymgrwd-auth-token', JSON.stringify(authData));

            if (authData?.user) {
                // Sử dụng user từ session đơn giản
                const basicUser = {
                    id: authData.user.id,
                    email: authData.user.email,
                    name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
                    image: authData.user.user_metadata?.avatar_url || null,
                    created_at: authData.user.created_at,
                    updated_at: authData.user.updated_at
                };
                setUser(basicUser);
                setLoading(false);
            }

            return { success: true, data: authData };
        } catch (err) {
            console.error('Supabase signIn error:', err);
            setLoading(false);
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
            console.log('🚪 Starting sign out...');

            // Clear localStorage
            localStorage.removeItem('sb-oqtlakdvlmkaalymgrwd-auth-token');

            // Reset state
            setUser(null);
            setLoading(false);

            console.log('✅ Sign out successful');
            return { success: true };
        } catch (error) {
            console.error('❌ SignOut catch error:', error);
            setUser(null);
            setLoading(false);
            return { success: true };
        }
    };

    const debugSession = async () => {
        console.log('=== DEBUG SESSION ===');
        console.log('Current user state:', user);
        console.log('Current loading state:', loading);

        try {
            const storedToken = localStorage.getItem('sb-oqtlakdvlmkaalymgrwd-auth-token');

            if (storedToken) {
                const authData = JSON.parse(storedToken);
                console.log('Auth data:', authData);
                console.log('User from token:', authData?.user);
                console.log('Access token:', authData?.access_token ? 'Present' : 'Not found');
            }

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
