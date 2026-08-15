import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBusinessConfig, useConcierge } from '@/lib/BusinessConfigContext';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Send } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatQuickReplies from './ChatQuickReplies';
import QuoteCard from './QuoteCard';

export default function ChatWidget() {
  const config = useBusinessConfig();
  const concierge = useConcierge();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => {
    return sessionStorage.getItem('webChatConvId') || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36));
  });
  const scrollRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('webChatConvId', conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Don't render until config loads, or if the feature flag is explicitly off.
  if (!config) return null;
  if (config.feature_flags?.web_chat_enabled === false) return null;

  // Hide on admin/specialist/partner portal pages — chat is for customers only.
  if (['/admin', '/specialist', '/partner', '/onboarding'].some(p => location.pathname.startsWith(p))) return null;

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      const greeting = concierge.greeting || `Hi! I'm ${concierge.name}. How can I help you today?`;
      setMessages([{ role: 'assistant', content: greeting }]);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('webChat', {
        message: text,
        conversation_id: conversationId,
      });
      const data = res?.data || res;
      const assistantMsg = { role: 'assistant', content: data.reply || 'Sorry, I had trouble with that.' };
      if (data.quote) assistantMsg.quote = data.quote;
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = [
    'Get a quote',
    'Check availability',
    'What are your hours?',
    'Tell me about the membership',
  ];

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gold text-obsidian flex items-center justify-center shadow-lg hover:scale-105 transition-transform gold-pulse"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-[400px] h-[calc(100vh-3rem)] max-h-[600px] glass-panel rounded-lg flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/15 bg-obsidian/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono-tech text-sm text-vapor">{concierge.name}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-vapor/50 hover:text-vapor transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content}>
                {m.quote && <QuoteCard quote={m.quote} />}
              </ChatMessage>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 text-vapor/40 text-sm font-mono-tech pl-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1">{concierge.name} is typing...</span>
              </div>
            )}
            {messages.length <= 1 && !loading && (
              <ChatQuickReplies replies={quickReplies} onSelect={sendMessage} />
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gold/15 bg-obsidian/80">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder={`Message ${concierge.name}...`}
                className="flex-1 bg-asphalt/50 border border-gold/15 rounded-sm px-3 py-2 text-sm text-vapor placeholder:text-vapor/30 focus:outline-none focus:border-gold/40"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-sm bg-gold text-obsidian flex items-center justify-center disabled:opacity-30 hover:bg-gold-light transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}