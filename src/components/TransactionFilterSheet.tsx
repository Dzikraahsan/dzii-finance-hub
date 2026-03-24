import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCategories, useWallets } from '@/hooks/useFinanceData';
import { X } from 'lucide-react';

export interface TransactionFilters {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  categoryId: string;
  walletId: string;
  type: '' | 'income' | 'expense' | 'transfer';
}

export const defaultFilters: TransactionFilters = {
  dateRange: 'all',
  categoryId: '',
  walletId: '',
  type: '',
};

export function hasActiveFilters(f: TransactionFilters) {
  return f.dateRange !== 'all' || f.categoryId !== '' || f.walletId !== '' || f.type !== '';
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: TransactionFilters;
  onApply: (f: TransactionFilters) => void;
}

export default function TransactionFilterSheet({ open, onOpenChange, filters, onApply }: Props) {
  const { data: categories = [] } = useCategories();
  const { data: wallets = [] } = useWallets();

  const local = { ...filters };
  const set = (key: keyof TransactionFilters, val: string) => {
    (local as any)[key] = val;
  };

  // We use uncontrolled approach with form submit
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t border-border p-0 bg-background max-h-[80vh]">
        <form onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onApply({
            dateRange: (fd.get('dateRange') as TransactionFilters['dateRange']) || 'all',
            categoryId: (fd.get('categoryId') as string) || '',
            walletId: (fd.get('walletId') as string) || '',
            type: (fd.get('type') as TransactionFilters['type']) || '',
          });
          onOpenChange(false);
        }} className="flex flex-col overflow-y-auto max-h-[80vh]">
          <SheetHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between">
            <SheetTitle className="text-lg font-bold">Filters</SheetTitle>
          </SheetHeader>

          <div className="px-5 space-y-5 pb-5 overflow-y-auto flex-1">
            {/* Date Range */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Date Range</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                ].map(o => (
                  <label key={o.value} className="cursor-pointer">
                    <input type="radio" name="dateRange" value={o.value} defaultChecked={filters.dateRange === o.value} className="sr-only peer" />
                    <span className="px-4 py-2 rounded-xl text-sm font-medium transition-all border border-border bg-card text-muted-foreground peer-checked:bg-primary/15 peer-checked:text-primary peer-checked:border-primary/30 block">
                      {o.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Type</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '', label: 'All' },
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' },
                  { value: 'transfer', label: 'Transfer' },
                ].map(o => (
                  <label key={o.value} className="cursor-pointer">
                    <input type="radio" name="type" value={o.value} defaultChecked={filters.type === o.value} className="sr-only peer" />
                    <span className="px-4 py-2 rounded-xl text-sm font-medium transition-all border border-border bg-card text-muted-foreground peer-checked:bg-primary/15 peer-checked:text-primary peer-checked:border-primary/30 block capitalize">
                      {o.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <input type="radio" name="categoryId" value="" defaultChecked={!filters.categoryId} className="sr-only peer" />
                  <span className="px-4 py-2 rounded-xl text-sm font-medium transition-all border border-border bg-card text-muted-foreground peer-checked:bg-primary/15 peer-checked:text-primary peer-checked:border-primary/30 block">All</span>
                </label>
                {categories.map(c => (
                  <label key={c.id} className="cursor-pointer">
                    <input type="radio" name="categoryId" value={c.id} defaultChecked={filters.categoryId === c.id} className="sr-only peer" />
                    <span className="px-3 py-2 rounded-xl text-sm font-medium transition-all border border-border bg-card text-muted-foreground peer-checked:bg-primary/15 peer-checked:text-primary peer-checked:border-primary/30 flex items-center gap-1.5">
                      <span>{c.icon}</span> {c.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Wallet */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Wallet</p>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <input type="radio" name="walletId" value="" defaultChecked={!filters.walletId} className="sr-only peer" />
                  <span className="px-4 py-2 rounded-xl text-sm font-medium transition-all border border-border bg-card text-muted-foreground peer-checked:bg-primary/15 peer-checked:text-primary peer-checked:border-primary/30 block">All</span>
                </label>
                {wallets.map(w => (
                  <label key={w.id} className="cursor-pointer">
                    <input type="radio" name="walletId" value={w.id} defaultChecked={filters.walletId === w.id} className="sr-only peer" />
                    <span className="px-3 py-2 rounded-xl text-sm font-medium transition-all border border-border bg-card text-muted-foreground peer-checked:bg-primary/15 peer-checked:text-primary peer-checked:border-primary/30 flex items-center gap-1.5">
                      <span>{w.icon}</span> {w.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 pt-3 flex gap-3 border-t border-border">
            <button type="button" onClick={() => { onApply(defaultFilters); onOpenChange(false); }}
              className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm transition-all active:scale-[0.98]">
              Reset
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm transition-all active:scale-[0.98]">
              Apply
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
