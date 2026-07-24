import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { capturePartnerRef } from "@/lib/partnerRef";

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const { pathname, hash, search } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Capture any ?ref= partner code on every navigation so it survives across all
    // pages — a referred visitor keeps attribution no matter which page they browse.
    capturePartnerRef();

    if (navigationType === "POP") return;

    if (hash) {
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, search, navigationType]);

  return null;
}