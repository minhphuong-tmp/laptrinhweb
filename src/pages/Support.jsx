import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Support.css';

const Support = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('contact');

    // Mock data for demonstration
    useEffect(() => {
        const mockContacts = [
            {
                id: 1,
                name: 'Nguyễn Văn A',
                position: 'Chủ nhiệm CLB',
                email: 'nguyenvana@kma.edu.vn',
                phone: '0123456789',
                avatar: null,
                availability: 'Thứ 2-6: 8:00-17:00',
                specialties: ['Quản lý CLB', 'Tổ chức sự kiện', 'Lập trình web']
            },
            {
                id: 2,
                name: 'Trần Thị B',
                position: 'Phó CLB',
                email: 'tranthib@kma.edu.vn',
                phone: '0123456790',
                avatar: null,
                availability: 'Thứ 2-5: 9:00-18:00',
                specialties: ['Tài liệu học tập', 'Hỗ trợ kỹ thuật', 'Python']
            },
            {
                id: 3,
                name: 'Lê Văn C',
                position: 'Thành viên',
                email: 'levanc@kma.edu.vn',
                phone: '0123456791',
                avatar: null,
                availability: 'Thứ 3-7: 19:00-22:00',
                specialties: ['React.js', 'Node.js', 'Database']
            }
        ];

        const mockFaqs = [
            {
                id: 1,
                question: 'Làm thế nào để tham gia CLB Tin học KMA?',
                answer: 'Bạn có thể đăng ký tham gia CLB bằng cách điền form đăng ký trên trang web hoặc liên hệ trực tiếp với Ban chủ nhiệm CLB. Yêu cầu: là sinh viên KMA, có đam mê với công nghệ thông tin.',
                category: 'Tham gia CLB'
            },
            {
                id: 2,
                question: 'CLB có tổ chức những hoạt động gì?',
                answer: 'CLB tổ chức nhiều hoạt động đa dạng: Workshop lập trình, Cuộc thi Hackathon, Seminar chuyên đề, Họp CLB định kỳ, và các hoạt động ngoại khóa khác.',
                category: 'Hoạt động'
            },
            {
                id: 3,
                question: 'Làm sao để tải tài liệu học tập?',
                answer: 'Bạn có thể truy cập vào mục "Tài liệu" trên website, tìm kiếm theo chủ đề hoặc danh mục, sau đó click "Tải xuống" để tải về máy.',
                category: 'Tài liệu'
            },
            {
                id: 4,
                question: 'Có phí thành viên không?',
                answer: 'Có, phí thành viên là 20,000 VNĐ/tháng. Phí này được sử dụng để tổ chức các hoạt động, mua tài liệu học tập và duy trì website CLB.',
                category: 'Tài chính'
            },
            {
                id: 5,
                question: 'Làm thế nào để đăng ký tham gia sự kiện?',
                answer: 'Bạn có thể xem lịch sự kiện trong mục "Lịch sự kiện", chọn sự kiện muốn tham gia và click "Đăng ký". Hệ thống sẽ gửi xác nhận qua email.',
                category: 'Sự kiện'
            },
            {
                id: 6,
                question: 'Tôi có thể đề xuất hoạt động mới không?',
                answer: 'Có, bạn có thể gửi đề xuất qua form "Liên hệ & Hỗ trợ" hoặc trực tiếp gửi email cho Ban chủ nhiệm CLB. Mọi ý tưởng đều được xem xét và đánh giá.',
                category: 'Đề xuất'
            }
        ];
        
        setTimeout(() => {
            setContacts(mockContacts);
            setFaqs(mockFaqs);
            setLoading(false);
        }, 1000);
    }, []);

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Tham gia CLB':
                return '👥';
            case 'Hoạt động':
                return '📅';
            case 'Tài liệu':
                return '📚';
            case 'Tài chính':
                return '💰';
            case 'Sự kiện':
                return '🎉';
            case 'Đề xuất':
                return '💡';
            default:
                return '❓';
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải thông tin hỗ trợ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Liên hệ & Hỗ trợ CLB</h1>
            </div>

            <div className="support-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contact')}
                >
                    👥 Liên hệ
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
                    onClick={() => setActiveTab('faq')}
                >
                    ❓ FAQ
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
                    onClick={() => setActiveTab('request')}
                >
                    📝 Gửi yêu cầu
                </button>
            </div>

            {activeTab === 'contact' && (
                <div className="contact-section">
                    <div className="contact-intro">
                        <h2>👥 Ban chủ nhiệm CLB Tin học KMA</h2>
                        <p>Liên hệ trực tiếp với các thành viên Ban chủ nhiệm để được hỗ trợ tốt nhất</p>
                    </div>

                    <div className="contacts-grid">
                        {contacts.map((contact) => (
                            <div key={contact.id} className="contact-card">
                                <div className="contact-avatar">
                                    {contact.avatar ? (
                                        <img src={contact.avatar} alt={contact.name} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {contact.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="contact-info">
                                    <h3 className="contact-name">{contact.name}</h3>
                                    <p className="contact-position">{contact.position}</p>
                                    
                                    <div className="contact-details">
                                        <div className="detail-item">
                                            <span className="detail-icon">📧</span>
                                            <a href={`mailto:${contact.email}`} className="detail-link">
                                                {contact.email}
                                            </a>
                                        </div>
                                        
                                        <div className="detail-item">
                                            <span className="detail-icon">📱</span>
                                            <a href={`tel:${contact.phone}`} className="detail-link">
                                                {contact.phone}
                                            </a>
                                        </div>
                                        
                                        <div className="detail-item">
                                            <span className="detail-icon">🕒</span>
                                            <span className="detail-text">{contact.availability}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="contact-specialties">
                                        <h4>Chuyên môn:</h4>
                                        <div className="specialties-tags">
                                            {contact.specialties.map((specialty, index) => (
                                                <span key={index} className="specialty-tag">
                                                    {specialty}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'faq' && (
                <div className="faq-section">
                    <div className="faq-intro">
                        <h2>❓ Câu hỏi thường gặp</h2>
                        <p>Tìm câu trả lời cho các câu hỏi phổ biến về CLB Tin học KMA</p>
                    </div>

                    <div className="faq-list">
                        {faqs.map((faq) => (
                            <div key={faq.id} className="faq-item">
                                <div className="faq-question">
                                    <span className="faq-category">
                                        {getCategoryIcon(faq.category)} {faq.category}
                                    </span>
                                    <h3>{faq.question}</h3>
                                </div>
                                <div className="faq-answer">
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'request' && (
                <div className="request-section">
                    <div className="request-intro">
                        <h2>📝 Gửi yêu cầu hỗ trợ</h2>
                        <p>Điền form dưới đây để gửi yêu cầu hỗ trợ hoặc đề xuất ý tưởng mới</p>
                    </div>

                    <div className="request-form">
                        <form>
                            <div className="form-group">
                                <label htmlFor="requestType">Loại yêu cầu</label>
                                <select id="requestType" className="form-select">
                                    <option value="">Chọn loại yêu cầu</option>
                                    <option value="technical">Hỗ trợ kỹ thuật</option>
                                    <option value="activity">Đề xuất hoạt động</option>
                                    <option value="document">Yêu cầu tài liệu</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">Tiêu đề</label>
                                <input 
                                    type="text" 
                                    id="subject" 
                                    className="form-input"
                                    placeholder="Nhập tiêu đề yêu cầu"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Mô tả chi tiết</label>
                                <textarea 
                                    id="description" 
                                    className="form-textarea"
                                    rows="5"
                                    placeholder="Mô tả chi tiết yêu cầu của bạn..."
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label htmlFor="priority">Mức độ ưu tiên</label>
                                <select id="priority" className="form-select">
                                    <option value="low">Thấp</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="high">Cao</option>
                                </select>
                            </div>

                            <button type="submit" className="submit-btn">
                                📤 Gửi yêu cầu
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Support;
