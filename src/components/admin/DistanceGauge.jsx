import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin } from 'lucide-react';

// Session-level cache: address -> distance (number | null)
const cache = {};
const MAX_MILES = 50;

function gaugeColor(miles) {
  if (miles <= 15) return { bar: 'bg-emerald-400', text: 'text-emerald-300' };
  if (miles <= 30) return { bar: 'bg-amber-400', text: 'text-amber-300' };
  return { bar: 'bg-red-400', text: 'text-red-300' };
}

export default function DistanceGauge({ address }) {
  const [distance, setDistance] = useState(cache[address] ?? null);
  const [loading, setLoading] = useState(!!address && cache[address] === undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!address || !address.trim()) {
      setLoading(false);
      return;
    }
    if (cache[address] !== undefined) {
      setDistance(cache[address]);
      setFailed(cache[address] == null);
      setLoading(false);
      return;
    }
    setLoading(true);
    base44.functions.invoke('getDistance', { address })
      .then((r) => {
        const d = r.data?.distance ?? r.distance ?? null;
        cache[address] = d;
        setDistance(d);
        setFailed(d == null);
      })
      .catch(() => { setFailed(true); cache[address] = null; })
      .finally(() => setLoading(false));
  }, [address]);

  if (!address || !address.trim()) {
    return <span className="text-xs text-vapor/30 font-mono-tech">—</span>;
  }
  if (loading) {
    return (
      <div className="w-20 h-1.5 bg-vapor/10 rounded-full overflow-hidden">
        <div className="h-full bg-vapor/20 animate-pulse w-1/2" />
      </div>
    );
  }
  if (failed || distance == null) {
    return <span className="text-xs text-vapor/30 font-mono-tech">N/A</span>;
  }

  const pct = Math.min(100, (distance / MAX_MILES) * 100);
  const { bar, text } = gaugeColor(distance);

  return (
    <div className="space-y-1.5 min-w-[88px]">
      <div className="flex items-center gap-1.5">
        <MapPin size={11} className={text} />
        <span className={`text-xs font-mono-tech font-bold ${text}`}>{distance} mi</span>
      </div>
      <div className="w-20 h-1.5 bg-vapor/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${bar} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}