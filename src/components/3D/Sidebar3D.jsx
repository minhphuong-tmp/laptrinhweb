import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useAuth } from '../../context/AuthContext';

const Sidebar3D = ({ position, navigate, location }) => {
    const meshRef = useRef();
    const { user } = useAuth();

    // Subtle floating animation
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });

    // Only show 3D pages in sidebar when in 3D mode
    const menuItems = [
        { path: '/leaderboard', icon: '🏆', label: 'Bảng xếp hạng' },
        { path: '/finance', icon: '💰', label: 'Tài chính' },
        { path: '/support', icon: '💬', label: 'Hỗ trợ' },
    ];

    return (
        <group ref={meshRef} position={position}>
            {/* Sidebar Panel - larger and more visible */}
            <mesh
                position={[0, 0, 0]}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[2.5, 6, 0.3]} />
                <meshStandardMaterial
                    color="#1a1a2e"
                    metalness={0.2}
                    roughness={0.6}
                    transparent
                    opacity={0.95}
                />
            </mesh>

            {/* Menu Items - better spacing */}
            {menuItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                const yPos = 2.2 - index * 1.2;
                
                return (
                    <group key={item.path} position={[0, yPos, 0.2]}>
                        <mesh
                            onClick={(e) => {
                                e.stopPropagation();
                                if (navigate && item.path !== location.pathname) {
                                    navigate(item.path);
                                }
                            }}
                            onPointerOver={(e) => {
                                e.stopPropagation();
                                document.body.style.cursor = 'pointer';
                            }}
                            onPointerOut={(e) => {
                                e.stopPropagation();
                                document.body.style.cursor = 'default';
                            }}
                        >
                            <boxGeometry args={[1.8, 0.6, 0.1]} />
                            <meshStandardMaterial
                                color={isActive ? "#4a90e2" : "#2a2a4e"}
                                metalness={0.5}
                                roughness={0.3}
                                emissive={isActive ? "#4a90e2" : "#000000"}
                                emissiveIntensity={isActive ? 0.3 : 0}
                            />
                        </mesh>
                        
                        <Html
                            position={[0, 0, 0.1]}
                            center
                            transform
                            occlude
                            style={{ pointerEvents: 'none' }}
                        >
                            <div
                                style={{
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: isActive ? 'bold' : 'normal',
                                    textAlign: 'center',
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                }}
                            >
                                <span style={{ fontSize: '20px', display: 'block' }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        </Html>
                    </group>
                );
            })}
        </group>
    );
};

export default Sidebar3D;

