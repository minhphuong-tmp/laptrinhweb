import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDocuments, deleteDocument, incrementDownloadCount, getDownloadUrl, testRPCFunction } from '../services/documentService';
import UploadDocument from '../components/UploadDocument';
import DocumentIcon from '../components/DocumentIcon';
import './Documents.css';

const Documents = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Load documents from database
    useEffect(() => {
        loadDocuments();
    }, [filterCategory, searchTerm]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const { data, error } = await getDocuments({
                category: filterCategory,
                searchTerm: searchTerm
            });

            if (error) {
                console.error('Error loading documents:', error);
                // Fallback to empty array
                setDocuments([]);
            } else {
                console.log('📊 Raw documents data:', data);
                console.log('📊 Documents with download counts:', data?.map(doc => ({ 
                    id: doc.id,
                    title: doc.title, 
                    download_count: doc.download_count,
                    file_type: doc.file_type
                })));
                setDocuments(data || []);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    // Documents đã được filter từ API, không cần filter lại
    const filteredDocuments = documents;

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


    const formatFileSize = (size) => {
        return size;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const handleTestRPC = async (doc) => {
        console.log('🧪 Testing RPC function for:', doc.title);
        const result = await testRPCFunction(doc.id);
        if (result.error) {
            alert('RPC function test failed: ' + result.error.message);
        } else {
            alert(`RPC test successful! Current: ${result.data.currentCount}, New: ${result.data.newCount}`);
            loadDocuments(); // Reload để xem kết quả
        }
    };

    const handleDownload = async (doc) => {
        try {
            // Tăng download count sử dụng RPC function
            console.log('🔄 Calling incrementDownloadCount for:', doc.id, 'Current count:', doc.download_count);
            const { data: newCount, error: countError } = await incrementDownloadCount(doc.id);
            
            if (countError) {
                console.error('❌ Error incrementing download count:', countError);
                // Vẫn tiếp tục download dù count lỗi
            } else {
                console.log('✅ Download count updated to:', newCount);
            }
            
            // Tạo download URL
            const { data: urlData, error } = await getDownloadUrl(doc.file_path);
            
            if (error) {
                console.error('Error getting download URL:', error);
                alert('Không thể tải xuống tài liệu');
                return;
            }
            
            // Fetch file data và tạo blob để force download
            console.log('📥 Starting download for:', doc.title, 'Type:', doc.file_type);
            const response = await fetch(urlData.signedUrl);
            const blob = await response.blob();
            
            console.log('📦 Blob created:', blob.size, 'bytes, type:', blob.type);
            
            // Tạo URL cho blob
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Lấy extension từ file_path
            const fileExtension = doc.file_path.split('.').pop();
            const fileName = `${doc.title}.${fileExtension}`;
            
            console.log('💾 Downloading as:', fileName);
            
            // Tạo link download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.style.display = 'none';
            
            // Thêm vào DOM, click, rồi xóa
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup blob URL
            window.URL.revokeObjectURL(blobUrl);
            
            // Reload documents để cập nhật download count
            console.log('🔄 Reloading documents to update download count...');
            await loadDocuments();
            console.log('✅ Documents reloaded successfully');
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Không thể tải xuống tài liệu');
        }
    };

    const handlePreview = async (doc) => {
        try {
            // Tạo preview URL (không tăng download count)
            const { data: urlData, error } = await getDownloadUrl(doc.file_path);
            
            if (error) {
                console.error('Error getting preview URL:', error);
                alert('Không thể xem trước tài liệu');
                return;
            }
            
            // Mở file trong tab mới để xem trước
            window.open(urlData.signedUrl, '_blank');
        } catch (error) {
            console.error('Error previewing document:', error);
            alert('Không thể xem trước tài liệu');
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải tài liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="header-left">
                    <h1>Quản lý tài liệu CLB</h1>
                </div>
                <div className="header-right">
                    <button 
                        className="upload-btn"
                        onClick={() => setShowAddModal(true)}
                    >
                        📤 Tải lên tài liệu
                    </button>
                </div>
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
                    <span className="stat-number">{documents.reduce((sum, doc) => sum + (doc.download_count || 0), 0)}</span>
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
                            <DocumentIcon fileType={doc.file_type} className="large" />
                            
                            <div className="document-info">
                                <h3 className="document-title">{doc.title}</h3>
                                <p className="document-description">{doc.description}</p>
                                
                                <div className="document-meta">
                                    <div className="meta-item">
                                        <span className="meta-icon">📁</span>
                                        <span className="meta-text">{doc.file_type} • {formatFileSize(doc.file_size)}</span>
                                    </div>
                                    
                                    <div className="meta-item">
                                        <span className="meta-icon">👤</span>
                                        <span className="meta-text">{doc.uploader?.name || 'Unknown'}</span>
                                    </div>
                                    
                                    <div className="meta-item">
                                        <span className="meta-icon">📅</span>
                                        <span className="meta-text">{formatDate(doc.upload_date)}</span>
                                    </div>
                                    
                                    <div className="meta-item">
                                        <span className="meta-icon">⬇️</span>
                                        <span className="meta-text">{doc.download_count} lượt tải</span>
                                    </div>
                                </div>
                                
                                <div className="document-tags">
                                    {doc.tags?.map((tag, index) => (
                                        <span key={index} className="tag">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="document-actions">
                            <button 
                                className="action-btn download-btn"
                                onClick={() => handleDownload(doc)}
                                title="Tải file về máy tính"
                            >
                                💾 Tải xuống
                            </button>
                            <button 
                                className="action-btn preview-btn"
                                onClick={() => handlePreview(doc)}
                                title="Xem trước file trong trình duyệt"
                            >
                                👁️ Xem trước
                            </button>
                            <button className="action-btn share-btn">
                                🔗 Chia sẻ
                            </button>
                            <button 
                                className="action-btn test-btn"
                                onClick={() => handleTestRPC(doc)}
                                title="Test RPC function"
                            >
                                🧪 Test
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

            {/* Upload Modal */}
            {showAddModal && (
                <UploadDocument
                    onUploadSuccess={(newDoc) => {
                        setDocuments(prev => [newDoc, ...prev]);
                        setShowAddModal(false);
                    }}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </div>
    );
};

export default Documents;
