import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlitchTitle from '../components/GlitchTitle';
import './Finance.css';
import './FinanceCartoon.css';

const Finance = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const shouldReduceMotion = useReducedMotion();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);

    // Cartoon 3D Animation Variants
    const springConfig = {
        type: "spring",
        stiffness: 200,
        damping: 15
    };

    const cartoonCardHover = shouldReduceMotion ? {} : {
        scale: 1.03,
        rotateX: 2,
        rotateY: -2,
        y: -8,
        transition: springConfig
    };

    const cartoonCardTap = shouldReduceMotion ? {} : {
        scale: 0.98,
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 17 }
    };

    const cartoonButtonHover = shouldReduceMotion ? {} : {
        scale: 1.05,
        y: -4,
        transition: springConfig
    };

    const cartoonButtonTap = shouldReduceMotion ? {} : {
        scale: 0.95,
        y: -1,
        transition: { type: "spring", stiffness: 500, damping: 20 }
    };

    const popAnimation = {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: springConfig
    };

    const slideSquashAnimation = {
        initial: { 
            x: -50, 
            y: 20, 
            scaleX: 0.8, 
            scaleY: 0.8,
            opacity: 0 
        },
        animate: { 
            x: 0, 
            y: 0, 
            scaleX: 1, 
            scaleY: 1,
            opacity: 1 
        },
        transition: springConfig
    };

    const staggerCartoon = {
        initial: {},
        animate: {
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const staggerItemCartoon = {
        initial: { 
            opacity: 0, 
            y: 30,
            scale: 0.9
        },
        animate: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: springConfig
        }
    };

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
            <div className="page-content finance-cartoon">
                <div className="loading">
                    <motion.div
                        className="loading-spinner"
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    >
                        ⏳
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Đang tải dữ liệu tài chính...
                    </motion.p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="page-content finance-cartoon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="page-header"
                {...slideSquashAnimation}
            >
                <motion.h1
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={springConfig}
                >
                    💰 Quản lý tài chính CLB
                </motion.h1>
            </motion.div>

            <motion.div
                className="finance-overview"
                variants={staggerCartoon}
                initial="initial"
                animate="animate"
            >
                <motion.div
                    className="balance-card"
                    variants={staggerItemCartoon}
                    whileHover={cartoonCardHover}
                    whileTap={cartoonCardTap}
                >
                    <motion.div
                        className="balance-icon"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        💰
                    </motion.div>
                    <div className="balance-content">
                        <div className="balance-label">Số dư hiện tại</div>
                        <motion.div
                            className="balance-amount"
                            {...popAnimation}
                            transition={{ ...springConfig, delay: 0.3 }}
                        >
                            {formatCurrency(currentBalance)}
                        </motion.div>
                    </div>
                </motion.div>
                
                <div className="summary-cards">
                    <motion.div
                        className="summary-card income"
                        variants={staggerItemCartoon}
                        whileHover={cartoonCardHover}
                        whileTap={cartoonCardTap}
                    >
                        <motion.div
                            className="summary-icon"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            📈
                        </motion.div>
                        <div className="summary-content">
                            <div className="summary-label">Tổng thu</div>
                            <motion.div
                                className="summary-amount"
                                {...popAnimation}
                                transition={{ ...springConfig, delay: 0.4 }}
                            >
                                {formatCurrency(totalIncome)}
                            </motion.div>
                        </div>
                    </motion.div>
                    
                    <motion.div
                        className="summary-card expense"
                        variants={staggerItemCartoon}
                        whileHover={cartoonCardHover}
                        whileTap={cartoonCardTap}
                    >
                        <motion.div
                            className="summary-icon"
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            📉
                        </motion.div>
                        <div className="summary-content">
                            <div className="summary-label">Tổng chi</div>
                            <motion.div
                                className="summary-amount"
                                {...popAnimation}
                                transition={{ ...springConfig, delay: 0.5 }}
                            >
                                {formatCurrency(totalExpense)}
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <motion.div
                className="finance-filters"
                {...slideSquashAnimation}
                transition={{ ...springConfig, delay: 0.2 }}
            >
                <motion.select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="filter-select"
                    whileHover={cartoonButtonHover}
                    whileTap={cartoonButtonTap}
                >
                    <option value="all">Tất cả giao dịch</option>
                    <option value="income">Thu nhập</option>
                    <option value="expense">Chi phí</option>
                </motion.select>
                
                <motion.select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="filter-select"
                    whileHover={cartoonButtonHover}
                    whileTap={cartoonButtonTap}
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
                </motion.select>
            </motion.div>

            <motion.div
                className="transactions-container"
                {...slideSquashAnimation}
                transition={{ ...springConfig, delay: 0.3 }}
            >
                <motion.div
                    className="transactions-list"
                    variants={staggerCartoon}
                    initial="initial"
                    animate="animate"
                >
                    {filteredTransactions.map((transaction, index) => (
                        <motion.div
                            key={transaction.id}
                            className="transaction-card"
                            variants={staggerItemCartoon}
                            whileHover={cartoonCardHover}
                            whileTap={cartoonCardTap}
                            custom={index}
                        >
                            <div className="transaction-header">
                                <motion.div
                                    className="transaction-amount"
                                    style={{ color: getTypeColor(transaction.type) }}
                                    {...popAnimation}
                                    transition={{ ...springConfig, delay: 0.1 * index }}
                                >
                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </motion.div>
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
                                <motion.button
                                    className="action-btn edit-btn"
                                    whileHover={cartoonButtonHover}
                                    whileTap={cartoonButtonTap}
                                >
                                    ✏️ Sửa
                                </motion.button>
                                <motion.button
                                    className="action-btn delete-btn"
                                    whileHover={cartoonButtonHover}
                                    whileTap={cartoonButtonTap}
                                >
                                    🗑️ Xóa
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>

            {filteredTransactions.length === 0 && (
                <motion.div
                    className="no-results"
                    {...popAnimation}
                >
                    <p>Không tìm thấy giao dịch nào phù hợp</p>
                </motion.div>
            )}

            <motion.div
                className="finance-reports"
                {...slideSquashAnimation}
                transition={{ ...springConfig, delay: 0.4 }}
            >
                <motion.h3
                    {...popAnimation}
                    transition={{ ...springConfig, delay: 0.5 }}
                >
                    📊 Báo cáo tài chính
                </motion.h3>
                <div className="reports-grid">
                    <motion.div
                        className="report-card"
                        variants={staggerItemCartoon}
                        whileHover={cartoonCardHover}
                        whileTap={cartoonCardTap}
                    >
                        <h4>📈 Biểu đồ thu chi theo tháng</h4>
                        <div className="chart-placeholder">
                            <p>Biểu đồ sẽ được hiển thị ở đây</p>
                        </div>
                    </motion.div>
                    
                    <motion.div
                        className="report-card"
                        variants={staggerItemCartoon}
                        whileHover={cartoonCardHover}
                        whileTap={cartoonCardTap}
                    >
                        <h4>📋 Phân loại chi phí</h4>
                        <div className="category-breakdown">
                            {['Phí thành viên', 'Tài trợ', 'Hoạt động', 'Tài liệu', 'Công cụ'].map((category, index) => {
                                const categoryAmount = transactions
                                    .filter(t => t.category === category)
                                    .reduce((sum, t) => sum + t.amount, 0);
                                return (
                                    <motion.div
                                        key={category}
                                        className="category-item"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ ...springConfig, delay: 0.6 + index * 0.1 }}
                                        whileHover={shouldReduceMotion ? {} : { x: 5, scale: 1.02 }}
                                    >
                                        <span className="category-name">{category}</span>
                                        <motion.span
                                            className="category-amount"
                                            {...popAnimation}
                                            transition={{ ...springConfig, delay: 0.7 + index * 0.1 }}
                                        >
                                            {formatCurrency(categoryAmount)}
                                        </motion.span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Finance;
