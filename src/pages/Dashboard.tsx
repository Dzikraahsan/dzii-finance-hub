import { useWallets, useTransactions, useCategories, useDeleteTransaction, useBudgets } from '@/hooks/useFinanceData';
import { formatCurrency, formatDate } from '@/lib/format';
import { generateInsights, formatRupiah, summarize, getTodayISO } from '@/lib/financeEngine';
import { TrendingUp, TrendingDown, ArrowRight, EyeOff, Eye, Target, Wallet, Sparkles } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSheet from '@/components/ProfileSheet';
import TransactionItem from '@/components/TransactionItem';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import InsightCards from '@/components/InsightCards';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Dashboard() {
  const { data: wallets = [] } = useWallets();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets();
  const deleteTxn = useDeleteTransaction();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [editTxn, setEditTxn] = useState<any>(null);
  const [deletingTxn, setDeletingTxn] = useState<any>(null);

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTxns = transactions.filter(t => t.date.startsWith(thisMonth));
  const totalIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const recentTxns = transactions.slice(0, 5);

  const todayStr = getTodayISO();
  const todayTxns = transactions.filter(t => t.date === todayStr);
  const todaySummary = useMemo(() => summarize(todayTxns), [todayTxns]);

  const [showBalance, setShowBalance] = useState(() => {
    const saved = localStorage.getItem("showBalance");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("showBalance", JSON.stringify(showBalance));
  }, [showBalance]);

  const getGreeting = () => {
    const now = new Date();
    const wibHour = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })).getHours();
    if (wibHour >= 1 && wibHour <= 10) return "Good morning 👋";
    if (wibHour >= 11 && wibHour <= 14) return "Good afternoon ☀️";
    if (wibHour >= 15 && wibHour <= 18) return "Good evening 🌇";
    return "Good night 🌙";
  };

  const chartData = useMemo(() => {
    const days: Record<string, { income: number; expense: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toISOString().split('T')[0]] = { income: 0, expense: 0 };
    }
    transactions.forEach(t => {
      if (days[t.date]) {
        if (t.type === 'income') days[t.date].income += Number(t.amount);
        else if (t.type === 'expense') days[t.date].expense += Number(t.amount);
      }
    });
    return Object.entries(days).map(([date, vals]) => ({ date, ...vals }));
  }, [transactions]);

  // Smart insights from finance engine
  const insights = useMemo(
    () => generateInsights(transactions as any, categories as any),
    [transactions, categories]
  );

  // Budget alerts
  const budgetAlerts = useMemo(() => {
    return budgets.map(budget => {
      const used = monthTxns
        .filter(t => t.type === 'expense' && t.category_id === budget.category_id)
        .reduce((s, t) => s + Number(t.amount), 0);
      const pct = Math.round((used / Number(budget.amount)) * 100);
      const cat = categories.find(c => c.id === budget.category_id);
      return { ...budget, used, pct, cat };
    }).filter(b => b.pct >= 80);
  }, [budgets, monthTxns, categories]);

  const handleDeleteConfirm = async () => {
    if (!deletingTxn) return;
    try {
      await deleteTxn.mutateAsync(deletingTxn);
      toast.success('Transaction deleted');
    } catch { toast.error('Failed to delete'); }
    setDeletingTxn(null);
  };

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in pb-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-caption text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-h3 text-foreground truncate">Dzii Finance</h1>
        </div>
        <button
          onClick={() => setShowProfile(true)}
          aria-label="Open profile"
          className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md btn-press"
        >
          {user?.email?.[0]?.toUpperCase?.() ?? 'D'}
        </button>
      </div>

      {/* Balance hero */}
      <section
        aria-label="Total balance"
        className="relative rounded-2xl gradient-primary p-5 glow-primary overflow-hidden text-primary-foreground"
      >
        <div className="absolute -right-12 -top-12 w-44 h-44 bg-white/10 rounded-full blur-3xl" aria-hidden />
        <div className="absolute right-10 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" aria-hidden />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 opacity-70" />
              <p className="text-caption font-medium opacity-80">Total Balance</p>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center btn-press"
            >
              {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <p className="text-3xl font-bold tracking-tight mb-4 font-display">
            <span key={showBalance ? 'show' : 'hide'} className="inline-block animate-[fadeScale_0.25s_ease]">
              {showBalance ? formatRupiah(totalBalance) : '••••••••'}
            </span>
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] opacity-70">Income</p>
                <p className="text-xs font-semibold truncate">
                  {showBalance ? formatRupiah(totalIncome) : '••••'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] opacity-70">Expense</p>
                <p className="text-xs font-semibold truncate">
                  {showBalance ? formatRupiah(totalExpense) : '••••'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-[10px] opacity-80">
            <span>Net cash flow this month</span>
            <span className="font-semibold">
              {showBalance ? formatRupiah(totalIncome - totalExpense) : '••••'}
            </span>
          </div>
        </div>
      </section>

      {/* Today */}
      <div className="surface-card p-4 animate-card-enter stagger-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-h4 text-foreground">Today</p>
          <span className="text-caption text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Income" value={formatRupiah(todaySummary.income)} tone="success" />
          <MiniStat label="Expense" value={formatRupiah(todaySummary.expense)} tone="danger" />
          <MiniStat
            label="Net"
            value={formatRupiah(todaySummary.net)}
            tone={todaySummary.net >= 0 ? 'success' : 'danger'}
          />
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2 animate-card-enter stagger-2">
          {budgetAlerts.map(b => (
            <button
              key={b.id}
              onClick={() => navigate('/budget')}
              className={`w-full rounded-xl border p-3 flex items-center gap-3 text-left transition-all active:scale-[0.98] ${
                b.pct >= 100
                  ? 'border-red-400/30 bg-red-400/5'
                  : 'border-yellow-400/30 bg-yellow-400/5'
              }`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 bg-red-400/10">
                {b.cat?.icon || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-card-foreground truncate">
                  {b.cat?.name}: {b.pct}% used
                </p>
                <p className="text-[10px] text-foreground/90">
                  {formatRupiah(b.used)} of {formatRupiah(Number(b.amount))}
                </p>
              </div>
              <Target className={`w-4 h-4 shrink-0 ${b.pct >= 100 ? 'text-destructive dark:!text-red-400' : 'text-warning'}`} />
            </button>
          ))}
        </div>
      )}

      {/* Insights */}
      <div className="animate-card-enter stagger-2">
        <InsightCards insights={insights} />
      </div>

      {/* Chart */}
      <div className="surface-card p-4 animate-card-enter stagger-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-h4 text-foreground">Last 7 Days</p>
          <span className="text-caption text-muted-foreground">Income vs Expense</span>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData}>
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
              formatter={(value: any, name: string) => [
                `${formatRupiah(value)}`,
                name === "income" ? "Income" : "Expense"
              ]}
              labelFormatter={(label: string) => {
                const d = new Date(label);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
              contentStyle={{
                backgroundColor: 'hsl(224,14%,12%)',
                border: 'none',
                borderRadius: 12,
                fontSize: 12
              }}
              labelStyle={{ color: 'hsl(210 90% 85%)' }}
            />
            <Area type="monotone" dataKey="income" stroke="hsl(142,76%,36%)" fill="url(#incGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="expense" stroke="hsl(0,84%,60%)" fill="url(#expGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-h4 text-foreground">Recent Transactions</p>
          <button onClick={() => navigate('/transactions')} className="text-caption text-primary font-semibold flex items-center gap-1 hover:underline">
            See all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentTxns.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-6 h-6" />}
            title="No transactions yet"
            description="Tap the + button below to log your first income or expense."
          />
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {recentTxns.map((txn, i) => {
              const cat = categories.find(c => c.id === txn.category_id);
              const wallet = wallets.find(w => w.id === txn.wallet_id);
              return (
                <div key={txn.id} className={`animate-list-item stagger-${Math.min(i + 1, 10)}`}>
                  <TransactionItem txn={txn as any} category={cat as any} wallet={wallet as any} onEdit={setEditTxn} onDelete={setDeletingTxn} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProfileSheet open={showProfile} onOpenChange={setShowProfile} />
      <EditTransactionSheet open={!!editTxn} onOpenChange={v => { if (!v) setEditTxn(null); }} transaction={editTxn} />
      <AlertDialog open={!!deletingTxn} onOpenChange={v => { if (!v) setDeletingTxn(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this transaction and reverse the wallet balance changes.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
