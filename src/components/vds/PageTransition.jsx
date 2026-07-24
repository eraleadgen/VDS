import { useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import VdsTransitionOverlay from '@/components/vds/VdsTransitionOverlay';

// App-wide page transition. Wraps every route as a layout route. On navigation the
// VdsTransitionOverlay closes a gold screen with the VDS logo over the page, then opens
// from the middle (~2s) to reveal the next page. The page itself swaps underneath while
// covered: the outgoing page fades out as the gold closes, and the incoming page fades
// in before the overlay opens — so the hand-off is never visible.
export default function PageTransition() {
  const location = useLocation();

  return (
    <>
      <VdsTransitionOverlay pathKey={location.pathname} />
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
    </>
  );
}