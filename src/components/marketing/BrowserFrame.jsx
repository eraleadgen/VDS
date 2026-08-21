// Consistent "device" treatment for every product capture on the page:
// a real browser-chrome frame, not a floating-card mockup.
export default function BrowserFrame({ url = 'app.eracore.com/admin', children, className = '' }) {
  return (
    <div className={`rounded-[10px] overflow-hidden bg-white ring-1 ring-[#DCE1E5] shadow-[0_28px_70px_-24px_rgba(12,27,26,0.28)] ${className}`}>
      <div className="h-9 bg-[#EDF0F1] border-b border-[#DCE1E5] flex items-center gap-2 px-3">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E0453B]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#F0A93B]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#3CB878]" />
        <div className="ml-3 flex-1 max-w-[300px] h-5 rounded-[4px] bg-white border border-[#DCE1E5] flex items-center px-2">
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#8A9499] truncate">{url}</span>
        </div>
      </div>
      <div className="bg-white overflow-hidden">{children}</div>
    </div>
  );
}