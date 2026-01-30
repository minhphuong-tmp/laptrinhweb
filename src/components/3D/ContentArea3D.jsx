import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const ContentArea3D = ({ position }) => {
    const meshRef = useRef();

    // Subtle floating animation
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
        }
    });

    return (
        <group ref={meshRef} position={position}>
            {/* Content Panel - larger and centered */}
            <mesh
                position={[0, 0, 0]}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[12, 8, 0.3]} />
                <meshStandardMaterial
                    color="#0f0f1e"
                    metalness={0.1}
                    roughness={0.7}
                    transparent
                    opacity={0.98}
                />
            </mesh>
        </group>
    );
};

export default ContentArea3D;

