/**
 * Hook để tích hợp Lenis smooth scroll
 * Sử dụng inertia-based scrolling cho trải nghiệm mượt mà hơn
 */

import { useEffect } from 'react';
import Lenis from 'lenis';

export const useSmoothScroll = (options = {}) => {
    useEffect(() => {
        // Khởi tạo Lenis với options tùy chỉnh
        const defaultEasing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
        const lenis = new Lenis({
            duration: options.duration || 1.2,
            easing: options.easing || defaultEasing,
            orientation: options.orientation || 'vertical',
            gestureOrientation: options.gestureOrientation || 'vertical',
            smoothWheel: options.smoothWheel !== false,
            wheelMultiplier: options.wheelMultiplier || 1,
            smoothTouch: options.smoothTouch !== false,
            touchMultiplier: options.touchMultiplier || 2,
            infinite: options.infinite || false,
        });

        // Animation loop
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Cleanup
        return () => {
            lenis.destroy();
        };
    }, [
        options.duration,
        options.easing,
        options.orientation,
        options.gestureOrientation,
        options.smoothWheel,
        options.wheelMultiplier,
        options.smoothTouch,
        options.touchMultiplier,
        options.infinite
    ]);
};

