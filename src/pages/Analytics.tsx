import { useTransactions, useCategories } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/format';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo, useState } from 'react';

export default function Analytics() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  const filtered = useMemo(() => {
    if (period === 'all') return transactions;
    const days = period === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, period]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense').forEach(t => {
      map[t.category_id || ''] = (map[t.category_id || ''] || 0) + Number(t.amount);
    });
    return Object.entries(map).map(([catId, total]) => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat?.name || 'Other', value: total, color: cat?.color || '#666', icon: cat?.icon || '❓' };
    }).sort((a, b) => b.value - a.value);
  }, [filtered, categories]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const chartData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 30;
    const result: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      result[d.toISOString().split('T')[0]] = 0;
    }
    filtered.filter(t => t.type === 'expense').forEach(t => {
      if (result[t.date] !== undefined) result[t.date] += Number(t.amount);
    });
    return Object.entries(result).map(([date, expense]) => ({ date, expense }));
  }, [filtered, period]);

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground">Analytics</h1>
      <div className="flex gap-2">
        {(['7d', '30d', 'all'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${period === p ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All'}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {/* Income */}
        <div className="bg-card border border-border border-blue-400 rounded-2xl p-4 flex flex-col items-center justify-center">
          <p className="text-[11px] sm:text-xs text-muted-foreground">Income</p>
          <p className="font-bold text-blue-400 text-center tracking-tight leading-tight text-[clamp(12px,4vw,20px)] break-words">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Expense */}
        <div className="bg-card border border-border border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center">
          <p className="text-[11px] sm:text-xs text-muted-foreground">Expense</p>
          <p className="font-bold text-red-400 text-center tracking-tight leading-tight text-[clamp(12px,4vw,20px)] break-words">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        {/* Net */}
        <div className="bg-card border border-border border-green-400 rounded-2xl p-4 flex flex-col items-center justify-center">
          <p className="text-[11px] sm:text-xs text-muted-foreground">Net</p>
          <p
            className={`font-bold text-center tracking-tight leading-tight text-[clamp(12px,4vw,20px)] break-words ${
              totalIncome - totalExpense >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {expenseByCategory.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold text-card-foreground mb-3">
            Expense by Category
          </p>

          <div className="pointer-events-none select-none">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  stroke="none"
                  isAnimationActive={false}
                  activeIndex={-1}
                >
                  {expenseByCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            {expenseByCategory.map((e) => (
              <div key={e.name} className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: e.color }}
                />
                <span className="text-xs text-muted-foreground truncate">
                  {e.icon} {e.name}
                </span>
                <span className="text-xs font-medium text-card-foreground ml-auto shrink-0">
                  {formatCurrency(e.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">No expense data to display</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-card-foreground mb-3">Spending Trend</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="aExpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0,84%,60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => new Date(d).getDate().toString()} stroke="hsl(215,15%,55%)" interval="preserveStartEnd" />
            <YAxis hide />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(224,14%,12%)', border: 'none', borderRadius: 12, fontSize: 11 }} />
            <Area type="monotone" dataKey="expense" stroke="hsl(0,84%,60%)" fill="url(#aExpGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
