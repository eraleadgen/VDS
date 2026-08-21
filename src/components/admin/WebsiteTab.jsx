import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Sparkles, ExternalLink, Check, Upload, Monitor, Smartphone } from 'lucide-react';
import DomainSection from '@/components/admin/DomainSection';

const GREETING = "Hi! I'm your website design assistant. Tell me what you'd like to change about the customer-facing site — tagline, brand colors, FAQ, SEO, the concierge persona, featured services, and more. Changes stage in the preview on the right; click Publish when you're happy.";

const SUGGESTIONS = [
  "Make the brand colors cooler — a deep navy and silver",
  "Update the tagline to 'Atlanta's Premier Mobile Detailing Concierge'",
  "Add a FAQ entry about how long a ceramic coating lasts",
  "Make Valerie's greeting more warm and conversational",
];

// Deep-merge a patch into a base config (objects merge, arrays/scalars replace).
// Mirrors the backend deepMerge so the preview matches what Publish will commit.
function mergeConfig(base, patch) {
  const out = { ...base };
  for (const k of Object.keys(patch || {})) {
    const pv = patch[k];
    if (pv && typeof pv === 'object' && !Array.isArray(pv)) {
      out[k] = mergeConfig(out[k] || {}, pv);
    } else {
      out[k] = pv;
    }
  }
  return out;
}

export default function WebsiteTab() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [baseConfig, setBaseConfig] = useState(null);
  const [pending, setPending] = useState({});
  const [device, setDevice] = useState('desktop');
  const scrollRef = useRef(null);
  const iframeRef = useRef(null);

  const previewConfig = baseConfig ? mergeConfig(baseConfig, pending) : null;
  const changedFields = Object.keys(pending);

  // Load the current editable config (base for the preview)
  useEffect(() => {
    (async () => {
      try {
        const r = await base44.functions.invoke('websiteDesigner', { action: 'get' });
        const res = r?.data ?? r;
        if (res?.config) setBaseConfig(res.config);
      } catch (e) { /* ignore — preview just shows live DB config */ }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Push the staged preview config into the iframe whenever it changes
  useEffect(() => {
    const f = iframeRef.current;
    if (f && previewConfig) {
      f.contentWindow?.postMessage({ type: 'designPreviewConfig', config: previewConfig }, '*');
    }
  }, [previewConfig]);

  // Respond to the iframe's "ready" signal so the first paint applies the config
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'designPreviewReady' && iframeRef.current && previewConfig) {
        iframeRef.current.contentWindow?.postMessage({ type: 'designPreviewConfig', config: previewConfig }, '*');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [previewConfig]);

  const onIframeLoad = () => {
    if (previewConfig) iframeRef.current?.contentWindow?.postMessage({ type: 'designPreviewConfig', config: previewConfig }, '*');
  };

  const send = async (override) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '__loading__' }]);
    setInput('');
    setLoading(true);
    try {
      const r = await base44.functions.invoke('websiteDesigner', { action: 'design', message: text, history });
      const res = r?.data ?? r;
      if (res.error) throw new Error(res.error);
      setMessages((m) => m.map((msg, i) => (i === m.length - 1 ? { role: 'assistant', content: res.reply } : msg)));
      if (res.proposed_updates) setPending((p) => mergeConfig(p, res.proposed_updates));
    } catch (e) {
      setMessages((m) => m.map((msg, i) => (i === m.length - 1 ? { role: 'assistant', content: `⚠️ ${e.message}` } : msg)));
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    if (!changedFields.length || publishing) return;
    setPublishing(true);
    try {
      const r = await base44.functions.invoke('websiteDesigner', { action: 'publish', updates: pending });
      const res = r?.data ?? r;
      if (res.error) throw new Error(res.error);
      setBaseConfig(res.config || previewConfig);
      setPending({});
      setMessages((m) => [...m, { role: 'assistant', content: '✅ Published! Your changes are now live on the site.' }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ Publish failed: ${e.message}` }]);
    } finally {
      setPublishing(false);
    }
  };

  const discard = () => {
    setPending({});
    setMessages((m) => [...m, { role: 'assistant', content: 'Pending changes discarded. The preview is back to the live site.' }]);
  };

  const previewUrl = `${window.location.origin}/?design_preview=1`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-gold" />
          <div>
            <h1 className="text-2xl font-grotesk font-bold text-vapor leading-tight">Website Designer</h1>
            <p className="text-xs font-mono-tech text-vapor/40">Visual & text changes only — preview, then publish</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {changedFields.length > 0 && (
            <button onClick={discard} disabled={publishing} className="text-xs font-mono-tech tracking-widest text-vapor/50 hover:text-vapor border border-vapor/15 hover:border-vapor/30 px-3 py-2 rounded-sm transition-colors">
              DISCARD
            </button>
          )}
          <button onClick={publish} disabled={!changedFields.length || publishing} className="flex items-center gap-2 bg-gold text-obsidian text-xs font-mono-tech tracking-widest px-4 py-2 rounded-sm hover:bg-gold-light disabled:opacity-40 transition-colors">
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            PUBLISH{changedFields.length > 0 ? ` (${changedFields.length})` : ''}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4" style={{ height: 'calc(100vh - 200px)', minHeight: 420 }}>
        {/* Chat panel — glass, compact */}
        <div className="glass-panel border border-gold/15 rounded-sm flex flex-col overflow-hidden bg-asphalt/40">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-md px-3 py-1.5 text-xs leading-relaxed ${m.role === 'user' ? 'bg-gold/90 text-obsidian font-grotesk font-medium' : 'bg-obsidian/40 border border-vapor/10 text-vapor/80 font-grotesk'}`}>
                  {m.content === '__loading__' ? <Loader2 size={12} className="animate-spin text-gold" /> : m.content}
                </div>
              </div>
            ))}
          </div>

          {changedFields.length > 0 && (
            <div className="px-3 py-1.5 border-t border-vapor/10 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono-tech text-gold/80 flex items-center gap-1"><Check size={10} /> STAGED</span>
              {changedFields.map((f) => (
                <span key={f} className="text-[10px] font-mono-tech text-gold/60 bg-gold/10 px-1.5 py-0.5 rounded">{f}</span>
              ))}
            </div>
          )}

          <div className="border-t border-vapor/10 p-2.5">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Describe a visual change…"
                className="flex-1 bg-obsidian/50 border border-vapor/15 rounded-sm px-2.5 py-2 text-xs text-vapor font-grotesk focus:border-gold/40 outline-none placeholder:text-vapor/25"
                disabled={loading}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()} className="bg-gold text-obsidian rounded-sm p-2 hover:bg-gold-light disabled:opacity-40 transition-colors">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={loading} className="text-[10px] text-vapor/45 hover:text-gold border border-vapor/10 hover:border-gold/30 rounded-sm px-2 py-1 font-grotesk transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="glass-panel border border-vapor/10 rounded-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-vapor/10 bg-obsidian/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gold/60" />
              <span className="text-[10px] font-mono-tech tracking-widest text-vapor/50">LIVE PREVIEW</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setDevice('desktop')} className={`p-1 rounded transition-colors ${device === 'desktop' ? 'text-gold' : 'text-vapor/40 hover:text-vapor'}`}><Monitor size={14} /></button>
              <button onClick={() => setDevice('mobile')} className={`p-1 rounded transition-colors ${device === 'mobile' ? 'text-gold' : 'text-vapor/40 hover:text-vapor'}`}><Smartphone size={14} /></button>
              <a href={window.location.origin} target="_blank" rel="noopener noreferrer" className="ml-1 text-vapor/40 hover:text-gold"><ExternalLink size={13} /></a>
            </div>
          </div>
          <div className="flex-1 bg-obsidian flex items-center justify-center p-3 overflow-hidden">
            <iframe
              ref={iframeRef}
              src={previewUrl}
              onLoad={onIframeLoad}
              title="Website Preview"
              className={`bg-obsidian rounded-sm border border-vapor/10 transition-all duration-300 ${device === 'mobile' ? 'w-[390px] h-full' : 'w-full h-full'}`}
            />
          </div>
        </div>
      </div>

      <DomainSection />
    </div>
  );
}