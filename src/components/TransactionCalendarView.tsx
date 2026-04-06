import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  [key: string]: any;
}

interface Props {
  transactions: Transaction[];
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

export default function TransactionCalendarView({ transactions, currentMonth, onMonthChange, onDateSelect, selectedDate }: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const dailyTotals = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    transactions.forEach(t => {
      const key = t.date.slice(0, 10);
      if (!map[key]) map[key] = { income: 0, expense: 0, count: 0 };
      if (t.type === 'income') map[key].income += Number(t.amount);
      else if (t.type === 'expense') map[key].expense += Number(t.amount);
      map[key].count++;
    });
    return map;
  }, [transactions]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month]);

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="animate-fade-in">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg bg-card border border-border btn-press">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">{monthLabel}</h2>
        <button onClick={nextMonth} className="p-2 rounded-lg bg-card border border-border btn-press">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;

          const dateStr = getDateStr(day);
          const data = dailyTotals[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasExpense = data && data.expense > 0;
          const hasIncome = data && data.income > 0;

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs transition-all duration-150 btn-press relative
                ${isSelected ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : ''}
                ${isToday && !isSelected ? 'bg-accent/30 text-muted-foreground font-semibold' : ''}
                ${!isToday && !isSelected ? 'hover:bg-muted/50 text-foreground' : ''}
              `}
            >
              <span className={`text-[11px] ${isSelected ? 'font-bold' : ''}`}>{day}</span>
              {data && (
                <div className="flex gap-0.5">
                  {hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                  {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Monthly totals */}
      {(() => {
        const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        let mIncome = 0, mExpense = 0;
        Object.entries(dailyTotals).forEach(([k, v]) => {
          if (k.startsWith(prefix)) { mIncome += v.income; mExpense += v.expense; }
        });
        if (mIncome === 0 && mExpense === 0) return null;
        return (
            <div className="mt-4 p-3 rounded-xl bg-card border border-border flex flex-col">
                <div className="flex items-center justify-between text-[10px] sm:text-xs lg:text-xs pb-2">
                    <span className="text-muted-foreground">Income</span>
                    <span className="text-[hsl(var(--success))] font-medium">
                    {formatCurrency(mIncome)}
                    </span>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-2" />

                <div className="flex items-center justify-between text-[10px] sm:text-xs lg:text-xs pb-2">
                    <span className="text-muted-foreground">Expense</span>
                    <span className="text-destructive font-medium">
                    {formatCurrency(mExpense)}
                    </span>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-2" />

                <div className="flex items-center justify-between text-[10px] sm:text-xs lg:text-xs">
                    <span className="text-muted-foreground">Net</span>
                    <span
                    className={`font-medium ${
                        mIncome - mExpense >= 0
                        ? "text-[hsl(var(--success))]"
                        : "text-destructive"
                    }`}
                    >
                    {formatCurrency(mIncome - mExpense)}
                    </span>
                </div>
            </div>
        );
      })()}
    </div>
  );
}
