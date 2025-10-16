import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Documents.css';

const Documents = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data for demonstration
    useEffect(() => {
        const mockDocuments = [
            {
                id: 1,
                title: 'Tài liệu học React.js cơ bản',
                description: 'Hướng dẫn chi tiết về React.js từ cơ bản đến nâng cao',
                category: 'Lập trình',
                fileType: 'PDF',
                fileSize: '2.5 MB',
                uploadDate: '2024-01-10',
                uploader: 'Nguyễn Văn A',
                downloadCount: 45,
                rating: 4.8,
                tags: ['React', 'JavaScript', 'Frontend'],
                fileUrl: '#'
            },
            {
                id: 2,
                title: 'Bài giảng Cấu trúc dữ liệu và Giải thuật',
                description: 'Slide bài giảng môn Cấu trúc dữ liệu và Giải thuật',
                category: 'Lý thuyết',
                fileType: 'PPTX',
                fileSize: '15.2 MB',
                uploadDate: '2024-01-08',
                uploader: 'Trần Thị B',
                downloadCount: 78,
                rating: 4.6,
                tags: ['Algorithm', 'Data Structure', 'Computer Science'],
                fileUrl: '#'
            },
            {
                id: 3,
                title: 'Video hướng dẫn Python cho người mới bắt đầu',
                description: 'Series video học Python từ cơ bản',
                category: 'Video',
                fileType: 'MP4',
                fileSize: '120.5 MB',
                uploadDate: '2024-01-05',
                uploader: 'Lê Văn C',
                downloadCount: 123,
                rating: 4.9,
                tags: ['Python', 'Programming', 'Tutorial'],
                fileUrl: '#'
            },
            {
                id: 4,
                title: 'Đề thi mẫu môn Toán rời rạc',
                description: 'Bộ đề thi mẫu và đáp án môn Toán rời rạc',
                category: 'Thi cử',
                fileType: 'PDF',
                fileSize: '1.8 MB',
                uploadDate: '2024-01-03',
                uploader: 'Phạm Thị D',
                downloadCount: 67,
                rating: 4.7,
                tags: ['Discrete Math', 'Exam', 'Practice'],
                fileUrl: '#'
            },
            {
                id: 5,
                title: 'Code mẫu ứng dụng Web với Node.js',
                description: 'Source code hoàn chỉnh của ứng dụng web sử dụng Node.js',
                category: 'Lập trình',
                fileType: 'ZIP',
                fileSize: '8.3 MB',
                uploadDate: '2024-01-01',
                uploader: 'Nguyễn Văn A',
                downloadCount: 34,
                rating: 4.5,
                tags: ['Node.js', 'Backend', 'Web Development'],
                fileUrl: '#'
            }
        ];
        
        setTimeout(() => {
            setDocuments(mockDocuments);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Lập trình':
                return '💻';
            case 'Lý thuyết':
                return '📚';
            case 'Video':
                return '🎥';
            case 'Thi cử':
                return '📝';
            case 'Thực hành':
                return '🛠️';
            default:
                return '📄';
        }
    };

    const getFileTypeIcon = (fileType) => {
        switch (fileType) {
            case 'PDF':
                return '📄';
            case 'PPTX':
                return '📊';
            case 'MP4':
                return '🎬';
            case 'ZIP':
                return '📦';
            case 'DOCX':
                return '📝';
            default:
                return '📄';
        }
    };

    const formatFileSize = (size) => {
        return size;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    if (loading) {
        return (
            <div className="documents-page">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải tài liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="documents-page">
            <div className="documents-header">
                <div className="header-left">
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/home')}
                        title="Quay lại trang chủ"
                    >
                        ← Quay lại
                    </button>
                    <h1>📚 Thư viện tài liệu CLB</h1>
                </div>
                <button 
                    className="upload-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    📤 Tải lên tài liệu
                </button>
            </div>

            <div className="documents-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm tài liệu, mô tả, tag..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                </div>
                
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="category-filter"
                >
                    <option value="all">Tất cả danh mục</option>
                    <option value="Lập trình">Lập trình</option>
                    <option value="Lý thuyết">Lý thuyết</option>
                    <option value="Video">Video</option>
                    <option value="Thi cử">Thi cử</option>
                    <option value="Thực hành">Thực hành</option>
                </select>
            </div>

            <div className="documents-stats">
                <div className="stat-card">
                    <span className="stat-number">{documents.length}</span>
                    <span className="stat-label">Tổng tài liệu</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{documents.reduce((sum, doc) => sum + doc.downloadCount, 0)}</span>
                    <span className="stat-label">Lượt tải</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{documents.filter(doc => doc.category === 'Lập trình').length}</span>
                    <span className="stat-label">Lập trình</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{documents.filter(doc => doc.category === 'Video').length}</span>
                    <span className="stat-label">Video</span>
                </div>
            </div>

            <div className="documents-grid">
                {filteredDocuments.map((doc) => (
                    <div key={doc.id} className="document-card">
                        <div className="document-header">
                            <div className="document-category">
                                <span className="category-icon">{getCategoryIcon(doc.category)}</span>
                                <span className="category-text">{doc.category}</span>
                            </div>
                            <div className="document-rating">
                                <span className="rating-stars">⭐</span>
                                <span className="rating-number">{doc.rating}</span>
                            </div>
                        </div>
                        
                        <div className="document-content">
                            <div className="document-icon">
                                {getFileTypeIcon(doc.fileType)}
                            </div>
                            
                            <div className="document-info">
                                <h3 className="document-title">{doc.title}</h3>
                                <p className="document-description">{doc.description}</p>
                                
                                <div className="document-meta">
                                    <div className="meta-item">
                                        <span className="meta-icon">📁</span>
                                        <span className="meta-text">{doc.fileType} • {formatFileSize(doc.fileSize)}</span>
                                    </div>
                                    
                                    <div className="meta-item">
                                        <span className="meta-icon">👤</span>
                                        <span className="meta-text">{doc.uploader}</span>
                                    </div>
                                    
                                    <div className="meta-item">
                                        <span className="meta-icon">📅</span>
                                        <span className="meta-text">{formatDate(doc.uploadDate)}</span>
                                    </div>
                                    
                                    <div className="meta-item">
                                        <span className="meta-icon">⬇️</span>
                                        <span className="meta-text">{doc.downloadCount} lượt tải</span>
                                    </div>
                                </div>
                                
                                <div className="document-tags">
                                    {doc.tags.map((tag, index) => (
                                        <span key={index} className="tag">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="document-actions">
                            <button className="action-btn download-btn">
                                ⬇️ Tải xuống
                            </button>
                            <button className="action-btn preview-btn">
                                👁️ Xem trước
                            </button>
                            <button className="action-btn share-btn">
                                🔗 Chia sẻ
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDocuments.length === 0 && (
                <div className="no-results">
                    <p>Không tìm thấy tài liệu nào phù hợp</p>
                </div>
            )}
        </div>
    );
};

export default Documents;
