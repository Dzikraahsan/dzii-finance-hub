import { mockWallets, mockTransactions, mockCategories, mockInsights, chartData7Days } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/format';
import { TrendingUp, TrendingDown, ArrowRight, Sparkles } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function Dashboard() {
  const totalBalance = mockWallets.reduce((s, w) => s + w.balance, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTxns = mockTransactions.filter(t => t.date.startsWith(thisMonth));
  const totalIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const recentTxns = mockTransactions.slice(0, 5);
  const insight = mockInsights[0];

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Good morning 👋</p>
          <h1 className="text-xl font-bold text-foreground">Dzii Finance</h1>
        </div>
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          D
        </div>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl gradient-primary p-5 glow-primary">
        <p className="text-primary-foreground/70 text-xs font-medium mb-1">Total Balance</p>
        <p className="text-3xl font-bold text-primary-foreground tracking-tight">{formatCurrency(totalBalance)}</p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-primary-foreground/60">Income</p>
              <p className="text-xs font-semibold text-primary-foreground">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-primary-foreground/60">Expense</p>
              <p className="text-xs font-semibold text-primary-foreground">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-sm font-semibold text-card-foreground mb-3">Last 7 Days</p>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData7Days}>
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142,76%,36%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(142,76%,36%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0,84%,60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(224,14%,12%)', border: 'none', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: 'hsl(215,15%,55%)' }}
            />
            <Area type="monotone" dataKey="income" stroke="hsl(142,76%,36%)" fill="url(#incGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="expense" stroke="hsl(0,84%,60%)" fill="url(#expGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insight */}
      {insight && (
        <div className="rounded-2xl bg-card border border-accent/20 p-4 flex gap-3 items-start glow-accent">
          <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-accent mb-1">AI Insight</p>
            <p className="text-sm text-card-foreground/80 leading-relaxed">{insight.message}</p>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Recent Transactions</p>
          <button className="text-xs text-primary flex items-center gap-1">
            See all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {recentTxns.map(txn => {
            const cat = mockCategories.find(c => c.id === txn.categoryId);
            const wallet = mockWallets.find(w => w.id === txn.walletId);
            return (
              <div key={txn.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: (cat?.color || '#666') + '20' }}>
                  {cat?.icon || '❓'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{cat?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{wallet?.name} · {formatDate(txn.date)}</p>
                </div>
                <p className={`text-sm font-semibold ${txn.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                  {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
