import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { clbApi } from '../services/clbService';
import { supabase } from '../lib/supabase';
import './Members.css';

const Members = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [totalMembers, setTotalMembers] = useState(0);
    const [newMember, setNewMember] = useState({
        name: '',
        student_id: '',
        role: 'Thành viên',
        major: 'Công nghệ thông tin',
        year: '2024',
        phone: '',
        join_date: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load all members at once
    const loadAllMembers = async () => {
        try {
            setLoading(true);
            
            const { data: membersData, error } = await supabase
                .from('clb_members')
                .select(`
                    *,
                    users (
                        id,
                        name,
                        email
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading members:', error);
                return;
            }

            setMembers(membersData || []);
            setTotalMembers(membersData?.length || 0);

        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load CLB members from database
    useEffect(() => {
        loadAllMembers();
    }, []);

    // Calculate table height for debugging
    useEffect(() => {
        const updateTableHeight = () => {
            const table = document.querySelector('.members-table');
            if (table) {
                const height = table.offsetHeight;
                const heightElement = document.getElementById('table-height');
                if (heightElement) {
                    heightElement.textContent = `${height}px`;
                }
            }
        };

        // Update height after members are loaded
        setTimeout(updateTableHeight, 100);
        
        // Update height when members change
        updateTableHeight();
    }, [members]);




    // Handle add member modal
    const handleAddMember = () => {
        setNewMember({
            name: '',
            student_id: '',
            role: 'Thành viên',
            major: 'Công nghệ thông tin',
            year: '2024',
            phone: '',
            join_date: new Date().toISOString().split('T')[0]
        });
        setShowAddModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setNewMember({
            name: '',
            student_id: '',
            role: 'Thành viên',
            major: 'Công nghệ thông tin',
            year: '2024',
            phone: '',
            join_date: new Date().toISOString().split('T')[0]
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMember(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const handleSubmitMember = async (e) => {
        e.preventDefault();
        if (!newMember.name || !newMember.student_id || !newMember.phone) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setIsSubmitting(true);
        try {
            const email = `${newMember.student_id.toLowerCase()}@actvn.edu.vn`;
            const password = newMember.student_id; // Use student_id as password

            // First, try to create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: newMember.name,
                        student_id: newMember.student_id
                    }
                }
            });

            if (authError) {
                console.error('Error creating auth user:', authError);
                // If auth signup fails, create user without auth
                let userId;
                let userExists = true;
                let attempts = 0;
                
                // Generate unique UUID
                while (userExists && attempts < 5) {
                    userId = crypto.randomUUID();
                    const { data: existingUser } = await supabase
                        .from('users')
                        .select('id')
                        .eq('id', userId)
                        .single();
                    userExists = !!existingUser;
                    attempts++;
                }
                
                if (userExists) {
                    alert('Không thể tạo ID duy nhất cho thành viên. Vui lòng thử lại.');
                    return;
                }
                
                const { data: newUser, error: userError } = await supabase
                    .from('users')
                    .insert([{
                        id: userId,
                        name: newMember.name,
                        email: email
                    }])
                    .select()
                    .single();

                if (userError) {
                    console.error('Error creating user:', userError);
                    alert('Có lỗi xảy ra khi tạo thông tin thành viên');
                    return;
                }

                // Add to clb_members
                const memberData = {
                    user_id: userId,
                    student_id: newMember.student_id,
                    role: newMember.role,
                    major: newMember.major,
                    year: newMember.year,
                    phone: newMember.phone,
                    join_date: newMember.join_date,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const { error: memberError } = await supabase
                    .from('clb_members')
                    .upsert([memberData], { 
                        onConflict: 'user_id' 
                    });

                if (memberError) {
                    console.error('Error adding member:', memberError);
                    alert('Có lỗi xảy ra khi thêm thành viên');
                } else {
                    loadAllMembers();
                    handleCloseModal();
                    alert(`Thêm thành viên thành công!\n\nThông tin tài khoản:\nMã sinh viên: ${newMember.student_id}\nEmail: ${email}\n\nLưu ý: Tài khoản đăng nhập sẽ được tạo riêng bởi admin`);
                }
                return;
            }

            // If auth signup successful, create user record
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .upsert([{
                    id: authData.user.id,
                    name: newMember.name,
                    email: email
                }], { 
                    onConflict: 'id' 
                })
                .select()
                .single();

            if (userError) {
                console.error('Error creating user:', userError);
                alert('Có lỗi xảy ra khi tạo thông tin thành viên');
                return;
            }

            // Add to clb_members
            const memberData = {
                user_id: authData.user.id,
                student_id: newMember.student_id,
                role: newMember.role,
                major: newMember.major,
                year: newMember.year,
                phone: newMember.phone,
                join_date: newMember.join_date,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { error: memberError } = await supabase
                .from('clb_members')
                .upsert([memberData], { 
                    onConflict: 'user_id' 
                });

            if (memberError) {
                console.error('Error adding member:', memberError);
                alert('Có lỗi xảy ra khi thêm thành viên');
            } else {
                console.log('Member added successfully');
                loadAllMembers();
                handleCloseModal();
                alert(`Thêm thành viên thành công!\n\nTài khoản đăng nhập:\nEmail: ${email}\nMật khẩu: ${password}`);
            }
        } catch (error) {
            console.error('Error adding member:', error);
            alert('Có lỗi xảy ra khi thêm thành viên');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Initialize CLB with Phuong as president and other users as members
    const initializeCLB = async () => {
        try {
            // Get all users from database
            const { data: allUsers, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at');

            if (error) throw error;

            if (allUsers && allUsers.length > 0) {
                // Find Phuong user (Chủ nhiệm CLB)
                const phuongUser = allUsers.find(u => 
                    u.name && u.name.toLowerCase().includes('phuong')
                );

                // Find Hoang and Long users (Phó Chủ Nhiệm)
                const hoangUser = allUsers.find(u => 
                    u.name && u.name.toLowerCase().includes('hoang')
                );
                const longUser = allUsers.find(u => 
                    u.name && u.name.toLowerCase().includes('long')
                );

                // Create clb_members table if not exists and add members
                const membersToAdd = allUsers.map((user, index) => {
                    let role = 'Thành viên';
                    if (user.id === phuongUser?.id) {
                        role = 'Chủ nhiệm CLB';
                    } else if (user.id === hoangUser?.id || user.id === longUser?.id) {
                        role = 'Phó Chủ Nhiệm';
                    }

                    return {
                        user_id: user.id,
                        student_id: `KMA${String(index + 1).padStart(3, '0')}`,
                        role: role,
                        major: 'Công nghệ thông tin',
                        year: '2024',
                        phone: '0123456789',
                        join_date: new Date().toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                });

                // Insert members into clb_members table
                const { error: insertError } = await supabase
                    .from('clb_members')
                    .upsert(membersToAdd, { 
                        onConflict: 'user_id'
                    });

                if (insertError) {
                    console.error('Error inserting CLB members:', insertError);
                } else {
                    console.log('CLB members initialized successfully');
                    loadAllMembers(); // Reload members
                }
            }
        } catch (error) {
            console.error('Error initializing CLB:', error);
        }
    };

    const filteredMembers = members.filter(member => {
        const memberName = member.users?.name || '';
        const memberEmail = member.users?.email || '';
        const studentId = member.student_id || '';
        
        const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            memberEmail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || member.role === filterRole;
        return matchesSearch && matchesRole;
    }).sort((a, b) => {
        // Chủ nhiệm CLB luôn ở đầu
        if (a.role === 'Chủ nhiệm CLB' && b.role !== 'Chủ nhiệm CLB') return -1;
        if (a.role !== 'Chủ nhiệm CLB' && b.role === 'Chủ nhiệm CLB') return 1;
        
        // Phó Chủ Nhiệm ở vị trí thứ 2
        if (a.role === 'Phó Chủ Nhiệm' && b.role === 'Thành viên') return -1;
        if (a.role === 'Thành viên' && b.role === 'Phó Chủ Nhiệm') return 1;
        
        // Cùng vai trò thì sắp xếp theo tên
        const nameA = a.users?.name || '';
        const nameB = b.users?.name || '';
        return nameA.localeCompare(nameB, 'vi');
    });


    const getRoleColor = (role) => {
        switch (role) {
            case 'Chủ nhiệm CLB':
                return '#e74c3c';
            case 'Phó Chủ Nhiệm':
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
                    onClick={handleAddMember}
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
                    <option value="Phó Chủ Nhiệm">Phó Chủ Nhiệm</option>
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
                    <span className="stat-number">{members.filter(m => m.role === 'Phó Chủ Nhiệm').length}</span>
                    <span className="stat-label">Phó Chủ Nhiệm</span>
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
                        {filteredMembers.map((member, index) => (
                                <tr key={member.id}>
                                    <td className="student-id">{member.student_id}</td>
                                    <td className="member-name">
                                        <div className="name-info">
                                            <span className="name">{member.users?.name || 'N/A'}</span>
                                            <span className="phone">📞 {member.phone}</span>
                                        </div>
                                    </td>
                                    <td className="email">{member.users?.email || 'N/A'}</td>
                                    <td className="major">{member.major}</td>
                                    <td className="year">{member.year}</td>
                                    <td className="role">
                                        <span 
                                            className={`role-badge ${member.role === 'Thành viên' ? 'role-member' : ''}`}
                                            style={{ backgroundColor: getRoleColor(member.role) }}
                                        >
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="join-date">
                                        {new Date(member.join_date).toLocaleDateString('vi-VN')}
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

            {/* End of list indicator */}
            {members.length > 0 && !loading && (
                <div className="end-of-list">
                    <p>Đã hiển thị tất cả {totalMembers} thành viên</p>
                </div>
            )}

            {filteredMembers.length === 0 && !loading && (
                <div className="no-results">
                    <p>Không tìm thấy thành viên nào phù hợp</p>
                </div>
            )}


            {/* Add Member Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Thêm thành viên mới</h2>
                            <button 
                                className="close-btn"
                                onClick={handleCloseModal}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmitMember} className="add-member-form">
                            <div className="form-group">
                                <label htmlFor="name">Họ và tên *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={newMember.name}
                                    onChange={handleInputChange}
                                    placeholder="Nhập họ và tên đầy đủ"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="student_id">Mã số sinh viên *</label>
                                <input
                                    type="text"
                                    id="student_id"
                                    name="student_id"
                                    value={newMember.student_id}
                                    onChange={handleInputChange}
                                    placeholder="Ví dụ: ACT001"
                                    required
                                />
                                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                                    💡 Mã sinh viên sẽ được dùng làm email và mật khẩu đăng nhập
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="role">Vai trò</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={newMember.role}
                                    onChange={handleInputChange}
                                >
                                    <option value="Thành viên">Thành viên</option>
                                    <option value="Phó Chủ Nhiệm">Phó Chủ Nhiệm</option>
                                    <option value="Chủ nhiệm CLB">Chủ nhiệm CLB</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="major">Chuyên ngành</label>
                                <input
                                    type="text"
                                    id="major"
                                    name="major"
                                    value={newMember.major}
                                    onChange={handleInputChange}
                                    placeholder="Công nghệ thông tin"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="year">Năm học</label>
                                <select
                                    id="year"
                                    name="year"
                                    value={newMember.year}
                                    onChange={handleInputChange}
                                >
                                    <option value="2021">2021</option>
                                    <option value="2022">2022</option>
                                    <option value="2023">2023</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Số điện thoại *</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={newMember.phone}
                                    onChange={handleInputChange}
                                    placeholder="0123456789"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="join_date">Ngày tham gia</label>
                                <input
                                    type="date"
                                    id="join_date"
                                    name="join_date"
                                    value={newMember.join_date}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    className="submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Đang thêm...' : 'Thêm thành viên'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Members;
