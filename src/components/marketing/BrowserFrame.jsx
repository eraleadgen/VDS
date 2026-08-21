// Dark browser-chrome frame for product captures on the emerald marketing site.
export default function BrowserFrame({ url = 'app.eracore.com/admin', children, className = '' }) {
  return (
    <div className={`rounded-[10px] overflow-hidden bg-[#0A1210] ring-1 ring-[#1A2A24] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_60px_-30px_rgba(16,185,129,0.15)] ${className}`}>
      <div className="h-9 bg-[#0C1614] border-b border-[#1A2A24] flex items-center gap-2 px-3">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E0453B]/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#F0A93B]/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/80" />
        <div className="ml-3 flex-1 max-w-[300px] h-5 rounded-[4px] bg-[#060A09] border border-[#1A2A24] flex items-center px-2">
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#6B8A82] truncate">{url}</span>
        </div>
      </div>
      <div className="bg-[#060A09] overflow-hidden">{children}</div>
    </div>
  );
}