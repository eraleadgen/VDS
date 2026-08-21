import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Sparkles, ExternalLink, Check, Upload, Monitor, Smartphone, Info, LifeBuoy, X } from 'lucide-react';
import DomainSection from '@/components/admin/DomainSection';

const GREETING = "Hi! I'm your website design assistant. Tell me what you'd like to change about the customer-facing site — tagline, brand colors, FAQ, SEO, the concierge persona, featured services, and more. Changes stage in the preview on the right; click Publish when you're happy.";

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
  const [showHelp, setShowHelp] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [sendingHelp, setSendingHelp] = useState(false);
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

  const sendHelp = async () => {
    const text = helpMessage.trim();
    if (!text || sendingHelp) return;
    setSendingHelp(true);
    try {
      const r = await base44.functions.invoke('supportContact', { source: 'Website Designer', subject: 'Website Designer Help', message: text });
      const res = r?.data ?? r;
      if (res.error) throw new Error(res.error);
      setMessages((m) => [...m, { role: 'assistant', content: '✅ Your message was sent to support@eraleadgen.com. Our team will reply by email.' }]);
      setShowHelp(false);
      setHelpMessage('');
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ Could not send: ${e.message}` }]);
    } finally {
      setSendingHelp(false);
    }
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
          <button onClick={() => setShowHelp(true)} className="flex items-center gap-1.5 text-xs font-mono-tech tracking-widest text-vapor/60 hover:text-gold border border-vapor/15 hover:border-gold/40 px-3 py-2 rounded-sm transition-colors">
            <LifeBuoy size={14} />
            GET HELP
          </button>
          <button onClick={publish} disabled={!changedFields.length || publishing} className="flex items-center gap-2 bg-gold text-obsidian text-xs font-mono-tech tracking-widest px-4 py-2 rounded-sm hover:bg-gold-light disabled:opacity-40 transition-colors">
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            PUBLISH{changedFields.length > 0 ? ` (${changedFields.length})` : ''}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs bg-gold/5 border border-gold/20 rounded-sm px-3 py-2 text-gold/80 font-mono-tech">
        <Info size={14} className="shrink-0" />
        Changes appear in the preview instantly, but only go live on your site when you click PUBLISH.
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

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4">
          <div className="glass-panel border border-gold/20 rounded-sm w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LifeBuoy size={18} className="text-gold" />
                <h3 className="font-grotesk text-lg text-vapor">Get Help</h3>
              </div>
              <button onClick={() => setShowHelp(false)} className="text-vapor/40 hover:text-vapor"><X size={18} /></button>
            </div>
            <p className="text-xs text-vapor/50 font-mono-tech">Send a message to our support team at <span className="text-gold/80">support@eraleadgen.com</span>. We'll reply by email.</p>
            <textarea
              value={helpMessage}
              onChange={(e) => setHelpMessage(e.target.value)}
              placeholder="Describe your question or issue…"
              rows={5}
              className="w-full bg-obsidian/50 border border-vapor/15 rounded-sm px-3 py-2 text-sm text-vapor font-grotesk focus:border-gold/40 outline-none placeholder:text-vapor/25 resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowHelp(false)} className="text-xs font-mono-tech tracking-widest text-vapor/50 hover:text-vapor px-3 py-2">CANCEL</button>
              <button onClick={sendHelp} disabled={!helpMessage.trim() || sendingHelp} className="flex items-center gap-2 bg-gold text-obsidian text-xs font-mono-tech tracking-widest px-4 py-2 rounded-sm hover:bg-gold-light disabled:opacity-40 transition-colors">
                {sendingHelp ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                SEND
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}