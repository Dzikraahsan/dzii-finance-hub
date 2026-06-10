import { useBudgets, useCategories, useTransactions, useDeleteBudget } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/format';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import AddBudgetSheet from '@/components/AddBudgetSheet';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/ui/empty-state';
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
      <PageHeader
        eyebrow="Spend control"
        title="Budget"
        description={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        action={
          <button onClick={() => { setEditBudget(null); setShowAdd(true); }}
            aria-label="Add budget"
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center btn-press shadow-md">
            <Plus className="w-4 h-4" />
          </button>
        }
      />
      {budgetsWithUsage.length === 0 ? (
        <EmptyState
          icon={<Target className="w-6 h-6" />}
          title="No budgets yet"
          description="Set monthly limits for your spending categories to stay on track."
          action={
            <button onClick={() => setShowAdd(true)} className="h-10 px-4 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold btn-press shadow-md">
              Create budget
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {budgetsWithUsage.map(budget => {
            const cat = categories.find(c => c.id === budget.category_id);
            const pct = Math.round((budget.used / Number(budget.amount)) * 100);
            const status = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
            const barColor = status === 'over' ? 'bg-destructive' : status === 'warn' ? 'bg-warning' : 'bg-success';
            return (
              <div key={budget.id} className={`surface-card p-4 card-interactive animate-list-item stagger-${Math.min(budgetsWithUsage.indexOf(budget) + 1, 10)} ${status === 'over' ? 'glow-destructive' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-red-400/10">{cat?.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{cat?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatRupiah(budget.used)} of {formatRupiah(Number(budget.amount))}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${status === 'over' ? 'text-destructive dark:!text-red-400' : status === 'warn' ? 'text-warning dark:!text-yellow-400' : 'text-success dark:!text-[hsl(var(--accent-text))]'}`}>{pct}%</span>
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
