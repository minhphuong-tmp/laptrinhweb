import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    getNotesByCategory,
    toggleFavorite,
    getFavoriteNotes
} from '../services/notesService';
import './Notes.css';

const Notes = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showFavorites, setShowFavorites] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'general',
        is_favorite: false
    });

    // Categories
    const categories = [
        { value: 'general', label: 'Chung', icon: '📝' },
        { value: 'work', label: 'Công việc', icon: '💼' },
        { value: 'personal', label: 'Cá nhân', icon: '👤' },
        { value: 'study', label: 'Học tập', icon: '📚' },
        { value: 'ideas', label: 'Ý tưởng', icon: '💡' },
        { value: 'shopping', label: 'Mua sắm', icon: '🛒' }
    ];

    useEffect(() => {
        if (user?.id) {
            loadNotes();
        }
    }, [user?.id, filterCategory, showFavorites]);

    const loadNotes = async () => {
        setLoading(true);
        try {
            let result;
            if (showFavorites) {
                result = await getFavoriteNotes(user.id);
            } else if (filterCategory === 'all') {
                result = await getNotes(user.id);
            } else {
                result = await getNotesByCategory(user.id, filterCategory);
            }

            if (result.success) {
                setNotes(result.data);
            } else {
                console.error('Error loading notes:', result.msg);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadNotes();
            return;
        }

        setLoading(true);
        try {
            const result = await searchNotes(user.id, searchQuery);
            if (result.success) {
                setNotes(result.data);
            } else {
                console.error('Error searching notes:', result.msg);
            }
        } catch (error) {
            console.error('Error searching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Vui lòng nhập đầy đủ tiêu đề và nội dung!');
            return;
        }

        try {
            const noteData = {
                ...formData,
                user_id: user.id,
                created_at: new Date().toISOString()
            };

            let result;
            if (editingNote) {
                result = await updateNote(editingNote.id, formData);
            } else {
                result = await createNote(noteData);
            }

            if (result.success) {
                setShowAddForm(false);
                setEditingNote(null);
                setFormData({ title: '', content: '', category: 'general', is_favorite: false });
                loadNotes();
                alert(editingNote ? 'Cập nhật ghi chú thành công!' : 'Tạo ghi chú thành công!');
            } else {
                alert(result.msg);
            }
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Có lỗi xảy ra khi lưu ghi chú!');
        }
    };

    const handleEdit = (note) => {
        setEditingNote(note);
        setFormData({
            title: note.title,
            content: note.content,
            category: note.category || 'general',
            is_favorite: note.is_favorite || false
        });
        setShowAddForm(true);
    };

    const handleDelete = async (noteId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) {
            try {
                const result = await deleteNote(noteId);
                if (result.success) {
                    loadNotes();
                    alert('Xóa ghi chú thành công!');
                } else {
                    alert(result.msg);
                }
            } catch (error) {
                console.error('Error deleting note:', error);
                alert('Có lỗi xảy ra khi xóa ghi chú!');
            }
        }
    };

    const handleToggleFavorite = async (noteId, currentFavorite) => {
        try {
            const result = await toggleFavorite(noteId, !currentFavorite);
            if (result.success) {
                loadNotes();
            } else {
                alert(result.msg);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryIcon = (category) => {
        const cat = categories.find(c => c.value === category);
        return cat ? cat.icon : '📝';
    };

    const getCategoryLabel = (category) => {
        const cat = categories.find(c => c.value === category);
        return cat ? cat.label : 'Chung';
    };

    if (loading) {
        return (
            <div className="notes-container">
                <div className="loading-spinner">⏳</div>
                <p>Đang tải ghi chú...</p>
            </div>
        );
    }

    return (
        <div className="notes-container">
            <div className="notes-header">
                <h1>📝 Ghi Chú Cá Nhân</h1>
                <button
                    className="add-note-btn"
                    onClick={() => {
                        setShowAddForm(true);
                        setEditingNote(null);
                        setFormData({ title: '', content: '', category: 'general', is_favorite: false });
                    }}
                >
                    ➕ Thêm Ghi Chú
                </button>
            </div>

            {/* Search and Filter */}
            <div className="notes-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm ghi chú..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch}>🔍</button>
                </div>

                <div className="filter-controls">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        disabled={showFavorites}
                    >
                        <option value="all">Tất cả</option>
                        {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                                {cat.icon} {cat.label}
                            </option>
                        ))}
                    </select>

                    <button
                        className={`favorite-btn ${showFavorites ? 'active' : ''}`}
                        onClick={() => setShowFavorites(!showFavorites)}
                    >
                        ⭐ Yêu thích
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="note-form-overlay">
                    <div className="note-form">
                        <h2>{editingNote ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú mới'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Tiêu đề:</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Nhập tiêu đề ghi chú..."
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Danh mục:</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.icon} {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Nội dung:</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Nhập nội dung ghi chú..."
                                    rows="6"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_favorite}
                                        onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                                    />
                                    ⭐ Đánh dấu yêu thích
                                </label>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="save-btn">
                                    {editingNote ? 'Cập nhật' : 'Lưu'}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditingNote(null);
                                        setFormData({ title: '', content: '', category: 'general', is_favorite: false });
                                    }}
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notes List */}
            <div className="notes-list">
                {notes.length === 0 ? (
                    <div className="no-notes">
                        <p>📝 Chưa có ghi chú nào</p>
                        <p>Hãy tạo ghi chú đầu tiên của bạn!</p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="note-card">
                            <div className="note-header">
                                <div className="note-title">
                                    <span className="category-icon">
                                        {getCategoryIcon(note.category)}
                                    </span>
                                    <h3>{note.title}</h3>
                                    <span className="category-label">
                                        {getCategoryLabel(note.category)}
                                    </span>
                                </div>
                                <div className="note-actions">
                                    <button
                                        className={`favorite-btn ${note.is_favorite ? 'active' : ''}`}
                                        onClick={() => handleToggleFavorite(note.id, note.is_favorite)}
                                        title={note.is_favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                                    >
                                        {note.is_favorite ? '⭐' : '☆'}
                                    </button>
                                    <button
                                        className="edit-btn"
                                        onClick={() => handleEdit(note)}
                                        title="Chỉnh sửa"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(note.id)}
                                        title="Xóa"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className="note-content">
                                <p>{note.content}</p>
                            </div>

                            <div className="note-footer">
                                <span className="note-date">
                                    📅 {formatDate(note.created_at)}
                                </span>
                                {note.updated_at && note.updated_at !== note.created_at && (
                                    <span className="note-updated">
                                        ✏️ Cập nhật: {formatDate(note.updated_at)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notes;
