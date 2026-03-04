/**
 * Animation utilities và variants cho Framer Motion
 * Tập trung tất cả animation configs ở đây để dễ quản lý và tái sử dụng
 */

// ========== FADE ANIMATIONS ==========
export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

export const fadeInDown = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
};

export const fadeInLeft = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
};

export const fadeInRight = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
};

// ========== SCALE ANIMATIONS ==========
export const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
};

export const scaleUp = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
};

// ========== TRANSITION CONFIGS ==========
export const smoothTransition = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] // ease-in-out cubic-bezier
};

export const fastTransition = {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1]
};

export const slowTransition = {
    duration: 0.5,
    ease: [0.4, 0, 0.2, 1]
};

export const springTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30
};

// ========== HOVER ANIMATIONS ==========
export const hoverScale = {
    scale: 1.05,
    transition: smoothTransition
};

export const hoverLift = {
    y: -5,
    transition: smoothTransition
};

export const hoverGlow = {
    boxShadow: "0 10px 30px rgba(139, 92, 246, 0.4)",
    transition: smoothTransition
};

// ========== TILT ANIMATION (Gentle Tilt) ==========
export const tiltVariants = {
    initial: { rotateX: 0, rotateY: 0 },
    hover: {
        rotateX: 2,
        rotateY: 2,
        transition: smoothTransition
    }
};

// ========== SCROLL ANIMATIONS ==========
export const scrollReveal = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

export const scrollRevealLeft = {
    initial: { opacity: 0, x: -50 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

export const scrollRevealRight = {
    initial: { opacity: 0, x: 50 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

export const scrollRevealScale = {
    initial: { opacity: 0, scale: 0.9 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
};

// ========== STAGGER ANIMATIONS ==========
export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

export const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
};

// ========== GLITCH EFFECT (Nhẹ) ==========
export const glitchVariants = {
    initial: { x: 0 },
    animate: {
        x: [0, -1, 1, -1, 1, 0],
        transition: {
            duration: 0.3,
            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
            repeat: Infinity,
            repeatDelay: 5
        }
    }
};

// ========== BUTTON ANIMATIONS ==========
export const buttonHover = {
    scale: 1.05,
    y: -2,
    transition: smoothTransition
};

export const buttonTap = {
    scale: 0.95,
    transition: fastTransition
};

// ========== CARD ANIMATIONS ==========
export const cardHover = {
    y: -8,
    rotateX: 2,
    rotateY: 2,
    transition: smoothTransition
};

export const cardTap = {
    scale: 0.98,
    transition: fastTransition
};

// ========== IMAGE ANIMATIONS ==========
export const imageHover = {
    scale: 1.05,
    transition: smoothTransition
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Tạo animation config tùy chỉnh
 */
export const createAnimation = (config) => {
    return {
        initial: config.initial || { opacity: 0 },
        animate: config.animate || { opacity: 1 },
        exit: config.exit || { opacity: 0 },
        transition: config.transition || smoothTransition
    };
};

/**
 * Tạo scroll reveal animation với options tùy chỉnh
 */
export const createScrollReveal = (options = {}) => {
    return {
        initial: { 
            opacity: 0, 
            y: options.y || 50,
            x: options.x || 0,
            scale: options.scale || 1
        },
        whileInView: { 
            opacity: 1, 
            y: 0,
            x: 0,
            scale: 1
        },
        viewport: { 
            once: options.once !== false, 
            margin: options.margin || "-100px" 
        },
        transition: { 
            duration: options.duration || 0.6, 
            ease: options.ease || [0.4, 0, 0.2, 1],
            delay: options.delay || 0
        }
    };
};


