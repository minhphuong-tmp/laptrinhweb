/**
 * Finance 3D - Apple Vision Pro Style
 * Complete rebuild with 3D effects and glassmorphism
 */

import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import Wallet3D from '../components/3D/Wallet3D';
import './Finance3D.css';

const Finance3D = () => {
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

    // Animation variants
    const fadeInUp = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
    };

    const staggerContainer = {
        initial: {},
        animate: {
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const cardVariants = {
        initial: { opacity: 0, y: 40, scale: 0.95 },
        animate: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
        }
    };

    // Mock data for UI
    const functionCards = [
        {
            icon: '💸',
            title: 'Chi tiêu',
            description: 'Theo dõi và quản lý các khoản chi tiêu hàng ngày',
            amount: '2,450,000 ₫'
        },
        {
            icon: '💰',
            title: 'Thu nhập',
            description: 'Quản lý nguồn thu nhập và các khoản đầu tư',
            amount: '5,200,000 ₫'
        },
        {
            icon: '📊',
            title: 'Tổng quan',
            description: 'Xem tổng quan tài chính và phân tích chi tiết',
            amount: '2,750,000 ₫'
        }
    ];

    const statsData = [
        { label: 'Phí thành viên', category: 'Thu nhập', amount: '500,000 ₫', date: '15/02/2024' },
        { label: 'Workshop React.js', category: 'Chi tiêu', amount: '300,000 ₫', date: '10/02/2024' },
        { label: 'Tài trợ Công ty ABC', category: 'Thu nhập', amount: '2,000,000 ₫', date: '05/02/2024' },
        { label: 'In tài liệu học tập', category: 'Chi tiêu', amount: '150,000 ₫', date: '28/01/2024' },
    ];

    return (
        <div className="finance-3d-container">
            {/* Header */}
            <motion.header
                className="finance-3d-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
                <h1>Quản Lý Tài Chính</h1>
                <div className="finance-3d-header-actions">
                    <button className="finance-3d-button">Báo cáo</button>
                    <button className="finance-3d-button finance-3d-button-primary">Thêm giao dịch</button>
                </div>
            </motion.header>

            {/* Hero Section with 3D Model */}
            <motion.section
                className="finance-3d-hero"
                style={{ opacity, scale }}
            >
                <div className="finance-3d-hero-content">
                    <motion.div
                        className="finance-3d-hero-text"
                        {...fadeInUp}
                    >
                        <h2>Quản lý tài chính thông minh</h2>
                        <p>
                            Theo dõi chi tiêu, thu nhập và phân tích tài chính một cách trực quan 
                            với giao diện 3D hiện đại. Tất cả trong tầm tay của bạn.
                        </p>
                    </motion.div>

                    <motion.div
                        className="finance-3d-hero-3d"
                        initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                    >
                        <Canvas
                            shadows
                            camera={{ position: [0, 0, 5], fov: 50 }}
                        >
                            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                            <ambientLight intensity={0.5} />
                            <directionalLight
                                position={[5, 5, 5]}
                                intensity={1}
                                castShadow
                            />
                            <pointLight position={[-5, -5, -5]} intensity={0.5} />
                            <Wallet3D />
                            <OrbitControls
                                enableZoom={false}
                                enablePan={false}
                                autoRotate
                                autoRotateSpeed={0.5}
                                minPolarAngle={Math.PI / 3}
                                maxPolarAngle={Math.PI / 2.2}
                            />
                            <Environment preset="city" />
                        </Canvas>
                    </motion.div>
                </div>
            </motion.section>

            {/* Function Cards */}
            <motion.section
                className="finance-3d-cards-grid"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                {functionCards.map((card, index) => (
                    <motion.div
                        key={index}
                        className="finance-3d-card finance-3d-function-card"
                        variants={cardVariants}
                        whileHover={{ 
                            y: -8,
                            rotateX: 2,
                            rotateY: -2,
                            transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
                        }}
                    >
                        <div>
                            <div className="finance-3d-function-card-icon">{card.icon}</div>
                            <h3>{card.title}</h3>
                            <p>{card.description}</p>
                        </div>
                        <div className="finance-3d-function-card-amount">{card.amount}</div>
                    </motion.div>
                ))}
            </motion.section>

            {/* Statistics Table */}
            <motion.section
                className="finance-3d-stats"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
                <div className="finance-3d-stats-header">
                    <h2>Thống kê gần đây</h2>
                </div>

                <div className="finance-3d-stats-table finance-3d-card">
                    <div className="finance-3d-stats-table-header">
                        <div className="finance-3d-stats-table-header-cell">Mô tả</div>
                        <div className="finance-3d-stats-table-header-cell">Loại</div>
                        <div className="finance-3d-stats-table-header-cell">Số tiền</div>
                        <div className="finance-3d-stats-table-header-cell">Ngày</div>
                    </div>

                    {statsData.map((row, index) => (
                        <motion.div
                            key={index}
                            className="finance-3d-stats-table-row"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ 
                                duration: 0.5, 
                                delay: index * 0.1,
                                ease: [0.25, 0.1, 0.25, 1]
                            }}
                            whileHover={{ 
                                x: 4,
                                transition: { duration: 0.3 }
                            }}
                        >
                            <div className="finance-3d-stats-table-cell finance-3d-stats-table-cell-label" data-label="Mô tả">
                                {row.label}
                            </div>
                            <div className="finance-3d-stats-table-cell" data-label="Loại">
                                {row.category}
                            </div>
                            <div className="finance-3d-stats-table-cell finance-3d-stats-table-cell-amount" data-label="Số tiền">
                                {row.amount}
                            </div>
                            <div className="finance-3d-stats-table-cell" data-label="Ngày">
                                {row.date}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>
        </div>
    );
};

export default Finance3D;

