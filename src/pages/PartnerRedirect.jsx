import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Vanity referral link redirect: /CODE → /book?ref=CODE
// Partner referral links are short (domain/CODE). This catches any unmatched
// single-segment path and forwards it to the booking flow with attribution.
export default function PartnerRedirect() {
  const { code } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/book?ref=${encodeURIComponent(code || '')}`, { replace: true });
  }, [code, navigate]);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-obsidian">
      <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
    </div>
  );
}