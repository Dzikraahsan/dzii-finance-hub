import { mockTransactions, mockCategories, chartData7Days } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/format';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo, useState } from 'react';

export default function Analytics() {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    mockTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return Object.entries(map).map(([catId, total]) => {
      const cat = mockCategories.find(c => c.id === catId);
      return { name: cat?.name || 'Other', value: total, color: cat?.color || '#666', icon: cat?.icon || '❓' };
    }).sort((a, b) => b.value - a.value);
  }, []);

  const totalIncome = mockTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = mockTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-foreground">Analytics</h1>

      {/* Period Toggle */}
      <div className="flex gap-2">
        {(['7d', '30d', 'all'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === p ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'
            }`}
          >
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="stat-number text-success">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-xs text-muted-foreground">Expense</p>
          <p className="stat-number text-destructive">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-xs text-muted-foreground">Net</p>
          <p className={`stat-number ${totalIncome - totalExpense >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-card-foreground mb-3">Expense by Category</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={expenseByCategory} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
              {expenseByCategory.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {expenseByCategory.map(e => (
            <div key={e.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
              <span className="text-xs text-muted-foreground">{e.icon} {e.name}</span>
              <span className="text-xs font-medium text-card-foreground ml-auto">{formatCurrency(e.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-card-foreground mb-3">Spending Trend</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData7Days}>
            <defs>
              <linearGradient id="aExpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0,84%,60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => new Date(d).getDate().toString()} stroke="hsl(215,15%,55%)" />
            <YAxis hide />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(224,14%,12%)', border: 'none', borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="expense" stroke="hsl(0,84%,60%)" fill="url(#aExpGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
