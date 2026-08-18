import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const STATUS_COLORS = {
  quote_requested: 'bg-slate-500/20 border-slate-400/40 text-slate-200',
  quote_generated: 'bg-slate-500/20 border-slate-400/40 text-slate-200',
  awaiting_approval: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
  appointment_scheduled: 'bg-blue-500/20 border-blue-400/40 text-blue-200',
  specialist_assigned: 'bg-blue-500/20 border-blue-400/40 text-blue-200',
  appointment_confirmed: 'bg-blue-500/20 border-blue-400/40 text-blue-200',
  technician_en_route: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200',
  in_progress: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200',
  awaiting_payment: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
  completed: 'bg-green-500/20 border-green-400/40 text-green-200',
  review_requested: 'bg-purple-500/20 border-purple-400/40 text-purple-200',
  rescheduled: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
  cancelled: 'bg-red-500/20 border-red-400/40 text-red-200',
  // No job linked — default VDS gold
  _default: 'bg-gold/15 border-gold/40 text-gold',
};

function eventColor(ev) {
  if (!ev.job) return STATUS_COLORS._default;
  return STATUS_COLORS[ev.job.status] || STATUS_COLORS._default;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function JobsCalendar({ events, selectedDate, onSelectDate, onSelectEvent, monthDate, onPrevMonth, onNextMonth, onToday, onNewJob, loading }) {
  // Build the 6-row x 7-col grid for the displayed month
  const grid = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    // Leading blanks from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    // Trailing blanks to fill 42 cells (6 rows)
    while (cells.length < 42) {
      const idx = cells.length - startOffset - daysInMonth + 1;
      cells.push({ date: new Date(year, month + 1, idx), isCurrentMonth: false });
    }
    return cells;
  }, [monthDate]);

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const d = new Date(ev.start);
      const key = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  const todayKey = new Date().toLocaleDateString('en-CA');
  const selectedKey = selectedDate ? selectedDate.toLocaleDateString('en-CA') : null;

  return (
    <div className="glass-panel border border-vapor/10 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-vapor/10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-grotesk font-bold text-vapor">
            {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={onToday} className="text-xs font-mono-tech tracking-widest text-gold/70 hover:text-gold border border-gold/20 hover:border-gold/40 px-2 py-1 rounded-sm transition-colors">
            TODAY
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onNewJob} className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold px-3 py-1.5 text-xs font-mono-tech tracking-widest rounded-sm hover:bg-gold/20 transition-colors">
            <Plus size={13} /> NEW JOB
          </button>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={onPrevMonth} className="p-1.5 text-vapor/50 hover:text-gold transition-colors rounded-sm">
              <ChevronLeft size={18} />
            </button>
            <button onClick={onNextMonth} className="p-1.5 text-vapor/50 hover:text-gold transition-colors rounded-sm">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-vapor/10">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center py-2 text-[10px] font-mono-tech tracking-widest text-vapor/40">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {grid.map((cell, i) => {
          const key = cell.date.toLocaleDateString('en-CA');
          const dayEvents = eventsByDate[key] || [];
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          return (
            <div
              key={i}
              onClick={() => onSelectDate(cell.date)}
              className={`min-h-[110px] border-r border-b border-vapor/5 p-1.5 cursor-pointer transition-colors ${
                isSelected ? 'bg-gold/[0.06]' : 'hover:bg-vapor/[0.02]'
              } ${!cell.isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-mono-tech ${
                  isToday ? 'bg-gold text-obsidian rounded-full w-5 h-5 flex items-center justify-center font-bold' : 'text-vapor/50'
                }`}>
                  {cell.date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[9px] font-mono-tech text-vapor/30">{dayEvents.length}</span>
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(ev => (
                  <button
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
                    className={`block w-full text-left text-[10px] font-mono-tech px-1.5 py-1 rounded-sm border truncate transition-colors hover:opacity-80 ${eventColor(ev)}`}
                    title={ev.summary}
                  >
                    <span className="opacity-60 mr-1">{formatTime(ev.start)}</span>
                    {ev.job ? ev.job.customer_name : ev.summary.replace(/^VDS\s*—\s*/, '').split('—')[0]?.trim()}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[9px] font-mono-tech text-vapor/40 pl-1.5">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}