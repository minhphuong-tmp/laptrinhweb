import { useState } from 'react';
import { uploadDocument } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import DocumentIcon from './DocumentIcon';
import './UploadDocument.css';

const UploadDocument = ({ onUploadSuccess, onClose }) => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Lập trình');
    const [tags, setTags] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileSelect = (selectedFile) => {
        if (selectedFile) {
            setFile(selectedFile);
            if (!title) {
                setTitle(selectedFile.name.split('.')[0]);
            }
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!file || !title.trim()) {
            alert('Vui lòng chọn file và nhập tiêu đề');
            return;
        }

        setUploading(true);
        
        try {
            const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            
            const { data, error } = await uploadDocument(file, {
                title: title.trim(),
                description: description.trim(),
                category,
                tags: tagsArray,
                isPublic,
                uploaderId: user.id
            });

            if (error) {
                console.error('Error uploading document:', error);
                alert('Không thể tải lên tài liệu: ' + error.message);
            } else {
                alert('Tải lên tài liệu thành công!');
                onUploadSuccess?.(data);
                onClose?.();
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Không thể tải lên tài liệu');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="upload-modal-overlay">
            <div className="upload-modal">
                <div className="upload-header">
                    <h2>📤 Tải lên tài liệu mới</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="upload-form">
                    {/* File Upload Area */}
                    <div className="upload-section">
                        <label className="upload-label">Chọn tài liệu</label>
                        <div 
                            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            {file ? (
                                <div className="file-selected">
                                    <DocumentIcon 
                                        fileType={file.name.split('.').pop()} 
                                        className="extra-large" 
                                    />
                                    <div className="file-info">
                                        <div className="file-name">{file.name}</div>
                                        <div className="file-size">{formatFileSize(file.size)}</div>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="remove-file-btn"
                                        onClick={() => setFile(null)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <div className="upload-icon">📁</div>
                                    <p>Kéo thả file vào đây hoặc click để chọn</p>
                                    <p className="file-types-hint">Hỗ trợ: PDF, Word, PowerPoint, Excel, Video, Audio, Image, Archive, Code files</p>
                                    <input
                                        type="file"
                                        onChange={(e) => handleFileSelect(e.target.files[0])}
                                        className="file-input"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.bmp,.svg,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.m4v,.mp3,.wav,.flac,.aac,.js,.jsx,.ts,.tsx,.html,.css,.php,.py,.java,.cpp,.c"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Document Info */}
                    <div className="form-section">
                        <label className="form-label">Tiêu đề *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="form-input"
                            placeholder="Nhập tiêu đề tài liệu"
                            required
                        />
                    </div>

                    <div className="form-section">
                        <label className="form-label">Mô tả</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="form-textarea"
                            placeholder="Mô tả về tài liệu..."
                            rows="3"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-section">
                            <label className="form-label">Danh mục</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="form-select"
                            >
                                <option value="Lập trình">💻 Lập trình</option>
                                <option value="Lý thuyết">📚 Lý thuyết</option>
                                <option value="Video">🎥 Video</option>
                                <option value="Thi cử">📝 Thi cử</option>
                                <option value="Thực hành">🛠️ Thực hành</option>
                            </select>
                        </div>

                        <div className="form-section">
                            <label className="form-label">Quyền truy cập</label>
                            <select
                                value={isPublic ? 'public' : 'private'}
                                onChange={(e) => setIsPublic(e.target.value === 'public')}
                                className="form-select"
                            >
                                <option value="public">🌐 Công khai</option>
                                <option value="private">🔒 Riêng tư</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <label className="form-label">Tags (cách nhau bởi dấu phẩy)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="form-input"
                            placeholder="React, JavaScript, Frontend"
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={uploading}
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={uploading || !file || !title.trim()}
                        >
                            {uploading ? '⏳ Đang tải lên...' : '📤 Tải lên'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadDocument;
