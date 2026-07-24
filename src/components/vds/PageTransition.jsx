import { Outlet } from 'react-router-dom';

// App-wide page-transition layout route. The branded VdsTransitionOverlay (rendered at the
// App level) now owns the page swap: it closes over the current page, swaps the route under
// the closed overlay (via the committedLocation passed to <Routes>), then opens to reveal it.
// This wrapper is a passthrough that renders the matched child route.
export default function PageTransition() {
  return <Outlet />;
}