import { useRef } from 'react';
import { addDays, formatDate } from '../../utils/dateHelpers';
import '../../styles/simulator.css';

interface DateControlProps {
  date: Date;
  onChange: (date: Date) => void;
}

export default function DateControl({ date, onChange }: DateControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const toInputValue = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const fromInputValue = (s: string) => {
    if (!s) return date;
    const [year, month, day] = s.split('-').map(Number);
    const d = new Date(date);
    d.setFullYear(year, month - 1, day);
    return d;
  };

  return (
    <div className="date-control">
      <button className="date-nav-btn" onClick={() => onChange(addDays(date, -1))} title="Previous day">
        ←
      </button>

      <div className="date-display-wrap">
        <div
          className="date-display"
          onClick={() => inputRef.current?.showPicker()}
          title="Click to pick date"
        >
          📅 {formatDate(date)}
        </div>
        <input
          ref={inputRef}
          type="date"
          className="date-input-hidden"
          value={toInputValue(date)}
          onChange={(e) => onChange(fromInputValue(e.target.value))}
        />
      </div>

      <button className="date-nav-btn" onClick={() => onChange(addDays(date, 1))} title="Next day">
        →
      </button>
    </div>
  );
}
