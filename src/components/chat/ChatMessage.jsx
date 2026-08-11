export default function ChatMessage({ role, content, children }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'bg-gold/15 border-gold/20' : 'bg-asphalt/60 border-vapor/10'} border rounded-lg px-3 py-2`}>
        <p className="text-sm text-vapor whitespace-pre-wrap leading-relaxed">{content}</p>
        {children}
      </div>
    </div>
  );
}