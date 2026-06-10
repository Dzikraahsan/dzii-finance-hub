import { useTransactions, useCategories, useWallets, useDeleteTransaction } from '@/hooks/useFinanceData';
import { formatDate, formatCurrency } from '@/lib/format';
import { Search, SlidersHorizontal, TrendingUp, TrendingDown, Calendar, List, BarChart3, Receipt } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import TransactionItem from '@/components/TransactionItem';
import TransactionFilterSheet, { TransactionFilters, defaultFilters, hasActiveFilters } from '@/components/TransactionFilterSheet';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import TransactionCalendarView from '@/components/TransactionCalendarView';
import TransactionWeeklyView from '@/components/TransactionWeeklyView';
import PageHeader from '@/components/PageHeader';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type ViewMode = 'day' | 'week' | 'month';

function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function normalize(date: string) {
  return date.slice(0, 10);
}

export default function Transactions() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: wallets = [] } = useWallets();
  const deleteTxn = useDeleteTransaction();

  // Centralized state
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWeekRange, setSelectedWeekRange] = useState<{ start: string; end: string } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [editTxn, setEditTxn] = useState<any>(null);
  const [deletingTxn, setDeletingTxn] = useState<any>(null);

  const active = hasActiveFilters(filters);

  // Base filtered transactions (search + type/category/wallet filters, NO date range in calendar/week modes)
  const filtered = useMemo(() => {
    let result = transactions;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => {
        const cat = categories.find(c => c.id === t.category_id);
        return cat?.name.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q);
      });
    }

    if (filters.type) result = result.filter(t => t.type === filters.type);
    if (filters.categoryId) result = result.filter(t => t.category_id === filters.categoryId);
    if (filters.walletId) result = result.filter(t => t.wallet_id === filters.walletId || t.to_wallet_id === filters.walletId);

    // Date range filter in day view
    if (viewMode === 'day') {
      if (selectedWeekRange) {
        // Coming from week view: show only that week's transactions
        result = result.filter(t => {
          const d = normalize(t.date);
          return d >= selectedWeekRange.start && d <= selectedWeekRange.end;
        });
      } else if (!selectedDate && filters.dateRange !== 'all') {
        const now = new Date();
        let cutoff = new Date();
        if (filters.dateRange === 'today') {
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (filters.dateRange === 'week') {
          cutoff.setDate(now.getDate() - 7);
        } else if (filters.dateRange === 'month') {
          cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        result = result.filter(t => new Date(t.date) >= cutoff);
      }
    }

    return result;
  }, [transactions, categories, search, filters, viewMode, selectedDate, selectedWeekRange]);

  // Transactions for a specific selected date
  const selectedDateTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return filtered.filter(t => normalize(t.date) === selectedDate);
  }, [filtered, selectedDate]);

  // Selected date aggregates
  const selectedDateSummary = useMemo(() => {
    let income = 0, expense = 0;
    selectedDateTransactions.forEach(t => {
      if (t.type === 'income') income += Number(t.amount);
      else if (t.type === 'expense') expense += Number(t.amount);
    });
    return { income, expense, net: income - expense };
  }, [selectedDateTransactions]);

  // Daily grouped data (for day view without selected date)
  const grouped = useMemo(() => {
    const source = selectedDate
      ? filtered.filter(t => normalize(t.date) === selectedDate)
      : filtered;

    const map: Record<string, { income: number; expense: number; transactions: typeof source }> = {};
    source.forEach(t => {
      const dateKey = normalize(t.date);
      if (!map[dateKey]) map[dateKey] = { income: 0, expense: 0, transactions: [] };
      if (t.type === 'income') map[dateKey].income += Number(t.amount);
      else if (t.type === 'expense') map[dateKey].expense += Number(t.amount);
      map[dateKey].transactions.push(t);
    });

    return Object.entries(map)
      .map(([date, data]) => ({
        date,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
        transactions: data.transactions,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered, selectedDate]);

  const handleDeleteConfirm = async () => {
    if (!deletingTxn) return;
    try {
      await deleteTxn.mutateAsync(deletingTxn);
      toast.success('Transaction deleted');
    } catch { toast.error('Failed to delete'); }
    setDeletingTxn(null);
  };

  // Calendar date click: stay in month view, show transactions below
  const handleCalendarDateSelect = useCallback((date: string) => {
    setSelectedDate(normalize(date));
  }, []);

  // Weekly date click: switch to day view showing that week's transactions
  const handleWeekDateSelect = useCallback((startDate: string) => {
    const mon = new Date(startDate);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const format = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    setSelectedWeekRange({
      start: format(mon),
      end: format(sun),
    });
    setSelectedDate(null);
    setViewMode('day');
  }, []);

  // View mode switch
  const handleViewSwitch = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setSelectedDate(null);
    setSelectedWeekRange(null);
  }, []);

  const viewIcons: Record<ViewMode, any> = {
    day: List,
    week: BarChart3,
    month: Calendar,
  };

  // Render transaction list (reused in month+selectedDate and day view)
  const renderTransactionList = (txns: typeof grouped) => {
    if (txns.length === 0) {
      return (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="No transactions found"
          description="Try changing your filters or add a new transaction with the + button."
        />
      );
    }
    return (
      <div className="space-y-5">
        {txns.map((day) => (
          <div key={day.date}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[hsl(var(--accent-text))] uppercase tracking-wider">{formatDate(day.date)}</p>
              <div className="flex items-center gap-3">
                {day.income > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--success))] dark:!text-[hsl(var(--accent-text))]">
                    <TrendingUp className="w-3 h-3 dark:!text-[hsl(var(--accent-text))]" />
                    {formatCurrency(day.income)}
                  </span>
                )}
                {day.expense > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-destructive dark:!text-red-400">
                    <TrendingDown className="w-3 h-3 dark:!text-red-400" />
                    {formatCurrency(day.expense)}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {day.transactions.map((txn, i) => {
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
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 pt-6 pb-2 animate-fade-in space-y-4">
      <PageHeader
        eyebrow="History"
        title="Transactions"
        description="Track every income and expense across your wallets"
      />

      {/* View switcher */}
      <div className="flex gap-1 p-1 surface-card">
        {(['day', 'week', 'month'] as ViewMode[]).map(mode => {
          const Icon = viewIcons[mode];
          const isActive = viewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => handleViewSwitch(mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 btn-press
                ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Search + Filter (day view only) */}
        <div className="max-h-[30vh] overflow-y-auto pr-1">
        {viewMode === 'day' && (
          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
              />
            </div>

            <button
              onClick={() => setShowFilter(true)}
              aria-label="Filter transactions"
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 btn-press shadow-xs ${
                active ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border'
              }`}
            >
              <SlidersHorizontal
                className={`w-4 h-4 ${
                  active ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              />
            </button>
          </div>
        )}

        {active && viewMode === 'day' && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-primary font-medium">Filters active</span>
            <button
              onClick={() => setFilters(defaultFilters)}
              className="text-xs text-muted-foreground underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <>
          <TransactionCalendarView
            transactions={filtered}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDateSelect={handleCalendarDateSelect}
            selectedDate={selectedDate}
          />

          {/* Selected date transactions shown BELOW calendar */}
          {selectedDate && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-foreground">{formatDate(selectedDate)}</p>
                <div className="flex items-center gap-3">
                  {selectedDateSummary.income > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--success))] dark:text-[hsl(var(--accent-text))]">
                      <TrendingUp className="w-3 h-3" />
                      {formatCurrency(selectedDateSummary.income)}
                    </span>
                  )}
                  {selectedDateSummary.expense > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-destructive dark:!text-red-400">
                      <TrendingDown className="w-3 h-3 !text-red-400" />
                      {formatCurrency(selectedDateSummary.expense)}
                    </span>
                  )}
                </div>
              </div>
              {selectedDateTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions on this date</p>
              ) : (
                <div className="space-y-2">
                  {selectedDateTransactions.map((txn, i) => {
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
          )}
        </>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <TransactionWeeklyView
          transactions={filtered}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onDateSelect={handleWeekDateSelect}
        />
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && renderTransactionList(grouped)}

      <TransactionFilterSheet open={showFilter} onOpenChange={setShowFilter} filters={filters} onApply={setFilters} />
      <EditTransactionSheet open={!!editTxn} onOpenChange={v => { if (!v) setEditTxn(null); }} transaction={editTxn} />
      <AlertDialog open={!!deletingTxn} onOpenChange={v => { if (!v) setDeletingTxn(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this transaction and reverse the wallet balance.</AlertDialogDescription>
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
