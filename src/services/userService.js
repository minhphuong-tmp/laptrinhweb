const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';
const BASE_URL = 'https://oqtlakdvlmkaalymgrwd.supabase.co';

const getAuthToken = () => {
    try {
        const storedToken = localStorage.getItem('sb-oqtlakdvlmkaalymgrwd-auth-token');
        if (storedToken) {
            const authData = JSON.parse(storedToken);
            return authData.access_token || API_KEY;
        }
    } catch (error) {
        console.log('Could not parse stored token, using API key');
    }
    return API_KEY;
};

export const getUserData = async (userId) => {
    try {
        console.log('🔍 Getting user data for:', userId);
        
        const authToken = getAuthToken();
        
        // Lấy dữ liệu từ bảng users bằng REST API
        const usersUrl = `${BASE_URL}/rest/v1/users?id=eq.${userId}`;
        const usersResponse = await fetch(usersUrl, {
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!usersResponse.ok) {
            console.error('❌ Failed to get user data:', usersResponse.status);
            // Fallback: trả về user data cơ bản
            return { 
                success: true, 
                data: {
                    id: userId,
                    name: 'User',
                    email: '',
                    image: null,
                    bio: null,
                    address: null,
                    phoneNumber: null
                }
            };
        }

        const usersData = await usersResponse.json();
        console.log('📊 Users data response:', usersData);

        if (!usersData || usersData.length === 0) {
            console.log('⚠️ No user data found, creating basic user');
            // Tạo user data cơ bản từ token
            const storedToken = localStorage.getItem('sb-oqtlakdvlmkaalymgrwd-auth-token');
            if (storedToken) {
                const authData = JSON.parse(storedToken);
                const basicUser = {
                    id: userId,
                    email: authData.user?.email || 'unknown@example.com',
                    name: authData.user?.user_metadata?.name || authData.user?.email?.split('@')[0] || 'User',
                    image: authData.user?.user_metadata?.avatar_url || null,
                    bio: null,
                    address: null,
                    phoneNumber: null,
                    created_at: authData.user?.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                return { success: true, data: basicUser };
            }
            return { success: false, msg: 'No user data found' };
        }

        const userData = usersData[0];
        
        // Đảm bảo có email field từ token nếu không có trong database
        if (!userData.email) {
            const storedToken = localStorage.getItem('sb-oqtlakdvlmkaalymgrwd-auth-token');
            if (storedToken) {
                const authData = JSON.parse(storedToken);
                userData.email = authData.user?.email || 'unknown@example.com';
            }
        }
        
        console.log('✅ User data loaded:', userData);

        return { success: true, data: userData };
    } catch (error) {
        console.error('❌ getUserData error:', error);
        return { success: false, msg: error.message };
    }
};

export const updateUser = async (userId, data) => {
    try {
        const authToken = getAuthToken();
        
        const updateUrl = `${BASE_URL}/rest/v1/users?id=eq.${userId}`;
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to update user:', response.status, errorText);
            return { success: false, msg: `HTTP error! status: ${response.status}` };
        }

        const updatedData = await response.json();
        return { success: true, data: updatedData[0] || data };
    } catch (error) {
        console.error('❌ updateUser error:', error);
        return { success: false, msg: error.message };
    }
};

export const createUser = async (userData) => {
    try {
        const authToken = getAuthToken();
        
        const createUrl = `${BASE_URL}/rest/v1/users`;
        const response = await fetch(createUrl, {
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to create user:', response.status, errorText);
            return { success: false, msg: `HTTP error! status: ${response.status}` };
        }

        const createdData = await response.json();
        return { success: true, data: createdData[0] };
    } catch (error) {
        console.error('❌ createUser error:', error);
        return { success: false, msg: error.message };
    }
};

export const deleteUser = async (userId) => {
    try {
        const authToken = getAuthToken();
        
        const deleteUrl = `${BASE_URL}/rest/v1/users?id=eq.${userId}`;
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to delete user:', response.status, errorText);
            return { success: false, msg: `HTTP error! status: ${response.status}` };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ deleteUser error:', error);
        return { success: false, msg: error.message };
    }
};

// Helper function để check user có tồn tại không
export const checkUserExists = async (userId) => {
    try {
        const authToken = getAuthToken();
        
        const checkUrl = `${BASE_URL}/rest/v1/users?id=eq.${userId}&select=id`;
        const response = await fetch(checkUrl, {
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('❌ Failed to check user existence:', response.status);
            return { success: false, exists: false };
        }

        const data = await response.json();
        return { success: true, exists: data && data.length > 0 };
    } catch (error) {
        console.error('❌ checkUserExists error:', error);
        return { success: false, exists: false };
    }
};

// Helper function để sync user data với auth
export const syncUserWithAuth = async (userId) => {
    try {
        const userRes = await getUserData(userId);
        if (userRes.success) {
            return userRes;
        } else {
            // Nếu không lấy được từ database, tạo user mới từ token
            const storedToken = localStorage.getItem('sb-oqtlakdvlmkaalymgrwd-auth-token');
            if (storedToken) {
                const authData = JSON.parse(storedToken);
                if (authData.user) {
                    const newUserData = {
                        id: authData.user.id,
                        email: authData.user.email,
                        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
                        image: authData.user.user_metadata?.avatar_url || null,
                        bio: null,
                        address: null,
                        phoneNumber: null,
                        created_at: authData.user.created_at || new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    const createRes = await createUser(newUserData);
                    if (createRes.success) {
                        return { success: true, data: createRes.data };
                    }
                }
            }
            return { success: false, msg: 'Failed to sync user data' };
        }
    } catch (error) {
        console.error('❌ syncUserWithAuth error:', error);
        return { success: false, msg: error.message };
    }
};

// Lấy tất cả users (cho chat, search, etc.)
export const getAllUsers = async (limit = 50, offset = 0) => {
    try {
        const authToken = getAuthToken();
        
        const usersUrl = `${BASE_URL}/rest/v1/users?order=created_at.desc&limit=${limit}&offset=${offset}`;
        const response = await fetch(usersUrl, {
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('❌ Failed to get all users:', response.status);
            return { success: false, msg: `HTTP error! status: ${response.status}` };
        }

        const data = await response.json();
        console.log('📊 All users data:', data);

        // Đảm bảo có image field
        const processedUsers = (data || []).map(user => ({
            ...user,
            image: user.image || user.avatar || user.avatar_url || null
        }));

        return { success: true, data: processedUsers };
    } catch (error) {
        console.error('❌ getAllUsers error:', error);
        return { success: false, msg: error.message };
    }
};

// Tìm kiếm users theo tên hoặc email
export const searchUsers = async (query, limit = 20) => {
    try {
        if (!query || query.trim().length < 2) {
            return { success: true, data: [] };
        }

        const authToken = getAuthToken();
        const searchTerm = `%${query.trim()}%`;
        
        const searchUrl = `${BASE_URL}/rest/v1/users?or=(name.ilike.${searchTerm},email.ilike.${searchTerm})&limit=${limit}`;
        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('❌ Failed to search users:', response.status);
            return { success: false, msg: `HTTP error! status: ${response.status}` };
        }

        const data = await response.json();

        // Đảm bảo có image field
        const processedUsers = (data || []).map(user => ({
            ...user,
            image: user.image || user.avatar || user.avatar_url || null
        }));

        return { success: true, data: processedUsers };
    } catch (error) {
        console.error('❌ searchUsers error:', error);
        return { success: false, msg: error.message };
    }
};