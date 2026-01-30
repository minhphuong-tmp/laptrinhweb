/**
 * 3D Wallet Model Component
 * Simple 3D wallet model for Finance page
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const Wallet3D = () => {
    const walletRef = useRef();

    // Rotate wallet slowly
    useFrame((state, delta) => {
        if (walletRef.current) {
            walletRef.current.rotation.y += delta * 0.2;
            walletRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });

    return (
        <group ref={walletRef}>
            {/* Main wallet body */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 1.2, 0.3]} />
                <meshStandardMaterial
                    color="#1a1a1a"
                    metalness={0.8}
                    roughness={0.2}
                    emissive="#ffffff"
                    emissiveIntensity={0.1}
                />
            </mesh>

            {/* Wallet flap */}
            <mesh position={[0, 0.6, 0.15]} rotation={[-0.2, 0, 0]} castShadow>
                <boxGeometry args={[2, 0.6, 0.1]} />
                <meshStandardMaterial
                    color="#2a2a2a"
                    metalness={0.7}
                    roughness={0.3}
                />
            </mesh>

            {/* Wallet details - cards inside */}
            <mesh position={[-0.6, 0, 0.2]} castShadow>
                <boxGeometry args={[0.8, 0.9, 0.05]} />
                <meshStandardMaterial
                    color="#0a0a0a"
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            <mesh position={[0.6, 0, 0.2]} castShadow>
                <boxGeometry args={[0.8, 0.9, 0.05]} />
                <meshStandardMaterial
                    color="#0a0a0a"
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>

            {/* Glow effect */}
            <mesh position={[0, 0, 0]} scale={[1.2, 1.2, 1.2]}>
                <boxGeometry args={[2, 1.2, 0.3]} />
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.05}
                    emissive="#ffffff"
                    emissiveIntensity={0.2}
                />
            </mesh>
        </group>
    );
};

export default Wallet3D;

