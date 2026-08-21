import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Sparkles, ExternalLink, Check } from 'lucide-react';

const GREETING = "Hi! I'm your website design assistant. Tell me what you'd like to change about the customer-facing site — tagline, brand colors, FAQ, SEO, the concierge persona, featured services, and more. For example: \"Make the primary brand color a deep emerald green\" or \"Add a FAQ about ceramic coating maintenance.\"";

const SUGGESTIONS = [
  "Make the brand colors cooler — a deep navy and silver",
  "Update the tagline to 'Atlanta's Premier Mobile Detailing Concierge'",
  "Add a FAQ entry about how long a ceramic coating lasts",
  "Make Valerie's greeting more warm and conversational",
];

export default function WebsiteTab() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastChanges, setLastChanges] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (override) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '__loading__' }]);
    setInput('');
    setLoading(true);
    setLastChanges([]);
    try {
      const r = await base44.functions.invoke('websiteDesigner', { message: text, history });
      const res = r?.data ?? r;
      if (res.error) throw new Error(res.error);
      setMessages((m) => m.map((msg, i) => (i === m.length - 1 ? { role: 'assistant', content: res.reply } : msg)));
      setLastChanges(res.changed_fields || []);
    } catch (e) {
      setMessages((m) => m.map((msg, i) => (i === m.length - 1 ? { role: 'assistant', content: `⚠️ ${e.message}` } : msg)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-gold" />
          <h1 className="text-2xl font-grotesk font-bold text-vapor">Website Designer</h1>
        </div>
        <a href={window.location.origin} target="_blank" rel="noopener noreferrer" className="text-xs font-mono-tech tracking-widest text-vapor/40 hover:text-gold flex items-center gap-1">
          VIEW LIVE SITE <ExternalLink size={12} />
        </a>
      </div>

      <div className="glass-panel border border-vapor/10 rounded-sm flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-sm px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-gold text-obsidian font-grotesk' : 'bg-asphalt border border-vapor/10 text-vapor font-grotesk'}`}>
                {m.content === '__loading__' ? <Loader2 size={14} className="animate-spin text-gold" /> : m.content}
              </div>
            </div>
          ))}
        </div>

        {lastChanges.length > 0 && (
          <div className="px-5 py-2 border-t border-vapor/10 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono-tech text-green-400 flex items-center gap-1"><Check size={12} /> APPLIED</span>
            {lastChanges.map((f) => (
              <span key={f} className="text-xs font-mono-tech text-gold/70 bg-gold/10 px-2 py-0.5 rounded">{f}</span>
            ))}
          </div>
        )}

        <div className="border-t border-vapor/10 p-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Describe a visual change to the website…"
              className="flex-1 bg-asphalt border border-vapor/15 rounded-sm px-3 py-2.5 text-sm text-vapor font-grotesk focus:border-gold/40 outline-none"
              disabled={loading}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} className="bg-gold text-obsidian rounded-sm p-2.5 hover:bg-gold-light disabled:opacity-40 transition-colors">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={loading} className="text-xs text-vapor/50 hover:text-gold border border-vapor/10 hover:border-gold/30 rounded-sm px-2.5 py-1 font-grotesk transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}