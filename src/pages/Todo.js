import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    createTodo, 
    getTodos, 
    deleteTodo, 
    toggleTodoComplete,
    getFilteredTodos,
    getPriorityColor,
    getPriorityText,
    testNotesSchema
} from '../services/todoService';
import './Todo.css';

const Todo = () => {
    const { user } = useAuth();
    const [todos, setTodos] = useState([]);
    const [filter, setFilter] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newTodo, setNewTodo] = useState({
        title: '',
        description: '',
        priority: 'medium',
        deadline: ''
    });

    const loadTodos = useCallback(async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            const result = await getTodos(user.id);
            if (result.success) {
                setTodos(result.data);
            } else {
                console.error('Error loading todos:', result.msg);
            }
        } catch (error) {
            console.error('Error loading todos:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            // Test schema first
            testNotesSchema();
            loadTodos();
        }
    }, [user?.id, loadTodos]);

    const addTodo = async () => {
        if (!newTodo.title.trim() || !user?.id) return;

        const tempId = 'temp-' + Date.now();
        const tempTodo = {
            id: tempId,
            user_id: user.id,
            title: newTodo.title,
            description: newTodo.description,
            priority: newTodo.priority,
            deadline: newTodo.deadline,
            completed: false,
            created_at: new Date().toISOString()
        };

        // Optimistic UI update - thêm ngay lập tức
        setTodos(prevTodos => [tempTodo, ...prevTodos]);
        
        // Clear form
        setNewTodo({
            title: '',
            description: '',
            priority: 'medium',
            deadline: ''
        });
        setShowAddForm(false);

        try {
            const todoData = {
                user_id: user.id,
                title: tempTodo.title,
                description: tempTodo.description,
                priority: tempTodo.priority,
                deadline: tempTodo.deadline || null,
                completed: false
            };

            const result = await createTodo(todoData);
            if (result.success) {
                // Thay thế temp todo bằng real todo từ server
                setTodos(prevTodos => 
                    prevTodos.map(t => 
                        t.id === tempId ? result.data : t
                    )
                );
                console.log('✅ Todo created successfully');
            } else {
                // Nếu API call thất bại, xóa temp todo
                setTodos(prevTodos => prevTodos.filter(t => t.id !== tempId));
                console.error('Error creating todo:', result.msg);
                
                // Hiển thị thông báo lỗi
                const errorMessage = document.createElement('div');
                errorMessage.textContent = '❌ Lỗi khi tạo ghi chú!';
                errorMessage.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ef4444;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                `;
                document.body.appendChild(errorMessage);
                
                setTimeout(() => {
                    errorMessage.remove();
                }, 3000);
            }
        } catch (error) {
            // Nếu có exception, xóa temp todo
            setTodos(prevTodos => prevTodos.filter(t => t.id !== tempId));
            console.error('Error creating todo:', error);
        }
    };

    const toggleTodo = async (id) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        // Optimistic UI update - update ngay lập tức
        setTodos(prevTodos => 
            prevTodos.map(t => 
                t.id === id ? { ...t, completed: !t.completed } : t
            )
        );

        try {
            const result = await toggleTodoComplete(id, !todo.completed);
            if (!result.success) {
                // Nếu API call thất bại, revert lại UI
                setTodos(prevTodos => 
                    prevTodos.map(t => 
                        t.id === id ? { ...t, completed: todo.completed } : t
                    )
                );
                console.error('Error toggling todo:', result.msg);
                
                // Hiển thị thông báo lỗi
                const errorMessage = document.createElement('div');
                errorMessage.textContent = '❌ Lỗi khi cập nhật trạng thái!';
                errorMessage.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ef4444;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                `;
                document.body.appendChild(errorMessage);
                
                setTimeout(() => {
                    errorMessage.remove();
                }, 3000);
            } else {
                console.log('✅ Todo toggled successfully');
            }
        } catch (error) {
            // Nếu có exception, revert lại UI
            setTodos(prevTodos => 
                prevTodos.map(t => 
                    t.id === id ? { ...t, completed: todo.completed } : t
                )
            );
            console.error('Error toggling todo:', error);
        }
    };

    const deleteTodoItem = async (id) => {
        // Optimistic UI update - xóa ngay lập tức
        const todoToDelete = todos.find(t => t.id === id);
        setTodos(prevTodos => prevTodos.filter(t => t.id !== id));

        try {
            const result = await deleteTodo(id);
            if (!result.success) {
                // Nếu API call thất bại, restore lại todo
                setTodos(prevTodos => [...prevTodos, todoToDelete]);
                console.error('Error deleting todo:', result.msg);
                
                // Hiển thị thông báo lỗi
                const errorMessage = document.createElement('div');
                errorMessage.textContent = '❌ Lỗi khi xóa ghi chú!';
                errorMessage.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ef4444;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                `;
                document.body.appendChild(errorMessage);
                
                setTimeout(() => {
                    errorMessage.remove();
                }, 3000);
            } else {
                console.log('✅ Todo deleted successfully');
            }
        } catch (error) {
            // Nếu có exception, restore lại todo
            setTodos(prevTodos => [...prevTodos, todoToDelete]);
            console.error('Error deleting todo:', error);
        }
    };

    const filteredTodos = getFilteredTodos(todos, filter);
    
    // Debug logging for statistics
    console.log('📊 Todo Statistics:', {
        total: todos.length,
        completed: todos.filter(t => t.completed).length,
        active: todos.filter(t => !t.completed).length,
        today: todos.filter(t => 
            t.deadline && new Date(t.deadline).toDateString() === new Date().toDateString()
        ).length,
        overdue: todos.filter(t => 
            t.deadline && new Date(t.deadline) < new Date() && !t.completed
        ).length,
        currentFilter: filter,
        filteredCount: filteredTodos.length
    });

    return (
        <div className="todo-container">
            {loading ? (
                <div className="loading">Đang tải...</div>
            ) : (
                <>
                    <div className="todo-header">
                        <h2>Ghi chú</h2>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowAddForm(true)}
                        >
                            + Thêm ghi chú
                        </button>
                    </div>

                    {/* Statistics Overview */}
                    <div className="todo-stats">
                        <div className="stat-card">
                            <div className="stat-number">{todos.length}</div>
                            <div className="stat-label">Tổng cộng</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{todos.filter(t => !t.completed).length}</div>
                            <div className="stat-label">Đang làm</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{todos.filter(t => t.completed).length}</div>
                            <div className="stat-label">Hoàn thành</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">
                                {todos.length > 0 ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) : 0}%
                            </div>
                            <div className="stat-label">Tiến độ</div>
                        </div>
                    </div>

            <div className="todo-filters">
                <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Tất cả ({todos.length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Đang làm ({todos.filter(t => !t.completed).length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Hoàn thành ({todos.filter(t => t.completed).length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
                    onClick={() => setFilter('today')}
                >
                    Hôm nay ({todos.filter(t => 
                        t.deadline && new Date(t.deadline).toDateString() === new Date().toDateString()
                    ).length})
                </button>
                <button 
                    className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
                    onClick={() => setFilter('overdue')}
                >
                    Quá hạn ({todos.filter(t => 
                        t.deadline && new Date(t.deadline) < new Date() && !t.completed
                    ).length})
                </button>
            </div>

            {showAddForm && (
                <div className="add-todo-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Thêm ghi chú mới</h3>
                            <button 
                                className="close-btn"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewTodo({
                                        title: '',
                                        description: '',
                                        priority: 'medium',
                                        deadline: ''
                                    });
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="add-todo-form">
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Tiêu đề..."
                                    value={newTodo.title}
                                    onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <textarea
                                    placeholder="Mô tả..."
                                    value={newTodo.description}
                                    onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                                    className="form-textarea"
                                    rows="3"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <select
                                        value={newTodo.priority}
                                        onChange={(e) => setNewTodo({...newTodo, priority: e.target.value})}
                                        className="form-input"
                                    >
                                        <option value="low">Thấp</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="high">Cao</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <input
                                        type="date"
                                        value={newTodo.deadline}
                                        onChange={(e) => setNewTodo({...newTodo, deadline: e.target.value})}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    Hủy
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={addTodo}
                                >
                                    Thêm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="todo-list">
                {filteredTodos.length === 0 ? (
                    <div className="empty-state">
                        <p>Không có ghi chú nào.</p>
                    </div>
                ) : (
                    filteredTodos.map((todo) => (
                        <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                            <div className="todo-content">
                                <div className="todo-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={todo.completed}
                                        onChange={() => toggleTodo(todo.id)}
                                    />
                                </div>
                                <div className="todo-details">
                                    <h4 className="todo-title">{todo.title}</h4>
                                    {todo.description && (
                                        <p className="todo-description">{todo.description}</p>
                                    )}
                                    <div className="todo-meta">
                                        <span 
                                            className="priority-badge"
                                            style={{ backgroundColor: getPriorityColor(todo.priority) }}
                                        >
                                            {getPriorityText(todo.priority)}
                                        </span>
                                        {todo.deadline && (
                                            <span className="deadline">
                                                {new Date(todo.deadline).toLocaleDateString('vi-VN')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button 
                                className="delete-btn"
                                onClick={() => deleteTodoItem(todo.id)}
                            >
                                Xóa
                            </button>
                        </div>
                    ))
                )}
            </div>
                </>
            )}
        </div>
    );
};

export default Todo;
