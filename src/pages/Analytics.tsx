import { useTransactions, useCategories } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/format';
import { formatRupiah, summarize, generateInsights } from '@/lib/financeEngine';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useMemo, useState } from 'react';
import InsightCards from '@/components/InsightCards';

export default function Analytics() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

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

  const { income: totalIncome, expense: totalExpense } = useMemo(() => summarize(filtered as any), [filtered]);

  // Income vs Expense bar chart data
  const barData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 7;
    const result: Record<string, { income: number; expense: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      result[d.toISOString().split('T')[0]] = { income: 0, expense: 0 };
    }
    filtered.forEach(t => {
      const key = t.date.slice(0, 10);
      if (result[key]) {
        if (t.type === 'income') result[key].income += Number(t.amount);
        else if (t.type === 'expense') result[key].expense += Number(t.amount);
      }
    });
    return Object.entries(result).map(([date, vals]) => ({ date, ...vals }));
  }, [filtered, period]);

  // Spending trend area chart
  const chartData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 7;
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

  const insights = useMemo(() => generateInsights(transactions as any, categories as any), [transactions, categories]);

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in pb-4">
      <h1 className="text-xl font-bold text-foreground">Analytics</h1>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', 'all'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${period === p ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'}`}>
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="bg-card border border-primary rounded-lg p-3 text-center animate-card-enter stagger-1">
          <p className="text-[10px] sm:text-xs text-muted-foreground">Income</p>
          <p className="text-sm sm:text-base font-bold text-[hsl(var(--accent-text))] animate-number">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-card border border-destructive/40 rounded-lg p-3 text-center animate-card-enter stagger-2">
          <p className="text-[10px] sm:text-xs text-muted-foreground">Expense</p>
          <p className="text-sm sm:text-base font-bold text-destructive dark:!text-red-400 animate-number">{formatRupiah(totalExpense)}</p>
        </div>
        <div className="bg-card border border-[hsl(var(--success))] rounded-lg p-3 text-center animate-card-enter stagger-3">
          <p className="text-[10px] sm:text-xs text-muted-foreground">Net</p>
          <p className={`text-sm sm:text-base font-bold animate-number ${totalIncome - totalExpense >= 0 ? 'text-[hsl(var(--accent-text))]' : 'text-destructive dark:!text-red-400'}`}>
            {formatRupiah(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="animate-card-enter stagger-3">
        <InsightCards insights={insights} />
      </div>

      {/* Income vs Expense Bar Chart */}
      <div className="bg-card border border-border rounded-2xl p-4 animate-card-enter stagger-4">
        <p className="text-sm font-semibold text-card-foreground mb-3">Income vs Expense</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,25%)" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d: string) => new Date(d).getDate().toString()} stroke="hsl(215,15%,55%)" interval="preserveStartEnd" />
            <YAxis hide />
            <Tooltip
              formatter={(value: any, name: string) => [formatRupiah(value), name === 'income' ? 'Income' : 'Expense']}
              labelFormatter={(label: string) => { const d = new Date(label); return `${d.getDate()}/${d.getMonth() + 1}`; }}
              contentStyle={{ backgroundColor: 'hsl(224,14%,12%)', border: 'none', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: 'hsl(210 90% 85%)' }}
            />
            <Bar dataKey="income" fill="hsl(142,76%,36%)" radius={[4, 4, 0, 0]} maxBarSize={12} />
            <Bar dataKey="expense" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} maxBarSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense by Category */}
      {expenseByCategory.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-4 animate-card-enter stagger-5">
          <p className="text-sm font-semibold text-card-foreground mb-3">Expense by Category</p>
          <div className="outline-none focus:outline-none active:outline-none">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0} isAnimationActive={false}>
                  {expenseByCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {expenseByCategory.map(e => (
              <div key={e.name} className="flex items-center gap-2 min-w-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                <span className="text-xs text-[hsl(var(--accent-text))] truncate">{e.icon} {e.name}</span>
                <span className="text-xs font-medium text-card-foreground ml-auto shrink-0">{formatCurrency(e.value)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-8 text-center animate-card-enter">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-sm font-medium text-card-foreground mb-1">No expense data</p>
          <p className="text-xs text-muted-foreground">Start adding transactions to see your spending breakdown.</p>
        </div>
      )}

      {/* Spending Trend */}
      <div className="bg-card border border-border rounded-2xl p-4 animate-card-enter stagger-6">
        <p className="text-sm font-semibold text-card-foreground mb-3">Spending Trend</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="aExpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0,84%,60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d: string) => new Date(d).getDate().toString()} stroke="hsl(215,15%,55%)" interval="preserveStartEnd" />
            <YAxis hide />
            <Tooltip
              formatter={(value: any) => [formatRupiah(value), 'Expense']}
              labelFormatter={(label: string) => { const d = new Date(label); return `${d.getDate()}/${d.getMonth() + 1}`; }}
              contentStyle={{ backgroundColor: 'hsl(224,14%,12%)', border: 'none', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: 'hsl(210 90% 85%)' }}
            />
            <Area type="monotone" dataKey="expense" stroke="hsl(0,84%,60%)" fill="url(#aExpGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
