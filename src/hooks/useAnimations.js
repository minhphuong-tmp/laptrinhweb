/**
 * Custom hooks cho animations
 * Cung cấp các hooks tái sử dụng cho các animation phổ biến
 */

import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/**
 * Hook cho gentle tilt effect khi hover
 * @param {number} maxTilt - Góc nghiêng tối đa (degrees)
 * @returns {object} - Motion values và event handlers
 */
export const useTilt = (maxTilt = 5) => {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), {
        stiffness: 300,
        damping: 30
    });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), {
        stiffness: 300,
        damping: 30
    });

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        x.set(mouseX / (rect.width / 2));
        y.set(mouseY / (rect.height / 2));
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return {
        ref,
        rotateX,
        rotateY,
        style: {
            transformStyle: 'preserve-3d'
        }
    };
};

/**
 * Hook cho parallax scroll effect
 * @param {number} speed - Tốc độ parallax (0-1)
 * @returns {object} - Motion value cho y position
 */
export const useParallax = (speed = 0.5) => {
    const y = useMotionValue(0);

    useEffect(() => {
        const handleScroll = () => {
            y.set(window.scrollY * speed);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed, y]);

    return y;
};

/**
 * Hook để detect khi element vào viewport
 * @param {object} options - Intersection Observer options
 * @returns {[ref, boolean]} - Ref và isInView state
 */
export const useInView = (options = {}) => {
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            {
                threshold: options.threshold || 0.1,
                rootMargin: options.rootMargin || '0px'
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [options.threshold, options.rootMargin]);

    return [ref, isInView];
};

