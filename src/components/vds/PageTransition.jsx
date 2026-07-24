import { useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// App-wide page transition. Applied as a layout route wrapping every page so
// navigation animates from the previous route to the next with a clean,
// theme-matched fade + blur-to-focus + vertical lift, finished by a gold sheen
// sweep across the top of the viewport. `mode="wait"` ensures the outgoing page
// exits before the incoming one enters for a crisp hand-off.
export default function PageTransition() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        exit={{ opacity: 0, filter: 'blur(8px)', y: -10 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        {/* Gold sheen sweep across the top on enter */}
        <motion.div
          aria-hidden
          initial={{ scaleX: 0, opacity: 0.9 }}
          animate={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed top-0 left-0 right-0 h-px origin-left z-[60]"
          style={{ background: 'linear-gradient(90deg, transparent, #D4AF37 50%, transparent)' }}
        />
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}