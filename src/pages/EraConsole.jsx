import { useEffect } from 'react';

// EraConsole is deprecated — /era-admin is the full ERA Staff Portal.
// Redirect immediately so any bookmarked links land in the right place.

export default function EraConsole() {
  useEffect(() => { window.location.replace('/era-admin'); }, []);
  return null;
}