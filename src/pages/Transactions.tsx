import { useTransactions, useCategories, useWallets, useDeleteTransaction } from '@/hooks/useFinanceData';
import { formatDate, formatCurrency } from '@/lib/format';
import { Search, SlidersHorizontal, TrendingUp, TrendingDown, Calendar, List, BarChart3 } from 'lucide-react';
import { useState, useMemo } from 'react';
import TransactionItem from '@/components/TransactionItem';
import TransactionFilterSheet, { TransactionFilters, defaultFilters, hasActiveFilters } from '@/components/TransactionFilterSheet';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import TransactionCalendarView from '@/components/TransactionCalendarView';
import TransactionWeeklyView from '@/components/TransactionWeeklyView';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type ViewMode = 'day' | 'week' | 'month';

export default function Transactions() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: wallets = [] } = useWallets();
  const deleteTxn = useDeleteTransaction();
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [editTxn, setEditTxn] = useState<any>(null);
  const [deletingTxn, setDeletingTxn] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const active = hasActiveFilters(filters);

  // Base filtered transactions (search + filters, no date range when in calendar/weekly)
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

    // Date filter only in day view
    if (viewMode === 'day' && filters.dateRange !== 'all') {
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

    return result;
  }, [transactions, categories, search, filters, viewMode]);

  // Daily grouped data (for day view)
  const grouped = useMemo(() => {
    let source = filtered;

    // If a date is selected from calendar/weekly, filter to that date
    if (selectedDate && viewMode === 'day') {
      source = source.filter(t => t.date.slice(0, 10) === selectedDate);
    }

    const map: Record<string, { income: number; expense: number; transactions: typeof source }> = {};
    source.forEach(t => {
      const dateKey = t.date.slice(0, 10);
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
  }, [filtered, selectedDate, viewMode]);

  const handleDeleteConfirm = async () => {
    if (!deletingTxn) return;
    try {
      await deleteTxn.mutateAsync(deletingTxn);
      toast.success('Transaction deleted');
    } catch { toast.error('Failed to delete'); }
    setDeletingTxn(null);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  const handleBackToView = (mode: ViewMode) => {
    setSelectedDate(null);
    setViewMode(mode);
  };

  const viewIcons: Record<ViewMode, any> = {
    day: List,
    week: BarChart3,
    month: Calendar,
  };

  return (
    <div className="px-4 pt-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">Transactions</h1>
      </div>

      {/* View switcher */}
      <div className="flex gap-1 mb-4 p-1 bg-card border border-border rounded-xl">
        {(['day', 'week', 'month'] as ViewMode[]).map(mode => {
          const Icon = viewIcons[mode];
          const isActive = viewMode === mode && !selectedDate;
          const isActiveFromSelection = viewMode === 'day' && selectedDate && mode === 'day';
          return (
            <button
              key={mode}
              onClick={() => mode === viewMode && !selectedDate ? null : handleBackToView(mode === 'day' ? 'day' : mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 btn-press
                ${isActive || isActiveFromSelection ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Back button when viewing a specific date from calendar/weekly */}
      {selectedDate && (
        <button
          onClick={() => handleBackToView('month')}
          className="flex items-center gap-1 text-xs text-primary font-medium mb-3 btn-press"
        >
          ← Back to calendar
        </button>
      )}

      {/* Search + Filter (day view only) */}
      {(viewMode === 'day') && (
        <div className="flex gap-2 mb-5">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0" />
          </div>
          <button onClick={() => setShowFilter(true)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 btn-press ${active ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
            <SlidersHorizontal className={`w-4 h-4 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
          </button>
        </div>
      )}

      {active && viewMode === 'day' && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-primary font-medium">Filters active</span>
          <button onClick={() => setFilters(defaultFilters)} className="text-xs text-muted-foreground underline">Clear all</button>
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && !selectedDate && (
        <TransactionCalendarView
          transactions={filtered}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
        />
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && !selectedDate && (
        <TransactionWeeklyView
          transactions={filtered}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onDateSelect={handleDateSelect}
        />
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <>
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No transactions found</p>
          ) : (
            <div className="space-y-5">
              {grouped.map((day) => (
                <div key={day.date}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{formatDate(day.date)}</p>
                    <div className="flex items-center gap-3">
                      {day.income > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--success))]">
                          <TrendingUp className="w-3 h-3" />
                          {formatCurrency(day.income)}
                        </span>
                      )}
                      {day.expense > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-destructive">
                          <TrendingDown className="w-3 h-3" />
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
          )}
        </>
      )}

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
