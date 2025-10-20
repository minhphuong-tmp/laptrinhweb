import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Members.css';

const Members = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);

    // Mock data for demonstration
    useEffect(() => {
        const mockMembers = [
            {
                id: 1,
                studentId: 'KMA001',
                name: 'Nguyễn Văn A',
                email: 'nguyenvana@kma.edu.vn',
                major: 'Công nghệ thông tin',
                year: '2023',
                role: 'Chủ nhiệm CLB',
                joinDate: '2023-09-01',
                phone: '0123456789',
                avatar: null
            },
            {
                id: 2,
                studentId: 'KMA002',
                name: 'Trần Thị B',
                email: 'tranthib@kma.edu.vn',
                major: 'Khoa học máy tính',
                year: '2023',
                role: 'Phó CLB',
                joinDate: '2023-09-15',
                phone: '0123456790',
                avatar: null
            },
            {
                id: 3,
                studentId: 'KMA003',
                name: 'Lê Văn C',
                email: 'levanc@kma.edu.vn',
                major: 'An toàn thông tin',
                year: '2024',
                role: 'Thành viên',
                joinDate: '2024-01-10',
                phone: '0123456791',
                avatar: null
            },
            {
                id: 4,
                studentId: 'KMA004',
                name: 'Phạm Thị D',
                email: 'phamthid@kma.edu.vn',
                major: 'Công nghệ thông tin',
                year: '2024',
                role: 'Thành viên',
                joinDate: '2024-02-20',
                phone: '0123456792',
                avatar: null
            }
        ];
        
        setTimeout(() => {
            setMembers(mockMembers);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || member.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleColor = (role) => {
        switch (role) {
            case 'Chủ nhiệm CLB':
                return '#e74c3c';
            case 'Phó CLB':
                return '#f39c12';
            case 'Thành viên':
                return '#27ae60';
            default:
                return '#95a5a6';
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải danh sách thành viên...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Quản lý thành viên CLB</h1>
            </div>

            <div className="members-actions">
                <button 
                    className="add-member-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    ➕ Thêm thành viên
                </button>
            </div>

            <div className="members-filters">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, MSSV, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                </div>
                
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="role-filter"
                >
                    <option value="all">Tất cả vai trò</option>
                    <option value="Chủ nhiệm CLB">Chủ nhiệm CLB</option>
                    <option value="Phó CLB">Phó CLB</option>
                    <option value="Thành viên">Thành viên</option>
                </select>
            </div>

            <div className="members-stats">
                <div className="stat-card">
                    <span className="stat-number">{members.length}</span>
                    <span className="stat-label">Tổng thành viên</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{members.filter(m => m.role === 'Chủ nhiệm CLB').length}</span>
                    <span className="stat-label">Chủ nhiệm</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{members.filter(m => m.role === 'Phó CLB').length}</span>
                    <span className="stat-label">Phó CLB</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{members.filter(m => m.role === 'Thành viên').length}</span>
                    <span className="stat-label">Thành viên</span>
                </div>
            </div>

            <div className="members-table-container">
                <table className="members-table">
                    <thead>
                        <tr>
                            <th>MSSV</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Chuyên ngành</th>
                            <th>Năm học</th>
                            <th>Vai trò</th>
                            <th>Ngày tham gia</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.map((member) => (
                            <tr key={member.id}>
                                <td className="student-id">{member.studentId}</td>
                                <td className="member-name">
                                    <div className="name-info">
                                        <span className="name">{member.name}</span>
                                        <span className="phone">📞 {member.phone}</span>
                                    </div>
                                </td>
                                <td className="email">{member.email}</td>
                                <td className="major">{member.major}</td>
                                <td className="year">{member.year}</td>
                                <td className="role">
                                    <span 
                                        className="role-badge"
                                        style={{ backgroundColor: getRoleColor(member.role) }}
                                    >
                                        {member.role}
                                    </span>
                                </td>
                                <td className="join-date">
                                    {new Date(member.joinDate).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="actions">
                                    <button className="edit-btn" title="Chỉnh sửa">✏️</button>
                                    <button className="delete-btn" title="Xóa">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredMembers.length === 0 && (
                <div className="no-results">
                    <p>Không tìm thấy thành viên nào phù hợp</p>
                </div>
            )}
        </div>
    );
};

export default Members;
