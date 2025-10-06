import { useEffect, useState } from 'react';
import './Todo.css';

const Todo = () => {
    const [todos, setTodos] = useState([]);
    const [filter, setFilter] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTodo, setNewTodo] = useState({
        title: '',
        description: '',
        priority: 'medium',
        deadline: ''
    });

    useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = () => {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            setTodos(JSON.parse(savedTodos));
        }
    };

    const saveTodos = (todosToSave) => {
        localStorage.setItem('todos', JSON.stringify(todosToSave));
        setTodos(todosToSave);
    };

    const addTodo = () => {
        if (!newTodo.title.trim()) return;

        const todo = {
            id: Date.now(),
            ...newTodo,
            completed: false,
            createdAt: new Date().toISOString()
        };

        const updatedTodos = [...todos, todo];
        saveTodos(updatedTodos);
        setNewTodo({ title: '', description: '', priority: 'medium', deadline: '' });
        setShowAddForm(false);
    };

    const toggleTodo = (id) => {
        const updatedTodos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveTodos(updatedTodos);
    };

    const deleteTodo = (id) => {
        const updatedTodos = todos.filter(todo => todo.id !== id);
        saveTodos(updatedTodos);
    };

    const getFilteredTodos = () => {
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

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getPriorityText = (priority) => {
        switch (priority) {
            case 'high': return 'Cao';
            case 'medium': return 'Trung bình';
            case 'low': return 'Thấp';
            default: return 'Trung bình';
        }
    };

    const filteredTodos = getFilteredTodos();

    return (
        <div className="todo-container">
            <div className="todo-header">
                <h2>Ghi chú</h2>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(true)}
                >
                    + Thêm ghi chú
                </button>
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
                                onClick={() => setShowAddForm(false)}
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
                                                📅 {new Date(todo.deadline).toLocaleDateString('vi-VN')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button 
                                className="delete-btn"
                                onClick={() => deleteTodo(todo.id)}
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Todo;
