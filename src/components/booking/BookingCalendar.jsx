import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, isToday, isSameDay } from 'date-fns';

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

export default function BookingCalendar({ calendarDate, setCalendarDate, selectedDay, onDayClick, bookedSlots, loadingSlots, selectedTime, onSelectTime, today, isConsultation }) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">SELECT DATE <span className="text-gold">*</span></p>
        <div className="glass-panel border border-vapor/10 rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <button type="button"
              onClick={() => setCalendarDate(d => subMonths(d, 1))}
              disabled={calendarDate.getFullYear() === today.getFullYear() && calendarDate.getMonth() === today.getMonth()}
              className="text-vapor/40 hover:text-vapor transition-colors p-1 disabled:opacity-20 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            <p className="text-vapor font-mono-tech text-sm tracking-widest">{format(calendarDate, 'MMMM yyyy').toUpperCase()}</p>
            <button type="button" onClick={() => setCalendarDate(d => addMonths(d, 1))} className="text-vapor/40 hover:text-vapor transition-colors p-1">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <p key={d} className="text-center text-vapor/25 font-mono-tech text-xs py-1">{d}</p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const isWeekend = getDay(day) === 0 || getDay(day) === 6;
              const isPast = isBefore(day, todayStart) || isToday(day) || isWeekend;
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              return (
                <button key={day.toString()} type="button" disabled={isPast} onClick={() => onDayClick(day)}
                  className={`mx-auto w-9 h-9 flex items-center justify-center rounded-sm font-mono-tech text-xs transition-colors ${
                    isSelected ? 'bg-gold text-obsidian font-bold'
                    : isPast ? 'text-vapor/15 cursor-not-allowed'
                    : 'text-vapor/60 hover:text-vapor hover:bg-vapor/5'
                  }`}>
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDay && (
        <div>
          <p className="text-xs font-mono-tech tracking-widest text-vapor/40 mb-3">
            {isConsultation ? 'SELECT CONSULTATION TIME' : 'SELECT TIME'} — {format(selectedDay, 'EEEE, MMMM d').toUpperCase()} <span className="text-gold">*</span>
          </p>
          {loadingSlots ? (
            <div className="flex items-center gap-2 text-vapor/40 font-mono-tech text-xs py-4">
              <Loader2 size={13} className="animate-spin" /> CHECKING AVAILABILITY...
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map(slot => {
                const isBooked = bookedSlots.some(b => b.toLowerCase().replace(/\s/g, '') === slot.toLowerCase().replace(/\s/g, ''));
                return (
                  <button key={slot} type="button" disabled={isBooked}
                    onClick={() => !isBooked && onSelectTime(slot)}
                    className={`py-3 border rounded-sm font-mono-tech text-xs tracking-widest transition-colors ${
                      isBooked ? 'border-vapor/5 text-vapor/20 cursor-not-allowed line-through'
                      : selectedTime === slot ? 'border-gold bg-gold/10 text-gold'
                      : 'border-vapor/10 text-vapor/50 hover:border-vapor/30 hover:text-vapor'
                    }`}>
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}