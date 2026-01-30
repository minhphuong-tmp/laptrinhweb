import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../Avatar';

const TopBar3D = ({ position }) => {
    const meshRef = useRef();

    // Subtle floating animation
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        }
    });

    const { user } = useAuth();

    return (
        <group ref={meshRef} position={position}>
            {/* Top Bar Panel - wider */}
            <mesh
                position={[0, 0, 0]}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[18, 1.2, 0.3]} />
                <meshStandardMaterial
                    color="#1a1a2e"
                    metalness={0.2}
                    roughness={0.6}
                    transparent
                    opacity={0.95}
                />
            </mesh>

            {/* Logo/Title with glow effect */}
            <Html
                position={[-7, 0, 0.2]}
                center
                transform
            >
                <div style={{
                    color: '#4a90e2',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    textShadow: '0 0 10px rgba(74, 144, 226, 0.8), 0 0 20px rgba(74, 144, 226, 0.5)',
                }}>
                    CLB Tin học KMA
                </div>
            </Html>

            {/* User Info */}
            {user && (
                <Html
                    position={[7, 0, 0.2]}
                    center
                    transform
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        pointerEvents: 'none',
                    }}>
                        <Avatar
                            src={user.image}
                            name={user.name}
                            size={30}
                        />
                        <span style={{ color: 'white', fontSize: '14px' }}>
                            {user.name}
                        </span>
                    </div>
                </Html>
            )}
        </group>
    );
};

export default TopBar3D;

