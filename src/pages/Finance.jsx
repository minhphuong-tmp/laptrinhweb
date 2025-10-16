import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Finance.css';

const Finance = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);

    // Mock data for demonstration
    useEffect(() => {
        const mockTransactions = [
            {
                id: 1,
                date: '2024-02-15',
                description: 'Thu phí thành viên tháng 2/2024',
                type: 'income',
                category: 'Phí thành viên',
                amount: 500000,
                balance: 2500000,
                createdBy: 'Nguyễn Văn A',
                notes: 'Thu từ 25 thành viên, mỗi người 20,000 VNĐ'
            },
            {
                id: 2,
                date: '2024-02-10',
                description: 'Chi phí tổ chức Workshop React.js',
                type: 'expense',
                category: 'Hoạt động',
                amount: 300000,
                balance: 2000000,
                createdBy: 'Trần Thị B',
                notes: 'Bao gồm: thuê phòng, in tài liệu, nước uống'
            },
            {
                id: 3,
                date: '2024-02-05',
                description: 'Tài trợ từ Công ty ABC',
                type: 'income',
                category: 'Tài trợ',
                amount: 2000000,
                balance: 2300000,
                createdBy: 'Lê Văn C',
                notes: 'Tài trợ cho cuộc thi Hackathon KMA 2024'
            },
            {
                id: 4,
                date: '2024-01-28',
                description: 'Chi phí in ấn tài liệu học tập',
                type: 'expense',
                category: 'Tài liệu',
                amount: 150000,
                balance: 300000,
                createdBy: 'Phạm Thị D',
                notes: 'In 50 bộ tài liệu React.js và Python'
            },
            {
                id: 5,
                date: '2024-01-25',
                description: 'Thu phí thành viên tháng 1/2024',
                type: 'income',
                category: 'Phí thành viên',
                amount: 500000,
                balance: 450000,
                createdBy: 'Nguyễn Văn A',
                notes: 'Thu từ 25 thành viên, mỗi người 20,000 VNĐ'
            },
            {
                id: 6,
                date: '2024-01-20',
                description: 'Chi phí mua phần mềm và công cụ',
                type: 'expense',
                category: 'Công cụ',
                amount: 800000,
                balance: -50000,
                createdBy: 'Hoàng Văn E',
                notes: 'Mua license Visual Studio Code, GitHub Pro'
            }
        ];
        
        setTimeout(() => {
            setTransactions(mockTransactions);
            setLoading(false);
        }, 1000);
    }, []);

    const filteredTransactions = transactions.filter(transaction => {
        const matchesType = filterType === 'all' || transaction.type === filterType;
        const matchesMonth = filterMonth === 'all' || 
            new Date(transaction.date).getMonth() === parseInt(filterMonth);
        return matchesType && matchesMonth;
    });

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const currentBalance = totalIncome - totalExpense;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getTypeColor = (type) => {
        return type === 'income' ? '#27ae60' : '#e74c3c';
    };

    const getTypeIcon = (type) => {
        return type === 'income' ? '📈' : '📉';
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Phí thành viên':
                return '👥';
            case 'Tài trợ':
                return '🤝';
            case 'Hoạt động':
                return '📅';
            case 'Tài liệu':
                return '📚';
            case 'Công cụ':
                return '🛠️';
            default:
                return '💰';
        }
    };

    if (loading) {
        return (
            <div className="finance-page">
                <div className="loading">
                    <div className="loading-spinner">⏳</div>
                    <p>Đang tải dữ liệu tài chính...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="finance-page">
            <div className="finance-header">
                <div className="header-left">
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/home')}
                        title="Quay lại trang chủ"
                    >
                        ← Quay lại
                    </button>
                    <h1>💰 Quản lý tài chính CLB</h1>
                </div>
                <button 
                    className="add-transaction-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    ➕ Thêm giao dịch
                </button>
            </div>

            <div className="finance-overview">
                <div className="balance-card">
                    <div className="balance-icon">💰</div>
                    <div className="balance-content">
                        <div className="balance-label">Số dư hiện tại</div>
                        <div className="balance-amount">{formatCurrency(currentBalance)}</div>
                    </div>
                </div>
                
                <div className="summary-cards">
                    <div className="summary-card income">
                        <div className="summary-icon">📈</div>
                        <div className="summary-content">
                            <div className="summary-label">Tổng thu</div>
                            <div className="summary-amount">{formatCurrency(totalIncome)}</div>
                        </div>
                    </div>
                    
                    <div className="summary-card expense">
                        <div className="summary-icon">📉</div>
                        <div className="summary-content">
                            <div className="summary-label">Tổng chi</div>
                            <div className="summary-amount">{formatCurrency(totalExpense)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="finance-filters">
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">Tất cả giao dịch</option>
                    <option value="income">Thu nhập</option>
                    <option value="expense">Chi phí</option>
                </select>
                
                <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">Tất cả tháng</option>
                    <option value="0">Tháng 1</option>
                    <option value="1">Tháng 2</option>
                    <option value="2">Tháng 3</option>
                    <option value="3">Tháng 4</option>
                    <option value="4">Tháng 5</option>
                    <option value="5">Tháng 6</option>
                    <option value="6">Tháng 7</option>
                    <option value="7">Tháng 8</option>
                    <option value="8">Tháng 9</option>
                    <option value="9">Tháng 10</option>
                    <option value="10">Tháng 11</option>
                    <option value="11">Tháng 12</option>
                </select>
            </div>

            <div className="transactions-container">
                <div className="transactions-header">
                    <h3>📋 Lịch sử giao dịch</h3>
                    <div className="transactions-count">
                        {filteredTransactions.length} giao dịch
                    </div>
                </div>
                
                <div className="transactions-list">
                    {filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="transaction-card">
                            <div className="transaction-header">
                                <div className="transaction-type">
                                    <span className="type-icon">{getTypeIcon(transaction.type)}</span>
                                    <span className="type-text">
                                        {transaction.type === 'income' ? 'Thu nhập' : 'Chi phí'}
                                    </span>
                                </div>
                                <div 
                                    className="transaction-amount"
                                    style={{ color: getTypeColor(transaction.type) }}
                                >
                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </div>
                            </div>
                            
                            <div className="transaction-content">
                                <h4 className="transaction-description">{transaction.description}</h4>
                                
                                <div className="transaction-meta">
                                    <div className="meta-item">
                                        <span className="meta-icon">{getCategoryIcon(transaction.category)}</span>
                                        <span className="meta-text">{transaction.category}</span>
                                    </div>
                                    
                                    <div className="meta-item">
                                        <span className="meta-icon">📅</span>
                                        <span className="meta-text">
                                            {new Date(transaction.date).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    
                                    <div className="meta-item">
                                        <span className="meta-icon">👤</span>
                                        <span className="meta-text">{transaction.createdBy}</span>
                                    </div>
                                    
                                    <div className="meta-item">
                                        <span className="meta-icon">💰</span>
                                        <span className="meta-text">Số dư: {formatCurrency(transaction.balance)}</span>
                                    </div>
                                </div>
                                
                                {transaction.notes && (
                                    <div className="transaction-notes">
                                        <strong>Ghi chú:</strong> {transaction.notes}
                                    </div>
                                )}
                            </div>
                            
                            <div className="transaction-actions">
                                <button className="action-btn edit-btn">✏️ Sửa</button>
                                <button className="action-btn delete-btn">🗑️ Xóa</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {filteredTransactions.length === 0 && (
                <div className="no-results">
                    <p>Không tìm thấy giao dịch nào phù hợp</p>
                </div>
            )}

            <div className="finance-reports">
                <h3>📊 Báo cáo tài chính</h3>
                <div className="reports-grid">
                    <div className="report-card">
                        <h4>📈 Biểu đồ thu chi theo tháng</h4>
                        <div className="chart-placeholder">
                            <p>Biểu đồ sẽ được hiển thị ở đây</p>
                        </div>
                    </div>
                    
                    <div className="report-card">
                        <h4>📋 Phân loại chi phí</h4>
                        <div className="category-breakdown">
                            {['Phí thành viên', 'Tài trợ', 'Hoạt động', 'Tài liệu', 'Công cụ'].map(category => {
                                const categoryAmount = transactions
                                    .filter(t => t.category === category)
                                    .reduce((sum, t) => sum + t.amount, 0);
                                return (
                                    <div key={category} className="category-item">
                                        <span className="category-name">{category}</span>
                                        <span className="category-amount">{formatCurrency(categoryAmount)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Finance;
