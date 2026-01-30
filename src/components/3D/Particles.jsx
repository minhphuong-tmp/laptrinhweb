import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Particles = ({ count = 200 }) => {
    const mesh = useRef();
    const light = useRef();

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const time = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const x = Math.random() * 30 - 15;
            const y = Math.random() * 30 - 15;
            const z = Math.random() * 30 - 15;

            temp.push({ time, factor, speed, x, y, z });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        if (mesh.current) {
            particles.forEach((particle, i) => {
                let { factor, speed, x, y, z } = particle;
                const t = particle.time + state.clock.elapsedTime * speed;
                
                mesh.current.geometry.attributes.position.setXYZ(
                    i,
                    x + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
                    y + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                    z + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
                );
            });
            mesh.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    const points = useMemo(() => {
        return new Float32Array(particles.length * 3);
    }, [particles]);

    return (
        <>
            <points ref={mesh}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particles.length}
                        array={points}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.03}
                    color="#4a90e2"
                    transparent
                    opacity={0.3}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>
        </>
    );
};

export default Particles;

