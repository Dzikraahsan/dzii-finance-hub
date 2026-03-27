import { useWallets, useTransactions, useCategories, useDeleteTransaction } from '@/hooks/useFinanceData';
import { formatCurrency, formatDate } from '@/lib/format';
import { TrendingUp, TrendingDown, ArrowRight, Sparkles, EyeOff, Eye } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSheet from '@/components/ProfileSheet';
import TransactionItem from '@/components/TransactionItem';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Dashboard() {
  const { data: wallets = [] } = useWallets();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
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

  const [showBalance, setShowBalance] = useState(true);

  // Greetings
  const getGreeting = () => {
  const now = new Date();

  // ambil jam WIB (GMT+7)
  const wibHour = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  ).getHours();

  // 01:00 - 10:59 → morning
  if (wibHour >= 1 && wibHour <= 10) return "Good morning 👋";

  // 11:00 - 14:59 → afternoon
  if (wibHour >= 11 && wibHour <= 14) return "Good afternoon ☀️";

  // 15:00 - 18:59 → evening
  if (wibHour >= 15 && wibHour <= 18) return "Good evening 🌇";

  // 19:00 - 23:59 → night
  if (wibHour >= 19 && wibHour <= 23) return "Good night 🌙";

  // 00:00 → night
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

  const insight = useMemo(() => {
    if (monthTxns.length === 0) return null;
    const topCatId = monthTxns.filter(t => t.type === 'expense')
      .reduce((acc, t) => { acc[t.category_id || ''] = (acc[t.category_id || ''] || 0) + Number(t.amount); return acc; }, {} as Record<string, number>);
    const topEntry = Object.entries(topCatId).sort(([,a], [,b]) => b - a)[0];
    if (!topEntry) return null;
    const cat = categories.find(c => c.id === topEntry[0]);
    return `Your top spending category this month is ${cat?.icon || ''} ${cat?.name || 'Unknown'} at ${formatCurrency(topEntry[1])}`;
  }, [monthTxns, categories]);

  const handleDeleteConfirm = async () => {
    if (!deletingTxn) return;
    try {
      await deleteTxn.mutateAsync(deletingTxn);
      toast.success('Transaction deleted');
    } catch { toast.error('Failed to delete'); }
    setDeletingTxn(null);
  };

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{getGreeting()}</p>
          <h1 className="text-xl font-bold text-foreground">Dzii Finance</h1>
        </div>
        <button onClick={() => setShowProfile(true)} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm active:scale-95 transition-transform">D</button>
      </div>

      <div className="rounded-2xl gradient-primary p-5 glow-primary">
        <div className="flex items-center justify-between">
          <p className="text-primary-foreground/70 text-xs font-medium mb-1">
            Total Balance
          </p>

          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-primary-foreground transition-all duration-200 active:scale-90 hover:scale-110"
          >
            <span className="transition-all duration-300 ease-in-out inline-block">
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </span>
          </button>
        </div>

        <p className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-tight transition-all duration-300 ease-in-out">
          <span
            key={showBalance ? "show" : "hide"}
            className="inline-block animate-[fadeScale_0.25s_ease]"
          >
            {showBalance ? formatCurrency(totalBalance) : "****"}
          </span>
        </p>

        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-primary-foreground/60">Income</p>
              <p className="text-xs font-semibold text-primary-foreground">
                <span
                  key={showBalance ? "inc-show" : "inc-hide"}
                  className="inline-block animate-[fadeScale_0.25s_ease]"
                >
                  {showBalance ? formatCurrency(totalIncome) : "****"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[10px] text-primary-foreground/60">Expense</p>
              <p className="text-xs font-semibold text-primary-foreground">
                <span
                  key={showBalance ? "exp-show" : "exp-hide"}
                  className="inline-block animate-[fadeScale_0.25s_ease]"
                >
                  {showBalance ? formatCurrency(totalExpense) : "****"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 animate-card-enter stagger-2">
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
            <Tooltip contentStyle={{ backgroundColor: 'hsl(224,14%,12%)', border: 'none', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: 'hsl(215,15%,55%)' }} />
            <Area type="monotone" dataKey="income" stroke="hsl(142,76%,36%)" fill="url(#incGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="expense" stroke="hsl(0,84%,60%)" fill="url(#expGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {insight && (
        <div className="rounded-2xl bg-card border border-accent/20 p-4 flex gap-3 items-start glow-accent animate-card-enter stagger-3">
          <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-accent mb-1">AI Insight</p>
            <p className="text-sm text-card-foreground/80 leading-relaxed">{insight}</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Recent Transactions</p>
          <button onClick={() => navigate('/transactions')} className="text-xs text-primary flex items-center gap-1">See all <ArrowRight className="w-3 h-3" /></button>
        </div>
        {recentTxns.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No transactions yet. Tap + to add one!</p>
        ) : (
          <div className="space-y-2">
            {recentTxns.map((txn, i) => {
              const cat = categories.find(c => c.id === txn.category_id);
              const wallet = wallets.find(w => w.id === txn.wallet_id);
              return (
                <div key={txn.id} className={`animate-list-item stagger-${Math.min(i + 1, 10)}`}>
                  <TransactionItem txn={txn as any} category={cat as any} wallet={wallet as any}
                    onEdit={setEditTxn} onDelete={setDeletingTxn} />
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
