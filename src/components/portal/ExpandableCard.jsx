import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ExpandableCard({ leading, header, right, children, selected = false, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`glass-panel border rounded-sm transition-colors ${open ? 'border-gold/30' : selected ? 'border-gold/40' : 'border-vapor/10'}`}>
      <div className="flex items-stretch">
        {leading && <div className="flex items-center pl-4 shrink-0">{leading}</div>}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex-1 flex items-center justify-between gap-3 p-4 text-left min-w-0"
        >
          <div className="min-w-0 flex-1">{header}</div>
          {right ? (
            <div className="flex items-center gap-3 shrink-0">
              {right}
              <ChevronDown size={18} className={`text-vapor/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </div>
          ) : (
            <ChevronDown size={18} className={`text-vapor/40 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`} />
          )}
        </button>
      </div>
      {open && <div className="border-t border-vapor/10 px-4 pb-4 pt-3 space-y-3">{children}</div>}
    </div>
  );
}