// Helper function to test table schema
export const testNotesSchema = async () => {
    try {
        console.log('🔍 Testing notes table schema...');
        
        const authToken = getAuthToken();
        const response = await fetch(`${BASE_URL}/notes?limit=1`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                console.log('📋 Notes table columns:', Object.keys(data[0]));
            } else {
                console.log('📋 Notes table is empty, trying to get schema info...');
            }
        } else {
            const errorData = await response.text();
            console.error('❌ Schema test error:', response.status, errorData);
        }
    } catch (error) {
        console.error('❌ Schema test error:', error);
    }
};

// ===== NOTES SERVICE (using REST API) =====
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';
const BASE_URL = 'https://oqtlakdvlmkaalymgrwd.supabase.co/rest/v1';

// Helper function to get auth token
const getAuthToken = () => {
    const storedToken = localStorage.getItem('sb-oqtlakdvlmkaalymgrwd-auth-token');
    if (storedToken) {
        try {
            const authData = JSON.parse(storedToken);
            return authData.access_token || API_KEY;
        } catch (e) {
            return API_KEY;
        }
    }
    return API_KEY;
};
export const createTodo = async (todoData) => {
    try {
        const authToken = getAuthToken();
        const response = await fetch(`${BASE_URL}/notes`, {
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(todoData)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.log('createTodo error:', response.status, errorData);
            return { success: false, msg: 'Không thể tạo ghi chú' };
        }

        const data = await response.json();
        return { success: true, data: data[0] };
    } catch (error) {
        console.log('createTodo error:', error);
        return { success: false, msg: 'Không thể tạo ghi chú' };
    }
};

export const getTodos = async (userId) => {
    try {
        console.log('📋 Loading todos for user:', userId);
        
        const authToken = getAuthToken();
        const url = `${BASE_URL}/notes?user_id=eq.${userId}&order=created_at.desc`;
        console.log('📡 Request URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ getTodos error:', response.status, errorData);
            return { success: false, msg: 'Không thể lấy danh sách ghi chú' };
        }

        const data = await response.json();
        console.log('✅ getTodos success, count:', data.length);
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('❌ getTodos error:', error);
        return { success: false, msg: 'Không thể lấy danh sách ghi chú' };
    }
};

export const updateTodo = async (todoId, updates) => {
    try {
        const authToken = getAuthToken();
        const response = await fetch(`${BASE_URL}/notes?id=eq.${todoId}`, {
            method: 'PATCH',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.log('updateTodo error:', response.status, errorData);
            return { success: false, msg: 'Không thể cập nhật ghi chú' };
        }

        const data = await response.json();
        return { success: true, data: data[0] };
    } catch (error) {
        console.log('updateTodo error:', error);
        return { success: false, msg: 'Không thể cập nhật ghi chú' };
    }
};

export const deleteTodo = async (todoId) => {
    try {
        const authToken = getAuthToken();
        const response = await fetch(`${BASE_URL}/notes?id=eq.${todoId}`, {
            method: 'DELETE',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.log('deleteTodo error:', response.status, errorData);
            return { success: false, msg: 'Không thể xóa ghi chú' };
        }

        return { success: true };
    } catch (error) {
        console.log('deleteTodo error:', error);
        return { success: false, msg: 'Không thể xóa ghi chú' };
    }
};

export const toggleTodoComplete = async (todoId, completed) => {
    try {
        console.log('🔄 Toggling todo:', todoId, 'to completed:', completed);
        
        const authToken = getAuthToken();
        console.log('🔑 Auth token:', authToken.substring(0, 20) + '...');
        
        const url = `${BASE_URL}/notes?id=eq.${todoId}`;
        console.log('📡 Request URL:', url);
        
        const requestBody = { 
            completed
        };
        console.log('📦 Request body:', requestBody);
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ toggleTodoComplete error:', response.status, errorData);
            return { success: false, msg: 'Không thể cập nhật trạng thái ghi chú' };
        }

        const data = await response.json();
        console.log('✅ toggleTodoComplete success:', data);
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('❌ toggleTodoComplete error:', error);
        return { success: false, msg: 'Không thể cập nhật trạng thái ghi chú' };
    }
};

// ===== FILTERING FUNCTIONS =====
export const getFilteredTodos = (todos, filter) => {
    switch (filter) {
        case 'active':
            return todos.filter(todo => !todo.completed);
        case 'completed':
            return todos.filter(todo => todo.completed);
        case 'today':
            const today = new Date().toDateString();
            return todos.filter(todo => 
                todo.deadline && new Date(todo.deadline).toDateString() === today
            );
        case 'overdue':
            const now = new Date();
            return todos.filter(todo => 
                todo.deadline && new Date(todo.deadline) < now && !todo.completed
            );
        default:
            return todos;
    }
};

export const getPriorityColor = (priority) => {
    switch (priority) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#10b981';
        default: return '#6b7280';
    }
};

export const getPriorityText = (priority) => {
    switch (priority) {
        case 'high': return 'Cao';
        case 'medium': return 'Trung bình';
        case 'low': return 'Thấp';
        default: return 'Trung bình';
    }
};

