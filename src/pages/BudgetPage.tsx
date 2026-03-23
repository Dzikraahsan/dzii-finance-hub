import { mockBudgets, mockCategories } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/format';
import { Plus } from 'lucide-react';

export default function BudgetPage() {
  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Budget</h1>
        <button className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>

      <div className="space-y-3">
        {mockBudgets.map(budget => {
          const cat = mockCategories.find(c => c.id === budget.categoryId);
          const pct = Math.round((budget.used / budget.amount) * 100);
          const status = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
          const barColor = status === 'over' ? 'bg-destructive' : status === 'warn' ? 'bg-warning' : 'bg-success';
          const glowClass = status === 'over' ? 'glow-destructive' : status === 'warn' ? '' : '';

          return (
            <div key={budget.id} className={`bg-card border border-border rounded-2xl p-4 ${glowClass}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: (cat?.color || '#666') + '20' }}>
                  {cat?.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{cat?.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(budget.used)} of {formatCurrency(budget.amount)}</p>
                </div>
                <span className={`text-sm font-bold ${status === 'over' ? 'text-destructive' : status === 'warn' ? 'text-warning' : 'text-success'}`}>
                  {pct}%
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {budget.amount - budget.used > 0
                  ? `${formatCurrency(budget.amount - budget.used)} remaining`
                  : `${formatCurrency(budget.used - budget.amount)} over budget`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
