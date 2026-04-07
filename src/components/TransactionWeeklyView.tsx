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

// 🔥 FIX: normalize semua date ke local (ANTI TIMEZONE BUG)
function toLocalDate(dateStr: string): Date {
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getMonday(d: Date): Date {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = local.getDay();
  const diff = local.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(local.getFullYear(), local.getMonth(), diff);
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TransactionWeeklyView({ transactions, currentMonth, onMonthChange, onDateSelect }: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const weeks = useMemo(() => {
    // ✅ FILTER BULAN (PAKAI LOCAL DATE)
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    // ambil semua transaksi yang masuk range minggu yang nyentuh bulan ini
    const monthTxns = transactions.filter(t => {
      const d = toLocalDate(t.date);
      return d >= new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() - 7)
        && d <= new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + 7);
    });

    const weekMap: Record<string, WeekData> = {};

    monthTxns.forEach(t => {
      const d = toLocalDate(t.date); // 🔥 FIX UTAMA

      const mon = getMonday(d);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);

      // 🔥 NO ISO — pakai local string
      const monKey = `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
      const sunKey = `${sun.getFullYear()}-${String(sun.getMonth() + 1).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')}`;

      if (!weekMap[monKey]) {
        weekMap[monKey] = {
          weekLabel: `${formatShortDate(monKey)} – ${formatShortDate(sunKey)}`,
          startDate: monKey,
          endDate: sunKey,
          income: 0,
          expense: 0,
          net: 0,
          count: 0,
        };
      }

      if (t.type === 'income') weekMap[monKey].income += Number(t.amount);
      else if (t.type === 'expense') weekMap[monKey].expense += Number(t.amount);

      weekMap[monKey].count++;
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
              onClick={() => onDateSelect(w.startDate)} // ✅ TIDAK DIUBAH
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
              <p className="text-[10px] text-muted-foreground mt-1">
                {w.count} transaction{w.count !== 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}