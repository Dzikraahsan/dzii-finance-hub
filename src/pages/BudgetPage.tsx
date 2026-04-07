import { useBudgets, useCategories, useTransactions, useDeleteBudget } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/format';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import AddBudgetSheet from '@/components/AddBudgetSheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function BudgetPage() {
  const { data: budgets = [] } = useBudgets();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const deleteBudget = useDeleteBudget();
  const [showAdd, setShowAdd] = useState(false);
  const [editBudget, setEditBudget] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const budgetsWithUsage = useMemo(() => {
    return budgets.map(budget => {
      const used = transactions
        .filter(t => t.type === 'expense' && t.category_id === budget.category_id && t.date.startsWith(currentMonth))
        .reduce((s, t) => s + Number(t.amount), 0);
      return { ...budget, used };
    });
  }, [budgets, transactions, currentMonth]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteBudget.mutateAsync(deletingId);
      toast.success('Budget deleted');
    } catch { toast.error('Failed to delete'); }
    setDeletingId(null);
  };

  // Format Rupiah Indonesia
  const formatRupiah = (num) => {
    return "Rp" + new Intl.NumberFormat("id-ID").format(num);
  };

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Budget</h1>
        <button onClick={() => { setEditBudget(null); setShowAdd(true); }}
          className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center active:scale-90 transition-transform">
          <Plus className="w-4 h-4 text-primary dark:!text-[hsl(var(--accent-text))]" />
        </button>
      </div>
      <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      {budgetsWithUsage.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No budgets set. Tap + to create one!</p>
      ) : (
        <div className="space-y-3">
          {budgetsWithUsage.map(budget => {
            const cat = categories.find(c => c.id === budget.category_id);
            const pct = Math.round((budget.used / Number(budget.amount)) * 100);
            const status = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
            const barColor = status === 'over' ? 'bg-destructive' : status === 'warn' ? 'bg-warning' : 'bg-success';
            return (
              <div key={budget.id} className={`bg-card border border-border rounded-2xl p-4 card-interactive animate-list-item stagger-${Math.min(budgetsWithUsage.indexOf(budget) + 1, 10)} ${status === 'over' ? 'glow-destructive' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: (cat?.color || '#666') + '20' }}>{cat?.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{cat?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatRupiah(budget.used)} of {formatRupiah(Number(budget.amount))}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${status === 'over' ? 'text-destructive' : status === 'warn' ? 'text-warning' : 'text-success'}`}>{pct}%</span>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditBudget(budget); setShowAdd(true); }}
                      className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Pencil className="w-3 h-3 text-primary dark:!text-[hsl(var(--accent-text))]" />
                    </button>
                    <button onClick={() => setDeletingId(budget.id)}
                      className="w-7 h-7 rounded-lg bg-destructive/10 dark:!bg-red-400/10 flex items-center justify-center">
                      <Trash2 className="w-3 h-3 text-destructive dark:!text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {Number(budget.amount) - budget.used > 0 ? `${formatRupiah(Number(budget.amount) - budget.used)} remaining` : `${formatCurrency(budget.used - Number(budget.amount))} over budget`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <AddBudgetSheet open={showAdd} onOpenChange={setShowAdd} editBudget={editBudget} />
      <AlertDialog open={!!deletingId} onOpenChange={v => { if (!v) setDeletingId(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this budget?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
