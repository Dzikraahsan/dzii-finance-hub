import { useBudgets, useCategories, useTransactions } from '@/hooks/useFinanceData';
import { formatCurrency } from '@/lib/format';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';

export default function BudgetPage() {
  const { data: budgets = [] } = useBudgets();
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const budgetsWithUsage = useMemo(() => {
    return budgets.map(budget => {
      const used = transactions
        .filter(t => t.type === 'expense' && t.category_id === budget.category_id && t.date.startsWith(currentMonth))
        .reduce((s, t) => s + Number(t.amount), 0);
      return { ...budget, used };
    });
  }, [budgets, transactions, currentMonth]);

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Budget</h1>
        <button className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary" />
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
              <div key={budget.id} className={`bg-card border border-border rounded-2xl p-4 ${status === 'over' ? 'glow-destructive' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: (cat?.color || '#666') + '20' }}>{cat?.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">{cat?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(budget.used)} of {formatCurrency(Number(budget.amount))}</p>
                  </div>
                  <span className={`text-sm font-bold ${status === 'over' ? 'text-destructive' : status === 'warn' ? 'text-warning' : 'text-success'}`}>{pct}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {Number(budget.amount) - budget.used > 0 ? `${formatCurrency(Number(budget.amount) - budget.used)} remaining` : `${formatCurrency(budget.used - Number(budget.amount))} over budget`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
