import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function QuoteCard({ quote }) {
  const navigate = useNavigate();
  if (!quote) return null;
  return (
    <div className="mt-3 border border-gold/25 rounded-lg p-3 bg-obsidian/40">
      <p className="text-xs font-mono-tech text-gold/70 mb-1">CUSTOM QUOTE</p>
      {quote.quote_summary && (
        <p className="text-xs text-vapor/60 mb-2 leading-relaxed">{quote.quote_summary}</p>
      )}
      <div className="flex items-center justify-between">
        <div>
          {quote.final_price != null && (
            <p className="text-lg font-bold text-gold">${quote.final_price}</p>
          )}
          {quote.estimated_duration && (
            <p className="text-xs text-vapor/40">{quote.estimated_duration}</p>
          )}
        </div>
        <button
          onClick={() => navigate(`/book?quote_id=${quote.quote_id}`)}
          className="flex items-center gap-1 text-xs font-mono-tech text-obsidian bg-gold px-3 py-2 rounded-sm hover:bg-gold-light transition-colors"
        >
          BOOK NOW <ArrowRight size={12} />
        </button>
      </div>
      {quote.requires_consultation && (
        <p className="text-xs text-vapor/40 mt-2">Consultation required — we'll confirm details after booking.</p>
      )}
    </div>
  );
}