import { useMemo } from 'react';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  [key: string]: any;
}

interface WeekData {
  weekLabel: string;
  startDate: string;
  endDate: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

interface Props {
  transactions: Transaction[];
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
  onDateSelect: (date: string) => void;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TransactionWeeklyView({ transactions, currentMonth, onMonthChange, onDateSelect }: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const weeks = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthTxns = transactions.filter(t => t.date.startsWith(prefix));

    const weekMap: Record<string, WeekData> = {};

    monthTxns.forEach(t => {
      const d = new Date(t.date + 'T00:00:00');
      const mon = getMonday(d);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const key = mon.toISOString().slice(0, 10);

      if (!weekMap[key]) {
        weekMap[key] = {
          weekLabel: `${formatShortDate(key)} – ${formatShortDate(sun.toISOString().slice(0, 10))}`,
          startDate: key,
          endDate: sun.toISOString().slice(0, 10),
          income: 0,
          expense: 0,
          net: 0,
          count: 0,
        };
      }
      if (t.type === 'income') weekMap[key].income += Number(t.amount);
      else if (t.type === 'expense') weekMap[key].expense += Number(t.amount);
      weekMap[key].count++;
    });

    return Object.values(weekMap)
      .map(w => ({ ...w, net: w.income - w.expense }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [transactions, year, month]);

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg bg-card border border-border btn-press">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">{monthLabel}</h2>
        <button onClick={nextMonth} className="p-2 rounded-lg bg-card border border-border btn-press">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {weeks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No transactions this month</p>
      ) : (
        <div className="space-y-3">
          {weeks.map((w, i) => (
            <button
              key={w.startDate}
              onClick={() => onDateSelect(w.startDate)}
              className={`w-full p-4 rounded-xl bg-card border border-border text-left card-interactive animate-list-item stagger-${Math.min(i + 1, 10)}`}
            >
              <p className="text-xs font-semibold text-foreground mb-2">{w.weekLabel}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {w.income > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--success))]">
                      <TrendingUp className="w-3 h-3" /> {formatCurrency(w.income)}
                    </span>
                  )}
                  {w.expense > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-destructive">
                      <TrendingDown className="w-3 h-3" /> {formatCurrency(w.expense)}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${w.net >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                  Net: {formatCurrency(w.net)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{w.count} transaction{w.count !== 1 ? 's' : ''}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
