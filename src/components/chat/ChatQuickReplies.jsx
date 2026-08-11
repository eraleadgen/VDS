export default function ChatQuickReplies({ replies, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {replies.map((reply, i) => (
        <button
          key={i}
          onClick={() => onSelect(reply)}
          className="text-xs font-mono-tech text-gold/80 border border-gold/20 rounded-full px-3 py-1.5 hover:bg-gold/10 hover:border-gold/40 transition-colors"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}