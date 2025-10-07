import { supabase } from "../lib/supabase";

// ===== TODO SERVICE =====
export const createTodo = async (todoData) => {
    try {
        const { data, error } = await supabase
            .from('todos')
            .insert(todoData)
            .select()
            .single();

        if (error) {
            console.log('createTodo error:', error);
            return { success: false, msg: 'Không thể tạo ghi chú' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('createTodo error:', error);
        return { success: false, msg: 'Không thể tạo ghi chú' };
    }
};

export const getTodos = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.log('getTodos error:', error);
            return { success: false, msg: 'Không thể lấy danh sách ghi chú' };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.log('getTodos error:', error);
        return { success: false, msg: 'Không thể lấy danh sách ghi chú' };
    }
};

export const updateTodo = async (todoId, updates) => {
    try {
        const { data, error } = await supabase
            .from('todos')
            .update(updates)
            .eq('id', todoId)
            .select()
            .single();

        if (error) {
            console.log('updateTodo error:', error);
            return { success: false, msg: 'Không thể cập nhật ghi chú' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('updateTodo error:', error);
        return { success: false, msg: 'Không thể cập nhật ghi chú' };
    }
};

export const deleteTodo = async (todoId) => {
    try {
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', todoId);

        if (error) {
            console.log('deleteTodo error:', error);
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
        const { data, error } = await supabase
            .from('todos')
            .update({ 
                completed,
                completed_at: completed ? new Date().toISOString() : null
            })
            .eq('id', todoId)
            .select()
            .single();

        if (error) {
            console.log('toggleTodoComplete error:', error);
            return { success: false, msg: 'Không thể cập nhật trạng thái ghi chú' };
        }

        return { success: true, data };
    } catch (error) {
        console.log('toggleTodoComplete error:', error);
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

