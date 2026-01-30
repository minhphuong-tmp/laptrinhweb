import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createActivity } from '../services/activityService';
import './CreateActivity.css';

const CreateActivity = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        activity_type: 'workshop',
        start_date: '',
        end_date: '',
        location: '',
        max_participants: 30,
        tags: '',
        requirements: '',
        materials: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate form
            if (!formData.title.trim()) {
                throw new Error('Vui lòng nhập tiêu đề hoạt động');
            }
            if (!formData.description.trim()) {
                throw new Error('Vui lòng nhập mô tả hoạt động');
            }
            if (!formData.start_date) {
                throw new Error('Vui lòng chọn ngày bắt đầu');
            }
            if (!formData.end_date) {
                throw new Error('Vui lòng chọn ngày kết thúc');
            }
            if (!formData.location.trim()) {
                throw new Error('Vui lòng nhập địa điểm');
            }

            // Prepare activity data
            const activityData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                activity_type: formData.activity_type,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString(),
                location: formData.location.trim(),
                organizer_id: user.id,
                max_participants: parseInt(formData.max_participants) || 30,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                requirements: formData.requirements ? formData.requirements.split('\n').map(req => req.trim()).filter(req => req) : [],
                materials: formData.materials || []
            };

            console.log('Creating activity:', activityData);
            console.log('User ID:', user?.id);
            console.log('User object:', user);
            
            // Validate required fields
            if (!user?.id) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }
            
            const { data, error } = await createActivity(activityData);
            
            if (error) {
                throw new Error('Không thể tạo sự kiện: ' + error.message);
            }
            
            onSuccess(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getActivityTypeIcon = (type) => {
        switch (type) {
            case 'workshop': return '📚';
            case 'competition': return '🎯';
            case 'meeting': return '📝';
            case 'social': return '🎉';
            case 'project': return '💻';
            default: return '📅';
        }
    };

    return (
        <div className="create-activity-overlay">
            <div className="create-activity-modal">
                <div className="modal-header">
                    <h2>📅 Tạo sự kiện mới</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="create-activity-form">
                    <div className="form-section">
                        <h3>📋 Thông tin cơ bản</h3>
                        
                        <div className="form-group">
                            <label>Tiêu đề hoạt động *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Nhập tiêu đề hoạt động"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Mô tả hoạt động *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Mô tả chi tiết về hoạt động..."
                                rows="4"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Loại hoạt động *</label>
                                <select
                                    name="activity_type"
                                    value={formData.activity_type}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="workshop">📚 Workshop</option>
                                    <option value="competition">🎯 Competition</option>
                                    <option value="meeting">📝 Meeting</option>
                                    <option value="social">🎉 Social</option>
                                    <option value="project">💻 Project</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Số người tối đa</label>
                                <input
                                    type="number"
                                    name="max_participants"
                                    value={formData.max_participants}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="100"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>📅 Thời gian và địa điểm</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Ngày bắt đầu *</label>
                                <input
                                    type="datetime-local"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Ngày kết thúc *</label>
                                <input
                                    type="datetime-local"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Địa điểm *</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="Nhập địa điểm tổ chức"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>🏷️ Tags và yêu cầu</h3>
                        
                        <div className="form-group">
                            <label>Tags (phân cách bằng dấu phẩy)</label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleInputChange}
                                placeholder="React, Frontend, JavaScript"
                            />
                        </div>

                        <div className="form-group">
                            <label>Yêu cầu tham gia</label>
                            <textarea
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleInputChange}
                                placeholder="Liệt kê các yêu cầu tham gia (mỗi yêu cầu một dòng)..."
                                rows="3"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            ❌ {error}
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Đang tạo...' : 'Tạo hoạt động'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateActivity;

