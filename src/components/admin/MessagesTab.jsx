import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Search, ArrowLeft, Phone, UserCircle, Send, Trash2 } from 'lucide-react';

const fmtTime = (iso) => {
  try { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)); }
  catch { return ''; }
};

export default function MessagesTab() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const list = await base44.entities.ConversationHistory.list('-created_date', 500);
      setRecords(list || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const sendReply = async () => {
    if (!selected || !reply.trim() || sending) return;
    setSending(true); setNotice('');
    try {
      const res = await base44.functions.invoke('sendSms', { to: selected.phone, content: reply.trim(), customer_name: selected.name });
      if (res?.data?.error) { alert(res.data.error); }
      else {
        if (res?.data?.sent === false && res?.data?.message) setNotice(res.data.message);
        setReply('');
        await load();
      }
    } catch (e) { alert(e.message); }
    finally { setSending(false); }
  };

  const deleteConversation = async () => {
    if (!selected || deleting) return;
    setDeleting(true);
    try {
      await base44.entities.ConversationHistory.deleteMany({ customer_phone: selected.phone });
      setConfirmingDelete(false);
      setSelectedPhone(null);
      await load();
    } catch (e) { alert(e.message); }
    finally { setDeleting(false); }
  };

  const conversations = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      const key = r.customer_phone || 'Unknown';
      if (!map.has(key)) map.set(key, { phone: key, name: r.customer_name || '', messages: [] });
      const conv = map.get(key);
      if (!conv.name && r.customer_name) conv.name = r.customer_name;
      conv.messages.push(r);
    }
    for (const c of map.values()) c.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    return Array.from(map.values()).sort((a, b) => {
      const al = a.messages[a.messages.length - 1]?.created_date || '';
      const bl = b.messages[b.messages.length - 1]?.created_date || '';
      return new Date(bl) - new Date(al);
    });
  }, [records]);

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter(c => c.phone.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q));
  }, [conversations, query]);

  const selected = conversations.find(c => c.phone === selectedPhone);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" /></div>;
  if (error) return <div className="glass-panel border border-red-400/20 rounded-sm p-6 text-red-400 text-sm font-mono-tech">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-grotesk font-bold text-vapor">Messages</h1>
        <span className="text-xs font-mono-tech text-vapor/40">{conversations.length} CONVERSATIONS</span>
      </div>

      <div className="glass-panel border border-vapor/10 rounded-sm overflow-hidden grid md:grid-cols-[300px_1fr] h-[70vh]">
        {/* Conversation list */}
        <div className={`border-r border-vapor/10 flex flex-col min-h-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-vapor/10">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vapor/30" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search phone or name"
                className="w-full bg-asphalt border border-vapor/10 focus:border-gold/40 outline-none text-vapor pl-9 pr-3 py-2 text-xs font-mono-tech rounded-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-vapor/40 font-mono-tech">
                {conversations.length === 0
                  ? 'No conversations yet. SMS threads with Valerie will appear here once Twilio and OpenAI are connected.'
                  : 'No matches.'}
              </div>
            ) : filtered.map(c => {
              const last = c.messages[c.messages.length - 1];
              const isSel = c.phone === selectedPhone;
              return (
                <button
                  key={c.phone}
                  onClick={() => setSelectedPhone(c.phone)}
                  className={`w-full text-left p-3 border-b border-vapor/5 transition-colors ${isSel ? 'bg-gold/10' : 'hover:bg-vapor/5'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-grotesk truncate ${isSel ? 'text-gold' : 'text-vapor'}`}>{c.name || 'Unknown'}</p>
                    <span className="text-[10px] font-mono-tech text-vapor/40 shrink-0 ml-2">{fmtTime(last?.created_date)}</span>
                  </div>
                  <p className="text-xs font-mono-tech text-vapor/40 truncate flex items-center gap-1.5"><Phone size={10} /> {c.phone}</p>
                  <p className="text-xs text-vapor/50 mt-1 truncate">{last?.role === 'user' ? '' : 'Valerie: '}{last?.content}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread */}
        <div className={`flex flex-col min-h-0 ${selected ? 'flex' : 'hidden md:flex'}`}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <MessageSquare size={28} className="text-vapor/20 mb-3" />
              <p className="text-sm text-vapor/40 font-mono-tech">Select a conversation to view the thread.</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-vapor/10 flex items-center gap-3">
                <button onClick={() => setSelectedPhone(null)} className="md:hidden text-vapor/50 hover:text-vapor"><ArrowLeft size={16} /></button>
                <UserCircle size={20} className="text-gold/60" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-grotesk font-bold text-vapor truncate">{selected.name || 'Unknown'}</p>
                  <p className="text-xs font-mono-tech text-vapor/40">{selected.phone}</p>
                </div>
                <span className="text-[10px] font-mono-tech text-vapor/40">{selected.messages.length} MSGS</span>
                {confirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setConfirmingDelete(false)} disabled={deleting} className="text-xs font-mono-tech text-vapor/50 hover:text-vapor px-2 py-1">CANCEL</button>
                    <button onClick={deleteConversation} disabled={deleting} className="text-xs font-mono-tech text-red-400 border border-red-400/40 bg-red-400/10 hover:bg-red-400/20 px-2 py-1 rounded-sm">CONFIRM DELETE</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmingDelete(true)} className="text-vapor/50 hover:text-red-400"><Trash2 size={16} /></button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-sm px-4 py-2.5 ${m.role === 'user' ? 'bg-asphalt border border-vapor/10' : 'bg-gold/10 border border-gold/20'}`}>
                      <p className={`text-[10px] font-mono-tech mb-1 ${m.role === 'user' ? 'text-vapor/40' : 'text-gold/60'}`}>{m.role === 'user' ? 'CUSTOMER' : 'VALERIE'}</p>
                      <p className="text-sm text-vapor whitespace-pre-wrap">{m.content}</p>
                      <p className="text-[10px] font-mono-tech text-vapor/30 mt-1 text-right">{fmtTime(m.created_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-vapor/10 p-3">
                {notice && <p className="text-[11px] font-mono-tech text-gold/70 mb-2">{notice}</p>}
                <div className="flex items-center gap-2">
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder="Reply to customer..."
                    className="flex-1 bg-asphalt border border-vapor/10 focus:border-gold/40 outline-none text-vapor px-3 py-2.5 text-sm font-mono-tech rounded-sm"
                  />
                  <button onClick={sendReply} disabled={sending || !reply.trim()} className="flex items-center gap-2 bg-gold hover:bg-gold-light text-obsidian px-4 py-2.5 text-xs font-mono-tech tracking-widest rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {sending ? <div className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /> : <><span>SEND</span><Send size={13} /></>}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}