import { useWallets, useTransactions, useCategories, useDeleteTransaction, useBudgets } from '@/hooks/useFinanceData';
import { formatCurrency, formatDate } from '@/lib/format';
import { generateInsights, formatRupiah, summarize, getTodayISO } from '@/lib/financeEngine';
import { TrendingUp, TrendingDown, ArrowRight, EyeOff, Eye, Target } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSheet from '@/components/ProfileSheet';
import TransactionItem from '@/components/TransactionItem';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import InsightCards from '@/components/InsightCards';
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{getGreeting()}</p>
          <h1 className="text-xl font-bold text-foreground">Dzii Finance</h1>
        </div>
        <button onClick={() => setShowProfile(true)} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm active:scale-95 transition-transform">D</button>
      </div>

      {/* Balance Card */}
      <div className="relative rounded-2xl gradient-primary p-5 glow-primary overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute right-10 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-primary-foreground/70 text-xs font-medium">Total Balance</p>
            <button onClick={() => setShowBalance(!showBalance)} className="text-primary-foreground transition-all duration-200 active:scale-90 hover:scale-110">
              <span className="transition-all duration-300 ease-in-out inline-block">
                {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </button>
          </div>

          <p className="text-2xl sm:text-2xl font-bold text-primary-foreground tracking-tight mb-4">
            <span key={showBalance ? "show" : "hide"} className="inline-block animate-[fadeScale_0.25s_ease]">
              {showBalance ? formatRupiah(totalBalance) : "****"}
            </span>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-primary-foreground/60">Income</p>
                <p className="text-xs font-semibold text-primary-foreground">
                  <span key={showBalance ? "inc-show" : "inc-hide"} className="inline-block animate-[fadeScale_0.25s_ease]">
                    {showBalance ? formatRupiah(totalIncome) : "****"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-primary-foreground/60">Expense</p>
                <p className="text-xs font-semibold text-primary-foreground">
                  <span key={showBalance ? "exp-show" : "exp-hide"} className="inline-block animate-[fadeScale_0.25s_ease]">
                    {showBalance ? formatRupiah(totalExpense) : "****"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-4 text-[10px] text-primary-foreground/60">
            <span>Cash Flow</span>
            <span className="font-medium text-primary-foreground">
              {showBalance ? formatRupiah(totalIncome - totalExpense) : "****"}
            </span>
          </div>
        </div>
      </div>

      {/* Today Summary */}
      <div className="rounded-2xl bg-card border border-border p-4 animate-card-enter stagger-1">
        <p className="text-sm font-semibold text-card-foreground mb-2">Today</p>
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-muted-foreground">Income</p>
            <p className="text-xs font-semibold text-[hsl(var(--accent-text))]">{formatRupiah(todaySummary.income)}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-muted-foreground">Expense</p>
            <p className="text-xs font-semibold text-destructive dark:!text-red-400">{formatRupiah(todaySummary.expense)}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-muted-foreground">Net</p>
            <p className={`text-xs font-semibold ${todaySummary.net >= 0 ? 'text-[hsl(var(--accent-text))]' : 'text-destructive dark:!text-red-400'}`}>{formatRupiah(todaySummary.net)}</p>
          </div>
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
      <div className="rounded-2xl bg-card border border-border p-4 animate-card-enter stagger-3">
        <p className="text-sm font-semibold text-card-foreground mb-3">Last 7 Days</p>
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
          <p className="text-sm font-semibold text-foreground">Recent Transactions</p>
          <button onClick={() => navigate('/transactions')} className="text-xs text-primary dark:!text-[hsl(var(--accent-text))] flex items-center gap-1">
            See all <ArrowRight className="w-3 h-3 dark:!text-[hsl(var(--accent-text))]" />
          </button>
        </div>

        {recentTxns.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center animate-card-enter">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-sm font-medium text-card-foreground mb-1">No transactions yet</p>
            <p className="text-xs text-muted-foreground">Tap the + button to add your first transaction!</p>
          </div>
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
