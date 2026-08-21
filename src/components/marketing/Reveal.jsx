import { motion } from 'framer-motion';

// Enhanced reveal: blur-to-sharp + spring entrance for a "alive" feel.
// Supports `as` prop for custom element, and stagger via delay.
export default function Reveal({ children, delay = 0, className = '', y = 24, once = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: 'blur(8px)', scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}