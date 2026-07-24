import { useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// App-wide page transition layout route. Wraps the page swap in a quick fade that runs
// underneath the VdsTransitionOverlay (rendered at the App level). The overlay covers the
// swap and only opens once the next page is finished loading, so the hand-off is never seen.
export default function PageTransition() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="relative"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}