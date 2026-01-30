/**
 * Component cho glitch effect nhẹ cho tiêu đề
 */

import { motion } from 'framer-motion';
import { glitchVariants } from '../utils/animations';

const GlitchTitle = ({ children, className = '' }) => {
    return (
        <motion.h1
            className={className}
            variants={glitchVariants}
            initial="initial"
            animate="animate"
        >
            {children}
        </motion.h1>
    );
};

export default GlitchTitle;


